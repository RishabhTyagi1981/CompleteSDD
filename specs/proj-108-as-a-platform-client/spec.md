# Functional Specification: Session Logout Endpoint

## 1. Overview
This specification defines the functional behavior for invalidating an active user session context via the authentication API.

* **Endpoint:** `POST /api/v1/auth/logout`
* **Target System:** Authentication Service
* **Client:** Platform Client

---

## 2. API Contract

### Request
* **HTTP Method:** `POST`
* **Path:** `/api/v1/auth/logout`
* **Headers:**
  * `Authorization: Bearer <token>` (Required)

### Response Status Codes
* `204 No Content` / `200 OK`: Session successfully invalidated.
* `401 Unauthorized`: Missing, malformed, or invalid/expired token.
* `405 Method Not Allowed`: HTTP method other than `POST` used.

---

## 3. Functional Requirements (EARS Syntax)

### 3.1. Event-Driven Requirements (Normal Operation)
* **REQ-LOGOUT-001:** When a platform client sends a `POST` request to `/api/v1/auth/logout` with a valid, active Bearer token in the `Authorization` header, the Authentication Service shall immediately invalidate the associated login session context.
* **REQ-LOGOUT-002:** When the login session context has been invalidated, the Authentication Service shall return an HTTP `204 No Content` response to the client.

### 3.2. Unwanted Behavior Requirements (Error Handling)
* **REQ-LOGOUT-003:** If a client sends a request to `/api/v1/auth/logout` without an `Authorization` header, then the Authentication Service shall return an HTTP `401 Unauthorized` response.
* **REQ-LOGOUT-004:** If a client sends a request to `/api/v1/auth/logout` with an invalid, malformed, or already expired Bearer token, then the Authentication Service shall return an HTTP `401 Unauthorized` response.
* **REQ-LOGOUT-005:** If a client submits a request to `/api/v1/auth/logout` using an HTTP verb other than `POST`, then the Authentication Service shall return an HTTP `405 Method Not Allowed` response.

### 3.3. State-Driven Requirements (Post-Condition Behavior)
* **REQ-LOGOUT-006:** While a Bearer token's session context is in an invalidated state, the Authentication Service shall reject all subsequent requests using that token with an HTTP `401 Unauthorized` response.