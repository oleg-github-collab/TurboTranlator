package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
)

// PaymentRepository stores payment metadata.
type PaymentRepository struct {
	db *sqlx.DB
}

// NewPaymentRepository constructs PaymentRepository.
func NewPaymentRepository(db *sqlx.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

// Create inserts a payment record.
func (r *PaymentRepository) Create(ctx context.Context, payment *models.Payment) (*models.Payment, error) {
	payment.ID = uuid.NewString()
	payment.CreatedAt = time.Now().UTC()
	query := `INSERT INTO payments (id, user_id, translation_id, amount_cents, currency, stripe_session_id, stripe_payment_intent, status, created_at)
              VALUES (:id, :user_id, :translation_id, :amount_cents, :currency, :stripe_session_id, :stripe_payment_intent, :status, :created_at)`
	if _, err := r.db.NamedExecContext(ctx, query, payment); err != nil {
		return nil, err
	}
	return payment, nil
}

// UpdateStatus updates the payment status.
func (r *PaymentRepository) UpdateStatus(ctx context.Context, stripeSessionID, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE payments SET status=$1 WHERE stripe_session_id=$2`, status, stripeSessionID)
	return err
}

// GetByStripeSession returns payment by Stripe session id.
func (r *PaymentRepository) GetByStripeSession(ctx context.Context, sessionID string) (*models.Payment, error) {
	var payment models.Payment
	if err := r.db.GetContext(ctx, &payment, `SELECT * FROM payments WHERE stripe_session_id=$1`, sessionID); err != nil {
		return nil, err
	}
	return &payment, nil
}
