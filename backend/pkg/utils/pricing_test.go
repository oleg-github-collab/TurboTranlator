package utils

import "testing"

func TestCalculatePriceCents(t *testing.T) {
	price := CalculatePriceCents(2000, 0.40, 0)
	if price != 40 {
		t.Fatalf("expected 40 got %d", price)
	}

	price = CalculatePriceCents(1000, 0.28, 0)
	if price != 28 {
		t.Fatalf("expected minimum 28 got %d", price)
	}

	price = CalculatePriceCents(5000, 0.96, 0.20)
	if price != 206 {
		t.Fatalf("expected 206 got %d", price)
	}
}
