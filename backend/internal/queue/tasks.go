package queue

const (
	TaskTranslateDocument = "translate:document"
	TaskCleanupFile       = "cleanup:file"
	TaskSyncSubscription  = "subscription:sync"
)

// TranslatePayload carries data for translation jobs.
type TranslatePayload struct {
	TranslationID string                 `json:"translationId"`
	ModelKey      string                 `json:"modelKey"`
	SourceLang    string                 `json:"sourceLang"`
	TargetLang    string                 `json:"targetLang"`
	StorageKey    string                 `json:"storageKey"`
	Filename      string                 `json:"filename"`
	UserID        string                 `json:"userId"`
	Options       map[string]interface{} `json:"options"`
}

// CleanupPayload used for file deletion.
type CleanupPayload struct {
	StorageKey string `json:"storageKey"`
}

// SubscriptionPayload used to sync subscription state.
type SubscriptionPayload struct {
	UserID string `json:"userId"`
}
