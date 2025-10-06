# Project Structure - Kaminskyi Language Intelligence

## 📁 Root Directory Structure
```
NewTurboTranslator/
├── .claude/                   # Claude Code configuration
├── .env                       # Environment variables (NOT in git)
├── .git/                      # Git repository
├── .gitignore                 # Git ignore rules
├── README.md                  # Main project documentation
├── PROJECT_STRUCTURE.md       # This file - detailed structure
├── docker-compose.yml         # Docker orchestration
│
├── backend/                   # Go backend service
│   ├── cmd/
│   │   └── api/              # Main application entry point
│   ├── internal/             # Private application code
│   │   ├── auth/            # Authentication logic
│   │   ├── config/          # Configuration management
│   │   ├── db/              # Database connection
│   │   ├── http/            # HTTP handlers
│   │   ├── invoice/         # Invoice generation
│   │   ├── logger/          # Logging utilities
│   │   ├── middleware/      # HTTP middlewares
│   │   ├── models/          # Data models
│   │   ├── payment/         # Stripe payment integration
│   │   ├── queue/           # Redis queue (Asynq)
│   │   ├── repository/      # Data access layer
│   │   ├── services/        # Business logic
│   │   ├── storage/         # File storage (S3/MinIO)
│   │   ├── translation/     # Translation providers (DeepL, etc)
│   │   └── worker/          # Background job workers
│   ├── migrations/           # SQL database migrations
│   ├── pkg/                  # Public utilities
│   ├── testdata/            # Test fixtures
│   ├── go.mod               # Go dependencies
│   ├── go.sum               # Go dependency checksums
│   └── Makefile             # Build commands
│
├── frontend/                  # React + Vite frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # React components
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components (Header, Footer)
│   │   │   ├── modals/      # Modal dialogs
│   │   │   └── widgets/     # Small reusable widgets
│   │   ├── context/         # React Context (Auth, etc)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Internationalization
│   │   │   ├── locales/     # Translation files (de, en, uk)
│   │   │   └── index.ts     # i18n configuration
│   │   ├── pages/           # Page components
│   │   │   └── legal/       # Legal pages (AGB, Privacy, etc)
│   │   ├── styles/          # Global styles
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main App component
│   │   └── main.tsx         # Application entry point
│   ├── index.html           # HTML template
│   ├── package.json         # NPM dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── vite.config.ts       # Vite configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
│
├── docker/                    # Docker configuration
│   └── Dockerfile            # Multi-stage Docker build
│
├── docs/                      # Documentation
│   └── ARCHITECTURE.md       # Architecture documentation
│
├── infra/                     # Infrastructure as Code
│   └── railway.json          # Railway deployment config (example)
│
└── legal/                     # Legal documents (Markdown)
    ├── agb.md                # Terms and Conditions (DE)
    ├── impressum.md          # Imprint (DE)
    ├── datenschutzerklaerung.md  # Privacy Policy (DE)
    ├── cookie-policy.md      # Cookie Policy (DE)
    └── widerrufsrecht.md     # Right of Withdrawal (DE)
```

## 🎯 Key Features by Directory

### Backend (`backend/`)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Payment Processing**: Stripe integration for one-time and subscription payments
- **Translation**: DeepL and OTranslator API integration
- **Queue System**: Redis + Asynq for async job processing
- **Storage**: S3/MinIO support for file uploads
- **Database**: PostgreSQL with goose migrations

### Frontend (`frontend/`)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Context + TanStack Query
- **i18n**: Support for DE, EN, UK languages
- **Forms**: React Hook Form with validation
- **Routing**: React Router v6

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (secrets, API keys) |
| `.gitignore` | Files/folders to exclude from Git |
| `docker-compose.yml` | Local development with Docker |
| `backend/go.mod` | Go dependencies |
| `frontend/package.json` | NPM dependencies |
| `frontend/tsconfig.json` | TypeScript compiler config |
| `frontend/vite.config.ts` | Vite bundler config |
| `frontend/tailwind.config.js` | TailwindCSS theme config |

## 🚀 Quick Navigation

- **Start Backend**: `cd backend && make run`
- **Start Frontend**: `cd frontend && npm run dev`
- **Migrations**: `cd backend && make migrate`
- **Build Docker**: `docker-compose up --build`

## 📝 Notes

1. **No nested TurboTranslator directory** - All files are now at root level
2. **Clean .gitignore** - Excludes build artifacts, dependencies, and secrets
3. **Organized structure** - Clear separation of concerns
4. **Type-safe** - Full TypeScript coverage in frontend
5. **Production-ready** - Docker, migrations, and deployment configs included

---
Last updated: October 6, 2024
