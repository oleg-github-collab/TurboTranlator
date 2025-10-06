.PHONY: run test lint migrate

run:
	go run ./cmd/api

test:
	go test ./...

migrate:
	go run github.com/pressly/goose/v3/cmd/goose -dir ./migrations postgres "$$DATABASE_URL" up
