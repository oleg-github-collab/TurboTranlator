FROM node:16-alpine as build

WORKDIR /app

# Встановлення залежностей
COPY package.json package-lock.json ./
RUN npm ci

# Копіювання коду
COPY . .

# Збірка проєкту
RUN npm run build

# Налаштування production-образу
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]