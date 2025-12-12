package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const (
	ctxUserID   ctxKey = "userID"
	ctxUserRole ctxKey = "userRole"
)

func Auth(jwtSecret []byte, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenStr == authHeader {
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "invalid claims", http.StatusUnauthorized)
			return
		}

		sub, okSub := claims["sub"].(float64)
		role, okRole := claims["role"].(string)
		if !okSub || !okRole {
			http.Error(w, "invalid token claims", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), ctxUserID, int64(sub))
		ctx = context.WithValue(ctx, ctxUserRole, role)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func UserID(r *http.Request) (int64, bool) {
	v, ok := r.Context().Value(ctxUserID).(int64)
	return v, ok
}

func UserRole(r *http.Request) (string, bool) {
	v, ok := r.Context().Value(ctxUserRole).(string)
	return v, ok
}
