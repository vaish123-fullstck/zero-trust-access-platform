package db

import (
	"database/sql"
	"fmt"

	"zero-trust-access-platform/backend/internal/config"

	_ "github.com/lib/pq"
)

func Open(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
	)

	// DEBUG: print DSN parts (no password)
	fmt.Println("DB DSN DEBUG:",
		"host="+cfg.DBHost,
		"port="+cfg.DBPort,
		"user="+cfg.DBUser,
		"dbname="+cfg.DBName,
	)

	return sql.Open("postgres", dsn)
}
