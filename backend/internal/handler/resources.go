package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type ResourceHandler struct {
	pool *pgxpool.Pool
}

func NewResourceHandler(pool *pgxpool.Pool) *ResourceHandler {
	return &ResourceHandler{pool: pool}
}

// List returns all resources for a specific topic
func (h *ResourceHandler) List(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	topicID := c.Param("id")
	if topicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	ctx := c.Request().Context()
	rows, err := h.pool.Query(ctx,
		`SELECT id, user_id, topic_id, type, title, url, est_minutes, status, created_at
		 FROM resources
		 WHERE topic_id = $1 AND user_id = $2
		 ORDER BY created_at ASC`,
		topicID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch resources")
	}
	defer rows.Close()

	resources := []model.Resource{}
	for rows.Next() {
		var res model.Resource
		if err := rows.Scan(&res.ID, &res.UserID, &res.TopicID, &res.Type, &res.Title, &res.URL, &res.EstMinutes, &res.Status, &res.CreatedAt); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan resource row")
		}
		resources = append(resources, res)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"resources": resources,
	})
}

type CreateResourceRequest struct {
	Type       string `json:"type"`
	Title      string `json:"title"`
	URL        string `json:"url"`
	EstMinutes int    `json:"est_minutes"`
	Status     string `json:"status"`
}

// Create inserts a resource with a strict MAX 3 PER TOPIC guard
func (h *ResourceHandler) Create(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	topicID := c.Param("id")
	if topicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	var req CreateResourceRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	req.Title = strings.TrimSpace(req.Title)
	req.URL = strings.TrimSpace(req.URL)
	if req.Title == "" || req.URL == "" || req.Type == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Title, URL, and Type are required")
	}

	validTypes := map[string]bool{"YOUTUBE_VIDEO": true, "YOUTUBE_PLAYLIST": true, "DEV_BLOG": true, "OFFICIAL_DOCS": true, "OTHER": true}
	if !validTypes[req.Type] {
		return sendError(c, http.StatusBadRequest, "INVALID_RESOURCE_TYPE", "Invalid resource type")
	}

	if req.EstMinutes <= 0 {
		req.EstMinutes = 30
	}

	if req.Status == "" {
		req.Status = "TODO"
	}
	validStatuses := map[string]bool{"TODO": true, "DOING": true, "DONE": true}
	if !validStatuses[req.Status] {
		return sendError(c, http.StatusBadRequest, "INVALID_RESOURCE_STATUS", "Invalid resource status")
	}

	ctx := c.Request().Context()

	// Verify topic ownership
	var topicExists bool
	err := h.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM topics WHERE id = $1 AND user_id = $2)",
		topicID, userID,
	).Scan(&topicExists)
	if err != nil || !topicExists {
		return sendError(c, http.StatusBadRequest, "INVALID_TOPIC", "Target topic does not exist or is unauthorized")
	}

	// MAX-3 GUARD: Enforce maximum of 3 resources per topic
	var count int
	err = h.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM resources WHERE topic_id = $1 AND user_id = $2",
		topicID, userID,
	).Scan(&count)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to check resource limit")
	}

	if count >= 3 {
		return sendError(c, http.StatusBadRequest, "RESOURCE_LIMIT_EXCEEDED", "A topic cannot have more than 3 resources")
	}

	var res model.Resource
	err = h.pool.QueryRow(ctx,
		`INSERT INTO resources (user_id, topic_id, type, title, url, est_minutes, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, user_id, topic_id, type, title, url, est_minutes, status, created_at`,
		userID, topicID, req.Type, req.Title, req.URL, req.EstMinutes, req.Status,
	).Scan(&res.ID, &res.UserID, &res.TopicID, &res.Type, &res.Title, &res.URL, &res.EstMinutes, &res.Status, &res.CreatedAt)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to create resource")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"resource": res,
	})
}

type UpdateResourceRequest struct {
	Type       *string `json:"type"`
	Title      *string `json:"title"`
	URL        *string `json:"url"`
	EstMinutes *int    `json:"est_minutes"`
	Status     *string `json:"status"`
}

// Update modifies an existing resource
func (h *ResourceHandler) Update(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	resourceID := c.Param("id")
	if resourceID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_RESOURCE_ID", "Resource ID is required")
	}

	var req UpdateResourceRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.Type != nil {
		validTypes := map[string]bool{"YOUTUBE_VIDEO": true, "YOUTUBE_PLAYLIST": true, "DEV_BLOG": true, "OFFICIAL_DOCS": true, "OTHER": true}
		if !validTypes[*req.Type] {
			return sendError(c, http.StatusBadRequest, "INVALID_RESOURCE_TYPE", "Invalid resource type")
		}
	}

	if req.Status != nil {
		validStatuses := map[string]bool{"TODO": true, "DOING": true, "DONE": true}
		if !validStatuses[*req.Status] {
			return sendError(c, http.StatusBadRequest, "INVALID_RESOURCE_STATUS", "Invalid resource status")
		}
	}

	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_TITLE", "Title cannot be empty")
		}
		req.Title = &trimmed
	}

	if req.URL != nil {
		trimmed := strings.TrimSpace(*req.URL)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_URL", "URL cannot be empty")
		}
		req.URL = &trimmed
	}

	ctx := c.Request().Context()
	var res model.Resource

	err := h.pool.QueryRow(ctx,
		`UPDATE resources
		 SET type = COALESCE($1, type),
		     title = COALESCE($2, title),
		     url = COALESCE($3, url),
		     est_minutes = COALESCE($4, est_minutes),
		     status = COALESCE($5, status)
		 WHERE id = $6 AND user_id = $7
		 RETURNING id, user_id, topic_id, type, title, url, est_minutes, status, created_at`,
		req.Type, req.Title, req.URL, req.EstMinutes, req.Status, resourceID, userID,
	).Scan(&res.ID, &res.UserID, &res.TopicID, &res.Type, &res.Title, &res.URL, &res.EstMinutes, &res.Status, &res.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "RESOURCE_NOT_FOUND", "Resource not found or unauthorized")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update resource")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"resource": res,
	})
}

// Delete removes a resource
func (h *ResourceHandler) Delete(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	resourceID := c.Param("id")
	if resourceID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_RESOURCE_ID", "Resource ID is required")
	}

	ctx := c.Request().Context()
	cmdTag, err := h.pool.Exec(ctx,
		"DELETE FROM resources WHERE id = $1 AND user_id = $2",
		resourceID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to delete resource")
	}

	if cmdTag.RowsAffected() == 0 {
		return sendError(c, http.StatusNotFound, "RESOURCE_NOT_FOUND", "Resource not found or unauthorized")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Resource deleted successfully",
	})
}
