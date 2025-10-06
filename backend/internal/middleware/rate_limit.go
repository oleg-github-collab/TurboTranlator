package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// RateLimit limits requests per duration per IP.
func RateLimit(requests int, duration time.Duration) func(http.Handler) http.Handler {
	return httprate.LimitByIP(requests, duration)
}
