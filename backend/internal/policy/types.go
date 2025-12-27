package policy

import "time"

// AccessContext represents all inputs required
// to make a Zero Trust authorization decision.
type AccessContext struct {
	UserID     int64
	UserRole   string
	MFAEnabled bool

	ResourceName string
	ResourceType string
	Sensitivity  string // low / medium / high
	Action       string // read / write / assume

	Time time.Time
}

// Decision is the result of a policy evaluation.
type Decision struct {
	Allowed bool
	Policy  string
	Reason  string
}
