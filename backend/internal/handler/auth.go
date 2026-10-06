package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"

	"github.com/yash/preptrack-backend/internal/config"
	"github.com/yash/preptrack-backend/internal/middleware"
	"github.com/yash/preptrack-backend/internal/model"
)

type AuthHandler struct {
	pool *pgxpool.Pool
	cfg  *config.Config
}

func NewAuthHandler(pool *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		pool: pool,
		cfg:  cfg,
	}
}

// Signup handles user registration with invite code validation
func (h *AuthHandler) Signup(c echo.Context) error {
	var req model.SignupRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)

	if req.DisplayName == "" || req.Email == "" || req.Password == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Display name, email, and password are required")
	}

	if len(req.Password) < 8 {
		return sendError(c, http.StatusBadRequest, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters long")
	}

	if req.InviteCode != h.cfg.InviteCode {
		return sendError(c, http.StatusBadRequest, "INVALID_INVITE_CODE", "Invalid invite code")
	}

	// Hash password with bcrypt (cost=12)
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "HASHING_FAILED", "Failed to secure password")
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "TRANSACTION_FAILED", "Database connection error")
	}
	defer tx.Rollback(ctx)

	var user model.User
	err = tx.QueryRow(ctx,
		`INSERT INTO users (display_name, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, email, display_name, created_at`,
		req.DisplayName, req.Email, string(hash),
	).Scan(&user.ID, &user.Email, &user.DisplayName, &user.CreatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // Unique constraint violation
			return sendError(c, http.StatusConflict, "EMAIL_ALREADY_EXISTS", "A user with this email already exists")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to create user account")
	}

	// Initialize user settings default row using DB defaults
	_, err = tx.Exec(ctx,
		`INSERT INTO user_settings (user_id)
		 VALUES ($1)
		 ON CONFLICT (user_id) DO NOTHING`,
		user.ID,
	)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to initialize user settings")
	}

	if err := tx.Commit(ctx); err != nil {
		return sendError(c, http.StatusInternalServerError, "TRANSACTION_COMMIT_FAILED", "Failed to complete signup transaction")
	}

	tokenStr, err := h.generateJWT(user.ID, user.Email)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "TOKEN_GENERATION_FAILED", "Failed to generate authentication token")
	}

	h.setAuthCookie(c, tokenStr)

	return c.JSON(http.StatusCreated, model.AuthResponse{
		Token: tokenStr,
		User:  user,
	})
}

// Login handles user authentication and JWT issuance
func (h *AuthHandler) Login(c echo.Context) error {
	var req model.LoginRequest
	if err := c.Bind(&req); err != nil {
		return sendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Email == "" || req.Password == "" {
		return sendError(c, http.StatusBadRequest, "MISSING_REQUIRED_FIELDS", "Email and password are required")
	}

	ctx := c.Request().Context()
	var user model.User
	var passwordHash string

	err := h.pool.QueryRow(ctx,
		`SELECT id, email, display_name, password_hash, created_at
		 FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.DisplayName, &passwordHash, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Database query failure")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return sendError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	tokenStr, err := h.generateJWT(user.ID, user.Email)
	if err != nil {
		return sendError(c, http.StatusInternalServerError, "TOKEN_GENERATION_FAILED", "Failed to generate authentication token")
	}

	h.setAuthCookie(c, tokenStr)

	return c.JSON(http.StatusOK, model.AuthResponse{
		Token: tokenStr,
		User:  user,
	})
}

// Logout clears the authentication HttpOnly cookie
func (h *AuthHandler) Logout(c echo.Context) error {
	cookie := &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	if h.cfg.AppEnv == "production" {
		cookie.Secure = true
		cookie.SameSite = http.SameSiteNoneMode
	}

	c.SetCookie(cookie)
	return c.JSON(http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

// Me retrieves current authenticated user profile
func (h *AuthHandler) Me(c echo.Context) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return sendError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing or invalid user identity in context")
	}

	ctx := c.Request().Context()
	var user model.User
	err := h.pool.QueryRow(ctx,
		`SELECT id, email, display_name, created_at
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.DisplayName, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sendError(c, http.StatusNotFound, "USER_NOT_FOUND", "User account not found")
		}
		return sendError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Database query failure")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

func (h *AuthHandler) setAuthCookie(c echo.Context, tokenStr string) {
	cookie := &http.Cookie{
		Name:     "token",
		Value:    tokenStr,
		Path:     "/",
		Expires:  time.Now().Add(time.Duration(h.cfg.JWTExpiryHrs) * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	if h.cfg.AppEnv == "production" {
		cookie.Secure = true
		cookie.SameSite = http.SameSiteNoneMode
	}

	c.SetCookie(cookie)
}

func (h *AuthHandler) generateJWT(userID, email string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Duration(h.cfg.JWTExpiryHrs) * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}

func sendError(c echo.Context, status int, code, message string) error {
	return c.JSON(status, model.ErrorResponse{
		Error: model.ErrorDetail{
			Code:    code,
			Message: message,
		},
	})
}
