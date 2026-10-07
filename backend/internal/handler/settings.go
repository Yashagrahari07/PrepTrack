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

const DefaultReferenceSheetURL = "https://neetcode.io/practice/practice/neetcode150"

type SettingsHandler struct {
	pool *pgxpool.Pool
}

func NewSettingsHandler(pool *pgxpool.Pool) *SettingsHandler {
	return &SettingsHandler{
		pool: pool,
	}
}

// Get retrieves the user's settings profile
func (h *SettingsHandler) Get(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()
	var settings model.UserSettings

	err := h.pool.QueryRow(ctx,
		`SELECT user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, COALESCE(show_reference_sheet, TRUE), updated_at
		 FROM user_settings WHERE user_id = $1`,
		userID,
	).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.ReferenceSheetURL, &settings.GoalType, &settings.GoalCustomText, &settings.ShowReferenceSheet, &settings.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Initialize default settings with explicit defaults for all new columns
			err = h.pool.QueryRow(ctx,
				`INSERT INTO user_settings (user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, show_reference_sheet)
				 VALUES ($1, 15.0, 'https://neetcode.io/practice/practice/neetcode150', NULL, NULL, TRUE)
				 ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
				 RETURNING user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, COALESCE(show_reference_sheet, TRUE), updated_at`,
				userID,
			).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.ReferenceSheetURL, &settings.GoalType, &settings.GoalCustomText, &settings.ShowReferenceSheet, &settings.UpdatedAt)

			if err != nil {
				return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to initialize default user settings")
			}
		} else {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch user settings")
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"settings": settings,
	})
}

// Update updates weekly target hours, reference sheet URL, goal preferences, and reference sheet visibility
func (h *SettingsHandler) Update(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	var req model.UpdateSettingsRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.WeeklyTargetHours != nil {
		if *req.WeeklyTargetHours <= 0 || *req.WeeklyTargetHours > 168.0 {
			return sendError(c, http.StatusBadRequest, "INVALID_TARGET_HOURS", "Weekly target hours must be between 0.5 and 168.0")
		}
	}

	if req.ReferenceSheetURL != nil {
		trimmed := strings.TrimSpace(*req.ReferenceSheetURL)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_REFERENCE_SHEET_URL", "Reference sheet URL cannot be empty")
		}
		req.ReferenceSheetURL = &trimmed
	}

	if req.GoalCustomText != nil {
		trimmed := strings.TrimSpace(*req.GoalCustomText)
		if len(trimmed) > 200 {
			return sendError(c, http.StatusBadRequest, "GOAL_TEXT_TOO_LONG", "Goal description must be 200 characters or less")
		}
		if trimmed == "" {
			req.GoalCustomText = nil
		} else {
			req.GoalCustomText = &trimmed
		}
	}

	ctx := c.Request().Context()
	var settings model.UserSettings

	err := h.pool.QueryRow(ctx,
		`INSERT INTO user_settings (user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, show_reference_sheet, updated_at)
		 VALUES ($1, COALESCE($2, 15.0), COALESCE($3, $4), $5, $6, COALESCE($7, TRUE), NOW())
		 ON CONFLICT (user_id) DO UPDATE SET
			weekly_target_hours = COALESCE($2, user_settings.weekly_target_hours),
			reference_sheet_url = COALESCE($3, user_settings.reference_sheet_url),
			goal_type = COALESCE($5, user_settings.goal_type),
			goal_custom_text = COALESCE($6, user_settings.goal_custom_text),
			show_reference_sheet = COALESCE($7, user_settings.show_reference_sheet),
			updated_at = NOW()
		 RETURNING user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, show_reference_sheet, updated_at`,
		userID, req.WeeklyTargetHours, req.ReferenceSheetURL, DefaultReferenceSheetURL,
		req.GoalType, req.GoalCustomText, req.ShowReferenceSheet,
	).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.ReferenceSheetURL, &settings.GoalType, &settings.GoalCustomText, &settings.ShowReferenceSheet, &settings.UpdatedAt)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update user settings")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"settings": settings,
	})
}