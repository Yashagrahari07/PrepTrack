package handler

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type StudyLogHandler struct {
	pool *pgxpool.Pool
}

func NewStudyLogHandler(pool *pgxpool.Pool) *StudyLogHandler {
	return &StudyLogHandler{pool: pool}
}

// ListByTopic returns all study logs for a specific topic
func (h *StudyLogHandler) ListByTopic(c echo.Context) error {
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
		`SELECT id, user_id, topic_id, TO_CHAR(logged_on, 'YYYY-MM-DD') as logged_on, minutes, comment, created_at
		 FROM study_logs
		 WHERE topic_id = $1 AND user_id = $2
		 ORDER BY logged_on DESC, created_at DESC`,
		topicID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch study logs")
	}
	defer rows.Close()

	logs := []model.StudyLog{}
	for rows.Next() {
		var log model.StudyLog
		if err := rows.Scan(&log.ID, &log.UserID, &log.TopicID, &log.LoggedOn, &log.Minutes, &log.Comment, &log.CreatedAt); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan study log row")
		}
		logs = append(logs, log)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"logs": logs,
	})
}

type CreateStudyLogRequest struct {
	TopicID  string  `json:"topic_id"`
	Minutes  int     `json:"minutes"`
	Comment  *string `json:"comment"`
	LoggedOn *string `json:"logged_on"` // optional YYYY-MM-DD (defaults to CURRENT_DATE)
}

// Create records a study session for a topic
func (h *StudyLogHandler) Create(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	var req CreateStudyLogRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.TopicID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_TOPIC_ID", "Topic ID is required")
	}

	if req.Minutes <= 0 {
		return sendError(c, http.StatusBadRequest, "INVALID_MINUTES", "Logged minutes must be greater than 0")
	}

	ctx := c.Request().Context()

	// Verify topic ownership
	var topicExists bool
	err := h.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM topics WHERE id = $1 AND user_id = $2)",
		req.TopicID, userID,
	).Scan(&topicExists)
	if err != nil || !topicExists {
		return sendError(c, http.StatusBadRequest, "INVALID_TOPIC", "Target topic does not exist or is unauthorized")
	}

	loggedOnDate := time.Now().Format("2006-01-02")
	if req.LoggedOn != nil && *req.LoggedOn != "" {
		loggedOnDate = *req.LoggedOn
	}

	var logEntry model.StudyLog
	err = h.pool.QueryRow(ctx,
		`INSERT INTO study_logs (user_id, topic_id, minutes, comment, logged_on)
		 VALUES ($1, $2, $3, $4, $5::date)
		 RETURNING id, user_id, topic_id, TO_CHAR(logged_on, 'YYYY-MM-DD'), minutes, comment, created_at`,
		userID, req.TopicID, req.Minutes, req.Comment, loggedOnDate,
	).Scan(&logEntry.ID, &logEntry.UserID, &logEntry.TopicID, &logEntry.LoggedOn, &logEntry.Minutes, &logEntry.Comment, &logEntry.CreatedAt)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to create study log")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"log": logEntry,
	})
}
