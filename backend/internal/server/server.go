package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"zero-trust-access-platform/backend/internal/awsroles"
	"zero-trust-access-platform/backend/internal/awssts"
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

func (s *Server) routes(mux *http.ServeMux) {
	// public
	mux.HandleFunc("/health", s.cors(s.handleHealth))
	mux.HandleFunc("/auth/signup", s.cors(s.handleSignup))
	mux.HandleFunc("/auth/login", s.cors(s.handleLogin))

	// protected: users
	mux.HandleFunc("/users",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleListUsers),
		),
	)

	mux.HandleFunc("/users/",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleUpdateUserRole)),
		),
	)

	// protected: resources
	mux.HandleFunc("/resources",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleListResources),
		),
	)

	// per-user activity feed
	mux.HandleFunc("/me/activity",
		s.cors(
			middleware.Auth(s.jwtSecret, s.handleMyActivity),
		),
	)

	// admin log viewer
	mux.HandleFunc("/admin/logs",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleListLogs)),
		),
	)

	// ---------- NEW: Admin Policies ----------
	mux.HandleFunc("/admin/policies/aws-roles",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleAwsRolePolicies)),
		),
	)

	// ---------- NEW: Audit stats for chart ----------
	mux.HandleFunc("/admin/audit/stats",
		s.cors(
			middleware.Auth(s.jwtSecret, s.requireAdmin(s.handleAuditStats)),
		),
	)

	// MFA routes
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

	// ---------- AWS multi-account roles ----------

	// STS client used to assume any allowed role.
	stsSvc, err := awssts.NewService(context.Background())
	if err != nil {
		log.Fatalf("failed to init AWS STS: %v", err)
	}

	// Repository for aws_roles + user_aws_roles.
	awsRepo := awsroles.NewRepository(s.db)

	// Handler that exposes:
	//  - GET  /me/aws/roles
	//  - POST /me/aws/roles/{id}/session
	awsHandler := awshandlers.NewAwsRolesHandler(awsRepo, stsSvc, s.db)

	mux.HandleFunc("/me/aws/roles",
		s.cors(
			middleware.Auth(s.jwtSecret, awsHandler.ListMyAwsRoles),
		),
	)

	// Uses path parsing inside CreateAwsSession to extract {id}.
	mux.HandleFunc("/me/aws/roles/",
		s.cors(
			middleware.Auth(s.jwtSecret, awsHandler.CreateAwsSession),
		),
	)
}

// ---------- NEW: Admin Policies Handler ----------
// ---------- NEW: Admin Policies Handler ----------
// ---------- NEW: Admin Policies Handler ----------
func (s *Server) handleAwsRolePolicies(w http.ResponseWriter, r *http.Request) {
	awsRepo := awsroles.NewRepository(s.db)

	// Hardcoded app role mappings (for demo - matches your repo logic)
	appRoles := []string{"admin", "user", "devops"}

	// Local response shape; no dependency on handler package
	type roleDTO struct {
		ID          int64  `json:"id"`
		Name        string `json:"name"`
		Env         string `json:"env"`
		RiskLevel   string `json:"risk_level"`
		Description string `json:"description"`
	}

	policies := make(map[string][]roleDTO)

	for _, appRole := range appRoles {
		roles, err := awsRepo.ListForAppRole(r.Context(), appRole)
		if err != nil {
			http.Error(w, "failed to list roles for app role", http.StatusInternalServerError)
			return
		}

		out := make([]roleDTO, 0, len(roles))
		for _, role := range roles {
			out = append(out, roleDTO{
				ID:          role.ID,
				Name:        role.Name,
				Env:         role.Env,
				RiskLevel:   string(role.RiskLevel),
				Description: role.Description,
			})
		}

		policies[appRole] = out
	}

	s.writeJSON(w, http.StatusOK, policies)
}

// ---------- NEW: Audit Stats for Chart ----------
// NEW: Audit Stats for Chart
func (s *Server) handleAuditStats(w http.ResponseWriter, r *http.Request) {
	type statRow struct {
		Decision string `json:"decision"`
		Count    int    `json:"count"`
	}

	rows, err := s.db.Query(`
        SELECT decision, COUNT(*) as count
        FROM access_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY decision
    `)
	if err != nil {
		http.Error(w, "failed to fetch audit stats", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var stats []statRow
	for rows.Next() {
		var sRow statRow
		if err := rows.Scan(&sRow.Decision, &sRow.Count); err != nil {
			http.Error(w, "failed to scan audit stats", http.StatusInternalServerError)
			return
		}
		stats = append(stats, sRow)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read audit stats", http.StatusInternalServerError)
		return
	}

	s.writeJSON(w, http.StatusOK, stats)
}

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

func (s *Server) cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")

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

func (s *Server) Run() error {
	mux := http.NewServeMux()
	s.routes(mux)

	addr := fmt.Sprintf(":%s", s.cfg.AppPort)
	log.Printf("listening on %s", addr)
	return http.ListenAndServe(addr, mux)
}

func (s *Server) writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
