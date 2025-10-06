package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/config"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/db"
	apphttp "github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/http"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/logger"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/payment"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/queue"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/repository"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/services"
	store "github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/storage"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/translation"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/worker"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.AppEnv)

	dbConn, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect database")
	}
	defer dbConn.Close()

	migrationsPath := filepath.Join("migrations")
	if err := db.Migrate(dbConn, migrationsPath); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}

	userRepo := repository.NewUserRepository(dbConn)
	translationRepo := repository.NewTranslationRepository(dbConn)
	fileRepo := repository.NewFileRepository(dbConn)
	paymentRepo := repository.NewPaymentRepository(dbConn)

	queueClient, err := queue.NewClient(cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect redis queue")
	}
	defer queueClient.Close()

	storageProvider, err := initStorage(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to init storage")
	}

	deepLClient := translation.NewDeepLClient(cfg.DeepLApiKey, translation.DeepLOptions{UseFreeAPI: cfg.AppEnv != "production"})
	otranslatorClient := translation.NewOTranslatorClient(cfg.OTranslatorKey, translation.OTranslatorOptions{BaseURL: cfg.OTranslatorBase, Timeout: 2 * time.Minute})

	userService := services.NewUserService(userRepo, cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	translationService := services.NewTranslationService(translationRepo, fileRepo, storageProvider, queueClient, deepLClient, otranslatorClient, cfg.FileRetention, log)

	stripeClient := payment.NewStripeClient(cfg.StripeSecretKey, cfg.StripeCurrency)
	paymentService := services.NewPaymentService(paymentRepo, userRepo, translationRepo, translationService, stripeClient, cfg.StripePremiumPriceID)

	handler := apphttp.NewHandler(cfg, userService, translationService, paymentService)
	router := apphttp.NewRouter(handler, cfg.AllowOrigins, 180)
	apphttp.AttachStatic(router, filepath.Join("public"))

	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: router,
	}

	workerService, err := worker.New(cfg.RedisURL, translationRepo, userRepo, fileRepo, storageProvider, translationService, paymentService, deepLClient, otranslatorClient, log)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to init worker")
	}

	go func() {
		if err := workerService.Start(); err != nil {
			log.Error().Err(err).Msg("worker stopped")
		}
	}()

	go func() {
		log.Info().Str("port", cfg.ServerPort).Msg("HTTP server listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("http server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("server shutdown failed")
	}
	workerService.Shutdown()
	log.Info().Msg("shutdown complete")
}

func initStorage(cfg *config.Config) (store.Provider, error) {
	switch cfg.StorageProvider {
	case "s3":
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return store.NewS3Storage(ctx, cfg.StorageEndpoint, cfg.StorageRegion, cfg.StorageBucket, cfg.StorageAccessKey, cfg.StorageSecretKey)
	default:
		baseDir := filepath.Join("storage")
		publicURL := cfg.PublicURL + "/storage"
		return store.NewLocalStorage(baseDir, publicURL)
	}
}
