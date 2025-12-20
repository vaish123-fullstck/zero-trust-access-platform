package awsroles

import (
	"context"
	"database/sql"
)

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// List all AWS roles granted to a given user.
func (r *Repository) ListForUser(ctx context.Context, userID int64) ([]AwsRole, error) {
	const q = `
SELECT ar.id, ar.name, ar.arn, ar.description, ar.env, ar.risk_level,
       ar.created_at, ar.updated_at
FROM user_aws_roles uar
JOIN aws_roles ar ON ar.id = uar.aws_role_id
WHERE uar.user_id = $1
ORDER BY ar.env, ar.name;
`
	rows, err := r.DB.QueryContext(ctx, q, userID)
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

// Get a single AWS role by id that belongs to the given user.
func (r *Repository) GetForUser(ctx context.Context, userID, roleID int64) (*AwsRole, error) {
	const q = `
SELECT ar.id, ar.name, ar.arn, ar.description, ar.env, ar.risk_level,
       ar.created_at, ar.updated_at
FROM user_aws_roles uar
JOIN aws_roles ar ON ar.id = uar.aws_role_id
WHERE uar.user_id = $1 AND ar.id = $2;
`
	row := r.DB.QueryRowContext(ctx, q, userID, roleID)

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
