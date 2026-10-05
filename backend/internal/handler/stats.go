package handler

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"

	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type StatsHandler struct {
	pool *pgxpool.Pool
}

func NewStatsHandler(pool *pgxpool.Pool) *StatsHandler {
	return &StatsHandler{pool: pool}
}

// Get aggregates extended analytics and historical charts
func (h *StatsHandler) Get(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing user identity in context")
	}

	ctx := c.Request().Context()
	g, gCtx := errgroup.WithContext(ctx)

	var totalLoggedMinutes int
	var totalSessions int
	var weeklyChart []model.WeeklyChartItem
	var topTopics []model.TopTopicItem
	var heatmap []model.HeatmapItem

	// 1. All-time Totals
	g.Go(func() error {
		return h.pool.QueryRow(gCtx,
			`SELECT COALESCE(SUM(minutes), 0)::int, COUNT(*)::int
			 FROM study_logs WHERE user_id = $1`,
			userID,
		).Scan(&totalLoggedMinutes, &totalSessions)
	})

	// 2. Weekly Hours Chart (Last 8 Weeks)
	g.Go(func() error {
		rows, err := h.pool.Query(gCtx,
			`SELECT TO_CHAR(DATE_TRUNC('week', logged_on), 'YYYY-MM-DD') as week_start,
			        COALESCE(SUM(minutes), 0) / 60.0 as hours
			 FROM study_logs
			 WHERE user_id = $1 AND logged_on >= CURRENT_DATE - INTERVAL '8 weeks'
			 GROUP BY DATE_TRUNC('week', logged_on)
			 ORDER BY week_start ASC`,
			userID,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		items := []model.WeeklyChartItem{}
		for rows.Next() {
			var item model.WeeklyChartItem
			if err := rows.Scan(&item.WeekStart, &item.Hours); err == nil {
				items = append(items, item)
			}
		}
		weeklyChart = items
		return nil
	})

	// 3. Top 10 Topics by Logged Minutes
	g.Go(func() error {
		rows, err := h.pool.Query(gCtx,
			`SELECT t.id, t.title, cat.name as category_name, SUM(s.minutes)::int as total_minutes
			 FROM study_logs s
			 JOIN topics t ON t.id = s.topic_id
			 JOIN categories cat ON cat.id = t.category_id
			 WHERE s.user_id = $1
			 GROUP BY t.id, t.title, cat.name
			 ORDER BY total_minutes DESC
			 LIMIT 10`,
			userID,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		items := []model.TopTopicItem{}
		for rows.Next() {
			var item model.TopTopicItem
			if err := rows.Scan(&item.TopicID, &item.TopicTitle, &item.CategoryName, &item.TotalMinutes); err == nil {
				items = append(items, item)
			}
		}
		topTopics = items
		return nil
	})

	// 4. 84-Day Activity Heatmap
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
		return sendError(c, http.StatusInternalServerError, "STATS_QUERY_FAILED", "Failed to aggregate analytics data")
	}

	if weeklyChart == nil {
		weeklyChart = []model.WeeklyChartItem{}
	}
	if topTopics == nil {
		topTopics = []model.TopTopicItem{}
	}
	if heatmap == nil {
		heatmap = []model.HeatmapItem{}
	}

	return c.JSON(http.StatusOK, model.StatsResponse{
		TotalLoggedMinutes: totalLoggedMinutes,
		TotalSessions:      totalSessions,
		WeeklyHoursChart:   weeklyChart,
		TopTopics:          topTopics,
		Heatmap:           heatmap,
	})
}
