package main

import (
	"log"

	"zero-trust-access-platform/backend/internal/config"
	"zero-trust-access-platform/backend/internal/db"
	"zero-trust-access-platform/backend/internal/server"
)

func main() {
	cfg := config.Load()

	database, err := db.Open(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	srv := server.New(cfg, database, []byte(cfg.JWTSecret))

	if err := srv.Run(); err != nil {
		log.Fatal(err)
	}
}
