package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// JSONB is a helper type for PostgreSQL jsonb columns.
type JSONB map[string]interface{}

// Value implements driver.Valuer.
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return []byte("{}"), nil
	}
	b, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// Scan implements sql.Scanner.
func (j *JSONB) Scan(src interface{}) error {
	if src == nil {
		*j = JSONB{}
		return nil
	}
	switch data := src.(type) {
	case []byte:
		if len(data) == 0 {
			*j = JSONB{}
			return nil
		}
		var m map[string]interface{}
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		*j = m
		return nil
	case string:
		if data == "" {
			*j = JSONB{}
			return nil
		}
		var m map[string]interface{}
		if err := json.Unmarshal([]byte(data), &m); err != nil {
			return err
		}
		*j = m
		return nil
	default:
		return fmt.Errorf("unsupported type for JSONB: %T", src)
	}
}
