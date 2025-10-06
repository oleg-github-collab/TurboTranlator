-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    subscription_status TEXT NOT NULL DEFAULT 'free',
    subscription_end_at TIMESTAMPTZ,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    agb_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_lang TEXT,
    target_lang TEXT NOT NULL,
    model_key TEXT NOT NULL,
    character_count INT NOT NULL,
    price_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    options JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL,
    queue_task_id TEXT,
    original_filename TEXT NOT NULL,
    translated_filename TEXT,
    delete_after TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_translations_user ON translations(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_status ON translations(status);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY,
    translation_id UUID NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    kind TEXT NOT NULL,
    stored_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_translation ON files(translation_id);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL,
    stripe_session_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS users;
