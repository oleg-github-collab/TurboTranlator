package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
)

// FileRepository persists file references.
type FileRepository struct {
	db *sqlx.DB
}

// NewFileRepository constructs FileRepository.
func NewFileRepository(db *sqlx.DB) *FileRepository {
	return &FileRepository{db: db}
}

// Create stores a file record.
func (r *FileRepository) Create(ctx context.Context, rec *models.FileRecord) (*models.FileRecord, error) {
	rec.ID = uuid.NewString()
	rec.CreatedAt = time.Now().UTC()
	query := `INSERT INTO files (id, translation_id, storage_key, kind, stored_until, created_at)
              VALUES (:id, :translation_id, :storage_key, :kind, :stored_until, :created_at)`
	if _, err := r.db.NamedExecContext(ctx, query, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

// ListByTranslation fetches file records for translation.
func (r *FileRepository) ListByTranslation(ctx context.Context, translationID string) ([]models.FileRecord, error) {
	records := []models.FileRecord{}
	if err := r.db.SelectContext(ctx, &records, `SELECT * FROM files WHERE translation_id=$1`, translationID); err != nil {
		return nil, err
	}
	return records, nil
}

// DeleteByID removes a file record.
func (r *FileRepository) DeleteByID(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM files WHERE id=$1`, id)
	return err
}
