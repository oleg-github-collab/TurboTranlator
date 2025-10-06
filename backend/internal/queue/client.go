package queue

import (
	"encoding/json"
	"time"

	"github.com/hibiken/asynq"
)

// Client wraps Asynq client for enqueuing tasks.
type Client struct {
	client *asynq.Client
}

// NewClient connects to Redis and returns Client.
func NewClient(redisURL string) (*Client, error) {
	opts, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, err
	}
	client := asynq.NewClient(opts)
	return &Client{client: client}, nil
}

// Close closes the underlying client.
func (c *Client) Close() error {
	return c.client.Close()
}

// EnqueueTranslation schedules a translation job.
func (c *Client) EnqueueTranslation(payload TranslatePayload) (*asynq.TaskInfo, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	task := asynq.NewTask(TaskTranslateDocument, body, asynq.MaxRetry(3), asynq.Timeout(30*time.Minute))
	return c.client.Enqueue(task, asynq.Queue("translations"))
}

// EnqueueCleanup schedules file deletion.
func (c *Client) EnqueueCleanup(payload CleanupPayload, delay time.Duration) (*asynq.TaskInfo, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	task := asynq.NewTask(TaskCleanupFile, body)
	return c.client.Enqueue(task, asynq.ProcessIn(delay), asynq.Queue("maintenance"))
}

// EnqueueSubscriptionSync schedules subscription sync.
func (c *Client) EnqueueSubscriptionSync(payload SubscriptionPayload) (*asynq.TaskInfo, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	task := asynq.NewTask(TaskSyncSubscription, body, asynq.Queue("billing"))
	return c.client.Enqueue(task)
}
