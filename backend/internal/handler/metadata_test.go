package handler

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/yash/preptrack-backend/internal/middleware"
)

func newMetadataCtx(t *testing.T, e *echo.Echo, target string) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/metadata/youtube?url="+url.QueryEscape(target), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(middleware.UserIDContextKey, "test-user-123")
	return c, rec
}

func TestMetadataLookup_Validation(t *testing.T) {
	e := echo.New()
	h := NewMetadataHandler(nil, "")

	t.Run("Missing URL", func(t *testing.T) {
		c, rec := newMetadataCtx(t, e, "")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_URL")
	})

	t.Run("Non YouTube Host", func(t *testing.T) {
		c, rec := newMetadataCtx(t, e, "https://example.com/video")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_URL")
	})

	t.Run("Not A URL", func(t *testing.T) {
		c, rec := newMetadataCtx(t, e, "not-a-url")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_URL")
	})

	t.Run("YouTube Host Without Video Or Playlist", func(t *testing.T) {
		c, rec := newMetadataCtx(t, e, "https://www.youtube.com/")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_URL")
	})

	t.Run("Lookalike Host Rejected", func(t *testing.T) {
		c, rec := newMetadataCtx(t, e, "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "INVALID_URL")
	})
}

func TestMetadataLookup_Upstream(t *testing.T) {
	e := echo.New()

	t.Run("Video Title Returned", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"title":"Some Video","author_name":"Some Channel"}`))
		}))
		defer srv.Close()

		h := NewMetadataHandler(srv.Client(), srv.URL)
		c, rec := newMetadataCtx(t, e, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "Some Video")
		assert.Contains(t, rec.Body.String(), `"kind":"video"`)
	})

	t.Run("Upstream Failure Is 502", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		}))
		defer srv.Close()

		h := NewMetadataHandler(srv.Client(), srv.URL)
		c, rec := newMetadataCtx(t, e, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
		assert.NoError(t, h.Lookup(c))
		assert.Equal(t, http.StatusBadGateway, rec.Code)
		assert.Contains(t, rec.Body.String(), "METADATA_UNAVAILABLE")
	})
}

func TestClassifyYouTube(t *testing.T) {
	cases := []struct {
		in       string
		kind     string
		videoID  string
		playlist string
		ok       bool
	}{
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ", "video", "dQw4w9WgXcQ", "", true},
		{"https://youtu.be/dQw4w9WgXcQ", "video", "dQw4w9WgXcQ", "", true},
		{"https://www.youtube.com/shorts/dQw4w9WgXcQ", "video", "dQw4w9WgXcQ", "", true},
		{"https://www.youtube.com/playlist?list=PL1234567890abcd", "playlist", "", "PL1234567890abcd", true},
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890abcd", "video", "dQw4w9WgXcQ", "", true},
		{"https://example.com/watch?v=dQw4w9WgXcQ", "", "", "", false},
		{"https://www.youtube.com/", "", "", "", false},
		{"notaurl", "", "", "", false},
		{"ftp://www.youtube.com/watch?v=dQw4w9WgXcQ", "", "", "", false},
	}

	for _, tc := range cases {
		k, ok := classifyYouTube(tc.in)
		assert.Equal(t, tc.ok, ok, tc.in)
		if ok {
			assert.Equal(t, tc.kind, k.kind, tc.in)
			assert.Equal(t, tc.videoID, k.videoID, tc.in)
			assert.Equal(t, tc.playlist, k.playlistID, tc.in)
		}
	}
}
