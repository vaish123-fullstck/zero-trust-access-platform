// internal/awsroles/model.go

package awsroles

import "time"

type RiskLevel string

const (
	RiskLow    RiskLevel = "low"
	RiskMedium RiskLevel = "medium"
	RiskHigh   RiskLevel = "high"
)

// AwsRole represents an AWS IAM role that a user can assume via this console.
// It is mapped to users through the user_aws_roles join table.
type AwsRole struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`        // Friendly label, e.g. "Prod ReadOnly"
	ARN         string    `json:"arn"`         // Full role ARN
	Description string    `json:"description"` // Optional human description
	Env         string    `json:"env"`         // e.g. "prod", "dev", "sandbox"
	RiskLevel   RiskLevel `json:"risk_level"`  // low/medium/high
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
