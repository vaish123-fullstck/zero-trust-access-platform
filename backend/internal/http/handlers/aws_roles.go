package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"zero-trust-access-platform/backend/internal/awsroles"
	"zero-trust-access-platform/backend/internal/awssts"
	"zero-trust-access-platform/backend/internal/middleware"
)

type AwsRolesHandler struct {
	Repo *awsroles.Repository
	STS  *awssts.Service
}

func NewAwsRolesHandler(repo *awsroles.Repository, stsSvc *awssts.Service) *AwsRolesHandler {
	return &AwsRolesHandler{
		Repo: repo,
		STS:  stsSvc,
	}
}

type awsRoleResponse struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Env         string `json:"env"`
	RiskLevel   string `json:"risk_level"`
	Description string `json:"description"`
}

// GET /me/aws/roles
func (h *AwsRolesHandler) ListMyAwsRoles(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	roles, err := h.Repo.ListForUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to list aws roles", http.StatusInternalServerError)
		return
	}

	out := make([]awsRoleResponse, 0, len(roles))
	for _, role := range roles {
		out = append(out, awsRoleResponse{
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
func (h *AwsRolesHandler) CreateAwsSession(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Expect /me/aws/roles/{id}/session
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 5 || parts[0] != "me" || parts[1] != "aws" || parts[2] != "roles" || parts[4] != "session" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	roleIDStr := parts[3]
	roleID, err := strconv.ParseInt(roleIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	role, err := h.Repo.GetForUser(r.Context(), userID, roleID)
	if err != nil {
		http.Error(w, "role not found", http.StatusNotFound)
		return
	}

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

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"url": consoleURL,
	})
}
