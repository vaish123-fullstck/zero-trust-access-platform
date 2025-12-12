package models

import "time"

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`

	MFAEnabled bool   `json:"mfa_enabled"`
	MFASecret  string `json:"-"`
}
