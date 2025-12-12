package server

import (
	"encoding/json"
	"net/http"

	"zero-trust-access-platform/backend/internal/middleware"
	"zero-trust-access-platform/backend/internal/models"
)

func (s *Server) handleListResources(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, _ := middleware.UserID(r)
	role, _ := middleware.UserRole(r)

	const q = `
        SELECT DISTINCT r.id, r.name, r.type, r.sensitivity, r.created_at
        FROM resources r
        JOIN access_policies p ON p.resource_id = r.id
        WHERE
            (
                p.role = $1
                OR (p.user_id IS NOT NULL AND p.user_id = $2)
            )
            AND 'read' = ANY(p.allowed_actions)
        ORDER BY r.id;
    `

	rows, err := s.db.Query(q, role, userID)
	if err != nil {
		http.Error(w, "failed to query resources", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var resources []models.Resource
	for rows.Next() {
		var rsrc models.Resource
		if err := rows.Scan(&rsrc.ID, &rsrc.Name, &rsrc.Type, &rsrc.Sensitivity, &rsrc.CreatedAt); err != nil {
			http.Error(w, "failed to scan resource", http.StatusInternalServerError)
			return
		}
		resources = append(resources, rsrc)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read resources", http.StatusInternalServerError)
		return
	}

	// Log successful access decision
	s.logAccess(r, userID, role, "resources", "read", "allow")

	_ = json.NewEncoder(w).Encode(resources)
}
