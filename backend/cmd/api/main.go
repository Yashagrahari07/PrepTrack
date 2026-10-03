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

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":      "healthy",
			"timestamp":   time.Now().Format(time.RFC3339),
			"environment": cfg.AppEnv,
		})
	})

	authH := handler.NewAuthHandler(pool, cfg)

	// Rate-limited public auth group (max 10 requests/min per IP)
	authGroup := e.Group("/api/auth", middleware.AuthRateLimiter())
	authGroup.POST("/signup", authH.Signup)
	authGroup.POST("/login", authH.Login)

	// Protected API group (JWT required)
	api := e.Group("/api", middleware.JWT(cfg))
	api.GET("/auth/me", authH.Me)

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
