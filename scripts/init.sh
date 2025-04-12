#!/bin/bash

# Ініціалізаційний скрипт для першого запуску застосунку

# Створення необхідних директорій
mkdir -p backend/files/uploads
mkdir -p backend/files/translations
mkdir -p nginx/ssl


# Встановлення прав на виконання
chmod +x backend/migrations/migrate.sh

echo "Створення .env файлу..."
if [ ! -f .env ]; then
    # Генерація секретних ключів
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    # Створення .env файлу
    cat > .env << EOF
# Безпека
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}

# База даних
DB_USER=translator_user
DB_PASSWORD=secure_db_password
DB_NAME=translator_db
DATABASE_URL=postgresql://translator_user:secure_db_password@db:5432/translator_db

# Redis
REDIS_URL=redis://redis:6379/0

# API ключі (замініть на власні)
OTRANSLATOR_API_KEY=your_otranslator_api_key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Середовище
FLASK_ENV=development
EOF

    echo ".env файл створено. Відредагуйте його, щоб додати справжні API ключі."
else
    echo ".env файл вже існує."
fi

echo "Ініціалізацію завершено."
echo "Далі виконайте: docker-compose up -d"