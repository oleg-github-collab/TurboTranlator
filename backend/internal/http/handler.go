package http

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/auth"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/config"
	appmiddleware "github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/middleware"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/services"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/translation"
)

// Handler bundles HTTP handlers.
type Handler struct {
	cfg                 *config.Config
	userService         *services.UserService
	translationSvc      *services.TranslationService
	paymentService      *services.PaymentService
	stripeWebhookSecret string
}

// NewHandler constructs HTTP handler.
func NewHandler(cfg *config.Config, userSvc *services.UserService, translationSvc *services.TranslationService, paymentSvc *services.PaymentService) *Handler {
	return &Handler{
		cfg:                 cfg,
		userService:         userSvc,
		translationSvc:      translationSvc,
		paymentService:      paymentSvc,
		stripeWebhookSecret: cfg.StripeWebhookSecret,
	}
}

// RegisterRoutes wires REST endpoints.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", h.handleRegister)
			r.Post("/login", h.handleLogin)
			r.Post("/refresh", h.handleRefresh)
			r.Group(func(r chi.Router) {
				r.Use(appmiddleware.AuthMiddleware(h.cfg.JWTSecret))
				r.Get("/me", h.handleMe)
			})
		})

		r.Get("/models", h.handleListModels)

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.AuthMiddleware(h.cfg.JWTSecret))
			r.Post("/translations", h.handleCreateTranslation)
			r.Get("/translations", h.handleListTranslations)
			r.Get("/translations/{id}", h.handleGetTranslation)
			r.Get("/translations/{id}/download", h.handleDownloadTranslation)
			r.Get("/translations/{id}/events", h.handleTranslationEvents)

			r.Post("/payments/translations", h.handleCreateTranslationPayment)
			r.Post("/payments/subscription", h.handleCreateSubscriptionPayment)
		})

		r.Post("/payments/webhook", h.handleStripeWebhook)
	})
}

type registerRequest struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Confirm   string `json:"confirm"`
	AGBAccept bool   `json:"agbAccept"`
}

type authResponse struct {
	User   *models.User    `json:"user"`
	Tokens *auth.TokenPair `json:"tokens"`
}

func (h *Handler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	if req.Password != req.Confirm {
		respondError(w, http.StatusBadRequest, "passwords do not match")
		return
	}
	if !req.AGBAccept {
		respondError(w, http.StatusBadRequest, "AGB must be accepted")
		return
	}
	ctx := r.Context()
	user, tokens, err := h.userService.Register(ctx, req.Username, req.Password, time.Now())
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, authResponse{User: user, Tokens: tokens})
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	user, tokens, err := h.userService.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, authResponse{User: user, Tokens: tokens})
}

func (h *Handler) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	claims, err := auth.ParseToken(h.cfg.JWTSecret, req.RefreshToken, "refresh")
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}
	user, err := h.userService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "user not found")
		return
	}
	tokens, err := auth.GenerateTokenPair(h.cfg.JWTSecret, user.ID, user.Username, h.cfg.AccessTokenTTL, h.cfg.RefreshTokenTTL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "could not issue tokens")
		return
	}
	respondJSON(w, http.StatusOK, authResponse{User: user, Tokens: tokens})
}

func (h *Handler) handleMe(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.userService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *Handler) handleListModels(w http.ResponseWriter, r *http.Request) {
	models := translation.ListModelDescriptors()
	respondJSON(w, http.StatusOK, models)
}

func (h *Handler) handleCreateTranslation(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.userService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := r.ParseMultipartForm(200 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to read file")
		return
	}
	sourceLang := r.FormValue("sourceLang")
	targetLang := r.FormValue("targetLang")
	modelKey := r.FormValue("modelKey")
	optionsValue := r.FormValue("options")
	stripTagsValue := r.FormValue("stripTags")
	stripTags := stripTagsValue == "true"
	var options map[string]interface{}
	if optionsValue != "" {
		if err := json.Unmarshal([]byte(optionsValue), &options); err != nil {
			respondError(w, http.StatusBadRequest, "invalid options json")
			return
		}
	}

	contentType := services.DetermineContentType(header.Filename)

	result, err := h.translationSvc.CreateTranslation(r.Context(), services.CreateTranslationInput{
		User:        user,
		Filename:    header.Filename,
		Data:        data,
		ContentType: contentType,
		SourceLang:  sourceLang,
		TargetLang:  targetLang,
		ModelKey:    modelKey,
		Options:     options,
		StripTags:   stripTags,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"translation": result.Translation,
		"model":       result.Model.ModelDescriptor,
	})
}

