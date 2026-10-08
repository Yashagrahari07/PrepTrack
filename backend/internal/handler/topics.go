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

	// Default appends to the end of the sibling set when the client omits position
	position := req.Position
	if position <= 0 {
		var maxPos int
		var maxErr error
		if req.ParentID != nil {
			maxErr = h.pool.QueryRow(ctx,
				`SELECT COALESCE(MAX(position), -1) FROM topics
				 WHERE user_id = $1 AND category_id = $2 AND parent_id = $3`,
				userID, req.CategoryID, *req.ParentID,
			).Scan(&maxPos)
		} else {
			maxErr = h.pool.QueryRow(ctx,
				`SELECT COALESCE(MAX(position), -1) FROM topics
				 WHERE user_id = $1 AND category_id = $2 AND parent_id IS NULL`,
				userID, req.CategoryID,
			).Scan(&maxPos)
		}
		if maxErr != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to determine topic position")
		}
		position = maxPos + 1
	}

	var topic model.Topic
	err = h.pool.QueryRow(ctx,
		`INSERT INTO topics (user_id, category_id, parent_id, title, position)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, category_id, parent_id, title, status, confidence, notes_md, position, created_at, updated_at`,
		userID, req.CategoryID, req.ParentID, req.Title, position,
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

// isValidUUID reports whether s has UUID text shape (8-4-4-4-12 hex).
// It guards pgx from malformed ids so bad input maps to 400, never 500.
func isValidUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i := 0; i < 36; i++ {
		c := s[i]
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f' || c >= 'A' && c <= 'F') {
				return false
			}
		}
	}
	return true
}

type CategoryGroup struct {
	CategoryID   string       `json:"category_id"`
	CategoryName string       `json:"category_name"`
	Color        string       `json:"color"`
	Position     int          `json:"position"`
	Topics       []model.Topic `json:"topics"`
}

// ListAll returns every user topic grouped by category for the All Domains view
func (h *TopicHandler) ListAll(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()

	type catRow struct {
		id       string
		name     string
		color    string
		position int
	}
	catRows, err := h.pool.Query(ctx,
		`SELECT id, name, color, position
		 FROM categories WHERE user_id = $1
		 ORDER BY position ASC, created_at ASC`,
		userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch categories")
	}
	cats := []catRow{}
	for catRows.Next() {
		var cr catRow
		if err := catRows.Scan(&cr.id, &cr.name, &cr.color, &cr.position); err != nil {
			catRows.Close()
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan category row")
		}
		cats = append(cats, cr)
	}
	catRows.Close()

	rows, err := h.pool.Query(ctx,
		`SELECT t.id, t.user_id, t.category_id, cat.name as category_name, t.parent_id,
		        t.title, t.status, t.confidence, t.notes_md, t.position, t.created_at, t.updated_at,
		        (SELECT COUNT(*) FROM resources r WHERE r.topic_id = t.id) as resource_count
		 FROM topics t
		 JOIN categories cat ON cat.id = t.category_id AND cat.user_id = $1
		 WHERE t.user_id = $1
		 ORDER BY t.position ASC, t.created_at ASC`,
		userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch topics")
	}
	defer rows.Close()

	subtopicMap := make(map[string][]model.Topic)
	topByCat := make(map[string][]model.Topic)
	for rows.Next() {
		var topic model.Topic
		if err := rows.Scan(
			&topic.ID, &topic.UserID, &topic.CategoryID, &topic.CategoryName, &topic.ParentID,
			&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
			&topic.CreatedAt, &topic.UpdatedAt, &topic.ResourceCount,
		); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan topic row")
		}
		if topic.ParentID != nil {
			subtopicMap[*topic.ParentID] = append(subtopicMap[*topic.ParentID], topic)
		} else {
			topByCat[topic.CategoryID] = append(topByCat[topic.CategoryID], topic)
		}
	}

	groups := make([]CategoryGroup, 0, len(cats))
	for _, cat := range cats {
		tops := topByCat[cat.id]
		if tops == nil {
			tops = []model.Topic{}
		}
		for i := range tops {
			if subs, exists := subtopicMap[tops[i].ID]; exists {
				tops[i].Subtopics = subs
			} else {
				tops[i].Subtopics = []model.Topic{}
			}
		}
		groups = append(groups, CategoryGroup{
			CategoryID:   cat.id,
			CategoryName: cat.name,
			Color:        cat.color,
			Position:     cat.position,
			Topics:       tops,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"groups": groups,
	})
}

type ReorderTopicsRequest struct {
	CategoryID string   `json:"category_id"`
	ParentID   *string  `json:"parent_id"`
	OrderedIDs []string `json:"ordered_ids"`
}

