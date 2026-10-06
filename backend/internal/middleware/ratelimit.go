package middleware

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
)

// AuthRateLimiter limits sensitive auth operations (signup, login) to 10 requests per minute per IP
func AuthRateLimiter() echo.MiddlewareFunc {
	config := echomw.RateLimiterConfig{
		Skipper: echomw.DefaultSkipper,
		Store: echomw.NewRateLimiterMemoryStoreWithConfig(
			echomw.RateLimiterMemoryStoreConfig{
				Rate:      10,              // 10 requests
				Burst:     10,              // burst capacity
				ExpiresIn: 3 * time.Minute, // cleanup inactive IP entries
			},
		),
		IdentifierExtractor: func(ctx echo.Context) (string, error) {
			return ctx.RealIP(), nil
		},
		ErrorHandler: func(ctx echo.Context, err error) error {
			ctx.Response().Header().Set("Retry-After", "60")
			return ctx.JSON(http.StatusTooManyRequests, map[string]interface{}{
				"error": map[string]interface{}{
					"code":       "RATE_LIMIT_EXCEEDED",
					"message":    "Too many requests. Please try again in 60 seconds.",
					"retryAfter": 60,
				},
			})
		},
		DenyHandler: func(ctx echo.Context, identifier string, err error) error {
			ctx.Response().Header().Set("Retry-After", "60")
			return ctx.JSON(http.StatusTooManyRequests, map[string]interface{}{
				"error": map[string]interface{}{
					"code":       "RATE_LIMIT_EXCEEDED",
					"message":    "Too many requests. Please try again in 60 seconds.",
					"retryAfter": 60,
				},
			})
		},
	}

	return echomw.RateLimiterWithConfig(config)
}
