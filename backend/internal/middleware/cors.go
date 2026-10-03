package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/yash/preptrack-backend/internal/config"
)

func CORS(cfg *config.Config) echo.MiddlewareFunc {
	origins := []string{cfg.AllowedOrigin}
	if cfg.AppEnv == "development" {
		origins = append(origins, "http://localhost:5173", "http://127.0.0.1:5173")
	}

	return echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins:     origins,
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowCredentials: true,
	})
}
