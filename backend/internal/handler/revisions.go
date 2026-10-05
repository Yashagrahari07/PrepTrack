package handler

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type RevisionHandler struct {
	pool *pgxpool.Pool
}

func NewRevisionHandler(pool *pgxpool.Pool) *RevisionHandler {
	return &RevisionHandler{pool: pool}
}

// ListDue returns all pending revisions due today or earlier
func (h *RevisionHandler) ListDue(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()
	rows, err := h.pool.Query(ctx,
		`SELECT r.id, r.user_id, r.topic_id, t.title as topic_title, cat.name as category_name,
		        TO_CHAR(r.due_on, 'YYYY-MM-DD') as due_on,
		        TO_CHAR(r.done_on, 'YYYY-MM-DD') as done_on,
		        r.confidence
		 FROM revisions r
		 JOIN topics t ON t.id = r.topic_id
		 JOIN categories cat ON cat.id = t.category_id
		 WHERE r.user_id = $1 AND r.done_on IS NULL AND r.due_on <= CURRENT_DATE
		 ORDER BY r.due_on ASC, r.created_at ASC`,
		userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch due revisions")
	}
	defer rows.Close()

	revisions := []model.Revision{}
	for rows.Next() {
		var rev model.Revision
		if err := rows.Scan(&rev.ID, &rev.UserID, &rev.TopicID, &rev.TopicTitle, &rev.CategoryName, &rev.DueOn, &rev.DoneOn, &rev.Confidence); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan revision row")
		}
		revisions = append(revisions, rev)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"revisions": revisions,
	})
}

// Complete processes a revision review rating (1-5), schedules next interval, and updates topic status
func (h *RevisionHandler) Complete(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	revisionID := c.Param("id")
	if revisionID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_REVISION_ID", "Revision ID is required")
	}

	var req model.CompleteRevisionRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.Confidence < 1 || req.Confidence > 5 {
		return sendError(c, http.StatusBadRequest, "INVALID_CONFIDENCE", "Confidence rating must be between 1 and 5")
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "TRANSACTION_FAILED", "Database connection error")
	}
	defer tx.Rollback(ctx)

	// Fetch revision & verify ownership
	var topicID string
	err = tx.QueryRow(ctx,
		"SELECT topic_id FROM revisions WHERE id = $1 AND user_id = $2 AND done_on IS NULL",
		revisionID, userID,
	).Scan(&topicID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "REVISION_NOT_FOUND", "Pending revision not found or unauthorized")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch revision")
	}

	// Mark current revision complete
	_, err = tx.Exec(ctx,
		"UPDATE revisions SET done_on = CURRENT_DATE, confidence = $1 WHERE id = $2 AND user_id = $3",
		req.Confidence, revisionID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to mark revision as completed")
	}

	// Update topic's confidence rating
	_, err = tx.Exec(ctx,
		"UPDATE topics SET confidence = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
		req.Confidence, topicID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update topic confidence")
	}

	// Calculate SM-2 spaced repetition next interval
	var intervalDays int
	switch req.Confidence {
	case 1, 2:
		intervalDays = 1
		// Reset topic status to IN_PROGRESS if forgotten/hard
		_, _ = tx.Exec(ctx,
			"UPDATE topics SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status IN ('LEARNED', 'INTERVIEW_READY')",
			topicID, userID,
		)
	case 3:
		intervalDays = 3
	case 4:
		intervalDays = 7
	case 5:
		intervalDays = 21

		// Check consecutive rating 5 count to auto-promote topic to INTERVIEW_READY
		var fiveCount int
		_ = tx.QueryRow(ctx,
			"SELECT COUNT(*) FROM revisions WHERE topic_id = $1 AND user_id = $2 AND confidence = 5 AND done_on IS NOT NULL",
			topicID, userID,
		).Scan(&fiveCount)

		if fiveCount >= 2 {
			_, _ = tx.Exec(ctx,
				"UPDATE topics SET status = 'INTERVIEW_READY', updated_at = NOW() WHERE id = $1 AND user_id = $2",
				topicID, userID,
			)
		}
	}

	// Schedule next revision
	nextDueDate := time.Now().AddDate(0, 0, intervalDays).Format("2006-01-02")
	_, err = tx.Exec(ctx,
		`INSERT INTO revisions (user_id, topic_id, due_on)
		 VALUES ($1, $2, CURRENT_DATE + $3 * INTERVAL '1 day')`,
		userID, topicID, intervalDays,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to schedule next revision")
	}

	if err := tx.Commit(ctx); err != nil {
		return sendError(c, http.StatusInternalServerError, "TRANSACTION_COMMIT_FAILED", "Failed to commit revision completion")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":       fmt.Sprintf("Revision completed. Next review scheduled in %d days.", intervalDays),
		"next_due_date": nextDueDate,
		"confidence":    req.Confidence,
	})
}
