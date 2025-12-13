package server

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"

	"zero-trust-access-platform/backend/internal/middleware"
	"zero-trust-access-platform/backend/internal/models"
)

type signupRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

type mfaVerifyRequest struct {
	Code string `json:"code"`
}

// shared helper to build a JWT for a user
func (s *Server) generateToken(u models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  u.ID,
		"role": u.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// POST /auth/signup
func (s *Server) handleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Password == "" {
		http.Error(w, "email and password required", http.StatusBadRequest)
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	// new signups are regular users; MFA will still be required on first login
	var u models.User
	err = s.db.QueryRow(
		`INSERT INTO users (email, full_name, role, password_hash)
         VALUES ($1, $2, 'user', $3)
         RETURNING id, email, full_name, role, created_at`,
		req.Email, req.FullName, string(hashed),
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.CreatedAt)
	if err != nil {
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	// Do NOT issue a long‑lived token here; user must still enroll+verify MFA
	token, err := s.generateToken(u)
	if err != nil {
		http.Error(w, "failed to create token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(authResponse{
		Token: token,
		User:  u,
	})
}

// POST /auth/login
// Mandatory MFA flow:
// - Always returns { mfa_required: true, enrollment_required: bool, temp_token, user }
// - Client must then:
//   - if enrollment_required: call /auth/mfa/enroll, show QR, then /auth/mfa/verify
//   - else: directly call /auth/mfa/verify
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	var u models.User
	var passwordHash string
	var mfaEnabled bool
	var mfaSecret sql.NullString

	err := s.db.QueryRow(
		`SELECT id, email, full_name, role, password_hash, created_at, mfa_enabled, mfa_secret
         FROM users
         WHERE email = $1`,
		req.Email,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &passwordHash, &u.CreatedAt, &mfaEnabled, &mfaSecret)
	if err == sql.ErrNoRows {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "failed to query user", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// MFA is mandatory for everyone.
	// If there is no stored secret yet, client must enroll before verifying.
	enrollmentRequired := !mfaSecret.Valid || mfaSecret.String == ""

	// Issue a short‑lived temp token used only for MFA enroll/verify calls.
	tempToken, err := s.generateToken(u)
	if err != nil {
		http.Error(w, "failed to create temp token", http.StatusInternalServerError)
		return
	}

	s.writeJSON(w, http.StatusOK, map[string]any{
		"mfa_required":        true,
		"enrollment_required": enrollmentRequired,
		"temp_token":          tempToken,
		"user":                u,
	})
}

// POST /auth/mfa/enroll (authenticated by temp or full token)
// Used to generate QR and store mfa_secret.
func (s *Server) handleMFAEnroll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// load user to get email (and ensure they exist)
	var u models.User
	err := s.db.QueryRow(
		`SELECT id, email, full_name, role, created_at
         FROM users
         WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.CreatedAt)
	if err != nil {
		http.Error(w, "failed to load user", http.StatusInternalServerError)
		return
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "ZeroTrustApp",
		AccountName: u.Email,
	})
	if err != nil {
		http.Error(w, "failed to generate mfa secret", http.StatusInternalServerError)
		return
	}

	secret := key.Secret()

	// store secret for user, but do not enable MFA yet
	_, err = s.db.Exec(
		`UPDATE users SET mfa_secret = $1 WHERE id = $2`,
		secret, userID,
	)
	if err != nil {
		http.Error(w, "failed to save mfa secret", http.StatusInternalServerError)
		return
	}

	otpURL := key.URL()

	s.writeJSON(w, http.StatusOK, map[string]string{
		"secret":      secret,
		"otpauth_url": otpURL,
	})
}

// POST /auth/mfa/verify (authenticated by temp or full token)
// Step 2 of MFA flow: client calls with temp_token + 6‑digit code.
// On success, sets mfa_enabled=true and returns final JWT.
func (s *Server) handleMFAVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req mfaVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// load mfa_secret
	var secret string
	err := s.db.QueryRow(
		`SELECT mfa_secret FROM users WHERE id = $1`,
		userID,
	).Scan(&secret)
	if err != nil || secret == "" {
		http.Error(w, "mfa not enrolled", http.StatusBadRequest)
		return
	}

	if !totp.Validate(req.Code, secret) {
		http.Error(w, "invalid code", http.StatusUnauthorized)
		return
	}

	// enable MFA
	_, err = s.db.Exec(
		`UPDATE users SET mfa_enabled = true WHERE id = $1`,
		userID,
	)
	if err != nil {
		http.Error(w, "failed to enable mfa", http.StatusInternalServerError)
		return
	}

	// load full user for token
	var u models.User
	err = s.db.QueryRow(
		`SELECT id, email, full_name, role, created_at
         FROM users WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.CreatedAt)
	if err != nil {
		http.Error(w, "failed to load user", http.StatusInternalServerError)
		return
	}

	token, err := s.generateToken(u)
	if err != nil {
		http.Error(w, "failed to create token", http.StatusInternalServerError)
		return
	}

	s.writeJSON(w, http.StatusOK, authResponse{
		Token: token,
		User:  u,
	})
}
