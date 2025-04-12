FROM python:3.9-slim

WORKDIR /app

# Встановлюємо залежності
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо код бекенду
COPY backend/ .

# Створюємо директорію для завантажених файлів
RUN mkdir -p uploads

# Запускаємо Gunicorn для обслуговування Flask додатку
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]