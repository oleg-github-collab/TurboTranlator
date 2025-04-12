# Етап 1: збірка фронтенду
FROM node:18-alpine AS build-stage

WORKDIR /app

# Копіюємо package.json і lock-файл
COPY ./frontend/package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код
COPY ./frontend .

# Білдимо проєкт (Create React App генерує папку build)
RUN npm run build

# Етап 2: продакшн-контейнер з nginx
FROM nginx:alpine

# Копіюємо зібраний білд із попереднього контейнера
COPY --from=build-stage /app/build /usr/share/nginx/html

# Копіюємо nginx конфіг
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
