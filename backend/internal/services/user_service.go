package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/auth"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"
	"github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/repository"
)

// UserService handles user operations.
type UserService struct {
	users      *repository.UserRepository
	jwtSecret  string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

// NewUserService constructs a UserService.
func NewUserService(users *repository.UserRepository, jwtSecret string, accessTTL, refreshTTL time.Duration) *UserService {
	return &UserService{users: users, jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL}
}

// Register registers a new user.
func (s *UserService) Register(ctx context.Context, username, password string, agbAccepted time.Time) (*models.User, *auth.TokenPair, error) {
	if len(password) < 8 {
		return nil, nil, errors.New("password must be at least 8 characters")
	}
	if !usernameValid(username) {
		return nil, nil, errors.New("username must contain only letters, numbers, dashes, underscores or dots")
	}
	if _, err := s.users.GetByUsername(ctx, username); err == nil {
		return nil, nil, errors.New("username already exists")
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, nil, err
	}

	hashed, err := auth.HashPassword(password)
	if err != nil {
		return nil, nil, err
	}
	user, err := s.users.Create(ctx, username, hashed, agbAccepted)
	if err != nil {
		return nil, nil, err
	}
	tokens, err := auth.GenerateTokenPair(s.jwtSecret, user.ID, user.Username, s.accessTTL, s.refreshTTL)
	if err != nil {
		return nil, nil, err
	}
	return user, tokens, nil
}

// Login authenticates user.
func (s *UserService) Login(ctx context.Context, username, password string) (*models.User, *auth.TokenPair, error) {
	user, err := s.users.GetByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, errors.New("invalid credentials")
		}
		return nil, nil, err
	}
	if err := auth.ComparePassword(user.PasswordHash, password); err != nil {
		return nil, nil, errors.New("invalid credentials")
	}
	tokens, err := auth.GenerateTokenPair(s.jwtSecret, user.ID, user.Username, s.accessTTL, s.refreshTTL)
	if err != nil {
		return nil, nil, err
	}
	return user, tokens, nil
}

// GetProfile fetches user by id.
func (s *UserService) GetProfile(ctx context.Context, id string) (*models.User, error) {
	return s.users.GetByID(ctx, id)
}

// UpdateSubscription updates user subscription state.
func (s *UserService) UpdateSubscription(ctx context.Context, id string, status models.SubscriptionStatus, endAt *time.Time) error {
	return s.users.UpdateSubscription(ctx, id, status, endAt)
}

// usernameValid ensures username pattern.
func usernameValid(username string) bool {
	if len(username) < 3 {
		return false
	}
	for _, r := range username {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			continue
		}
		return false
	}
	return true
}
