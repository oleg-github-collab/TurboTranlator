package storage

import (
	"context"
	"io"
)

// Provider defines storage operations required by the app.
type Provider interface {
	Save(ctx context.Context, path string, reader io.Reader, contentType string) error
	Get(ctx context.Context, path string) (io.ReadCloser, error)
	Delete(ctx context.Context, path string) error
	SignedURL(ctx context.Context, path string, expirySeconds int) (string, error)
}
