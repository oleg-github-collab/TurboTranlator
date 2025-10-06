package repository

import (
	"context"
	"github.com/jmoiron/sqlx"
)

// LogRepository persists audit logs.
type LogRepository struct {
	db *sqlx.DB
}

// NewLogRepository constructs LogRepository.
func NewLogRepository(db *sqlx.DB) *LogRepository {
	return &LogRepository{db: db}
}

// Insert adds a log entry.
func (r *LogRepository) Insert(ctx context.Context, level, message, contextJSON string) error {
	_, err := r.db.ExecContext(ctx, `INSERT INTO logs (level, message, context, created_at) VALUES ($1, $2, $3, NOW())`, level, message, contextJSON)
	return err
}
