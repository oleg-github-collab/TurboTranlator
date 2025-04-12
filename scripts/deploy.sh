#!/bin/bash
# Скрипт для розгортання TurboTranslator

# Зупиняємо попередню версію
docker compose down

# Перебудовуємо всі образи
docker compose build

# Запускаємо всі контейнери
docker compose up -d

# Перевіряємо статус
docker compose ps

echo "Розгортання завершено! Перевірте http://your-server-ip"