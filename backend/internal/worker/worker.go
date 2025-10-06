package worker

import (
	"bytes"

	"context"
	"fmt"
	"io"
	"time"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/invoice"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/queue"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/repository"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/services"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/storage"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/translation"
)

// Worker processes background jobs.
type Worker struct {
	server       *asynq.Server
	translations *repository.TranslationRepository
	users        *repository.UserRepository
	files        *repository.FileRepository
	storage      storage.Provider
	translateSvc *services.TranslationService
	stripeSvc    *services.PaymentService
	deepl        *translation.DeepLClient
	otranslator  *translation.OTranslatorClient
	logger       zerolog.Logger
}

// New constructs worker with shared dependencies.
func New(redisURL string, translations *repository.TranslationRepository, users *repository.UserRepository, files *repository.FileRepository, storage storage.Provider, translateSvc *services.TranslationService, stripeSvc *services.PaymentService, deepl *translation.DeepLClient, otranslator *translation.OTranslatorClient, logger zerolog.Logger) (*Worker, error) {
	opts, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, err
	}
	srv := asynq.NewServer(opts, asynq.Config{
		Concurrency: 10,
		Queues: map[string]int{
			"translations": 6,
			"maintenance":  2,
			"billing":      2,
		},
	})
	return &Worker{
		server:       srv,
		translations: translations,
		users:        users,
		files:        files,
		storage:      storage,
		translateSvc: translateSvc,
		stripeSvc:    stripeSvc,
		deepl:        deepl,
		otranslator:  otranslator,
		logger:       logger,
	}, nil
}

// Start begins processing background tasks.
func (w *Worker) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskTranslateDocument, w.handleTranslateDocument)
	mux.HandleFunc(queue.TaskCleanupFile, w.handleCleanupFile)
	mux.HandleFunc(queue.TaskSyncSubscription, w.handleSyncSubscription)
	return w.server.Run(mux)
}

func (w *Worker) handleTranslateDocument(ctx context.Context, task *asynq.Task) error {
	var payload queue.TranslatePayload
	if err := task.UnmarshalPayload(&payload); err != nil {
		return err
	}

	translationEntity, err := w.translations.GetByID(ctx, payload.TranslationID)
	if err != nil {
		return err
	}
	if err := w.translations.UpdateStatus(ctx, translationEntity.ID, models.TranslationProcessing, nil); err != nil {
		return err
	}

	fileRecords, err := w.files.ListByTranslation(ctx, translationEntity.ID)
	if err != nil {
		return err
	}
	var sourceKey string
	for _, f := range fileRecords {
		if f.Kind == models.FileKindSource {
			sourceKey = f.StorageKey
			break
		}
	}
	if sourceKey == "" {
		return fmt.Errorf("source file missing for translation %s", translationEntity.ID)
	}

	reader, err := w.storage.Get(ctx, sourceKey)
	if err != nil {
		return err
	}
	defer reader.Close()
	data, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	model := translation.GetModelByKey(translationEntity.ModelKey)
	if model == nil {
		return fmt.Errorf("model %s not registered", translationEntity.ModelKey)
	}

	result, err := w.performTranslation(ctx, *model, data, translationEntity)
	if err != nil {
		_ = w.translations.UpdateStatus(ctx, translationEntity.ID, models.TranslationFailed, &err.Error())
		return err
	}

	outputName := fmt.Sprintf("translated-%s", translationEntity.OriginalFilename)
	if err := w.translateSvc.CompleteTranslation(ctx, translationEntity.ID, result, "application/octet-stream", outputName); err != nil {
		return err
	}

	if err := w.generateInvoice(ctx, translationEntity.ID); err != nil {
		w.logger.Error().Err(err).Msg("failed to generate invoice")
	}

	return nil
}

