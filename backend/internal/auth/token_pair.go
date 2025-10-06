package auth

import "time"

// TokenPair holds generated access and refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

// GenerateTokenPair creates access and refresh tokens.
func GenerateTokenPair(secret, userID, username string, accessTTL, refreshTTL time.Duration) (*TokenPair, error) {
	access, err := GenerateToken(secret, userID, username, accessTTL, "access")
	if err != nil {
		return nil, err
	}
	refresh, err := GenerateToken(secret, userID, username, refreshTTL, "refresh")
	if err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(accessTTL.Seconds()),
	}, nil
}
