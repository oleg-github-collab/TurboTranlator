FROM node:16-alpine AS build

WORKDIR /app

# Копіювання package.json
COPY frontend/package.json ./

# Встановлення залежностей (використовуємо npm install замість npm ci)
RUN npm install

# Копіювання всіх файлів фронтенду
COPY frontend/ ./

# Переконуємося, що директорія public існує з index.html
RUN mkdir -p public

# Створюємо базовий index.html, якщо він відсутній
RUN if [ ! -f public/index.html ]; then \
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>TurboTranslator</title></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>' > public/index.html; \
    fi

# Перевіряємо наявність index.html перед збіркою
RUN ls -la public/

# Створення production build
RUN npm run build

# Налаштування production образу
FROM nginx:alpine

# Копіювання збірки з етапу build
COPY --from=build /app/build /usr/share/nginx/html

# Копіювання налаштувань Nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Порт, який буде доступний
EXPOSE 80

# Запуск Nginx
CMD ["nginx", "-g", "daemon off;"]