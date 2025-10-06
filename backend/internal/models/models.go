package models

import "time"

// SubscriptionStatus enumerates user subscription tiers.
type SubscriptionStatus string

const (
	SubscriptionFree    SubscriptionStatus = "free"
	SubscriptionPremium SubscriptionStatus = "premium"
)

// TranslationStatus enumerates states for translation jobs.
type TranslationStatus string

const (
	TranslationPending    TranslationStatus = "pending"
	TranslationQueued     TranslationStatus = "queued"
	TranslationProcessing TranslationStatus = "processing"
	TranslationCompleted  TranslationStatus = "completed"
	TranslationFailed     TranslationStatus = "failed"
)

// FileKind identifies stored file purpose.
type FileKind string

const (
	FileKindSource     FileKind = "source"
	FileKindTranslated FileKind = "translated"
	FileKindInvoice    FileKind = "invoice"
)

// User represents an authenticated user.
type User struct {
	ID               string             `db:"id" json:"id"`
	Username         string             `db:"username" json:"username"`
	PasswordHash     string             `db:"password_hash" json:"-"`
	Subscription     SubscriptionStatus `db:"subscription_status" json:"subscriptionStatus"`
	SubscriptionEnds *time.Time         `db:"subscription_end_at" json:"subscriptionEndAt,omitempty"`
	BalanceCents     int64              `db:"balance_cents" json:"balanceCents"`
	AGBAcceptedAt    time.Time          `db:"agb_accepted_at" json:"agbAcceptedAt"`
	CreatedAt        time.Time          `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time          `db:"updated_at" json:"updatedAt"`
}

// Translation describes a translation request and result.
type Translation struct {
	ID                 string            `db:"id" json:"id"`
	UserID             string            `db:"user_id" json:"userId"`
	SourceLang         string            `db:"source_lang" json:"sourceLang"`
	TargetLang         string            `db:"target_lang" json:"targetLang"`
	ModelKey           string            `db:"model_key" json:"modelKey"`
	CharacterCount     int               `db:"character_count" json:"characterCount"`
	PriceCents         int64             `db:"price_cents" json:"priceCents"`
	Currency           string            `db:"currency" json:"currency"`
	Options            JSONB             `db:"options" json:"options"`
	Status             TranslationStatus `db:"status" json:"status"`
	QueueTaskID        string            `db:"queue_task_id" json:"queueTaskId"`
	OriginalFilename   string            `db:"original_filename" json:"originalFilename"`
	TranslatedFilename *string           `db:"translated_filename" json:"translatedFilename,omitempty"`
	DeleteAfter        *time.Time        `db:"delete_after" json:"deleteAfter,omitempty"`
	FailureReason      *string           `db:"failure_reason" json:"failureReason,omitempty"`
	CreatedAt          time.Time         `db:"created_at" json:"createdAt"`
	UpdatedAt          time.Time         `db:"updated_at" json:"updatedAt"`
	CompletedAt        *time.Time        `db:"completed_at" json:"completedAt,omitempty"`
}

// FileRecord stores metadata for files in storage.
type FileRecord struct {
	ID            string     `db:"id" json:"id"`
	TranslationID string     `db:"translation_id" json:"translationId"`
	StorageKey    string     `db:"storage_key" json:"storageKey"`
	Kind          FileKind   `db:"kind" json:"kind"`
	StoredUntil   *time.Time `db:"stored_until" json:"storedUntil,omitempty"`
	CreatedAt     time.Time  `db:"created_at" json:"createdAt"`
}

// Payment represents Stripe payment metadata.
type Payment struct {
	ID                  string    `db:"id" json:"id"`
	UserID              string    `db:"user_id" json:"userId"`
	TranslationID       *string   `db:"translation_id" json:"translationId,omitempty"`
	AmountCents         int64     `db:"amount_cents" json:"amountCents"`
	Currency            string    `db:"currency" json:"currency"`
	StripeSessionID     string    `db:"stripe_session_id" json:"stripeSessionId"`
	StripePaymentIntent string    `db:"stripe_payment_intent" json:"stripePaymentIntent"`
	Status              string    `db:"status" json:"status"`
	CreatedAt           time.Time `db:"created_at" json:"createdAt"`
}

// LogEntry stores application events for auditing.
type LogEntry struct {
	ID        int64     `db:"id" json:"id"`
	Level     string    `db:"level" json:"level"`
	Message   string    `db:"message" json:"message"`
	Context   string    `db:"context" json:"context"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}

// ModelDescriptor describes a translation model exposed to clients.
type ModelDescriptor struct {
	Key           string            `json:"key"`
	DisplayName   string            `json:"displayName"`
	Provider      string            `json:"provider"`
	Tier          string            `json:"tier"`
	PricePer1860  float64           `json:"pricePer1860"`
	Currency      string            `json:"currency"`
	Features      []string          `json:"features"`
	Options       map[string]string `json:"options"`
	MaxCharacters int               `json:"maxCharacters"`
	SpeedScore    int               `json:"speedScore"`
	AccuracyScore int               `json:"accuracyScore"`
}

// InvoiceMetadata holds data needed to render PDF invoices.
type InvoiceMetadata struct {
	InvoiceNumber    string
	User             User
	Translation      Translation
	Model            ModelDescriptor
	NetAmountCents   int64
	TaxAmountCents   int64
	GrossAmountCents int64
	Currency         string
	IssuedAt         time.Time
}
