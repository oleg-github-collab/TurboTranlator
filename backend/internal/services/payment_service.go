package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/stripe/stripe-go/v75"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/payment"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/repository"
)

// PaymentService encapsulates billing operations.
type PaymentService struct {
	payments       *repository.PaymentRepository
	users          *repository.UserRepository
	translations   *repository.TranslationRepository
	translateSvc   *TranslationService
	stripeClient   *payment.StripeClient
	premiumPriceID string
}

// NewPaymentService constructs PaymentService.
func NewPaymentService(payments *repository.PaymentRepository, users *repository.UserRepository, translations *repository.TranslationRepository, translateSvc *TranslationService, stripeClient *payment.StripeClient, premiumPriceID string) *PaymentService {
	return &PaymentService{
		payments:       payments,
		users:          users,
		translations:   translations,
		translateSvc:   translateSvc,
		stripeClient:   stripeClient,
		premiumPriceID: premiumPriceID,
	}
}

// StartTranslationCheckout creates Stripe checkout for translation payment.
func (s *PaymentService) StartTranslationCheckout(ctx context.Context, userID, translationID, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	translation, err := s.translations.GetByID(ctx, translationID)
	if err != nil {
		return nil, err
	}
	if translation.UserID != userID {
		return nil, fmt.Errorf("translation %s does not belong to user", translationID)
	}
	if translation.Status != models.TranslationPending {
		return nil, fmt.Errorf("translation %s is not pending payment", translationID)
	}

	session, err := s.stripeClient.CreateTranslationCheckoutSession(ctx, payment.TranslationSessionParams{
		AmountCents: translation.PriceCents,
		SuccessURL:  successURL,
		CancelURL:   cancelURL,
		Metadata: map[string]string{
			"translation_id": translation.ID,
			"user_id":        translation.UserID,
		},
	})
	if err != nil {
		return nil, err
	}

	_, err = s.payments.Create(ctx, &models.Payment{
		UserID:              translation.UserID,
		TranslationID:       &translation.ID,
		AmountCents:         translation.PriceCents,
		Currency:            translation.Currency,
		StripeSessionID:     session.ID,
		StripePaymentIntent: extractPaymentIntentID(session),
		Status:              string(stripe.CheckoutSessionPaymentStatusUnpaid),
	})
	if err != nil {
		return nil, err
	}
	return session, nil
}

// StartSubscriptionCheckout starts Stripe session for premium subscription.
func (s *PaymentService) StartSubscriptionCheckout(ctx context.Context, userID, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	if s.premiumPriceID == "" {
		return nil, errors.New("premium price id not configured")
	}

	session, err := s.stripeClient.CreateSubscriptionCheckoutSession(ctx, payment.SubscriptionSessionParams{
		PriceID:    s.premiumPriceID,
		SuccessURL: successURL,
		CancelURL:  cancelURL,
		Metadata: map[string]string{
			"user_id": userID,
		},
	})
	if err != nil {
		return nil, err
	}

	_, err = s.payments.Create(ctx, &models.Payment{
		UserID:              userID,
		AmountCents:         session.AmountSubtotal,
		Currency:            session.Currency,
		StripeSessionID:     session.ID,
		StripePaymentIntent: extractPaymentIntentID(session),
		Status:              string(stripe.CheckoutSessionPaymentStatusUnpaid),
	})
	if err != nil {
		return nil, err
	}
	return session, nil
}

// MarkPaymentSucceeded marks payment as succeeded and triggers translation queue if necessary.
func (s *PaymentService) MarkPaymentSucceeded(ctx context.Context, sessionID string) error {
	paymentRecord, err := s.payments.GetByStripeSession(ctx, sessionID)
	if err != nil {
		return err
	}
	if err := s.payments.UpdateStatus(ctx, sessionID, string(stripe.CheckoutSessionPaymentStatusPaid)); err != nil {
		return err
	}

	if paymentRecord.TranslationID != nil {
		return s.translateSvc.QueueTranslation(ctx, *paymentRecord.TranslationID)
	}
	// Premium subscription payment
	return s.ActivatePremium(ctx, paymentRecord.UserID, 30*24*time.Hour)
}

// ActivatePremium upgrades user subscription after webhook.
func (s *PaymentService) ActivatePremium(ctx context.Context, userID string, duration time.Duration) error {
	end := time.Now().Add(duration)
	return s.users.UpdateSubscription(ctx, userID, models.SubscriptionPremium, &end)
}

// DowngradePremium resets subscription to free tier.
func (s *PaymentService) DowngradePremium(ctx context.Context, userID string) error {
	return s.users.UpdateSubscription(ctx, userID, models.SubscriptionFree, nil)
}

func extractPaymentIntentID(session *stripe.CheckoutSession) string {
	if session == nil {
		return ""
	}
	if session.PaymentIntent != nil {
		return session.PaymentIntent.ID
	}
	if session.PaymentIntentID != "" {
		return session.PaymentIntentID
	}
	return ""
}

func (s *PaymentService) VerifyWebhook(payload []byte, signature, secret string) (*stripe.Event, error) {
	return s.stripeClient.VerifyWebhook(payload, signature, secret)
}
