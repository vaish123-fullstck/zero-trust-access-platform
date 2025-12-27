package server

import (
	"encoding/json"
	"net/http"
	"time"

	"zero-trust-access-platform/backend/internal/middleware"
	"zero-trust-access-platform/backend/internal/models"
	"zero-trust-access-platform/backend/internal/policy"
)

func (s *Server) handleListResources(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	role, ok := middleware.UserRole(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

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
		if err := rows.Scan(
			&rsrc.ID,
			&rsrc.Name,
			&rsrc.Type,
			&rsrc.Sensitivity,
			&rsrc.CreatedAt,
		); err != nil {
			http.Error(w, "failed to scan resource", http.StatusInternalServerError)
			return
		}

		// 🔐 Zero Trust policy evaluation
		decision := policy.Evaluate(policy.AccessContext{
			UserID:       userID,
			UserRole:     role,
			MFAEnabled:   true, // enforced during login
			ResourceName: rsrc.Name,
			ResourceType: rsrc.Type,
			Sensitivity:  rsrc.Sensitivity,
			Action:       "read",
			Time:         time.Now(),
		})

		if !decision.Allowed {
			s.logAccess(
				r,
				userID,
				role,
				rsrc.Name,
				"read",
				"deny",
				decision.Policy,
				decision.Reason,
			)
			continue
		}

		resources = append(resources, rsrc)

		s.logAccess(
			r,
			userID,
			role,
			rsrc.Name,
			"read",
			"allow",
			decision.Policy,
			decision.Reason,
		)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read resources", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(resources)
}
