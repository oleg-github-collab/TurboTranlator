FROM python:3.9-slim

WORKDIR /app

# Встановлення залежностей системи
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копіювання і встановлення залежностей Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Створення необхідних директорій
RUN mkdir -p /app/files/uploads /app/files/translations

# Копіювання коду додатку
COPY backend/ .

# Змінні середовища за замовчуванням
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py

# Порт, який буде використовувати додаток
EXPOSE 5000

# Команда для запуску додатку
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]