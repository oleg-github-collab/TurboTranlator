# 🚂 Railway Deployment Guide

## Підготовка

### 1. Створіть новий проект на Railway
1. Відкрийте [railway.app](https://railway.app)
2. Login через GitHub
3. Натисніть "New Project"
4. Виберіть "Deploy from GitHub repo"
5. Оберіть репозиторій `TurboTranlator`

### 2. Додайте сервіси

#### PostgreSQL Database
1. У проекті натисніть "+ New"
2. Виберіть "Database" → "PostgreSQL"
3. Railway автоматично створить DATABASE_URL

#### Redis
1. Натисніть "+ New"
2. Виберіть "Database" → "Redis"
3. Railway автоматично створить REDIS_URL

### 3. Налаштуйте змінні оточення

Перейдіть у Settings → Variables вашого додатку та додайте:

```bash
# Автоматично надаються Railway
DATABASE_URL=(автоматично)
REDIS_URL=(автоматично)

# Application Settings
APP_ENV=production
SERVER_PORT=8080
PUBLIC_URL=https://your-app-name.up.railway.app
FRONTEND_URL=https://your-app-name.up.railway.app

# Translation API Keys (ВИ ЇХ ВЖЕ МАЄТЕ!)
DEEPL_API_KEY=9028c163-650b-4594-b662-79e968d6e32c
OTRANSLATOR_API_KEY=sk-d477e9fae8373c9389c117086fd10ca219475879a56a17484fb03ede4234
OTRANSLATOR_BASE_URL=https://api.otranslator.ai

# JWT Secret (використовуйте існуючий або згенеруйте новий)
JWT_SECRET=cf2d95fbc1a99501b672fc51c610a74f78ba5870ef4c056c154c653e5032f178
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=720h

# Stripe (ДОДАЙТЕ ПІЗНІШЕ)
# 1. Створіть обліковий запис Stripe: https://stripe.com
# 2. Отримайте ключі в Dashboard → Developers → API keys
STRIPE_SECRET_KEY=sk_test_ваш_ключ_тут
STRIPE_PUBLISHABLE_KEY=pk_test_ваш_ключ_тут
STRIPE_WEBHOOK_SECRET=whsec_ваш_вебхук_тут
STRIPE_PREMIUM_PRICE_ID=price_ваш_прайс_id
STRIPE_CURRENCY=eur

# Storage (залиште як є для початку)
STORAGE_PROVIDER=local
STORAGE_BUCKET=uploads
STORAGE_REGION=us-east-1

# File Management
CLEANUP_INTERVAL=1h
FILE_RETENTION=168h

# CORS (для production використовуйте конкретний домен)
ALLOW_ORIGINS=https://your-app-name.up.railway.app

# Debug
ENABLE_DEBUG=false
```

### 4. Build і Deploy налаштування

Railway автоматично виявить Dockerfile та використає його.

**Dockerfile вже налаштований!** Він:
- Збирає Go backend
- Збирає React frontend
- Об'єднує їх в один контейнер
- Експонує порт 8080

### 5. Deploy!

1. Railway автоматично почне deployment після push на main
2. Слідкуйте за логами в консолі Railway
3. Після успішного deploy отримаєте URL типу: `https://your-app-name.up.railway.app`

## 🔍 Перевірка

1. Відкрийте `https://your-app-name.up.railway.app`
2. Спробуйте зареєструватися
3. Перевірте логін
4. Тест створення перекладу

## ⚠️ Важливо!

### Stripe Webhook
Після налаштування Stripe:
1. Перейдіть в Stripe Dashboard → Webhooks
2. Додайте endpoint: `https://your-app-name.up.railway.app/api/v1/payments/webhook`
3. Оберіть події: `checkout.session.completed`, `customer.subscription.updated`
4. Скопіюйте Webhook Secret в STRIPE_WEBHOOK_SECRET

### Що ПОТРІБНО зробити ЗАРАЗ:
✅ DeepL API key - **ВЖЕ ДОДАНО**
✅ OTranslator API key - **ВЖЕ ДОДАНО**
⏳ Stripe keys - додайте коли будете готові приймати платежі

### Що можна додати ПІЗНІШЕ:
- S3/MinIO для зберігання файлів (зараз local storage)
- Custom domain
- CDN для статики

## 🆘 Troubleshooting

### Помилка "Database connection failed"
- Перевірте що PostgreSQL сервіс запущений
- DATABASE_URL має бути автоматично прив'язаний

### Помилка "Redis connection failed"
- Перевірте що Redis сервіс запущений
- REDIS_URL має бути автоматично прив'язаний

### Build failed
- Перегляньте логи в Railway консолі
- Перевірте що go.mod та package.json правильні

## 📊 Моніторинг

1. **Logs**: Railway → Service → Logs
2. **Metrics**: Railway → Service → Metrics
3. **Database**: Railway → PostgreSQL → Metrics

## 🎯 Наступні кроки

1. ✅ Deploy на Railway (ВИ ЗРОБИЛИ ЦЕ!)
2. Створити Stripe account
3. Додати Stripe keys
4. Налаштувати webhook
5. Тестувати платежі
6. (Опціонально) Підключити custom domain

---
**Готово до тестування!** 🚀

Ваші API ключі вже в .env локально і готові до додавання в Railway.
