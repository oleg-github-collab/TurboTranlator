# Етап 1: збірка фронтенду
FROM node:18-alpine as build-stage

WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend ./
RUN npm run build

# Етап 2: NGINX з готовим білдом
FROM nginx:alpine

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Або, якщо це Create React App:
# COPY --from=build-stage /app/build /usr/share/nginx/html

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
