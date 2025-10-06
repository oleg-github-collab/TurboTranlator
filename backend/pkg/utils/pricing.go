package utils

import "math"

// CalculatePriceCents calculates price in cents given character count, price per 1860 characters, and optional discount.
func CalculatePriceCents(characters int, pricePer1860 float64, discount float64) int64 {
	units := float64(characters) / 1860.0
	if units < 1 {
		units = 1
	}
	price := units * pricePer1860
	if discount > 0 {
		price = price * (1 - discount)
	}
	return int64(math.Round(price * 100))
}

// ApplyDiscount returns price after applying discount percentage (0-1).
func ApplyDiscount(amountCents int64, discount float64) int64 {
	if discount <= 0 {
		return amountCents
	}
	return int64(math.Round(float64(amountCents) * (1 - discount)))
}
