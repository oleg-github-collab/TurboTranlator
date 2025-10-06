package config

import (
	"log"
	"time"

	"github.com/caarlos0/env/v9"
)

// Config holds all runtime configuration for the application.
type Config struct {
	AppEnv      string `env:"APP_ENV" envDefault:"development"`
	ServerPort  string `env:"SERVER_PORT" envDefault:"8080"`
	PublicURL   string `env:"PUBLIC_URL" envDefault:"http://localhost:8080"`
	FrontendURL string `env:"FRONTEND_URL" envDefault:"http://localhost:5173"`

	DatabaseURL string `env:"DATABASE_URL,required"`
	RedisURL    string `env:"REDIS_URL,required"`

	DeepLApiKey     string `env:"DEEPL_API_KEY"`
	OTranslatorKey  string `env:"OTRANSLATOR_API_KEY"`
	OTranslatorBase string `env:"OTRANSLATOR_BASE_URL" envDefault:"https://api.otranslator.ai"`

	JWTSecret       string        `env:"JWT_SECRET,required"`
	AccessTokenTTL  time.Duration `env:"ACCESS_TOKEN_TTL" envDefault:"1h"`
	RefreshTokenTTL time.Duration `env:"REFRESH_TOKEN_TTL" envDefault:"720h"`

	StripeSecretKey      string `env:"STRIPE_SECRET_KEY"`
	StripePublishableKey string `env:"STRIPE_PUBLISHABLE_KEY"`
	StripeWebhookSecret  string `env:"STRIPE_WEBHOOK_SECRET"`
	StripePremiumPriceID string `env:"STRIPE_PREMIUM_PRICE_ID"`
	StripeCurrency       string `env:"STRIPE_CURRENCY" envDefault:"eur"`

	StorageProvider  string `env:"STORAGE_PROVIDER" envDefault:"local"`
	StorageBucket    string `env:"STORAGE_BUCKET" envDefault:"uploads"`
	StorageRegion    string `env:"STORAGE_REGION" envDefault:"us-east-1"`
	StorageEndpoint  string `env:"STORAGE_ENDPOINT"`
	StorageAccessKey string `env:"STORAGE_ACCESS_KEY"`
	StorageSecretKey string `env:"STORAGE_SECRET_KEY"`

	CleanupInterval time.Duration `env:"CLEANUP_INTERVAL" envDefault:"1h"`
	FileRetention   time.Duration `env:"FILE_RETENTION" envDefault:"168h"` // 7 days

	AllowOrigins []string `env:"ALLOW_ORIGINS" envSeparator:"," envDefault:"*"`

	EnableDebug bool `env:"ENABLE_DEBUG" envDefault:"false"`
}

// Load parses environment variables into Config. Panics on failure.
func Load() *Config {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		log.Fatalf("failed to parse env config: %v", err)
	}
	return cfg
}
