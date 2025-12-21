package awsroles

// defaultRoleMap defines which AWS role names are available to which
// application roles (middleware.UserRole), e.g. "admin", "user", "devops".
//

var defaultRoleMap = map[string][]string{
	"admin": {
		"ZTPortalReadOnlyLogs", // <‑ matches aws_roles.name from DB
	},
	// you can add other app roles here if needed
	"user": {
		// normal users get no AWS roles by default
	},
}

func roleNamesForAppRole(appRole string) []string {
	names, ok := defaultRoleMap[appRole]
	if !ok {
		return nil
	}
	return names
}
