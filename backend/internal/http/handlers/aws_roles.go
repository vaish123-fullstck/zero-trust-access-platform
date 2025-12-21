package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"zero-trust-access-platform/backend/internal/awsroles"
	"zero-trust-access-platform/backend/internal/awssts"
	"zero-trust-access-platform/backend/internal/middleware"
)

// AwsRolesHandler exposes APIs for listing AWS roles available
// to the current user and creating console sessions for them.
type AwsRolesHandler struct {
	Repo *awsroles.Repository
	STS  *awssts.Service
	DB   *sql.DB
}

func NewAwsRolesHandler(repo *awsroles.Repository, stsSvc *awssts.Service, db *sql.DB) *AwsRolesHandler {
	return &AwsRolesHandler{
		Repo: repo,
		STS:  stsSvc,
		DB:   db,
	}
}

type AwsRoleResponse struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Env         string `json:"env"`
	RiskLevel   string `json:"risk_level"`
	Description string `json:"description"`
}

// GET /me/aws/roles
// Returns the list of AWS roles this user is allowed to assume,
// based on their application role (middleware.UserRole).
func (h *AwsRolesHandler) ListMyAwsRoles(w http.ResponseWriter, r *http.Request) {
	appRole, ok := middleware.UserRole(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	roles, err := h.Repo.ListForAppRole(r.Context(), appRole)
	if err != nil {
		http.Error(w, "failed to list aws roles", http.StatusInternalServerError)
		return
	}

	out := make([]AwsRoleResponse, 0, len(roles))
	for _, role := range roles {
		out = append(out, AwsRoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			Env:         role.Env,
			RiskLevel:   string(role.RiskLevel),
			Description: role.Description,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

// POST /me/aws/roles/{id}/session
// Creates a federated AWS console URL for the specified role,
// only if that role is allowed for the current user's app role.
func (h *AwsRolesHandler) CreateAwsSession(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	appRole, ok := middleware.UserRole(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Expect path: /me/aws/roles/{id}/session
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 5 || parts[0] != "me" || parts[1] != "aws" || parts[2] != "roles" || parts[4] != "session" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	roleIDStr := parts[3]
	roleID, err := strconv.ParseInt(roleIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	// Ensure this role is actually allowed for this app role.
	role, err := h.Repo.GetForAppRole(r.Context(), appRole, roleID)
	if err != nil {
		// Could be sql.ErrNoRows or other error; treat as not found for security.
		http.Error(w, "role not found", http.StatusNotFound)
		return
	}

	// Create a federated console URL via STS.
	consoleURL, err := h.STS.AssumeRoleAndConsoleURL(
		r.Context(),
		role.ARN,
		fmt.Sprintf("zt-%d-%d", userID, role.ID),
		int32(3600),
	)
	if err != nil {
		http.Error(w, "failed to create aws session", http.StatusInternalServerError)
		return
	}

	// Log activity into access_logs (best-effort; ignore errors).
	if h.DB != nil {
		_, _ = h.DB.Exec(`
			INSERT INTO access_logs (user_id, role, resource_name, action, decision, path, method, ip)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`,
			userID,
			appRole,
			role.Name,        // resource_name
			"create_session", // action
			"allow",          // decision
			r.URL.Path,
			r.Method,
			r.RemoteAddr,
		)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"url": consoleURL,
	})
}