func (w *Worker) performTranslation(ctx context.Context, model translation.Model, data []byte, translationEntity *models.Translation) ([]byte, error) {
	reader := bytes.NewReader(data)
	switch model.Provider {
	case translation.ProviderDeepL:
		opts := translation.DocumentOptions{
			SourceLang:  translationEntity.SourceLang,
			TargetLang:  translationEntity.TargetLang,
			Formality:   fmt.Sprintf("%v", translationEntity.Options["formality"]),
			TagHandling: fmt.Sprintf("%v", translationEntity.Options["tag_handling"]),
			FileName:    translationEntity.OriginalFilename,
		}
		return w.deepl.TranslateDocument(ctx, reader, opts)
	case translation.ProviderOTranslator:
		passes := 1
		if v, ok := translationEntity.Options["passes"].(float64); ok {
			passes = int(v)
		}
		opts := translation.OTranslatorDocumentOptions{
			SourceLang:     translationEntity.SourceLang,
			TargetLang:     translationEntity.TargetLang,
			Model:          model.Engine,
			Passes:         passes,
			Formality:      fmt.Sprintf("%v", translationEntity.Options["formality"]),
			IgnoreComments: translationEntity.Options["ignore_comments"] == true,
			PreserveFormat: true,
		}
		return w.otranslator.TranslateDocument(ctx, reader, translationEntity.OriginalFilename, opts)
	default:
		return nil, fmt.Errorf("unsupported provider %s", model.Provider)
	}
}

func (w *Worker) generateInvoice(ctx context.Context, translationID string) error {
	translationEntity, err := w.translations.GetByID(ctx, translationID)
	if err != nil {
		return err
	}
	user, err := w.users.GetByID(ctx, translationEntity.UserID)
	if err != nil {
		return err
	}
	model := translation.GetModelByKey(translationEntity.ModelKey)
	if model == nil {
		return fmt.Errorf("model %s missing", translationEntity.ModelKey)
	}

	meta := invoice.BuildMetadata(*user, *translationEntity, model.ModelDescriptor)
	pdfBytes, err := invoice.Generate(meta)
	if err != nil {
		return err
	}
	invoiceKey := fmt.Sprintf("users/%s/translations/%s/invoices/%s.pdf", user.ID, translationEntity.ID, meta.InvoiceNumber)
	if err := w.storage.Save(ctx, invoiceKey, bytes.NewReader(pdfBytes), "application/pdf"); err != nil {
		return err
	}
	if _, err := w.files.Create(ctx, &models.FileRecord{
		TranslationID: translationEntity.ID,
		StorageKey:    invoiceKey,
		Kind:          models.FileKindInvoice,
		StoredUntil:   translationEntity.DeleteAfter,
	}); err != nil {
		return err
	}
	return nil
}

func (w *Worker) handleCleanupFile(ctx context.Context, task *asynq.Task) error {
	var payload queue.CleanupPayload
	if err := task.UnmarshalPayload(&payload); err != nil {
		return err
	}
	return w.storage.Delete(ctx, payload.StorageKey)
}

func (w *Worker) handleSyncSubscription(ctx context.Context, task *asynq.Task) error {
	var payload queue.SubscriptionPayload
	if err := task.UnmarshalPayload(&payload); err != nil {
		return err
	}
	return w.stripeSvc.ActivatePremium(ctx, payload.UserID, 30*24*time.Hour)
}

// Shutdown stops worker processing.
func (w *Worker) Shutdown() {
	w.server.Shutdown()
}

func optionString(opts models.JSONB, key string) string {
	if opts == nil {
		return ""
	}
	if v, ok := opts[key]; ok {
		switch val := v.(type) {
		case string:
			return val
		case fmt.Stringer:
			return val.String()
		case float64:
			return fmt.Sprintf("%g", val)
		case int:
			return fmt.Sprintf("%d", val)
		case bool:
			if val {
				return "true"
			}
			return "false"
		}
	}
	return ""
}

func optionBool(opts models.JSONB, key string) bool {
	if opts == nil {
		return false
	}
	if v, ok := opts[key]; ok {
		switch val := v.(type) {
		case bool:
			return val
		case string:
			return val == "true" || val == "1"
		case float64:
			return val != 0
		case int:
			return val != 0
		}
	}
	return false
}

func optionFloat(opts models.JSONB, key string, def float64) float64 {
	if opts == nil {
		return def
	}
	if v, ok := opts[key]; ok {
		switch val := v.(type) {
		case float64:
			return val
		case int:
			return float64(val)
		case string:
			if parsed, err := strconv.ParseFloat(val, 64); err == nil {
				return parsed
			}
		}
	}
	return def
}
