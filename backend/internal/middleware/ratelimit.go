package middleware

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/yash/preptrack-backend/internal/model"
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
			return ctx.JSON(http.StatusTooManyRequests, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "RATE_LIMIT_EXCEEDED",
					Message: "Too many authentication requests. Please try again in a few minutes.",
				},
			})
		},
		DenyHandler: func(ctx echo.Context, identifier string, err error) error {
			return ctx.JSON(http.StatusTooManyRequests, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "RATE_LIMIT_EXCEEDED",
					Message: "Too many authentication requests. Please try again in a few minutes.",
				},
			})
		},
	}

	return echomw.RateLimiterWithConfig(config)
}
