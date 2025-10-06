package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
)

// TranslationRepository manages translation persistence.
type TranslationRepository struct {
	db *sqlx.DB
}

// NewTranslationRepository constructs a new repository.
func NewTranslationRepository(db *sqlx.DB) *TranslationRepository {
	return &TranslationRepository{db: db}
}

// Create inserts a translation row.
func (r *TranslationRepository) Create(ctx context.Context, translation *models.Translation) (*models.Translation, error) {
	if translation.ID == "" {
		translation.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	translation.CreatedAt = now
	translation.UpdatedAt = now
	translation.Status = models.TranslationPending

	query := `INSERT INTO translations (id, user_id, source_lang, target_lang, model_key, character_count, price_cents, currency, options, status, queue_task_id, original_filename, delete_after, created_at, updated_at)
              VALUES (:id, :user_id, :source_lang, :target_lang, :model_key, :character_count, :price_cents, :currency, :options, :status, :queue_task_id, :original_filename, :delete_after, :created_at, :updated_at)`

	if _, err := r.db.NamedExecContext(ctx, query, translation); err != nil {
		return nil, err
	}
	return translation, nil
}

// UpdateStatus updates translation status and optional metadata.
func (r *TranslationRepository) UpdateStatus(ctx context.Context, id string, status models.TranslationStatus, failureReason *string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE translations SET status=$1, failure_reason=$2, updated_at=$3 WHERE id=$4`, status, failureReason, time.Now().UTC(), id)
	return err
}

// MarkCompleted marks translation as completed with file info.
func (r *TranslationRepository) MarkCompleted(ctx context.Context, id string, translatedFilename string) error {
	now := time.Now().UTC()
	_, err := r.db.ExecContext(ctx, `UPDATE translations SET status=$1, translated_filename=$2, completed_at=$3, updated_at=$4 WHERE id=$5`, models.TranslationCompleted, translatedFilename, now, now, id)
	return err
}

// SetQueueTaskID stores queue task identifier.
func (r *TranslationRepository) SetQueueTaskID(ctx context.Context, id string, taskID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE translations SET queue_task_id=$1, status=$2, updated_at=$3 WHERE id=$4`, taskID, models.TranslationQueued, time.Now().UTC(), id)
	return err
}

// GetByID fetches translation by ID.
func (r *TranslationRepository) GetByID(ctx context.Context, id string) (*models.Translation, error) {
	var translation models.Translation
	if err := r.db.GetContext(ctx, &translation, `SELECT * FROM translations WHERE id=$1`, id); err != nil {
		return nil, err
	}
	return &translation, nil
}

// ListByUser fetches translations for a specific user.
func (r *TranslationRepository) ListByUser(ctx context.Context, userID string, limit, offset int) ([]models.Translation, error) {
	translations := []models.Translation{}
	query := `SELECT * FROM translations WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	if err := r.db.SelectContext(ctx, &translations, query, userID, limit, offset); err != nil {
		return nil, err
	}
	return translations, nil
}

// PendingForDeletion returns translations whose files should be deleted.
func (r *TranslationRepository) PendingForDeletion(ctx context.Context, cutoff time.Time) ([]models.Translation, error) {
	translations := []models.Translation{}
	query := `SELECT * FROM translations WHERE delete_after IS NOT NULL AND delete_after <= $1`
	if err := r.db.SelectContext(ctx, &translations, query, cutoff); err != nil {
		return nil, err
	}
	return translations, nil
}
