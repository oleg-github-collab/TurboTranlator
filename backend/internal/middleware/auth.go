package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/auth"
)

type contextKey string

const userContextKey contextKey = "userClaims"

// AuthMiddleware validates JWT tokens and injects user claims.
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}
			parts := strings.Split(header, " ")
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				http.Error(w, "invalid authorization header", http.StatusUnauthorized)
				return
			}
			claims, err := auth.ParseToken(jwtSecret, parts[1], "access")
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), userContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// MustUserClaims retrieves user claims from context.
func MustUserClaims(r *http.Request) *auth.Claims {
	value := r.Context().Value(userContextKey)
	if value == nil {
		return nil
	}
	if claims, ok := value.(*auth.Claims); ok {
		return claims
	}
	return nil
}
