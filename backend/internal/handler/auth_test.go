package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/yash/preptrack-backend/internal/config"
)

func TestSignup_ValidationErrors(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		InviteCode:   "secret123",
		JWTSecret:    "supersecretjwtkey32byteslongkey!",
		JWTExpiryHrs: 168,
	}
	authH := NewAuthHandler(nil, cfg)

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		expectedCode   string
	}{
		{
			name:           "Invalid JSON",
			body:           `{invalid-json}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_REQUEST_BODY",
		},
		{
			name:           "Missing Required Fields",
			body:           `{"display_name":"","email":"","password":""}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "MISSING_REQUIRED_FIELDS",
		},
		{
			name:           "Password Too Short",
			body:           `{"display_name":"Yash","email":"yash@example.com","password":"123"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "PASSWORD_TOO_SHORT",
		},
		{
			name:           "Invalid Invite Code",
			body:           `{"display_name":"Yash","email":"yash@example.com","password":"Password123!","invite_code":"wrong"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_INVITE_CODE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			err := authH.Signup(c)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, rec.Code)
			assert.Contains(t, rec.Body.String(), tt.expectedCode)
		})
	}
}

func TestGenerateJWT(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:    "supersecretjwtkey32byteslongkey!",
		JWTExpiryHrs: 168,
	}
	authH := NewAuthHandler(nil, cfg)

	tokenStr, err := authH.generateJWT("user-uuid-123", "yash@example.com")
	assert.NoError(t, err)
	assert.NotEmpty(t, tokenStr)
}
