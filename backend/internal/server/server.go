package server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"zero-trust-access-platform/backend/internal/awsroles"
	"zero-trust-access-platform/backend/internal/config"
	awshandlers "zero-trust-access-platform/backend/internal/http/handlers"
	"zero-trust-access-platform/backend/internal/middleware"
)

type Server struct {
	cfg       *config.Config
	db        *sql.DB
	jwtSecret []byte
}

type healthResponse struct {
	Status string `json:"status"`
	Env    string `json:"env"`
	Time   string `json:"time"`
}

func New(cfg *config.Config, db *sql.DB, jwtSecret []byte) *Server {
	return &Server{
		cfg:       cfg,
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// routes now takes a mux instead of using the default
func (s *Server) routes(mux *http.ServeMux) {
	// public
	mux.HandleFunc("/health", s.cors(s.handleHealth))
	mux.HandleFunc("/auth/signup", s.cors(s.handleSignup))
	mux.HandleFunc("/auth/login", s.cors(s.handleLogin))

	// protected
	mux.HandleFunc("/users",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleListUsers),
		),
	)

	// /users/{id}/role for admins
	mux.HandleFunc("/users/",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleUpdateUserRole)),
		),
	)

	mux.HandleFunc("/resources",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleListResources),
		),
	)

	mux.HandleFunc("/admin/logs",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleListLogs)),
		),
	)

	// MFA routes (authenticated)
	mux.HandleFunc("/auth/mfa/enroll",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleMFAEnroll),
		),
	)
	mux.HandleFunc("/auth/mfa/verify",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleMFAVerify),
		),
	)

	// AWS roles (authenticated)
	awsRepo := awsroles.NewRepository(s.db)
	awsHandler := awshandlers.NewAwsRolesHandler(awsRepo)

	mux.HandleFunc("/me/aws/roles",
		s.cors(
			middleware.Auth(s.jwtSecret, awsHandler.ListMyAwsRoles),
		),
	)
}

// requireAdmin ensures only admin role can access wrapped handlers
func (s *Server) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role, _ := middleware.UserRole(r)
		if role != "admin" {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	}
}

// basic CORS wrapper for now
func (s *Server) cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	resp := healthResponse{
		Status: "ok",
		Env:    s.cfg.AppEnv,
		Time:   time.Now().UTC().Format(time.RFC3339),
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

// Run using an explicit mux
func (s *Server) Run() error {
	mux := http.NewServeMux()
	s.routes(mux)

	addr := fmt.Sprintf(":%s", s.cfg.AppPort)
	log.Printf("listening on %s", addr)
	return http.ListenAndServe(addr, mux)
}

// shared JSON writer
func (s *Server) writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
