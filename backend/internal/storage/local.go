package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"time"
)

// LocalStorage stores files on disk inside a base directory.
type LocalStorage struct {
	baseDir   string
	publicURL string
}

// NewLocalStorage constructs a LocalStorage provider.
func NewLocalStorage(baseDir, publicURL string) (*LocalStorage, error) {
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return nil, err
	}
	return &LocalStorage{baseDir: baseDir, publicURL: publicURL}, nil
}

func (s *LocalStorage) resolve(path string) string {
	return filepath.Join(s.baseDir, filepath.Clean(path))
}

// Save writes file to disk.
func (s *LocalStorage) Save(_ context.Context, path string, reader io.Reader, _ string) error {
	fullPath := s.resolve(path)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return err
	}
	file, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err := io.Copy(file, reader); err != nil {
		return err
	}
	return nil
}

// Get opens a file for reading.
func (s *LocalStorage) Get(_ context.Context, path string) (io.ReadCloser, error) {
	fullPath := s.resolve(path)
	return os.Open(fullPath)
}

// Delete removes file from disk.
func (s *LocalStorage) Delete(_ context.Context, path string) error {
	fullPath := s.resolve(path)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// SignedURL returns a pseudo-public URL for local development.
func (s *LocalStorage) SignedURL(_ context.Context, path string, expirySeconds int) (string, error) {
	if s.publicURL == "" {
		return "", fmt.Errorf("no public URL configured for local storage")
	}
	u, err := url.Parse(s.publicURL)
	if err != nil {
		return "", err
	}
	u.Path = filepath.Join(u.Path, path)
	q := u.Query()
	q.Set("expires", fmt.Sprint(time.Now().Add(time.Duration(expirySeconds)*time.Second).Unix()))
	u.RawQuery = q.Encode()
	return u.String(), nil
}