// Reorder rewrites positions 0..n-1 for one sibling set in a single transaction
func (h *TopicHandler) Reorder(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	var req ReorderTopicsRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	if req.CategoryID == "" || req.OrderedIDs == nil {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Category ID and ordered ID list are required")
	}
	if len(req.OrderedIDs) == 0 {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Ordered ID list cannot be empty")
	}
	if len(req.OrderedIDs) > 500 {
		return sendError(c, http.StatusBadRequest, "ORDER_MISMATCH", "Ordered ID list exceeds the 500 item limit")
	}
	if !isValidUUID(req.CategoryID) {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Category ID is not a valid UUID")
	}
	for _, id := range req.OrderedIDs {
		if !isValidUUID(id) {
			return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Ordered ID list contains an invalid UUID")
		}
	}
	seen := make(map[string]bool, len(req.OrderedIDs))
	for _, id := range req.OrderedIDs {
		if seen[id] {
			return sendError(c, http.StatusBadRequest, "ORDER_MISMATCH", "Ordered ID list contains duplicates")
		}
		seen[id] = true
	}

	// Normalize "" parent to nil, mirroring Create
	parentID := req.ParentID
	if parentID != nil && *parentID == "" {
		parentID = nil
	}
	if parentID != nil && !isValidUUID(*parentID) {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Parent ID is not a valid UUID")
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Database connection error")
	}
	defer tx.Rollback(ctx)

	// Verify category ownership (locks nothing yet; category rows are never reordered here)
	var categoryExists bool
	err = tx.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)",
		req.CategoryID, userID,
	).Scan(&categoryExists)
	if err != nil || !categoryExists {
		return sendError(c, http.StatusBadRequest, "INVALID_CATEGORY", "Target category does not exist or is unauthorized")
	}

	// Depth guard + parent validation: a parent must exist in this category
	// and must itself be top-level (nesting is exactly 2 levels)
	if parentID != nil {
		var grandParent *string
		err = tx.QueryRow(ctx,
			"SELECT parent_id FROM topics WHERE id = $1 AND user_id = $2 AND category_id = $3",
			*parentID, userID, req.CategoryID,
		).Scan(&grandParent)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return sendError(c, http.StatusBadRequest, "INVALID_PARENT_TOPIC", "Parent topic does not exist in this category")
			}
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to verify parent topic")
		}
		if grandParent != nil {
			return sendError(c, http.StatusBadRequest, "INVALID_PARENT_TOPIC", "Nesting is limited to subtopics (2 levels)")
		}
	}

	// Lock the sibling set; this read doubles as the exact-set-match validation
	var rows pgx.Rows
	if parentID != nil {
		rows, err = tx.Query(ctx,
			"SELECT id FROM topics WHERE user_id = $1 AND category_id = $2 AND parent_id IS NOT DISTINCT FROM $3 FOR UPDATE",
			userID, req.CategoryID, *parentID,
		)
	} else {
		rows, err = tx.Query(ctx,
			"SELECT id FROM topics WHERE user_id = $1 AND category_id = $2 AND parent_id IS NULL FOR UPDATE",
			userID, req.CategoryID,
		)
	}
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to lock topic order")
	}
	existing := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan topic row")
		}
		existing[id] = true
	}
	rows.Close()
	if rows.Err() != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to read topic order")
	}

	if len(existing) != len(req.OrderedIDs) {
		return sendError(c, http.StatusBadRequest, "ORDER_MISMATCH", "Ordered ID list does not match the existing topics")
	}
	for _, id := range req.OrderedIDs {
		if !existing[id] {
			// Covers cross-user, cross-category, cross-parent, and deleted ids
			// without revealing which one matched.
			return sendError(c, http.StatusNotFound, "TOPIC_NOT_FOUND", "Topic not found or unauthorized")
		}
	}

	_, err = tx.Exec(ctx,
		`UPDATE topics AS t SET position = u.ord, updated_at = NOW()
		 FROM unnest($1::uuid[], $2::int[]) WITH ORDINALITY AS u(id, ord)
		 WHERE t.id = u.id AND t.user_id = $3`,
		req.OrderedIDs, makeRange(len(req.OrderedIDs)), userID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to persist topic order")
	}

	if err := tx.Commit(ctx); err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to commit topic order")
	}

	// Re-read the sibling set in its new order so the client can replace
	// cache without refetching.
	outRows, err := h.pool.Query(ctx,
		`SELECT id, user_id, category_id, parent_id, title, status, confidence, notes_md, position, created_at, updated_at
		 FROM topics WHERE user_id = $1 AND category_id = $2 AND
			CASE WHEN $3::uuid IS NULL THEN parent_id IS NULL ELSE parent_id = $3::uuid END
		 ORDER BY position ASC, created_at ASC`,
		userID, req.CategoryID, parentID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to fetch updated order")
	}
	defer outRows.Close()

	updated := []model.Topic{}
	for outRows.Next() {
		var t model.Topic
		if err := outRows.Scan(
			&t.ID, &t.UserID, &t.CategoryID, &t.ParentID,
			&t.Title, &t.Status, &t.Confidence, &t.NotesMd, &t.Position,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to scan topic row")
		}
		t.Subtopics = []model.Topic{}
		updated = append(updated, t)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"topics": updated,
	})
}

// makeRange returns [0..n-1] for ordinality mapping in bulk reorder writes
func makeRange(n int) []int {
	r := make([]int, n)
	for i := range r {
		r[i] = i
	}
	return r
}
