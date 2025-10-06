package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/queue"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/repository"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/storage"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/translation"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/pkg/utils"
)

// TranslationService orchestrates translation lifecycle.
type TranslationService struct {
	translations *repository.TranslationRepository
	files        *repository.FileRepository
	storage      storage.Provider
	queue        *queue.Client
	deepl        *translation.DeepLClient
	otranslator  *translation.OTranslatorClient
	logger       zerolog.Logger
	retention    time.Duration
}

// NewTranslationService constructs service.
func NewTranslationService(translations *repository.TranslationRepository, files *repository.FileRepository, storage storage.Provider, queueClient *queue.Client, deepl *translation.DeepLClient, otranslator *translation.OTranslatorClient, retention time.Duration, logger zerolog.Logger) *TranslationService {
	return &TranslationService{
		translations: translations,
		files:        files,
		storage:      storage,
		queue:        queueClient,
		deepl:        deepl,
		otranslator:  otranslator,
		logger:       logger,
		retention:    retention,
	}
}

// CreateTranslationInput holds request values.
type CreateTranslationInput struct {
	User        *models.User
	Filename    string
	Data        []byte
	ContentType string
	SourceLang  string
	TargetLang  string
	ModelKey    string
	Options     map[string]interface{}
	StripTags   bool
}

// CreateTranslationResult describes created translation.
type CreateTranslationResult struct {
	Translation *models.Translation
	Model       translation.Model
}

// CreateTranslation validates input, persists metadata and schedules payment.
func (s *TranslationService) CreateTranslation(ctx context.Context, input CreateTranslationInput) (*CreateTranslationResult, error) {
	if input.User == nil {
		return nil, errors.New("user required")
	}
	if input.TargetLang == "" {
		return nil, errors.New("target language required")
	}
	model := translation.GetModelByKey(input.ModelKey)
	if model == nil {
		return nil, fmt.Errorf("unknown model %s", input.ModelKey)
	}
	text, err := ExtractText(input.Filename, input.Data)
	if err != nil {
		return nil, fmt.Errorf("extract text: %w", err)
	}
	characterCount := utils.CountCharacters(text, input.StripTags)
	if characterCount == 0 {
		return nil, errors.New("document appears to be empty")
	}

	discount := 0.0
	if input.User.Subscription == models.SubscriptionPremium {
		discount = 0.20
	}

	priceCents := utils.CalculatePriceCents(characterCount, model.PricePer1860, discount)
	translationID := uuid.NewString()
	deleteAfter := (*time.Time)(nil)
	if input.User.Subscription != models.SubscriptionPremium {
		expiry := time.Now().Add(s.retention)
		deleteAfter = &expiry
	}

	translationEntity := &models.Translation{
		ID:               translationID,
		UserID:           input.User.ID,
		SourceLang:       input.SourceLang,
		TargetLang:       input.TargetLang,
		ModelKey:         input.ModelKey,
		CharacterCount:   characterCount,
		PriceCents:       priceCents,
		Currency:         "EUR",
		Options:          models.JSONB(input.Options),
		Status:           models.TranslationPending,
		QueueTaskID:      "",
		OriginalFilename: input.Filename,
		DeleteAfter:      deleteAfter,
	}

	translationEntity, err = s.translations.Create(ctx, translationEntity)
	if err != nil {
		return nil, err
	}

	storageKey := s.buildStorageKey(input.User.ID, translationID, "source", input.Filename)
	if err := s.storage.Save(ctx, storageKey, bytes.NewReader(input.Data), input.ContentType); err != nil {
		return nil, err
	}
	_, err = s.files.Create(ctx, &models.FileRecord{
		TranslationID: translationID,
		StorageKey:    storageKey,
		Kind:          models.FileKindSource,
		StoredUntil:   deleteAfter,
	})
	if err != nil {
		s.logger.Error().Err(err).Msg("failed to store file record")
	}
	if deleteAfter != nil {
		delay := time.Until(*deleteAfter)
		if delay > 0 {
			if _, qerr := s.queue.EnqueueCleanup(queue.CleanupPayload{StorageKey: storageKey}, delay); qerr != nil {
				s.logger.Warn().Err(qerr).Msg("failed to enqueue source cleanup")
			}
		}
	}

	s.logger.Info().Str("translation_id", translationID).Str("model", input.ModelKey).Int("characters", characterCount).Msg("translation created")

	return &CreateTranslationResult{Translation: translationEntity, Model: *model}, nil
}

