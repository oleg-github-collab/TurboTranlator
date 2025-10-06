package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// OTranslatorClient interacts with the fictional OTranslator API.
type OTranslatorClient struct {
	httpClient *http.Client
	apiKey     string
	baseURL    string
}

// OTranslatorOptions configures the client.
type OTranslatorOptions struct {
	BaseURL string
	Timeout time.Duration
}

// NewOTranslatorClient constructs the client.
func NewOTranslatorClient(apiKey string, opts OTranslatorOptions) *OTranslatorClient {
	baseURL := opts.BaseURL
	if baseURL == "" {
		baseURL = "https://api.otranslator.ai"
	}
	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 2 * time.Minute
	}
	return &OTranslatorClient{
		httpClient: &http.Client{Timeout: timeout},
		apiKey:     apiKey,
		baseURL:    baseURL,
	}
}

// OTranslatorDocumentOptions holds request parameters.
type OTranslatorDocumentOptions struct {
	SourceLang     string            `json:"source_lang"`
	TargetLang     string            `json:"target_lang"`
	Model          string            `json:"model"`
	Passes         int               `json:"passes"`
	Formality      string            `json:"formality,omitempty"`
	GlossaryID     string            `json:"glossary_id,omitempty"`
	IgnoreComments bool              `json:"ignore_comments"`
	PreserveFormat bool              `json:"preserve_format"`
	ExtraMetadata  map[string]string `json:"metadata,omitempty"`
}

// TranslateDocument uploads a document for translation.
func (c *OTranslatorClient) TranslateDocument(ctx context.Context, reader io.Reader, filename string, opts OTranslatorDocumentOptions) ([]byte, error) {
	endpoint := fmt.Sprintf("%s/v1/document:translate", c.baseURL)

	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)

	fileWriter, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(fileWriter, reader); err != nil {
		return nil, err
	}

	optsBytes, err := json.Marshal(opts)
	if err != nil {
		return nil, err
	}
	if err := writer.WriteField("options", string(optsBytes)); err != nil {
		return nil, err
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, payload)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, parseOTranslatorError(resp.Body)
	}

	var job struct {
		JobID string `json:"job_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&job); err != nil {
		return nil, err
	}

	return c.pollJob(ctx, job.JobID)
}

// TranslateText translates plain text via OTranslator.
func (c *OTranslatorClient) TranslateText(ctx context.Context, text string, opts OTranslatorDocumentOptions) (string, error) {
	endpoint := fmt.Sprintf("%s/v1/text:translate", c.baseURL)
	requestBody := map[string]interface{}{
		"text":    text,
		"options": opts,
	}

	buf := &bytes.Buffer{}
	if err := json.NewEncoder(buf).Encode(requestBody); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, buf)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", parseOTranslatorError(resp.Body)
	}

	var result struct {
		Translation string `json:"translation"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Translation, nil
}

func (c *OTranslatorClient) pollJob(ctx context.Context, jobID string) ([]byte, error) {
	endpoint := fmt.Sprintf("%s/v1/jobs/%s", c.baseURL, jobID)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
			if err != nil {
				return nil, err
			}
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

			resp, err := c.httpClient.Do(req)
			if err != nil {
				return nil, err
			}
			body, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				return nil, err
			}

			if resp.StatusCode >= 400 {
				return nil, parseOTranslatorError(bytes.NewReader(body))
			}

			var status struct {
				Status   string `json:"status"`
				Download string `json:"download_url"`
				Error    string `json:"error"`
			}
			if err := json.Unmarshal(body, &status); err != nil {
				return nil, err
			}

			switch status.Status {
			case "completed":
				return c.download(ctx, status.Download)
			case "failed":
				if status.Error == "" {
					status.Error = "unknown translation failure"
				}
				return nil, fmt.Errorf("otranslator: %s", status.Error)
			case "queued", "processing":
				continue
			default:
				return nil, fmt.Errorf("otranslator: unexpected job status %s", status.Status)
			}
		}
	}
}

func (c *OTranslatorClient) download(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, parseOTranslatorError(resp.Body)
	}

	return io.ReadAll(resp.Body)
}

type oTranslatorError struct {
	Message string `json:"message"`
	Code    string `json:"code"`
}

func (e *oTranslatorError) Error() string {
	return fmt.Sprintf("otranslator api error: %s (%s)", e.Message, e.Code)
}

func parseOTranslatorError(body io.Reader) error {
	var apiErr oTranslatorError
	if err := json.NewDecoder(body).Decode(&apiErr); err != nil {
		return err
	}
	if apiErr.Message == "" {
		apiErr.Message = "unexpected error"
	}
	return &apiErr
}
