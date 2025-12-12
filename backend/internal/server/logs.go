package server

import (
	"encoding/json"
	"net/http"
)

type accessLogRow struct {
	ID           int64  `json:"id"`
	UserID       *int64 `json:"user_id"`
	Role         string `json:"role"`
	ResourceName string `json:"resource_name"`
	Action       string `json:"action"`
	Decision     string `json:"decision"`
	Path         string `json:"path"`
	Method       string `json:"method"`
	IP           string `json:"ip"`
	CreatedAt    string `json:"created_at"`
}

func (s *Server) handleListLogs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := s.db.Query(
		`SELECT id, user_id, role, resource_name, action, decision,
                path, method, ip, created_at
         FROM access_logs
         ORDER BY created_at DESC
         LIMIT 100`,
	)
	if err != nil {
		http.Error(w, "failed to query logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []accessLogRow
	for rows.Next() {
		var row accessLogRow
		if err := rows.Scan(
			&row.ID,
			&row.UserID,
			&row.Role,
			&row.ResourceName,
			&row.Action,
			&row.Decision,
			&row.Path,
			&row.Method,
			&row.IP,
			&row.CreatedAt,
		); err != nil {
			http.Error(w, "failed to scan logs", http.StatusInternalServerError)
			return
		}
		logs = append(logs, row)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read logs", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(logs)
}
