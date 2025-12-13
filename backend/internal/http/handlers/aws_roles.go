// internal/http/handlers/aws_roles.go

package handlers

import (
	"encoding/json"
	"net/http"
	"zero-trust-access-platform/backend/internal/auth"
	"zero-trust-access-platform/backend/internal/awsroles"
)

type AwsRolesHandler struct {
	Repo *awsroles.Repository
}

func NewAwsRolesHandler(repo *awsroles.Repository) *AwsRolesHandler {
	return &AwsRolesHandler{Repo: repo}
}

type awsRoleResponse struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Env         string `json:"env"`
	RiskLevel   string `json:"risk_level"`
	Description string `json:"description"`
}

func (h *AwsRolesHandler) ListMyAwsRoles(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.CurrentUserIDFromContext(r.Context())
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
	if err := json.NewEncoder(w).Encode(out); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}
}
