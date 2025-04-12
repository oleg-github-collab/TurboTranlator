FROM node:16-alpine as build

WORKDIR /app

# Копіювання package.json та встановлення залежностей
COPY frontend/package.json ./
RUN npm install

# Копіювання коду фронтенду
COPY frontend/ .

# Створення production build
RUN npm run build

# Налаштування production образу
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]