// internal/awsroles/model.go

package awsroles

import "time"

type RiskLevel string

const (
	RiskLow    RiskLevel = "low"
	RiskMedium RiskLevel = "medium"
	RiskHigh   RiskLevel = "high"
)

type AwsRole struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	ARN         string    `json:"arn"`
	Description string    `json:"description"`
	Env         string    `json:"env"`
	RiskLevel   RiskLevel `json:"risk_level"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
