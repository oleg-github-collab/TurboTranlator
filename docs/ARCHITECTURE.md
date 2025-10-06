# Kaminskyi Language Intelligence – Architecture Overview

Kaminskyi Language Intelligence is a full-stack platform for AI-powered translation of large documents. The system consists of a TypeScript/React frontend, a Go backend, PostgreSQL for persistence, Redis for distributed queues/pub-sub, and optional S3-compatible object storage. All components are built with production-readiness, GDPR compliance, and Railway deployment in mind.

## High-Level Components

- **Frontend (React + Vite + TypeScript)**: Implements the glassmorphism UI, onboarding wizard, translation workflow, payments, multilingual interface (German, Ukrainian, English), and legal pages. Communicates with backend REST endpoints and WebSocket/SSE channels.
- **Backend (Go)**: Provides REST API, authentication (JWT), file ingestion, translation orchestration, billing, Stripe integration, and legal compliance endpoints. Exposes WebSocket notifications for translation progress.
- **Queue / Workers (Redis + Asynq)**: Asynchronous translation jobs and clean-up tasks are processed by background workers to keep API responsive and allow scaling to 100 concurrent users.
- **PostgreSQL**: Stores users, translations, payments, logs, and subscription data. Managed via SQL migrations.
- **Object Storage (S3-compatible or local)**: Persists uploaded source files, translated outputs, and generated invoices. Local storage is used for development, while production can switch to S3 by configuration.
- **Stripe**: Handles payments for translations (per-character billing) and monthly premium subscriptions. Webhooks synchronize payment states.

## Backend Services

```
backend/
  cmd/api/main.go           // entrypoint wiring config, DB, Redis, HTTP router
  internal/
    config/                 // environment parsing & defaults
    logger/                 // structured logging via zerolog
    db/                     // postgres connection + migrations bootstrap
    models/                 // Go structs representing DB entities
    repository/             // database access layer
    auth/                   // bcrypt + JWT utilities
    http/                   // REST handlers & router
    middleware/             // auth enforcement, i18n, rate limiting
    services/
      user.go               // registration, login, profile, consent handling
      translation.go        // char counting, cost calculation, job creation
      schedule.go           // cron-like cleanup of expired files
    queue/                  // Asynq client & task definitions
    worker/                 // background workers processing translation tasks
    storage/                // Local and S3 storage providers
    translation/            // Integrations with DeepL & OTranslator APIs
    payment/                // Stripe billing & subscription logic
    invoice/                // PDF generation for invoices
  migrations/               // SQL schema definitions
  testdata/                 // sample payloads for tests
```

### Translation Models

Each translation model is rebranded as "Kaminskyi <Tier>" with metadata defining provider, price per 1860 characters, available features, and provider-specific options. The backend exposes these models through `GET /api/v1/models`. Pricing tiers:

| Model               | Provider      | Price (EUR / 1860 chars) | Highlights |
|---------------------|---------------|---------------------------|------------|
| Kaminskyi Basic     | DeepL (basic) | 0.28                      | General-purpose, fast |
| Kaminskyi Standard  | DeepL (pro)   | 0.40                      | Formality control, tag handling |
| Kaminskyi Pro       | DeepL (advanced) | 0.55                   | Glossaries, context handling |
| Kaminskyi Elite     | OTranslator mid-tier | 0.70                | Rich media, image translation |
| Kaminskyi Epic      | OTranslator advanced | 0.85               | Batch processing, tone styles |
| Kaminskyi Ultimate  | OTranslator premium | 0.96               | Multi-pass proofreading |

Premium subscribers receive a 20% discount on all per-translation prices.

### Database Entities

- **users**: username (unique), password_hash, agb_accepted_at, subscription_status (enum: `free`/`premium`), subscription_end_at, balance_cents, created_at, updated_at.
- **translations**: user_id, source_lang, target_lang, model_key, character_count, price_cents, currency, status, queue_job_id, original_filename, translated_filename, delete_after, created_at, updated_at, failure_reason.
- **files**: translation_id, storage_key, kind (`source`/`translated`/`invoice`), stored_until.
- **payments**: user_id, translation_id (nullable), amount_cents, currency, stripe_session_id, stripe_payment_intent_id, status, created_at.
- **logs**: level, message, metadata JSON, created_at.

SQL migrations are written for PostgreSQL and orchestrated with `golang-migrate` (see `backend/migrations/0001_initial.sql`).

### Authentication & Authorization

- Passwords hashed with bcrypt (`bcrypt.DefaultCost`).
- JWT access tokens (HS256) with 1h lifetime and refresh tokens (30 days).
- AGB acceptance timestamp recorded during registration; API rejects registration if not accepted.
- Middleware enforces JWT verification and extracts user context.

### File Handling & Character Counting

- Uploads accepted via multipart, validated for size and supported extensions (PDF, DOCX, EPUB, TXT).
- Source files stored securely using the configured storage provider and scanned (hook for ClamAV integration).
- Character counting performed server-side using UTF-8 aware counter (counts runes, excluding metadata/tags when requested).
- Client provides preview counts; server calculation treated as canonical for billing.

### Translation Workflow

1. User submits translation request with file, source/target languages, model, options.
2. Backend validates payment state, charges via Stripe or applies subscription discount.
3. A translation job is enqueued in Redis (Asynq) with metadata.
4. Worker fetches job, streams file to provider (DeepL/OTranslator), polls for completion, and stores translated output.
5. Invoice PDF generated and stored; translation status updates broadcast via Redis Pub/Sub to HTTP/WebSocket subscribers.
6. Non-premium files scheduled for deletion after 7 days via periodic cleanup job; premium files retained indefinitely.

### GDPR & Legal Compliance

- Legal documents (Impressum, AGB, Datenschutzerklärung, Cookie Policy, Widerrufsbelehrung) maintained in `legal/` and surfaced in frontend routes.
- Cookie & data-consent banners implemented using React component with persistence in `localStorage`.
- Logging and analytics anonymize IPs; IP anonymization toggle in config.
- User data export/delete endpoints provided (planned) to support GDPR rights.

### Deployment (Railway)

- Multi-stage Dockerfile compiles Go backend and bundles built React frontend into `/app/public` for serving through backend.
- `docker-compose.yml` orchestrates backend, frontend (for local dev), Postgres, Redis, and MinIO.
- Railway variables: `DATABASE_URL`, `REDIS_URL`, `DEEPL_API_KEY`, `OTRANSLATOR_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `STORAGE_BUCKET`, etc.
- CI/CD leverages Railway GitHub integration (build command `docker build -f docker/Dockerfile .`).

## Testing Strategy

- Go unit tests for character counting, cost calculation, JWT auth, and model selection logic.
- Integration tests (Go) stub API clients using httptest servers to simulate DeepL/OTranslator responses.
- Frontend unit tests via Vitest for hooks (character counting, pricing) and components (cookie banner, onboarding modal).
- End-to-end scenarios defined with Playwright (scripts placeholder) to validate registration, payment, translation flow.

## Scaling Considerations

- Horizontal scaling supported by stateless backend design and shared Redis/PostgreSQL.
- Rate limiting middleware uses Redis to throttle abusive users.
- Background workers can be scaled separately to handle translation throughput (100 concurrent users baseline).
- Observability via structured logs and status endpoints.