func (h *Handler) handleListTranslations(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	translations, err := h.translationSvc.ListTranslations(r.Context(), claims.UserID, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load translations")
		return
	}
	respondJSON(w, http.StatusOK, translations)
}

func (h *Handler) handleGetTranslation(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := chi.URLParam(r, "id")
	translation, err := h.translationSvc.GetTranslation(r.Context(), id)
	if err != nil || translation.UserID != claims.UserID {
		respondError(w, http.StatusNotFound, "translation not found")
		return
	}
	respondJSON(w, http.StatusOK, translation)
}

func (h *Handler) handleDownloadTranslation(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := chi.URLParam(r, "id")
	translation, err := h.translationSvc.GetTranslation(r.Context(), id)
	if err != nil || translation.UserID != claims.UserID {
		respondError(w, http.StatusNotFound, "translation not found")
		return
	}
	if translation.Status != models.TranslationCompleted {
		respondError(w, http.StatusConflict, "translation not ready")
		return
	}
	reader, filename, err := h.translationSvc.OpenTranslatedFile(r.Context(), translation.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer reader.Close()
	w.Header().Set("Content-Disposition", "attachment; filename="+strconv.Quote(filename))
	w.Header().Set("Content-Type", services.DetermineContentType(filename))
	if _, err := io.Copy(w, reader); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
}

func (h *Handler) handleTranslationEvents(w http.ResponseWriter, r *http.Request) {
	f, ok := w.(http.Flusher)
	if !ok {
		respondError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	id := chi.URLParam(r, "id")
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	translation, err := h.translationSvc.GetTranslation(r.Context(), id)
	if err != nil || translation.UserID != claims.UserID {
		respondError(w, http.StatusNotFound, "translation not found")
		return
	}
	ctx := r.Context()
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			translation, err := h.translationSvc.GetTranslation(ctx, id)
			if err != nil {
				return
			}
			payload, _ := json.Marshal(translation)
			w.Write([]byte("data: "))
			w.Write(payload)
			w.Write([]byte("\n\n"))
			f.Flush()
			if translation.Status == models.TranslationCompleted || translation.Status == models.TranslationFailed {
				return
			}
		}
	}
}

func (h *Handler) handleCreateTranslationPayment(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req struct {
		TranslationID string `json:"translationId"`
		SuccessURL    string `json:"successUrl"`
		CancelURL     string `json:"cancelUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	session, err := h.paymentService.StartTranslationCheckout(r.Context(), claims.UserID, req.TranslationID, req.SuccessURL, req.CancelURL)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, session)
}

func (h *Handler) handleCreateSubscriptionPayment(w http.ResponseWriter, r *http.Request) {
	claims := appmiddleware.MustUserClaims(r)
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req struct {
		SuccessURL string `json:"successUrl"`
		CancelURL  string `json:"cancelUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	session, err := h.paymentService.StartSubscriptionCheckout(r.Context(), claims.UserID, req.SuccessURL, req.CancelURL)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, session)
}

func (h *Handler) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	sig := r.Header.Get("Stripe-Signature")
	event, err := h.paymentService.VerifyWebhook(body, sig, h.stripeWebhookSecret)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	switch event.Type {
	case "checkout.session.completed":
		var session struct {
			ID       string            `json:"id"`
			Metadata map[string]string `json:"metadata"`
		}
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			respondError(w, http.StatusBadRequest, "invalid session payload")
			return
		}
		if err := h.paymentService.MarkPaymentSucceeded(r.Context(), session.ID); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// respondJSON writes JSON responses.
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
