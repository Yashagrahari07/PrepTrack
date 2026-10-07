package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// downMarker separates the UP section from the DOWN section in a migration file.
const downMarker = "-- DOWN"

// splitMigration returns the UP section (before the marker) and the DOWN
// section (after it). Files without a marker are treated as UP-only.
func splitMigration(sql string) (up, down string, hasDown bool) {
	idx := strings.Index(sql, downMarker)
	if idx == -1 {
		return sql, "", false
	}
	return sql[:idx], sql[idx+len(downMarker):], true
}

func main() {
	_ = godotenv.Load(".env")
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	// Parse command: "up" (default) or "down"
	action := "up"
	if len(os.Args) > 1 {
		action = os.Args[1]
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Read all migration files in order
	files, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		log.Fatalf("failed to list migration files: %v", err)
	}
	sort.Strings(files)

	switch action {
	case "up":
		runUpMigrations(ctx, pool, files)
	case "down":
		if len(files) == 0 {
			log.Fatal("no migration files found")
		}
		// Rollback the LAST migration file (highest alphabetical = latest)
		lastFile := files[len(files)-1]
		runDownMigration(ctx, pool, lastFile)
	default:
		log.Fatalf("unknown command: %s (use 'up' or 'down')", action)
	}
}

func runUpMigrations(ctx context.Context, pool *pgxpool.Pool, files []string) {
	for _, file := range files {
		sqlBytes, err := os.ReadFile(file)
		if err != nil {
			log.Fatalf("failed to read %s: %v", file, err)
		}

		// Execute ONLY the UP section. Running the whole file would also
		// execute the DOWN section and silently undo the migration.
		up, _, _ := splitMigration(string(sqlBytes))

		fmt.Printf("🚀 Executing database migration (%s)...\n", filepath.Base(file))
		_, err = pool.Exec(ctx, up)
		if err != nil {
			log.Fatalf("❌ Migration failed for %s: %v", file, err)
		}
		fmt.Printf("✅ Migration %s applied successfully!\n", filepath.Base(file))
	}
}

func runDownMigration(ctx context.Context, pool *pgxpool.Pool, file string) {
	sqlBytes, err := os.ReadFile(file)
	if err != nil {
		log.Fatalf("failed to read %s: %v", file, err)
	}

	_, downSQL, hasDown := splitMigration(string(sqlBytes))
	if !hasDown {
		log.Fatalf("❌ No '-- DOWN' section found in %s", filepath.Base(file))
	}

	fmt.Printf("⏪ Rolling back migration (%s)...\n", filepath.Base(file))
	_, err = pool.Exec(ctx, downSQL)
	if err != nil {
		log.Fatalf("❌ Rollback failed for %s: %v", filepath.Base(file), err)
	}
	fmt.Printf("✅ Migration %s rolled back successfully!\n", filepath.Base(file))
}
