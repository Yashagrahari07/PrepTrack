package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"

	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type DashboardHandler struct {
	pool *pgxpool.Pool
}

func NewDashboardHandler(pool *pgxpool.Pool) *DashboardHandler {
	return &DashboardHandler{pool: pool}
}

// Get aggregates dashboard metrics using concurrent errgroup execution
func (h *DashboardHandler) Get(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()
	g, gCtx := errgroup.WithContext(ctx)

	var streakDays int
	var weeklyHours float64
	var weeklyTargetHours float64 = 15.0
	var revisionsDueCount int
	var focusTopic *model.Topic
	var categoryProgress []model.CategoryProgressItem
	var heatmap []model.HeatmapItem

	// 1. Streak Calculation
	g.Go(func() error {
		rows, err := h.pool.Query(gCtx,
			`SELECT TO_CHAR(logged_on, 'YYYY-MM-DD'), SUM(minutes)
			 FROM study_logs
			 WHERE user_id = $1 AND logged_on >= CURRENT_DATE - INTERVAL '90 days'
			 GROUP BY logged_on
			 HAVING SUM(minutes) >= 30
			 ORDER BY logged_on DESC`,
			userID,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		activeDates := make(map[string]bool)
		for rows.Next() {
			var dateStr string
			var total int
			if err := rows.Scan(&dateStr, &total); err == nil {
				activeDates[dateStr] = true
			}
		}

		// Calculate streak walking backward from today
		today := time.Now()
		current := today
		streak := 0
		restDaysUsed := 0

		for i := 0; i < 90; i++ {
			dateKey := current.Format("2006-01-02")
			if activeDates[dateKey] {
				streak++
			} else {
				// Allow 1 rest day per 7-day window if study occurred before
				if i > 0 && restDaysUsed == 0 {
					restDaysUsed++
				} else if i == 0 {
					// Today hasn't ended yet; check if yesterday was active
					current = current.AddDate(0, 0, -1)
					continue
				} else {
					break
				}
			}
			current = current.AddDate(0, 0, -1)
		}

		streakDays = streak
		return nil
	})

	// 2. Weekly Hours
	g.Go(func() error {
		return h.pool.QueryRow(gCtx,
			`SELECT COALESCE(SUM(minutes), 0) / 60.0
			 FROM study_logs
			 WHERE user_id = $1 AND logged_on >= CURRENT_DATE - INTERVAL '6 days'`,
			userID,
		).Scan(&weeklyHours)
	})

	// 3. User Settings (Weekly Target)
	g.Go(func() error {
		err := h.pool.QueryRow(gCtx,
			"SELECT weekly_target_hours FROM user_settings WHERE user_id = $1",
			userID,
		).Scan(&weeklyTargetHours)
		if errors.Is(err, pgx.ErrNoRows) {
			weeklyTargetHours = 15.0
			return nil
		}
		return err
	})

	// 4. Revisions Due Count
	g.Go(func() error {
		return h.pool.QueryRow(gCtx,
			"SELECT COUNT(*) FROM revisions WHERE user_id = $1 AND due_on <= CURRENT_DATE AND done_on IS NULL",
			userID,
		).Scan(&revisionsDueCount)
	})

	// 5. Today's Recommended Focus Topic (lowest confidence IN_PROGRESS or NOT_STARTED)
	g.Go(func() error {
		var topic model.Topic
		err := h.pool.QueryRow(gCtx,
			`SELECT t.id, t.user_id, t.category_id, cat.name as category_name, t.parent_id,
			        t.title, t.status, t.confidence, t.notes_md, t.position, t.created_at, t.updated_at,
			        (SELECT COUNT(*) FROM resources r WHERE r.topic_id = t.id) as resource_count
			 FROM topics t
			 JOIN categories cat ON cat.id = t.category_id
			 WHERE t.user_id = $1 AND t.status IN ('IN_PROGRESS', 'NOT_STARTED')
			 ORDER BY CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 2 END, t.confidence ASC, t.position ASC
			 LIMIT 1`,
			userID,
		).Scan(
			&topic.ID, &topic.UserID, &topic.CategoryID, &topic.CategoryName, &topic.ParentID,
			&topic.Title, &topic.Status, &topic.Confidence, &topic.NotesMd, &topic.Position,
			&topic.CreatedAt, &topic.UpdatedAt, &topic.ResourceCount,
		)
		if err == nil {
			topic.Subtopics = []model.Topic{}
			focusTopic = &topic
		}
		return nil
	})

	// 6. Category Progress Breakdown
	g.Go(func() error {
		rows, err := h.pool.Query(gCtx,
			`SELECT c.id, c.name, c.color,
			        COUNT(t.id) as total,
			        COUNT(CASE WHEN t.status IN ('LEARNED', 'INTERVIEW_READY') THEN 1 END) as learned,
			        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
			        COUNT(CASE WHEN t.status = 'NOT_STARTED' THEN 1 END) as not_started
			 FROM categories c
			 LEFT JOIN topics t ON t.category_id = c.id
			 WHERE c.user_id = $1
			 GROUP BY c.id, c.name, c.color, c.position
			 ORDER BY c.position ASC`,
			userID,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		items := []model.CategoryProgressItem{}
		for rows.Next() {
			var item model.CategoryProgressItem
			if err := rows.Scan(&item.CategoryID, &item.CategoryName, &item.Color, &item.TotalTopics, &item.Learned, &item.InProgress, &item.NotStarted); err == nil {
				items = append(items, item)
			}
		}
		categoryProgress = items
		return nil
	})

	// 7. 84-Day Activity Heatmap
	g.Go(func() error {
		rows, err := h.pool.Query(gCtx,
			`SELECT TO_CHAR(d.day, 'YYYY-MM-DD') as date,
			        COALESCE(SUM(s.minutes), 0)::int as minutes
			 FROM generate_series(CURRENT_DATE - INTERVAL '83 days', CURRENT_DATE, '1 day'::interval) d(day)
			 LEFT JOIN study_logs s ON s.logged_on = d.day AND s.user_id = $1
			 GROUP BY d.day
			 ORDER BY d.day ASC`,
			userID,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		items := []model.HeatmapItem{}
		for rows.Next() {
			var item model.HeatmapItem
			if err := rows.Scan(&item.Date, &item.Minutes); err == nil {
				items = append(items, item)
			}
		}
		heatmap = items
		return nil
	})

	if err := g.Wait(); err != nil {
		return sendError(c, http.StatusInternalServerError, "DASHBOARD_QUERY_FAILED", "Failed to aggregate dashboard metrics")
	}

	if categoryProgress == nil {
		categoryProgress = []model.CategoryProgressItem{}
	}
	if heatmap == nil {
		heatmap = []model.HeatmapItem{}
	}

	return c.JSON(http.StatusOK, model.DashboardResponse{
		StreakDays:        streakDays,
		WeeklyHours:       weeklyHours,
		WeeklyTargetHours: weeklyTargetHours,
		RevisionsDueCount: revisionsDueCount,
		FocusTopic:        focusTopic,
		CategoryProgress:  categoryProgress,
		Heatmap:           heatmap,
	})
}
