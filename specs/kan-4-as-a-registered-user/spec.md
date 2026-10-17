# Functional Specification: Password Reset Verification Code Request

## 1. Overview
This specification defines the functional requirements for generating and dispatching a 6-digit numeric verification code to facilitate secure identity verification for registered users undergoing credential recovery.

---

## 2. Preconditions
- The target user holds an existing registered account within the Identity Management System (IDMS).
- The user has an associated, verified communication channel (Email or SMS).

---

## 3. Functional Requirements (EARS Syntax)

### 3.1 Normal Operation (Event-Driven)
- **REQ-PWD-001 (Event-driven):**  
  When a user submits a valid registered identifier on the password reset request interface, the IDMS shall generate a cryptographically random, 6-digit numeric verification code.

- **REQ-PWD-002 (Event-driven):**  
  When the 6-digit numeric verification code is generated, the IDMS shall dispatch the code to the user's primary registered delivery channel (Email or SMS).

- **REQ-PWD-003 (Event-driven):**  
  When a verification code dispatch event completes, the IDMS shall display a generic confirmation notification indicating that a code has been sent if the account exists.

### 3.2 State-Driven Behavior
- **REQ-PWD-004 (State-driven):**  
  While a verification code remains unverified and unexpired, the IDMS shall maintain the code in an active state for a duration of exactly 15 minutes from generation.

- **REQ-PWD-005 (State-driven):**  
  While an active verification code exists for a user, the IDMS shall restrict the maximum number of failed submission attempts to 5.

### 3.3 Unwanted Behavior & Exception Handling
- **REQ-PWD-006 (Unwanted Behavior):**  
  If a user submits an identifier not associated with any registered account, then the IDMS shall return a standard confirmation response identical to a successful request without generating or dispatching a verification code.

- **REQ-PWD-007 (Unwanted Behavior):**  
  If a user submits more than 3 code requests within a rolling 60-minute window, then the IDMS shall throttle the request and display a rate-limit error message specifying the retry cooldown period.

- **REQ-PWD-008 (Unwanted Behavior):**  
  If the active verification code duration exceeds 15 minutes, then the IDMS shall invalidate the verification code.

- **REQ-PWD-009 (Unwanted Behavior):**  
  If the delivery service fails to dispatch the message, then the IDMS shall log a high-priority system error and present a generic retry prompt to the user.

### 3.4 Ubiquitous Requirements
- **REQ-PWD-010 (Ubiquitous):**  
  The IDMS shall restrict the verification code character set strictly to numeric digits (`0-9`).

- **REQ-PWD-011 (Ubiquitous):**  
  The IDMS shall store verification codes using a salted one-way cryptographic hash algorithm.

- **REQ-PWD-012 (Ubiquitous):**  
  The IDMS shall enforce single-use consumption for every verification code.

---

## 4. Data Specification: Verification Code

| Attribute | Type | Length | Format / Constraint |
| :--- | :--- | :--- | :--- |
| `verification_code` | String | 6 | Numeric only (`^[0-9]{6}$`) |
| `code_ttl` | Integer | - | 900 seconds (15 minutes) |
| `max_failed_attempts` | Integer | - | 5 attempts |
| `cooldown_limit` | Integer | - | 3 requests per 60 minutes |