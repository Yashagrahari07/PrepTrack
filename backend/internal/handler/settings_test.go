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

func TestSettingsUpdate_Validation(t *testing.T) {
	e := echo.New()
	settingsH := NewSettingsHandler(nil)

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
			name:           "Target Hours Zero or Negative",
			body:           `{"weekly_target_hours": 0}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_TARGET_HOURS",
		},
		{
			name:           "Target Hours Exceed 168",
			body:           `{"weekly_target_hours": 200}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_TARGET_HOURS",
		},
		{
			name:           "Empty Reference Sheet URL",
			body:           `{"reference_sheet_url": "   "}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "INVALID_REFERENCE_SHEET_URL",
		},
		{
			name:           "Goal Custom Text Too Long",
			body:           `{"goal_custom_text": "` + strings.Repeat("a", 201) + `"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "GOAL_TEXT_TOO_LONG",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPatch, "/api/settings", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.Set(middleware.UserIDContextKey, "test-user-123")

			err := settingsH.Update(c)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, rec.Code)
			assert.Contains(t, rec.Body.String(), tt.expectedCode)
		})
	}
}