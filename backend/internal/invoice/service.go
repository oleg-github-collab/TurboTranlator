package invoice

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
)

// Generate creates an invoice PDF in memory.
func Generate(meta models.InvoiceMetadata) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Helvetica", "", 12)

	pdf.Cell(190, 10, "Kaminskyi AI GmbH")
	pdf.Ln(6)
	pdf.Cell(190, 10, "Alexanderplatz 1, 10178 Berlin, Germany")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "B", 16)
	pdf.Cell(190, 10, "Rechnung")
	pdf.Ln(12)

	pdf.SetFont("Helvetica", "", 12)
	pdf.CellFormat(95, 6, fmt.Sprintf("Rechnungsnummer: %s", meta.InvoiceNumber), "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 6, fmt.Sprintf("Ausgestellt am: %s", meta.IssuedAt.Format("02.01.2006")), "", 0, "R", false, 0, "")
	pdf.Ln(10)

	pdf.CellFormat(95, 6, fmt.Sprintf("Kunde: %s", meta.User.Username), "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 6, "Leistung: KI-gestützte Übersetzung", "", 0, "R", false, 0, "")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(95, 8, "Beschreibung", "1", 0, "C", false, 0, "")
	pdf.CellFormat(30, 8, "Zeichen", "1", 0, "C", false, 0, "")
	pdf.CellFormat(30, 8, "Einheitspreis", "1", 0, "C", false, 0, "")
	pdf.CellFormat(35, 8, "Gesamt", "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("Helvetica", "", 12)
	pricePer := float64(meta.Model.PricePer1860)
	unitPrice := fmt.Sprintf("%.2f %s", pricePer, meta.Currency)
	total := float64(meta.GrossAmountCents) / 100.0
	totalFormatted := fmt.Sprintf("%.2f %s", total, meta.Currency)

	description := fmt.Sprintf("%s (%s → %s)", meta.Model.DisplayName, meta.Translation.SourceLang, meta.Translation.TargetLang)
	pdf.CellFormat(95, 8, description, "1", 0, "L", false, 0, "")
	pdf.CellFormat(30, 8, fmt.Sprintf("%d", meta.Translation.CharacterCount), "1", 0, "C", false, 0, "")
	pdf.CellFormat(30, 8, unitPrice, "1", 0, "C", false, 0, "")
	pdf.CellFormat(35, 8, totalFormatted, "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	pdf.Ln(8)
	pdf.CellFormat(125, 6, "Zwischensumme", "", 0, "R", false, 0, "")
	pdf.CellFormat(35, 6, fmt.Sprintf("%.2f %s", float64(meta.NetAmountCents)/100, meta.Currency), "", 0, "R", false, 0, "")
	pdf.Ln(6)
	pdf.CellFormat(125, 6, "MwSt (19%)", "", 0, "R", false, 0, "")
	pdf.CellFormat(35, 6, fmt.Sprintf("%.2f %s", float64(meta.TaxAmountCents)/100, meta.Currency), "", 0, "R", false, 0, "")
	pdf.Ln(6)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(125, 6, "Gesamtbetrag", "", 0, "R", false, 0, "")
	pdf.CellFormat(35, 6, totalFormatted, "", 0, "R", false, 0, "")

	pdf.Ln(10)
	pdf.SetFont("Helvetica", "", 10)
	pdf.MultiCell(190, 5, "Vielen Dank für Ihr Vertrauen in Kaminskyi Language Intelligence. Digitale Leistungen unterliegen dem sofortigen Verbrauch, Widerrufsrecht siehe Portal.", "", "L", false)

	buf := &bytes.Buffer{}
	if err := pdf.Output(buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// BuildMetadata constructs invoice metadata from translation entity.
func BuildMetadata(user models.User, translation models.Translation, model models.ModelDescriptor) models.InvoiceMetadata {
	netAmount := translation.PriceCents
	tax := int64(float64(netAmount) * 0.19 / 1.19)
	gross := netAmount
	return models.InvoiceMetadata{
		InvoiceNumber:    fmt.Sprintf("KLI-%s", time.Now().Format("20060102-1504")),
		User:             user,
		Translation:      translation,
		Model:            model,
		NetAmountCents:   netAmount - tax,
		TaxAmountCents:   tax,
		GrossAmountCents: gross,
		Currency:         translation.Currency,
		IssuedAt:         time.Now(),
	}
}
