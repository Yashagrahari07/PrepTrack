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

const DefaultDSASheetURL = "https://neetcode.io/practice/practice/neetcode150"

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
		`SELECT user_id, weekly_target_hours, dsa_sheet_url, updated_at
		 FROM user_settings WHERE user_id = $1`,
		userID,
	).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.DSASheetURL, &settings.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Initialize default settings using PostgreSQL schema defaults
			err = h.pool.QueryRow(ctx,
				`INSERT INTO user_settings (user_id)
				 VALUES ($1)
				 ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
				 RETURNING user_id, weekly_target_hours, dsa_sheet_url, updated_at`,
				userID,
			).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.DSASheetURL, &settings.UpdatedAt)

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

// Update updates weekly target hours and/or DSA sheet URL
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

	if req.DSASheetURL != nil {
		trimmed := strings.TrimSpace(*req.DSASheetURL)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_DSA_SHEET_URL", "DSA sheet URL cannot be empty")
		}
		req.DSASheetURL = &trimmed
	}

	ctx := c.Request().Context()
	var settings model.UserSettings

	err := h.pool.QueryRow(ctx,
		`INSERT INTO user_settings (user_id, weekly_target_hours, dsa_sheet_url, updated_at)
		 VALUES ($1, COALESCE($2, 15.0), COALESCE($3, $4), NOW())
		 ON CONFLICT (user_id) DO UPDATE SET
			weekly_target_hours = COALESCE($2, user_settings.weekly_target_hours),
			dsa_sheet_url = COALESCE($3, user_settings.dsa_sheet_url),
			updated_at = NOW()
		 RETURNING user_id, weekly_target_hours, dsa_sheet_url, updated_at`,
		userID, req.WeeklyTargetHours, req.DSASheetURL, DefaultDSASheetURL,
	).Scan(&settings.UserID, &settings.WeeklyTargetHours, &settings.DSASheetURL, &settings.UpdatedAt)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update user settings")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"settings": settings,
	})
}
