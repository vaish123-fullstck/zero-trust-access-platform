package models

import "time"

type Resource struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Sensitivity string    `json:"sensitivity"`
	CreatedAt   time.Time `json:"created_at"`
}
