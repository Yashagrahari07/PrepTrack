package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/yash/preptrack-backend/internal/config"
	"github.com/yash/preptrack-backend/internal/model"
)

const UserIDContextKey = "user_id"

// JWT returns a middleware that validates JWT Bearer tokens in the Authorization header
func JWT(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Error: model.ErrorDetail{
						Code:    "MISSING_TOKEN",
						Message: "Missing or invalid authorization header",
					},
				})
			}
			tokenStr := strings.TrimPrefix(header, "Bearer ")

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, c.JSON(http.StatusUnauthorized, model.ErrorResponse{
						Error: model.ErrorDetail{
							Code:    "INVALID_SIGNING_METHOD",
							Message: "Unexpected token signing method",
						},
					})
				}
				return []byte(cfg.JWTSecret), nil
			})
			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Error: model.ErrorDetail{
						Code:    "INVALID_TOKEN",
						Message: "Token is invalid or expired",
					},
				})
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Error: model.ErrorDetail{
						Code:    "INVALID_CLAIMS",
						Message: "Invalid token payload structure",
					},
				})
			}

			userID, ok := claims["user_id"].(string)
			if !ok || userID == "" {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Error: model.ErrorDetail{
						Code:    "INVALID_USER_ID",
						Message: "Token does not contain a valid user identity",
					},
				})
			}

			c.Set(UserIDContextKey, userID)
			return next(c)
		}
	}
}

// GetUserID extracts the user_id from Echo context set by JWT middleware
func GetUserID(c echo.Context) (string, bool) {
	uid, ok := c.Get(UserIDContextKey).(string)
	if !ok || uid == "" {
		return "", false
	}
	return uid, true
}
