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

type TopicHandler struct {
	pool *pgxpool.Pool
}

func NewTopicHandler(pool *pgxpool.Pool) *TopicHandler {
	return &TopicHandler{pool: pool}
}

// ListByCategory returns top-level topics and nested subtopics for a category
func (h *TopicHandler) ListByCategory(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_CATEGORY_ID", "Category ID is required")
	}

	ctx := c.Request().Context()
	rows, err := h.pool.Query(ctx,
		`SELECT t.id, t.user_id, t.category_id, cat.name as category_name, t.parent_id,
		        t.title, t.status, t.confidence, t.notes_md, t.position, t.created_at, t.updated_at,
		        (SELECT COUNT(*) FROM resources r WHERE r.topic_id = t.id) as resource_count
		 FROM topics t
		 JOIN categories cat ON cat.id = t.category_id
		 WHERE t.category_id = $1 AND t.user_id = $2
		 ORDER BY t.position ASC, t.created_at ASC`,
		categoryID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch topics")
	}
	defer rows.Close()

	allTopics := []model.Topic{}
	subtopicMap := make(map[string][]model.Topic)

	for rows.Next() {
		var topic model.Topic
		err := rows.Scan(
			&topic.ID, &topic.UserID, &topic.CategoryID, &topic.CategoryName, &topic.ParentID,
			&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
			&topic.CreatedAt, &topic.UpdatedAt, &topic.ResourceCount,
		)
		if err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan topic row")
		}

		if topic.ParentID != nil {
			subtopicMap[*topic.ParentID] = append(subtopicMap[*topic.ParentID], topic)
		} else {
			allTopics = append(allTopics, topic)
		}
	}

	// Nest subtopics into top-level topics
	result := make([]model.Topic, 0, len(allTopics))
	for _, top := range allTopics {
		if subs, exists := subtopicMap[top.ID]; exists {
			top.Subtopics = subs
		} else {
			top.Subtopics = []model.Topic{}
		}
		result = append(result, top)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"topics": result,
	})
}

// Get returns single topic details
func (h *TopicHandler) Get(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	topicID := c.Param("id")
	if topicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	ctx := c.Request().Context()
	var topic model.Topic

	err := h.pool.QueryRow(ctx,
		`SELECT t.id, t.user_id, t.category_id, cat.name as category_name, t.parent_id,
		        t.title, t.status, t.confidence, t.notes_md, t.position, t.created_at, t.updated_at,
		        (SELECT COUNT(*) FROM resources r WHERE r.topic_id = t.id) as resource_count
		 FROM topics t
		 JOIN categories cat ON cat.id = t.category_id
		 WHERE t.id = $1 AND t.user_id = $2`,
		topicID, userID,
	).Scan(
		&topic.ID, &topic.UserID, &topic.CategoryID, &topic.CategoryName, &topic.ParentID,
		&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
		&topic.CreatedAt, &topic.UpdatedAt, &topic.ResourceCount,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "TOPIC_NOT_FOUND", "Topic not found or unauthorized")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch topic")
	}

	topic.Subtopics = []model.Topic{}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"topic": topic,
	})
}

type CreateTopicRequest struct {
	CategoryID string  `json:"category_id"`
	ParentID   *string `json:"parent_id"`
	Title      string  `json:"title"`
	Position   int     `json:"position"`
}

