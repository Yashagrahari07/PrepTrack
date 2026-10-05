package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/yash/preptrack-backend/internal/middleware"
)

func TestRevisionComplete_Validation(t *testing.T) {
	e := echo.New()
	revH := NewRevisionHandler(nil)

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		expectedCode   string
	}{
		{
			name:           "Invalid JSON",
			body:           `{invalid}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_REQUEST_BODY",
		},
		{
			name:           "Confidence Rating Out of Bounds (0)",
			body:           `{"confidence": 0}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_CONFIDENCE",
		},
		{
			name:           "Confidence Rating Out of Bounds (6)",
			body:           `{"confidence": 6}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_CONFIDENCE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/revisions/rev-1/complete", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetParamNames("id")
			c.SetParamValues("rev-1")
			c.Set(middleware.UserIDContextKey, "test-user-123")

			err := revH.Complete(c)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, rec.Code)
			assert.Contains(t, rec.Body.String(), tt.expectedCode)
		})
	}
}
