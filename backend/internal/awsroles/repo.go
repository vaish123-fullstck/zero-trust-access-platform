// internal/awsroles/repo.go

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
		var r0 AwsRole
		if err := rows.Scan(
			&r0.ID,
			&r0.Name,
			&r0.ARN,
			&r0.Description,
			&r0.Env,
			&r0.RiskLevel,
			&r0.CreatedAt,
			&r0.UpdatedAt,
		); err != nil {
			return nil, err
		}
		roles = append(roles, r0)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return roles, nil
}