// Create adds a new topic or subtopic
func (h *TopicHandler) Create(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	var req CreateTopicRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" || req.CategoryID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Category ID and Title are required")
	}

	ctx := c.Request().Context()

	// Verify Category ownership
	var categoryExists bool
	err := h.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)",
		req.CategoryID, userID,
	).Scan(&categoryExists)
	if err != nil || !categoryExists {
		return sendError(c, http.StatusBadRequest, "INVALID_CATEGORY", "Target category does not exist or is unauthorized")
	}

	// Verify Parent Topic ownership if provided
	if req.ParentID != nil && *req.ParentID != "" {
		var parentExists bool
		err := h.pool.QueryRow(ctx,
			"SELECT EXISTS(SELECT 1 FROM topics WHERE id = $1 AND user_id = $2 AND category_id = $3)",
			*req.ParentID, userID, req.CategoryID,
		).Scan(&parentExists)
		if err != nil || !parentExists {
			return sendError(c, http.StatusBadRequest, "INVALID_PARENT_TOPIC", "Parent topic does not exist in this category")
		}
	} else {
		req.ParentID = nil
	}

	var topic model.Topic
	err = h.pool.QueryRow(ctx,
		`INSERT INTO topics (user_id, category_id, parent_id, title, position)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, category_id, parent_id, title, status, confidence, notes_md, position, created_at, updated_at`,
		userID, req.CategoryID, req.ParentID, req.Title, req.Position,
	).Scan(
		&topic.ID, &topic.UserID, &topic.CategoryID, &topic.ParentID,
		&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
		&topic.CreatedAt, &topic.UpdatedAt,
	)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to create topic")
	}

	topic.Subtopics = []model.Topic{}
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"topic": topic,
	})
}

type UpdateTopicRequest struct {
	Title      *string `json:"title"`
	Status     *string `json:"status"`
	Confidence *int    `json:"confidence"`
	NotesMd    *string `json:"notes_md"`
	Position   *int    `json:"position"`
}

// Update modifies topic details with side-effect (creates revision when status -> LEARNED)
func (h *TopicHandler) Update(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	topicID := c.Param("id")
	if topicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	var req UpdateTopicRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.Status != nil {
		validStatuses := map[string]bool{"NOT_STARTED": true, "IN_PROGRESS": true, "LEARNED": true, "INTERVIEW_READY": true}
		if !validStatuses[*req.Status] {
			return sendError(c, http.StatusBadRequest, "INVALID_STATUS", "Invalid status value")
		}
	}

	if req.Confidence != nil {
		if *req.Confidence < 1 || *req.Confidence > 5 {
			return sendError(c, http.StatusBadRequest, "INVALID_CONFIDENCE", "Confidence must be between 1 and 5")
		}
	}

	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_TITLE", "Title cannot be empty")
		}
		req.Title = &trimmed
	}

	ctx := c.Request().Context()
	var topic model.Topic

	err := h.pool.QueryRow(ctx,
		`UPDATE topics
		 SET title = COALESCE($1, title),
		     status = COALESCE($2, status),
		     confidence = COALESCE($3, confidence),
		     notes_md = COALESCE($4, notes_md),
		     position = COALESCE($5, position),
		     updated_at = NOW()
		 WHERE id = $6 AND user_id = $7
		 RETURNING id, user_id, category_id, parent_id, title, status, confidence, notes_md, position, created_at, updated_at`,
		req.Title, req.Status, req.Confidence, req.NotesMd, req.Position, topicID, userID,
	).Scan(
		&topic.ID, &topic.UserID, &topic.CategoryID, &topic.ParentID,
		&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
		&topic.CreatedAt, &topic.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "TOPIC_NOT_FOUND", "Topic not found or unauthorized")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update topic")
	}

	// SIDE-EFFECT: If status transitioned to 'LEARNED', trigger first scheduled revision for tomorrow if no pending revision exists
	if req.Status != nil && *req.Status == "LEARNED" {
		_, _ = h.pool.Exec(ctx,
			`INSERT INTO revisions (user_id, topic_id, due_on)
			 SELECT $1, $2, CURRENT_DATE + 1
			 WHERE NOT EXISTS (
				 SELECT 1 FROM revisions WHERE topic_id = $2 AND done_on IS NULL
			 )`,
			userID, topicID,
		)
	}

	topic.Subtopics = []model.Topic{}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"topic": topic,
	})
}

// Delete removes a topic
func (h *TopicHandler) Delete(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	topicID := c.Param("id")
	if topicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	ctx := c.Request().Context()
	cmdTag, err := h.pool.Exec(ctx,
		"DELETE FROM topics WHERE id = $1 AND user_id = $2",
		topicID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to delete topic")
	}

	if cmdTag.RowsAffected() == 0 {
		return sendError(c, http.StatusNotFound, "TOPIC_NOT_FOUND", "Topic not found or unauthorized")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Topic deleted successfully",
	})
}
