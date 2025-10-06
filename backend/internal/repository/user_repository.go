package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
)

// UserRepository provides DB operations for users.
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository constructs a UserRepository.
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user.
func (r *UserRepository) Create(ctx context.Context, username, passwordHash string, agbAcceptedAt time.Time) (*models.User, error) {
	user := &models.User{
		ID:            uuid.NewString(),
		Username:      username,
		PasswordHash:  passwordHash,
		Subscription:  models.SubscriptionFree,
		BalanceCents:  0,
		AGBAcceptedAt: agbAcceptedAt,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	query := `INSERT INTO users (id, username, password_hash, subscription_status, balance_cents, agb_accepted_at, created_at, updated_at)
              VALUES (:id, :username, :password_hash, :subscription_status, :balance_cents, :agb_accepted_at, :created_at, :updated_at)`
	if _, err := r.db.NamedExecContext(ctx, query, user); err != nil {
		return nil, err
	}
	return user, nil
}

// GetByUsername fetches a user by username.
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	if err := r.db.GetContext(ctx, &user, `SELECT * FROM users WHERE username=$1`, username); err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByID fetches a user by ID.
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	if err := r.db.GetContext(ctx, &user, `SELECT * FROM users WHERE id=$1`, id); err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateSubscription updates subscription info.
func (r *UserRepository) UpdateSubscription(ctx context.Context, id string, status models.SubscriptionStatus, endAt *time.Time) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET subscription_status=$1, subscription_end_at=$2, updated_at=$3 WHERE id=$4`, status, endAt, time.Now().UTC(), id)
	return err
}

// UpdateBalance sets the balance cents.
func (r *UserRepository) UpdateBalance(ctx context.Context, id string, balanceCents int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET balance_cents=$1, updated_at=$2 WHERE id=$3`, balanceCents, time.Now().UTC(), id)
	return err
}
