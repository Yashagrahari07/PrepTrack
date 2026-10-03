package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/yash/preptrack-backend/internal/config"
)

func TestJWTMiddleware_Validation(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		JWTSecret: "mysecretjwtkey32byteslongstring!",
	}

	dummyHandler := func(c echo.Context) error {
		userID, ok := GetUserID(c)
		assert.True(t, ok)
		return c.String(http.StatusOK, userID)
	}

	jwtMw := JWT(cfg)(dummyHandler)

	t.Run("Missing Authorization Header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := jwtMw(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_TOKEN")
	})

	t.Run("Invalid Token Format", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer invalidtoken")
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := jwtMw(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_TOKEN")
	})

	t.Run("Valid Token", func(t *testing.T) {
		claims := jwt.MapClaims{
			"user_id": "test-uuid-123",
			"exp":     time.Now().Add(time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenStr, _ := token.SignedString([]byte(cfg.JWTSecret))

		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+tokenStr)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := jwtMw(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "test-uuid-123", rec.Body.String())
	})
}
