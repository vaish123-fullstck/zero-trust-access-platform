package policy

func evaluateRules(ctx AccessContext) Decision {

	// 🔐 High sensitivity resources
	if ctx.Sensitivity == "high" {
		if ctx.UserRole != "admin" {
			return Decision{
				Allowed: false,
				Policy:  "high-sensitivity-admin-only",
				Reason:  "only admins may access high sensitivity resources",
			}
		}

		if !ctx.MFAEnabled {
			return Decision{
				Allowed: false,
				Policy:  "high-sensitivity-mfa-required",
				Reason:  "MFA is required for high sensitivity access",
			}
		}
	}

	// ☁️ AWS role–specific rules
	if ctx.ResourceType == "aws_role" {

		if ctx.UserRole == "user" {
			return Decision{
				Allowed: false,
				Policy:  "aws-non-privileged-deny",
				Reason:  "regular users cannot assume AWS roles",
			}
		}
	}

	// 👤 Regular users are read-only
	if ctx.UserRole == "user" && ctx.Action != "read" {
		return Decision{
			Allowed: false,
			Policy:  "user-read-only",
			Reason:  "users are limited to read-only access",
		}
	}

	return Decision{
		Allowed: true,
		Policy:  "default-allow",
		Reason:  "policy conditions satisfied",
	}
}
