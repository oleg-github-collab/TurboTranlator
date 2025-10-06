package services

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"path/filepath"
	"regexp"
	"strings"

	pdf "github.com/ledongthuc/pdf"
)

var xmlTagRegex = regexp.MustCompile(`<[^>]+>`)

// ExtractText extracts textual contents from supported document formats.
func ExtractText(filename string, data []byte) (string, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".txt":
		return string(data), nil
	case ".pdf":
		return extractFromPDF(data)
	case ".docx":
		return extractFromDocx(data)
	case ".epub":
		return extractFromEpub(data)
	default:
		return "", errors.New("unsupported file type")
	}
}

func extractFromPDF(data []byte) (string, error) {
	reader := bytes.NewReader(data)
	pdfReader, err := pdf.NewReader(reader, int64(len(data)))
	if err != nil {
		return "", err
	}
	var builder strings.Builder
	totalPage := pdfReader.NumPage()
	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		page := pdfReader.Page(pageIndex)
		if page.V.IsNull() {
			continue
		}
		content, err := page.GetPlainText(nil)
		if err != nil {
			return "", err
		}
		builder.WriteString(content)
		if pageIndex != totalPage {
			builder.WriteString("\n")
		}
	}
	return builder.String(), nil
}

func extractFromDocx(data []byte) (string, error) {
	reader := bytes.NewReader(data)
	zipReader, err := zip.NewReader(reader, int64(len(data)))
	if err != nil {
		return "", err
	}
	var documentFile *zip.File
	for _, f := range zipReader.File {
		if f.Name == "word/document.xml" {
			documentFile = f
			break
		}
	}
	if documentFile == nil {
		return "", errors.New("docx document.xml not found")
	}
	rc, err := documentFile.Open()
	if err != nil {
		return "", err
	}
	defer rc.Close()
	raw, err := io.ReadAll(rc)
	if err != nil {
		return "", err
	}
	content := xmlTagRegex.ReplaceAllString(string(raw), " ")
	content = strings.ReplaceAll(content, "&nbsp;", " ")
	return strings.TrimSpace(content), nil
}

func extractFromEpub(data []byte) (string, error) {
	reader := bytes.NewReader(data)
	zipReader, err := zip.NewReader(reader, int64(len(data)))
	if err != nil {
		return "", err
	}
	var builder strings.Builder
	for _, f := range zipReader.File {
		if !strings.HasSuffix(strings.ToLower(f.Name), ".xhtml") && !strings.HasSuffix(strings.ToLower(f.Name), ".html") {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		raw, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return "", err
		}
		text := xmlTagRegex.ReplaceAllString(string(raw), " ")
		builder.WriteString(text)
		builder.WriteString("\n")
	}
	return strings.TrimSpace(builder.String()), nil
}
