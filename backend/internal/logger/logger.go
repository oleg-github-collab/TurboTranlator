package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// New initializes and returns a zerolog logger configured for the environment.
func New(appEnv string) zerolog.Logger {
	if appEnv == "development" {
		output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
		logger := zerolog.New(output).With().Timestamp().Logger()
		return logger
	}
	zerolog.TimeFieldFormat = time.RFC3339
	return log.Logger
}
