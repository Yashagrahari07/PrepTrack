package db

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yash/preptrack-backend/internal/config"
)

func Connect(cfg *config.Config) *pgxpool.Pool {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("unable to parse database url: %v", err)
	}

	// Set connection pool limits suitable for serverless / small instances
	poolConfig.MaxConns = 10
	poolConfig.MinConns = 2
	poolConfig.MaxConnIdleTime = 15 * time.Minute

	// Never cache prepared statements by SQL text. Migrations that change column
	// types (e.g. INT -> NUMERIC) invalidate previously prepared plans, and
	// pooled connections holding them fail every subsequent execution with
	// "cached plan must not change result type" until they recycle.
	// CacheDescribe re-describes instead (proven safe across type changes in
	// pgx's own test suite), so DDL can never poison the pool.
	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeCacheDescribe

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		log.Fatalf("unable to create connection pool: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		log.Printf("warning: initial database ping failed: %v", err)
	} else {
		log.Println("connected to PostgreSQL database successfully")
	}

	return pool
}
