# Етап збірки
FROM node:18-alpine as build

WORKDIR /app

# Копіюємо package.json та встановлюємо залежності
COPY frontend/package.json ./
RUN npm install

# Копіюємо код фронтенду
COPY frontend/ ./

# Виконуємо збірку
RUN npm run build

# Етап production не потрібен, оскільки використовуємо окремий Nginx
# Просто результат збірки