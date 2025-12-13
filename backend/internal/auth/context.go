// internal/auth/context.go
package auth

import "context"

type ctxKey string

const userIDKey ctxKey = "user_id"

func WithUserID(ctx context.Context, id int64) context.Context {
	return context.WithValue(ctx, userIDKey, id)
}

func CurrentUserIDFromContext(ctx context.Context) (int64, bool) {
	v := ctx.Value(userIDKey)
	id, ok := v.(int64)
	return id, ok
}
