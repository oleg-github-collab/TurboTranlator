# Kaminskyi Language Intelligence

Kaminskyi Language Intelligence ist eine Ende-zu-Ende-Webplattform für KI-gestützte Übersetzungen von Büchern und langen Texten. Das Projekt bündelt einen Go-Backend-Service, ein React/Vite-Frontend, DeepL- und OTranslator-Integrationen, Stripe-Zahlungen sowie alle in Deutschland erforderlichen Rechtstexte.

## Highlights
- **Rebrandete Modelle:** Kaminskyi Basic → Ultimate mit abgestufter Preis-/Leistungsstruktur.
- **Mehrsprachige UI:** Deutsch, Englisch, Ukrainisch inkl. Onboarding und Cookie-Banner.
- **Exakte Abrechnung:** UTF-8-genaue Zeichenzählung client- und serverseitig, Preisberechnung pro 1.860 Zeichen.
- **Asynchrone Verarbeitung:** Redis + Asynq für Warteschlange & Worker, automatische Dateilöschung (7 Tage für Free).
- **Dateiformate:** PDF, DOCX, EPUB, TXT – Format-Erhalt via API-Optionen.
- **Zahlungen:** Stripe Checkout für Einzelübersetzungen, Premium-Abo (12 USD/Monat, 20 % Rabatt, unbegrenzter Speicher).
- **Rechtliches:** Impressum, AGB, Datenschutzerklärung, Cookie Policy, Widerrufsrecht (DE-konform) als Footer-Seiten.
- **Deployment-ready:** Multi-Stage-Dockerfile, docker-compose (App, Postgres, Redis), Railway-Anleitung, `.env.example`.

## Projektstruktur
```
.
├─ backend/                 # Go API + Worker
│  ├─ cmd/api               # main.go
│  ├─ internal/             # Config, Services, Queue, Storage, HTTP
│  ├─ migrations/           # goose SQL Migrationen
│  └─ Makefile              # run/test/migrate
├─ frontend/                # Vite + React + TypeScript UI
│  ├─ src/                  # Komponenten, Hooks, Context, i18n
│  └─ package.json
├─ legal/                   # Markdown-Rechtstexte
├─ docker/                  # Multi-Stage Dockerfile
├─ docker-compose.yml       # App + Postgres + Redis
├─ docs/                    # Architekturhinweise
└─ README.md
```

## Schnellstart (lokal)
### Voraussetzungen
- Go 1.21+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend
```bash
cd backend
cp .env.example .env
# ENV-Werte anpassen (Datenbank, Schlüssel, Stripe etc.)
go mod tidy          # lädt Abhängigkeiten (Internet erforderlich)
make run             # startet API + Worker (Port 8080)
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Vite-Dev-Server auf :5173, Proxypass auf /api
```

### Datenbank & Queue (optional via Docker)
```bash
docker-compose up db redis
```
Migrationen laufen beim API-Start über goose (`backend/migrations`). Alternativ manuell:
```bash
cd backend
go run github.com/pressly/goose/v3/cmd/goose -dir ./migrations postgres "$DATABASE_URL" up
```

## Tests
```bash
cd backend
go test ./...

cd frontend
npm run build        # Typprüfung + Produktionsbundle
```

## Docker & Deployment
```bash
docker build -f docker/Dockerfile -t kli .
docker-compose up --build
```

### Railway
1. Repository forken & auf Railway verbinden.
2. Postgres- und Redis-Service provisionieren.
3. ENV-Variablen aus `backend/.env.example` übertragen (u. a. `DATABASE_URL`, `REDIS_URL`, `DEEPL_API_KEY`, `STRIPE_*`).
4. Build Command: `docker build -f docker/Dockerfile -t app .`
5. Start Command: `./kli`

## Sicherheit & Datenschutz
- JWT (Access/Refresh) + bcrypt-PW-Hashing
- S3/MinIO-Support durch `STORAGE_PROVIDER`
- Nicht-Premium-Dateien werden nach 7 Tagen entfernt (`FILE_RETENTION`)
- Logs-Tabelle für Auditing
- HTTPS wird vom Host (z. B. Railway, Reverse Proxy) bereitgestellt

## Rechtliches
Die folgenden Markdown-Dateien werden im Frontend gerendert und sind über den Footer erreichbar:
- `legal/agb.md`
- `legal/impressum.md`
- `legal/datenschutzerklaerung.md`
- `legal/cookie-policy.md`
- `legal/widerrufsrecht.md`

## API-Überblick (Auszug)
- `POST /api/v1/auth/register` – Registrierung (AGB bestätigen Pflicht)
- `POST /api/v1/auth/login`
- `GET /api/v1/models` – verfügbare Kaminskyi-Modelle
- `POST /api/v1/translations` – Upload + Kostenvorschau
- `POST /api/v1/payments/translations` – Stripe Checkout Session
- `POST /api/v1/payments/webhook` – Stripe Webhook (Erfolg, Abo)
- `GET /api/v1/translations/:id/download` – fertige Übersetzung herunterladen

## Roadmap-Ideen
- Live-Status via WebSockets/SSE
- Virenscan der Uploads (z. B. ClamAV)
- Erweiterte Test-Suite (Webhook/Queue-Mocks)
- Admin-/Support-Oberfläche

---
Made with ❤️ in Berlin · Support: [support@kaminskyi.ai](mailto:support@kaminskyi.ai)
