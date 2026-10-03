package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	JWTExpiryHrs  int
	InviteCode    string
	AllowedOrigin string
	AppEnv        string
}

func Load() *Config {
	_ = godotenv.Load(".env") // OK to fail in production (vars set via platform env)

	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   mustEnv("DATABASE_URL"),
		JWTSecret:     mustEnv("JWT_SECRET"),
		InviteCode:    mustEnv("INVITE_CODE"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		AppEnv:        getEnv("APP_ENV", "development"),
	}

	hrs, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "168"))
	if err != nil {
		hrs = 168
	}
	cfg.JWTExpiryHrs = hrs
	return cfg
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %q is missing", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
