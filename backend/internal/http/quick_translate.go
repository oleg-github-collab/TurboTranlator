package http

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	QuickTranslateMaxChars = 5000
	QuickTranslateTTL      = time.Hour
)

// QuickTranslateRequest for anonymous translation
type QuickTranslateRequest struct {
	Text       string `json:"text" binding:"required,max=5000"`
	SourceLang string `json:"sourceLang" binding:"required"`
	TargetLang string `json:"targetLang" binding:"required"`
}

// QuickTranslateResponse contains translation result
type QuickTranslateResponse struct {
	ID          string `json:"id"`
	Text        string `json:"text"`
	Translation string `json:"translation"`
	SourceLang  string `json:"sourceLang"`
	TargetLang  string `json:"targetLang"`
	CharCount   int    `json:"charCount"`
	DownloadURL string `json:"downloadUrl"`
	ExpiresAt   string `json:"expiresAt"`
}

// QuickTranslate handles anonymous text translation
func (h *Handler) QuickTranslate(c *gin.Context) {
	var req QuickTranslateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate text length
	if len(req.Text) > QuickTranslateMaxChars {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Text exceeds maximum length of 5000 characters",
		})
		return
	}

	// Use Basic model for quick translate
	translation, err := h.deepl.TranslateText(req.Text, req.SourceLang, req.TargetLang, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Translation failed"})
		return
	}

	// Generate unique ID
	id := generateQuickID()

	// Store in Redis with TTL
	result := QuickTranslateResponse{
		ID:          id,
		Text:        req.Text,
		Translation: translation,
		SourceLang:  req.SourceLang,
		TargetLang:  req.TargetLang,
		CharCount:   len(req.Text),
		DownloadURL: "/api/v1/quick/download/" + id,
		ExpiresAt:   time.Now().Add(QuickTranslateTTL).Format(time.RFC3339),
	}

	// Store in Redis (serialized JSON)
	if err := h.redis.SetJSON("quick:"+id, result, QuickTranslateTTL); err != nil {
		h.logger.Error("Failed to store quick translation", "error", err)
	}

	c.JSON(http.StatusOK, result)
}

// QuickDownload downloads translation as text file
func (h *Handler) QuickDownload(c *gin.Context) {
	id := c.Param("id")

	var result QuickTranslateResponse
	exists, err := h.redis.GetJSON("quick:"+id, &result)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Translation not found or expired"})
		return
	}

	filename := "translation_" + result.TargetLang + ".txt"
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "text/plain")
	c.String(http.StatusOK, result.Translation)
}

// generateQuickID creates a random ID for quick translations
func generateQuickID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
