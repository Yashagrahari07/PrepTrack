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

type CategoryHandler struct {
	pool *pgxpool.Pool
}

func NewCategoryHandler(pool *pgxpool.Pool) *CategoryHandler {
	return &CategoryHandler{pool: pool}
}

// List returns all categories for the user with calculated topic counts
func (h *CategoryHandler) List(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()
	rows, err := h.pool.Query(ctx,
		`SELECT c.id, c.user_id, c.name, c.color, c.position, c.created_at,
		        (SELECT COUNT(*) FROM topics t WHERE t.category_id = c.id AND t.user_id = c.user_id) AS topic_count
		 FROM categories c
		 WHERE c.user_id = $1
		 ORDER BY c.position ASC, c.created_at ASC`,
		userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch categories")
	}
	defer rows.Close()

	categories := []model.Category{}
	for rows.Next() {
		var cat model.Category
		if err := rows.Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Color, &cat.Position, &cat.CreatedAt, &cat.TopicCount); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan category row")
		}
		categories = append(categories, cat)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"categories": categories,
	})
}

type CreateCategoryRequest struct {
	Name     string `json:"name"`
	Color    string `json:"color"`
	Position int    `json:"position"`
}

// Create inserts a new user category
func (h *CategoryHandler) Create(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	var req CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_NAME", "Category name is required")
	}

	if req.Color == "" {
		req.Color = "#4f46e5"
	}

	ctx := c.Request().Context()
	var cat model.Category
	err := h.pool.QueryRow(ctx,
		`INSERT INTO categories (user_id, name, color, position)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, color, position, created_at`,
		userID, req.Name, req.Color, req.Position,
	).Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Color, &cat.Position, &cat.CreatedAt)

	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to create category")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"category": cat,
	})
}

type UpdateCategoryRequest struct {
	Name     *string `json:"name"`
	Color    *string `json:"color"`
	Position *int    `json:"position"`
}

// Update modifies an existing category owned by the user
func (h *CategoryHandler) Update(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_ID", "Category ID is required")
	}

	var req UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			return sendError(c, http.StatusBadRequest, "INVALID_NAME", "Category name cannot be empty")
		}
		req.Name = &trimmed
	}

	ctx := c.Request().Context()
	var cat model.Category
	err := h.pool.QueryRow(ctx,
		`UPDATE categories
		 SET name = COALESCE($1, name),
		     color = COALESCE($2, color),
		     position = COALESCE($3, position)
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, user_id, name, color, position, created_at`,
		req.Name, req.Color, req.Position, categoryID, userID,
	).Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Color, &cat.Position, &cat.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found or unauthorized")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to update category")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"category": cat,
	})
}

// Delete removes a category and all associated topics/resources/logs via DB cascade
func (h *CategoryHandler) Delete(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_ID", "Category ID is required")
	}

	ctx := c.Request().Context()
	cmdTag, err := h.pool.Exec(ctx,
		"DELETE FROM categories WHERE id = $1 AND user_id = $2",
		categoryID, userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to delete category")
	}

	if cmdTag.RowsAffected() == 0 {
		return sendError(c, http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found or unauthorized")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Category deleted successfully",
	})
}
