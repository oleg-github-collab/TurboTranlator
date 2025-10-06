package http

import (
	stdhttp "net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	appmiddleware "github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/middleware"
)

// NewRouter wires up the HTTP router with middlewares.
func NewRouter(handler *Handler, allowOrigins []string, rateLimit int) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(appmiddleware.CORS(allowOrigins))
	if rateLimit > 0 {
		r.Use(appmiddleware.RateLimit(rateLimit, time.Minute))
	}

	r.Get("/healthz", func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		w.WriteHeader(stdhttp.StatusOK)
		w.Write([]byte("ok"))
	})

	handler.RegisterRoutes(r)

	return r
}
