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

func TestTopicReorder_Validation(t *testing.T) {
	e := echo.New()
	topicH := NewTopicHandler(nil)

	newCtx := func(body string) (echo.Context, *httptest.ResponseRecorder) {
		req := httptest.NewRequest(http.MethodPost, "/api/topics/reorder", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(middleware.UserIDContextKey, "test-user-123")
		return c, rec
	}

	t.Run("Reorder Missing Fields", func(t *testing.T) {
		c, rec := newCtx(`{"category_id": ""}`)
		err := topicH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_REQUIRED_FIELDS")
	})

	t.Run("Reorder Empty List", func(t *testing.T) {
		c, rec := newCtx(`{"category_id": "11111111-1111-1111-1111-111111111111", "ordered_ids": []}`)
		err := topicH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_REQUIRED_FIELDS")
	})

	t.Run("Reorder Duplicate IDs", func(t *testing.T) {
		id := "11111111-1111-1111-1111-111111111111"
		c, rec := newCtx(`{"category_id": "` + id + `", "ordered_ids": ["` + id + `", "` + id + `"]}`)
		err := topicH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "ORDER_MISMATCH")
	})

	t.Run("Reorder Invalid UUID", func(t *testing.T) {
		c, rec := newCtx(`{"category_id": "not-a-uuid", "ordered_ids": ["not-a-uuid"]}`)
		err := topicH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("Reorder Invalid JSON", func(t *testing.T) {
		c, rec := newCtx(`{invalid}`)
		err := topicH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_REQUEST_BODY")
	})
}

func TestResourceReorder_Validation(t *testing.T) {
	e := echo.New()
	resH := NewResourceHandler(nil)

	newCtx := func(body string) (echo.Context, *httptest.ResponseRecorder) {
		req := httptest.NewRequest(http.MethodPost, "/api/resources/reorder", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		c.Set(middleware.UserIDContextKey, "test-user-123")
		return c, rec
	}

	t.Run("Reorder Missing Fields", func(t *testing.T) {
		c, rec := newCtx(`{"topic_id": ""}`)
		err := resH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_REQUIRED_FIELDS")
	})

	t.Run("Reorder Empty List", func(t *testing.T) {
		c, rec := newCtx(`{"topic_id": "11111111-1111-1111-1111-111111111111", "ordered_ids": []}`)
		err := resH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "MISSING_REQUIRED_FIELDS")
	})

	t.Run("Reorder Duplicate IDs", func(t *testing.T) {
		id := "11111111-1111-1111-1111-111111111111"
		c, rec := newCtx(`{"topic_id": "` + id + `", "ordered_ids": ["` + id + `", "` + id + `"]}`)
		err := resH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "ORDER_MISMATCH")
	})

	t.Run("Reorder Over Cap", func(t *testing.T) {
		id := "11111111-1111-1111-1111-111111111111"
		c, rec := newCtx(`{"topic_id": "` + id + `", "ordered_ids": ["` + id + `", "` + id + `", "` + id + `", "` + id + `"]}`)
		err := resH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "ORDER_MISMATCH")
	})

	t.Run("Reorder Invalid JSON", func(t *testing.T) {
		c, rec := newCtx(`{invalid}`)
		err := resH.Reorder(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_REQUEST_BODY")
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
