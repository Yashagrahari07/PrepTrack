package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/yash/preptrack-backend/internal/config"
	"github.com/yash/preptrack-backend/internal/db"
	"github.com/yash/preptrack-backend/internal/handler"
	"github.com/yash/preptrack-backend/internal/middleware"
)

func main() {
	cfg := config.Load()
	pool := db.Connect(cfg)
	defer pool.Close()

	e := echo.New()
	e.HideBanner = true

	// Global middleware
	e.Use(echomw.Logger())
	e.Use(echomw.Recover())
	e.Use(middleware.CORS(cfg))

	// Root endpoint for platform probes hitting / (Render health checks).
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"service":     "preptrack-api",
			"status":      "healthy",
			"timestamp":   time.Now().Format(time.RFC3339),
			"environment": cfg.AppEnv,
		})
	})

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":      "healthy",
			"timestamp":   time.Now().Format(time.RFC3339),
			"environment": cfg.AppEnv,
		})
	})

	authH := handler.NewAuthHandler(pool, cfg)
	settingsH := handler.NewSettingsHandler(pool)
	catH := handler.NewCategoryHandler(pool)
	topicH := handler.NewTopicHandler(pool)
	resH := handler.NewResourceHandler(pool)
	logH := handler.NewStudyLogHandler(pool)
	dashH := handler.NewDashboardHandler(pool)
	revH := handler.NewRevisionHandler(pool)
	statsH := handler.NewStatsHandler(pool)

	// Rate-limited public auth group (max 10 requests/min per IP)
	authGroup := e.Group("/api/auth", middleware.AuthRateLimiter())
	authGroup.POST("/signup", authH.Signup)
	authGroup.POST("/login", authH.Login)
	authGroup.POST("/logout", authH.Logout)

	// Protected API group (JWT required)
	api := e.Group("/api", middleware.JWT(cfg))
	api.GET("/auth/me", authH.Me)
	api.POST("/auth/logout", authH.Logout)

	// User Settings routes
	api.GET("/settings", settingsH.Get)
	api.PATCH("/settings", settingsH.Update)

	// Dashboard route
	api.GET("/dashboard", dashH.Get)

	// Revisions routes
	api.GET("/revisions/due", revH.ListDue)
	api.POST("/revisions/:id/complete", revH.Complete)

	// Stats route
	api.GET("/stats", statsH.Get)

	// Categories routes
	api.GET("/categories", catH.List)
	api.POST("/categories", catH.Create)
	api.PATCH("/categories/:id", catH.Update)
	api.DELETE("/categories/:id", catH.Delete)

	// Topics routes
	api.GET("/categories/:id/topics", topicH.ListByCategory)
	api.GET("/topics/:id", topicH.Get)
	api.POST("/topics", topicH.Create)
	api.PATCH("/topics/:id", topicH.Update)
	api.DELETE("/topics/:id", topicH.Delete)

	// Resources routes
	api.GET("/topics/:id/resources", resH.List)
	api.POST("/topics/:id/resources", resH.Create)
	api.PATCH("/resources/:id", resH.Update)
	api.DELETE("/resources/:id", resH.Delete)

	// Study Logs routes
	api.GET("/topics/:id/logs", logH.ListByTopic)
	api.POST("/study-logs", logH.Create)

	// Base API test route
	api.GET("/ping", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "pong",
		})
	})

	// Graceful shutdown handling
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		log.Printf("starting PrepTrack API server on port :%s (env: %s)", cfg.Port, cfg.AppEnv)
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("shutting down server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down server gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	log.Println("server exited cleanly")
}
