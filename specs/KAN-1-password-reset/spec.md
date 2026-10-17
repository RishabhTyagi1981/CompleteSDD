# SPEC-105: Password Reset Code Generator
**Jira Story:** [KAN-1](https://atlassian.net)

## 1. Acceptance Criteria (EARS Framework)
- **AC_01 (Code Generation Success):**
  - WHEN a client sends a `POST` request to `/api/v1/auth/reset-request` with a valid `username`
  - THE SYSTEM SHALL return an HTTP status code `200 OK` and a response payload containing a 6-digit numeric string string code expiring in 15 minutes.
- **AC_02 (Missing Field Failure):**
  - WHEN a client sends a `POST` request missing the `username` field
  - THE SYSTEM SHALL return an HTTP status code `400 Bad Request` with error payload: `{"error": "Username is required"}`.
