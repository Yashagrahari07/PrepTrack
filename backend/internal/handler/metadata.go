package handler

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/yash/preptrack-backend/internal/middleware"
)

const oembedMaxBodyBytes = 64 * 1024

type MetadataHandler struct {
	client     *http.Client
	oembedBase string
}

func NewMetadataHandler(client *http.Client, oembedBase string) *MetadataHandler {
	if client == nil {
		client = &http.Client{
			Timeout: 8 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		}
	}
	if oembedBase == "" {
		oembedBase = "https://www.youtube.com/oembed"
	}
	return &MetadataHandler{client: client, oembedBase: oembedBase}
}

// isYouTubeHost reports whether host belongs to YouTube. DNS rebinding is a
// non-issue here: the fetch target below is the hardcoded oEmbed host, never
// the user-supplied URL (which is only passed as an escaped query value).
func isYouTubeHost(host string) bool {
	h := strings.ToLower(strings.TrimSuffix(host, "."))
	if h == "youtube.com" || h == "youtu.be" ||
		h == "youtube-nocookie.com" || h == "www.youtube-nocookie.com" {
		return true
	}
	return strings.HasSuffix(h, ".youtube.com")
}

func isVideoID(s string) bool {
	if len(s) != 11 {
		return false
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

type youtubeKind struct {
	kind       string
	videoID    string
	playlistID string
}

// classifyYouTube detects video vs playlist from any YouTube URL shape.
func classifyYouTube(raw string) (youtubeKind, bool) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || !u.IsAbs() || u.Host == "" {
		return youtubeKind{}, false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return youtubeKind{}, false
	}
	if !isYouTubeHost(u.Hostname()) {
		return youtubeKind{}, false
	}

	q := u.Query()
	if v := q.Get("v"); isVideoID(v) {
		return youtubeKind{kind: "video", videoID: v}, true
	}
	if u.Hostname() == "youtu.be" || strings.HasSuffix(strings.ToLower(u.Hostname()), ".youtu.be") {
		if id := strings.Trim(u.Path, "/"); isVideoID(id) {
			return youtubeKind{kind: "video", videoID: id}, true
		}
	}
	for _, prefix := range []string{"/shorts/", "/embed/", "/live/"} {
		if strings.HasPrefix(u.Path, prefix) {
			if id := strings.Trim(strings.TrimPrefix(u.Path, prefix), "/"); isVideoID(id) {
				return youtubeKind{kind: "video", videoID: id}, true
			}
		}
	}
	if list := q.Get("list"); list != "" {
		return youtubeKind{kind: "playlist", playlistID: list}, true
	}
	return youtubeKind{}, false
}

type oembedResponse struct {
	Title      string `json:"title"`
	AuthorName string `json:"author_name"`
}

type youtubeMetadata struct {
	Kind       string `json:"kind"`
	Title      string `json:"title"`
	Author     string `json:"author,omitempty"`
	VideoID    string `json:"video_id,omitempty"`
	PlaylistID string `json:"playlist_id,omitempty"`
}

// Lookup fetches public YouTube title metadata for prefill. Nothing is persisted.
func (h *MetadataHandler) Lookup(c echo.Context) error {
	if _, ok := middleware.GetUserID(c); !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	raw := strings.TrimSpace(c.QueryParam("url"))
	if raw == "" {
		return sendError(c, http.StatusBadRequest, "INVALID_URL", "A URL query parameter is required")
	}

	kind, ok := classifyYouTube(raw)
	if !ok {
		return sendError(c, http.StatusBadRequest, "INVALID_URL", "URL is not a supported YouTube video or playlist link")
	}

	fetchURL := h.oembedBase + "?url=" + url.QueryEscape(raw) + "&format=json"
	req, err := http.NewRequestWithContext(c.Request().Context(), http.MethodGet, fetchURL, nil)
	if err != nil {
		return sendError(c, http.StatusBadGateway, "METADATA_UNAVAILABLE", "Video details are currently unavailable")
	}
	req.Header.Set("User-Agent", "PrepTrack/1.0")
	req.Header.Set("Accept", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		log.Printf("metadata: upstream fetch failed: %v", err)
		return sendError(c, http.StatusBadGateway, "METADATA_UNAVAILABLE", "Video details are currently unavailable")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("metadata: upstream status %d", resp.StatusCode)
		return sendError(c, http.StatusBadGateway, "METADATA_UNAVAILABLE", "Video details are currently unavailable")
	}

	var oe oembedResponse
	if err := json.NewDecoder(io.LimitReader(resp.Body, oembedMaxBodyBytes)).Decode(&oe); err != nil {
		log.Printf("metadata: upstream decode failed: %v", err)
		return sendError(c, http.StatusBadGateway, "METADATA_UNAVAILABLE", "Video details are currently unavailable")
	}
	if strings.TrimSpace(oe.Title) == "" {
		return sendError(c, http.StatusBadGateway, "METADATA_UNAVAILABLE", "Video details are currently unavailable")
	}

	meta := youtubeMetadata{
		Kind:   kind.kind,
		Title:  strings.TrimSpace(oe.Title),
		Author: strings.TrimSpace(oe.AuthorName),
	}
	if kind.videoID != "" {
		meta.VideoID = kind.videoID
	}
	if kind.playlistID != "" {
		meta.PlaylistID = kind.playlistID
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"metadata": meta,
	})
}
