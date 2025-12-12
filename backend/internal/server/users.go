package server

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"zero-trust-access-platform/backend/internal/models"
)

// GET /users
func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := s.db.Query(`
		SELECT id, email, full_name, role, created_at
		FROM users
		ORDER BY id
	`)
	if err != nil {
		http.Error(w, "failed to query users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []models.User

	for rows.Next() {
		var u models.User
		var createdAt time.Time

		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &createdAt); err != nil {
			http.Error(w, "failed to scan user", http.StatusInternalServerError)
			return
		}
		u.CreatedAt = createdAt
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "users rows error", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(users)
}

type updateRoleRequest struct {
	Role string `json:"role"`
}

// PATCH /users/{id}/role  (admin only, route is in server.go)
func (s *Server) handleUpdateUserRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Expect /users/{id}/role
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 3 || parts[0] != "users" || parts[2] != "role" {
		http.NotFound(w, r)
		return
	}

	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	var req updateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.Role != "user" && req.Role != "admin" {
		http.Error(w, "invalid role", http.StatusBadRequest)
		return
	}

	_, err = s.db.Exec(`UPDATE users SET role = $1 WHERE id = $2`, req.Role, id)
	if err != nil {
		http.Error(w, "failed to update role", http.StatusInternalServerError)
		return
	}

	var u models.User
	var createdAt time.Time
	err = s.db.QueryRow(
		`SELECT id, email, full_name, role, created_at
		 FROM users
		 WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &createdAt)
	if err != nil {
		http.Error(w, "failed to load user", http.StatusInternalServerError)
		return
	}
	u.CreatedAt = createdAt

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(u)
}