// QueueTranslation enqueues actual translation task after payment confirmation.
func (s *TranslationService) QueueTranslation(ctx context.Context, translationID string) error {
	translationEntity, err := s.translations.GetByID(ctx, translationID)
	if err != nil {
		return err
	}
	if translationEntity.Status != models.TranslationPending {
		return fmt.Errorf("translation %s not pending", translationID)
	}
	files, err := s.files.ListByTranslation(ctx, translationID)
	if err != nil {
		return err
	}
	var sourceFile *models.FileRecord
	for _, f := range files {
		if f.Kind == models.FileKindSource {
			copy := f
			sourceFile = &copy
			break
		}
	}
	if sourceFile == nil {
		return errors.New("source file not found")
	}
	model := translation.GetModelByKey(translationEntity.ModelKey)
	if model == nil {
		return fmt.Errorf("model %s not found", translationEntity.ModelKey)
	}

	payload := queue.TranslatePayload{
		TranslationID: translationEntity.ID,
		ModelKey:      translationEntity.ModelKey,
		SourceLang:    translationEntity.SourceLang,
		TargetLang:    translationEntity.TargetLang,
		StorageKey:    sourceFile.StorageKey,
		Filename:      translationEntity.OriginalFilename,
		UserID:        translationEntity.UserID,
		Options:       map[string]interface{}(translationEntity.Options),
	}

	taskInfo, err := s.queue.EnqueueTranslation(payload)
	if err != nil {
		return err
	}
	if err := s.translations.SetQueueTaskID(ctx, translationID, taskInfo.ID.String()); err != nil {
		return err
	}
	s.logger.Info().Str("translation_id", translationID).Str("task_id", taskInfo.ID.String()).Msg("translation enqueued")
	return nil
}

// CompleteTranslation is invoked by worker after translation finishes successfully.
func (s *TranslationService) CompleteTranslation(ctx context.Context, translationID string, translatedData []byte, contentType string, filename string) error {
	translationEntity, err := s.translations.GetByID(ctx, translationID)
	if err != nil {
		return err
	}
	storageKey := s.buildStorageKey(translationEntity.UserID, translationID, "translated", filename)
	if err := s.storage.Save(ctx, storageKey, bytes.NewReader(translatedData), contentType); err != nil {
		return err
	}
	fileRecord := &models.FileRecord{
		TranslationID: translationID,
		StorageKey:    storageKey,
		Kind:          models.FileKindTranslated,
		StoredUntil:   translationEntity.DeleteAfter,
	}
	if _, err := s.files.Create(ctx, fileRecord); err != nil {
		return err
	}
	if translationEntity.DeleteAfter != nil {
		delay := time.Until(*translationEntity.DeleteAfter)
		if delay > 0 {
			if _, qerr := s.queue.EnqueueCleanup(queue.CleanupPayload{StorageKey: storageKey}, delay); qerr != nil {
				s.logger.Warn().Err(qerr).Msg("failed to enqueue translated cleanup")
			}
		}
	}
	if err := s.translations.MarkCompleted(ctx, translationID, filename); err != nil {
		return err
	}
	return nil
}

// FailTranslation marks translation as failed.
func (s *TranslationService) FailTranslation(ctx context.Context, translationID string, reason string) error {
	return s.translations.UpdateStatus(ctx, translationID, models.TranslationFailed, &reason)
}

// buildStorageKey creates structured storage paths.
func (s *TranslationService) buildStorageKey(userID, translationID, kind, filename string) string {
	safeName := sanitizeFilename(filename)
	parts := []string{"translations", translationID, kind, safeName}
	if userID != "" {
		parts = append([]string{"users", userID}, parts...)
	}
	return strings.Join(parts, "/")
}

func sanitizeFilename(name string) string {
	name = strings.TrimSpace(name)
	name = strings.ReplaceAll(name, " ", "-")
	name = strings.Map(func(r rune) rune {
		if r == '.' || r == '-' || r == '_' || (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			return r
		}
		return '-' // fallback
	}, name)
	if !strings.Contains(name, ".") {
		name += ".txt"
	}
	return strings.ToLower(name)
}

// DetermineContentType infers mime type from filename.
func DetermineContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".epub":
		return "application/epub+zip"
	default:
		return "text/plain"
	}
}

func (s *TranslationService) ListTranslations(ctx context.Context, userID string, limit, offset int) ([]models.Translation, error) {
	return s.translations.ListByUser(ctx, userID, limit, offset)
}

func (s *TranslationService) GetTranslation(ctx context.Context, id string) (*models.Translation, error) {
	return s.translations.GetByID(ctx, id)
}

func (s *TranslationService) GenerateDownloadURL(ctx context.Context, translationID string, expiry time.Duration) (string, error) {
	files, err := s.files.ListByTranslation(ctx, translationID)
	if err != nil {
		return "", err
	}
	var targetKey string
	for _, f := range files {
		if f.Kind == models.FileKindTranslated {
			targetKey = f.StorageKey
			break
		}
	}
	if targetKey == "" {
		return "", errors.New("translated file not ready")
	}
	return s.storage.SignedURL(ctx, targetKey, int(expiry.Seconds()))
}

func (s *TranslationService) OpenTranslatedFile(ctx context.Context, translationID string) (io.ReadCloser, string, error) {
	translationEntity, err := s.translations.GetByID(ctx, translationID)
	if err != nil {
		return nil, "", err
	}
	if translationEntity.TranslatedFilename == nil {
		return nil, "", errors.New("translation not ready")
	}
	files, err := s.files.ListByTranslation(ctx, translationID)
	if err != nil {
		return nil, "", err
	}
	var targetKey string
	for _, f := range files {
		if f.Kind == models.FileKindTranslated {
			targetKey = f.StorageKey
			break
		}
	}
	if targetKey == "" {
		return nil, "", errors.New("translated file missing")
	}
	reader, err := s.storage.Get(ctx, targetKey)
	if err != nil {
		return nil, "", err
	}
	return reader, *translationEntity.TranslatedFilename, nil
}
