package policy

// Evaluate is the single entry point for authorization decisions.
// All access control must pass through this function.
func Evaluate(ctx AccessContext) Decision {
	return evaluateRules(ctx)
}
