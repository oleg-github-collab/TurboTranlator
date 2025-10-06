package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

const (
	deepLBaseURL      = "https://api.deepl.com"
	deepLFreeBaseURL  = "https://api-free.deepl.com"
	deepLAPIVersion   = "/v2"
	deepLPollInterval = 3 * time.Second
	deepLPollTimeout  = 5 * time.Minute
)

// DeepLClient interacts with DeepL API.
type DeepLClient struct {
	httpClient *http.Client
	apiKey     string
	baseURL    string
}

// DeepLOptions configure DeepL client.
type DeepLOptions struct {
	UseFreeAPI bool
}

// NewDeepLClient constructs a DeepL client.
func NewDeepLClient(apiKey string, opts DeepLOptions) *DeepLClient {
	base := deepLBaseURL
	if opts.UseFreeAPI {
		base = deepLFreeBaseURL
	}
	return &DeepLClient{
		httpClient: &http.Client{Timeout: 60 * time.Second},
		apiKey:     apiKey,
		baseURL:    base,
	}
}

// DocumentOptions specify document translation parameters.
type DocumentOptions struct {
	SourceLang       string
	TargetLang       string
	Formality        string
	GlossaryID       string
	TagHandling      string
	OutlineDetection bool
	FileName         string
}

// DeepLError represents API errors.
type DeepLError struct {
	Message string `json:"message"`
}

func (e *DeepLError) Error() string {
	return fmt.Sprintf("deepl api error: %s", e.Message)
}

// TranslateDocument submits a document and returns translated bytes.
func (c *DeepLClient) TranslateDocument(ctx context.Context, reader io.Reader, opts DocumentOptions) ([]byte, error) {
	uploadURL := c.makeURL("document")

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	fw, err := writer.CreateFormFile("file", opts.FileName)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(fw, reader); err != nil {
		return nil, err
	}

	_ = writer.WriteField("target_lang", strings.ToUpper(opts.TargetLang))
	if opts.SourceLang != "" {
		_ = writer.WriteField("source_lang", strings.ToUpper(opts.SourceLang))
	}
	if opts.Formality != "" {
		_ = writer.WriteField("formality", opts.Formality)
	}
	if opts.GlossaryID != "" {
		_ = writer.WriteField("glossary_id", opts.GlossaryID)
	}
	if opts.TagHandling != "" {
		_ = writer.WriteField("tag_handling", opts.TagHandling)
	}
	if opts.OutlineDetection {
		_ = writer.WriteField("outline_detection", "true")
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("DeepL-Auth-Key %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, parseDeepLError(resp.Body)
	}

	var uploaded struct {
		DocumentID       string `json:"document_id"`
		DocumentKey      string `json:"document_key"`
		BilledCharacters int    `json:"billed_characters"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&uploaded); err != nil {
		return nil, err
	}

	statusURL := c.makeURL(path.Join("document", uploaded.DocumentID))
	resultURL := c.makeURL(path.Join("document", uploaded.DocumentID, "result"))

	ctx, cancel := context.WithTimeout(ctx, deepLPollTimeout)
	defer cancel()

	ticker := time.NewTicker(deepLPollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			statusReqBody := url.Values{}
			statusReqBody.Set("document_key", uploaded.DocumentKey)

			statusReq, err := http.NewRequestWithContext(ctx, http.MethodPost, statusURL, strings.NewReader(statusReqBody.Encode()))
			if err != nil {
				return nil, err
			}
			statusReq.Header.Set("Authorization", fmt.Sprintf("DeepL-Auth-Key %s", c.apiKey))
			statusReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

			statusResp, err := c.httpClient.Do(statusReq)
			if err != nil {
				return nil, err
			}

			statusBody, err := io.ReadAll(statusResp.Body)
			statusResp.Body.Close()
			if err != nil {
				return nil, err
			}
			if statusResp.StatusCode >= 400 {
				return nil, parseDeepLError(bytes.NewReader(statusBody))
			}

			var statusResult struct {
				Status  string `json:"status"`
				Message string `json:"message"`
			}
			if err := json.Unmarshal(statusBody, &statusResult); err != nil {
				return nil, err
			}

			switch statusResult.Status {
			case "done":
				resultReqBody := url.Values{}
				resultReqBody.Set("document_key", uploaded.DocumentKey)

				resultReq, err := http.NewRequestWithContext(ctx, http.MethodPost, resultURL, strings.NewReader(resultReqBody.Encode()))
				if err != nil {
					return nil, err
				}
				resultReq.Header.Set("Authorization", fmt.Sprintf("DeepL-Auth-Key %s", c.apiKey))
				resultReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

				resultResp, err := c.httpClient.Do(resultReq)
				if err != nil {
					return nil, err
				}
				defer resultResp.Body.Close()
				if resultResp.StatusCode >= 400 {
					return nil, parseDeepLError(resultResp.Body)
				}
				return io.ReadAll(resultResp.Body)
			case "translating", "queued", "uploaded":
				continue
			case "error":
				if statusResult.Message != "" {
					return nil, errors.New(statusResult.Message)
				}
				return nil, errors.New("deepl translation failed")
			default:
				return nil, fmt.Errorf("unknown deepl document status: %s", statusResult.Status)
			}
		}
	}
}

// TranslateText calls the text translation endpoint.
func (c *DeepLClient) TranslateText(ctx context.Context, text string, sourceLang, targetLang, formality string) (string, error) {
	translateURL := c.makeURL("translate")
	form := url.Values{}
	form.Set("text", text)
	if sourceLang != "" {
		form.Set("source_lang", strings.ToUpper(sourceLang))
	}
	form.Set("target_lang", strings.ToUpper(targetLang))
	if formality != "" {
		form.Set("formality", formality)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, translateURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("DeepL-Auth-Key %s", c.apiKey))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", parseDeepLError(resp.Body)
	}

	var result struct {
		Translations []struct {
			Text string `json:"text"`
		} `json:"translations"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result.Translations) == 0 {
		return "", errors.New("deepl: empty translation result")
	}
	return result.Translations[0].Text, nil
}

func (c *DeepLClient) makeURL(pathSuffix string) string {
	base, _ := url.Parse(c.baseURL)
	base.Path = path.Join(deepLAPIVersion, pathSuffix)
	return base.String()
}

func parseDeepLError(body io.Reader) error {
	var apiErr DeepLError
	if err := json.NewDecoder(body).Decode(&apiErr); err != nil {
		return err
	}
	if apiErr.Message == "" {
		return errors.New("deepl: unknown error")
	}
	return &apiErr
}
