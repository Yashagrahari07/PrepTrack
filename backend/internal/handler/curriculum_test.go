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

func TestCategory_Validation(t *testing.T) {
	e := echo.New()
	catH := NewCategoryHandler(nil)

	t.Run("Create Category Missing Name", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/categories", strings.NewReader(`{"name": "  "}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(middleware.UserIDContextKey, "test-user-123")

		err := catH.Create(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_NAME")
	})
}

func TestTopic_Validation(t *testing.T) {
	e := echo.New()
	topicH := NewTopicHandler(nil)

	t.Run("Create Topic Missing Title or CategoryID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/topics", strings.NewReader(`{"title": ""}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(middleware.UserIDContextKey, "test-user-123")

		err := topicH.Create(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_REQUIRED_FIELDS")
	})

	t.Run("Update Topic Invalid Status", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPatch, "/api/topics/t-1", strings.NewReader(`{"status": "INVALID_STATUS"}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues("t-1")
		c.Set(middleware.UserIDContextKey, "test-user-123")

		err := topicH.Update(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_STATUS")
	})
}

func TestResource_Validation(t *testing.T) {
	e := echo.New()
	resH := NewResourceHandler(nil)

	t.Run("Create Resource Invalid Type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/topics/t-1/resources", strings.NewReader(`{"title": "Video", "url": "https://yt.com", "type": "UNKNOWN"}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.SetParamNames("id")
		c.SetParamValues("t-1")
		c.Set(middleware.UserIDContextKey, "test-user-123")

		err := resH.Create(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_RESOURCE_TYPE")
	})
}
