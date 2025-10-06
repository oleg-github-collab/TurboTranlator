package payment

import (
	"context"
	"errors"
	"fmt"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/client"
)

// StripeClient wraps stripe-go for easier testing.
type StripeClient struct {
	sc       *client.API
	currency string
}

// NewStripeClient constructs a Stripe client.
func NewStripeClient(secretKey, currency string) *StripeClient {
	sc := &client.API{}
	sc.Init(secretKey, nil)
	return &StripeClient{sc: sc, currency: currency}
}

// TranslationSessionParams describes dynamic checkout session creation.
type TranslationSessionParams struct {
	AmountCents int64
	SuccessURL  string
	CancelURL   string
	Metadata    map[string]string
	CustomerID  string
}

// CreateTranslationCheckoutSession starts a one-off payment session.
func (c *StripeClient) CreateTranslationCheckoutSession(ctx context.Context, params TranslationSessionParams) (*stripe.CheckoutSession, error) {
	if params.AmountCents <= 0 {
		return nil, errors.New("amount must be positive")
	}
	sessionParams := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String(c.currency),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String("Kaminskyi Übersetzungsdienst"),
					},
					UnitAmount: stripe.Int64(params.AmountCents),
				},
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(params.SuccessURL),
		CancelURL:  stripe.String(params.CancelURL),
	}
	if params.Metadata != nil {
		sessionParams.Metadata = params.Metadata
	}
	if params.CustomerID != "" {
		sessionParams.Customer = stripe.String(params.CustomerID)
	}

	session, err := c.sc.CheckoutSessions.New(sessionParams)
	if err != nil {
		return nil, fmt.Errorf("create checkout session: %w", err)
	}
	return session, nil
}

// SubscriptionSessionParams configures premium subscription checkout.
type SubscriptionSessionParams struct {
	PriceID    string
	SuccessURL string
	CancelURL  string
	CustomerID string
	Metadata   map[string]string
}

// CreateSubscriptionCheckoutSession starts a subscription checkout session.
func (c *StripeClient) CreateSubscriptionCheckoutSession(ctx context.Context, params SubscriptionSessionParams) (*stripe.CheckoutSession, error) {
	if params.PriceID == "" {
		return nil, errors.New("price id required")
	}
	sessionParams := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(params.SuccessURL),
		CancelURL:  stripe.String(params.CancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(params.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
	}
	if params.Metadata != nil {
		sessionParams.Metadata = params.Metadata
	}
	if params.CustomerID != "" {
		sessionParams.Customer = stripe.String(params.CustomerID)
	}
	session, err := c.sc.CheckoutSessions.New(sessionParams)
	if err != nil {
		return nil, fmt.Errorf("create subscription session: %w", err)
	}
	return session, nil
}

// VerifyWebhook verifies signature and returns stripe event.
func (c *StripeClient) VerifyWebhook(payload []byte, sigHeader, webhookSecret string) (*stripe.Event, error) {
	event, err := stripe.ConstructEvent(payload, sigHeader, webhookSecret)
	if err != nil {
		return nil, fmt.Errorf("verify webhook: %w", err)
	}
	return &event, nil
}
