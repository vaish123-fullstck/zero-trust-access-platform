package server

import (
	"net"
	"net/http"
)

func (s *Server) logAccess(
	r *http.Request,
	userID int64,
	role string,
	resourceName string,
	action string,
	decision string,
	policy string,
	reason string,
) {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)

	_, _ = s.db.Exec(
		`INSERT INTO access_logs
         (user_id, role, resource_name, action, decision,
          policy_name, decision_reason, path, method, ip)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		userID,
		role,
		resourceName,
		action,
		decision,
		policy,
		reason,
		r.URL.Path,
		r.Method,
		ip,
	)
}
