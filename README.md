# Zero Trust Access Platform

Zero Trust Access Platform is a full‑stack security console that demonstrates **policy‑driven access control**, **MFA‑backed identity**, **just‑in‑time AWS access**, and **audit logging** following Zero Trust principles. [file:204]

## Installation

Use Go and Node instead of `pip` to install and run the app. [file:204]

```python
# Backend
cd backend
go mod tidy
go run main.go
```
Required backend environment variables: [file:204]
 ```
APP_ENV=dev
APP_PORT=8080
JWT_SECRET=your-secret
DATABASE_URL=postgres://user:password@localhost/zero_trust
AWS_REGION=ap-south-1
```
Installing frontend:
```
# Frontend
cd frontend
npm install
npm run dev
```
Required frontend environment variable: [file:204]
```
VITE_API_BASE_URL=http://localhost:8080
```
# Usage
## Authentication & MFA
 - Users sign up and log in with email + password.
 - If MFA is enabled, login returns a temporary token and requires TOTP verification.
- A JWT is issued only after successful MFA verification and is sent as:
- Authorization: Bearer <jwt>

## Resource access
- Request:
```   
#  GET /resources
#  Authorization: Bearer <jwt>
# Response:
#   JSON array of resources the current user is allowed to access:
#   [
#     { "id": 1, "name": "...", "type": "...", "sensitivity": "...", "created_at": "..." },
#     ...
#   ]
```

## Just‑in‑time AWS console access

```
# Request:
#   POST /me/aws/roles/{id}/session
#   Authorization: Bearer <jwt>
# Behavior:
#   - Checks which AWS roles the user’s app role can assume.
#   - Uses AWS STS AssumeRole for the selected role.
#   - Returns a short‑lived AWS console URL:
#     { "url": "https://signin.aws.amazon.com/console/..." }
```
## Admin AWS role policies
```
# Request:
#   GET /admin/policies/aws-roles
#   Authorization: Bearer <jwt-admin>
# Response (example):
# {
#   "admin": [
#     { "id": 1, "name": "zt-admin-prod", "env": "prod", "risk_level": "high", "description": "..." }
#   ],
#   "user": [
#     { "id": 2, "name": "zt-readonly-dev", "env": "dev", "risk_level": "low", "description": "..." }
#   ],
#   "devops": [
#     ...
#   ]
# }
```
# SAMPLE WORKFLOW SNAPSHOTS

## Login page 
![image alt](https://github.com/vaish123-fullstck/zero-trust-access-platform/blob/2d26354dc0ea69995e09da8e3267c85a326fa9bf/1.png)

## MFA
![image alt](https://github.com/vaish123-fullstck/zero-trust-access-platform/blob/d3bc9a4ff3b5565430b68920e7afdb5c4e3c74b8/2.png)

## Console Page
![image alt](https://github.com/vaish123-fullstck/zero-trust-access-platform/blob/d3bc9a4ff3b5565430b68920e7afdb5c4e3c74b8/3.png)

## Audit trail 
# The audit trail provides complete visibility into every access decision made by the Zero Trust policy engine
- Every protected request (/resources, /me/aws/roles, admin endpoints) is automatically logged with:
```
  {
  "id": 123,
  "user_id": 456,
  "action": "view_resource", 
  "decision": "allow",        # or "deny"
  "resource_name": "customer-db",
  "method": "GET",
  "path": "/resources",
  "ip": "127.0.0.1",
  "policy_name": "high_sensitivity",
  "reason": "admin role + MFA verified",
  "created_at": "2025-12-31T21:00:00Z"
}
```
![image alt](https://github.com/vaish123-fullstck/zero-trust-access-platform/blob/e4655b606d5b782618e7a86ed2050f6d2ed57d04/4.png)



# Contributing

Pull requests are welcome. For major changes such as: [file:204]

- New policy types or decision logic

- Additional AWS roles or other cloud providers

- Changes to MFA or authentication flows

- New admin pages (e.g. richer audit explorer or policy editor)

please open an issue first to discuss what you would like to change. Make sure backend (backend/internal/*) and frontend (frontend/src/*) remain consistent with the Zero Trust model (JWT everywhere, least privilege, audited decisions).












