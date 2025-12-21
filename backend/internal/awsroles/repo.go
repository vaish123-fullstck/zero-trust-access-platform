package awsroles

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// Repository provides DB access for AWS roles.
type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// ListForAppRole returns all AWS roles that should be available to users
// with the given application role (e.g. "admin", "developer").
//
// It uses defaultRoleMap (roleNamesForAppRole) and selects from aws_roles
// by name. You can extend this to also filter by env or risk_level.
func (r *Repository) ListForAppRole(ctx context.Context, appRole string) ([]AwsRole, error) {
	names := roleNamesForAppRole(appRole)
	if len(names) == 0 {
		return []AwsRole{}, nil
	}

	// Build simple IN clause with $1, $2, ...
	placeholders := make([]string, len(names))
	args := make([]any, len(names))
	for i, n := range names {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = n
	}

	q := fmt.Sprintf(`
SELECT id, name, arn, description, env, risk_level, created_at, updated_at
FROM aws_roles
WHERE name IN (%s)
ORDER BY env, name;
`, strings.Join(placeholders, ","))

	rows, err := r.DB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []AwsRole
	for rows.Next() {
		var role AwsRole
		if err := rows.Scan(
			&role.ID,
			&role.Name,
			&role.ARN,
			&role.Description,
			&role.Env,
			&role.RiskLevel,
			&role.CreatedAt,
			&role.UpdatedAt,
		); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return roles, nil
}

// GetForAppRole returns a single AWS role by id, but only if that role
// is allowed for the given application role. This prevents a user from
// requesting an arbitrary role id they are not mapped to.
func (r *Repository) GetForAppRole(ctx context.Context, appRole string, roleID int64) (*AwsRole, error) {
	names := roleNamesForAppRole(appRole)
	if len(names) == 0 {
		return nil, sql.ErrNoRows
	}

	placeholders := make([]string, len(names))
	args := make([]any, 0, len(names)+1)
	for i, n := range names {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args = append(args, n)
	}
	// last arg is roleID
	args = append(args, roleID)

	q := fmt.Sprintf(`
SELECT id, name, arn, description, env, risk_level, created_at, updated_at
FROM aws_roles
WHERE id = $%d AND name IN (%s)
LIMIT 1;
`, len(args), strings.Join(placeholders, ","))

	row := r.DB.QueryRowContext(ctx, q, args...)

	var role AwsRole
	if err := row.Scan(
		&role.ID,
		&role.Name,
		&role.ARN,
		&role.Description,
		&role.Env,
		&role.RiskLevel,
		&role.CreatedAt,
		&role.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &role, nil
}
