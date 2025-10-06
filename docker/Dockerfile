# Frontend build
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Backend build
FROM golang:1.21-alpine AS backend-builder
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend ./
COPY --from=frontend-builder /app/dist ./public
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/kli ./cmd/api

# Final runtime image
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=backend-builder /bin/kli ./kli
COPY --from=backend-builder /src/public ./public
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["./kli"]
