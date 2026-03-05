# Frontend Integration Guide: Invitations (Department Head → Users)

This document describes how to integrate the **Department Head invitation flow** with the backend API:

- Invite a single user (Student / Advisor / Coordinator)
- Bulk invite students (sync)
- Bulk invite students (async job)
- Preview invitation email (backend-rendered HTML/text)
- List / resend / revoke invitations
- Public accept flow (preview → confirm → accept)
- Login and forced password change (`mustChangePassword`)
- Optional Excel import (frontend-only, batched sends)

---

## 1) Base URL + versioning

- Base URL (local): `http://localhost:3001`
- API prefix + versioning: `/api/v1`
- Swagger: `http://localhost:3001/api/docs`

All routes below are shown with the full prefix, e.g. `GET /api/v1/tenant/invitations`.

---

## 2) Auth header + roles

All Department Head endpoints require:

- Header: `Authorization: Bearer <ACCESS_TOKEN>`
- Role: `DepartmentHead`

Public acceptance endpoints do **not** require auth.

---

## 3) High-level frontend flow (recommended)

### A) Department Head sends invitations

1. Department Head logs in
2. Department Head invites one user OR bulk-invites students
3. Backend sends invitation email (provider template or fallback HTML)

### B) Invitee accepts invitation

1. Invitee clicks **Accept invitation** in email (frontend page)
2. Frontend calls `POST /api/v1/invitations/accept/preview` to fetch invitation details
3. Frontend displays invited identity (`firstName` / `lastName`) as **read-only** and asks user to confirm
4. On confirm, frontend calls `POST /api/v1/invitations/accept`
5. Backend returns `temporaryPassword` (shown **once**) and `mustChangePassword: true`

### C) Invitee logs in and is forced to change password

1. Frontend navigates to Login
2. Frontend logs in with email + `temporaryPassword`
3. Backend login response includes `user.mustChangePassword: true`
4. Frontend forces redirect to “Change password” screen
5. Frontend calls `POST /api/v1/auth/change-password`

---

## 4) Response wrapper shape

Most endpoints use a standard wrapper:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-03-02T18:19:11.868Z"
}
```

Errors typically look like:

```json
{
  "success": false,
  "message": "Reason for failure",
  "error": { "code": "BADREQUEST" },
  "timestamp": "2026-03-02T18:19:11.868Z",
  "path": "/api/v1/..."
}
```

Frontend guidance:
- Prefer backend `message` for user-facing feedback.

---

## 5) Department Head Invitation APIs

### 5.0) Optional email customization

The Department Head can optionally customize the invitation email using:

- `subject` (plain text)
- `message` (plain text)

Rules:
- These values are **send-time only** (not stored on the Invitation record).

---

### 5.1) Create a single invitation

- **POST** `/api/v1/tenant/invitations`
- **Auth**: DepartmentHead
- **201 Created**

Request body:

```json
{
  "email": "student@university.edu",
  "firstName": "Kubsa",
  "lastName": "Melkami",
  "roleName": "Student",
  "subject": "Optional custom subject",
  "message": "Optional custom message (plain text)"
}
```

Allowed `roleName` values:
- `Student`
- `Advisor`
- `Coordinator`

Common errors:
- `400` invalid payload
- `401` missing/invalid token
- `403` not DepartmentHead
- `409` user already exists

---

### 5.2) Bulk invite students (synchronous)

- **POST** `/api/v1/tenant/invitations/bulk`
- **Auth**: DepartmentHead
- **200 OK**
- **Limit**: max 50 invites per request

Request body:

```json
{
  "invites": [
    { "email": "student1@university.edu", "firstName": "Abebe", "lastName": "Kebede" },
    { "email": "student2@university.edu", "firstName": "Almaz", "lastName": "Tesfaye" }
  ],
  "subject": "Optional custom subject (applies to all)",
  "message": "Optional custom message (applies to all)"
}
```

Response (example):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "requested": 2,
    "unique": 2,
    "created": 2,
    "skippedExisting": 0,
    "duplicates": [],
    "invitations": [
      {
        "id": "invitation-id",
        "tenantId": "tenant-id",
        "departmentId": "department-id",
        "email": "student1@university.edu",
        "firstName": "Abebe",
        "lastName": "Kebede",
        "roleName": "Student",
        "status": "PENDING",
        "expiresAt": "2026-03-09T10:00:00.000Z",
        "createdAt": "2026-03-02T10:00:00.000Z",
        "acceptedAt": null,
        "revokedAt": null,
        "lastSentAt": "2026-03-02T10:00:01.000Z",
        "sendCount": 1,
        "lastSendError": null
      }
    ]
  },
  "timestamp": "..."
}
```

---

### 5.3) Bulk invite students (asynchronous job)

- **POST** `/api/v1/tenant/invitations/bulk/jobs`
- **Auth**: DepartmentHead
- **202 Accepted**
- **Limit**: max 50 invites per request

Request body: same as sync bulk.

Response (example):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "jobId": "123",
    "enqueued": true,
    "requested": 2,
    "maxPerRequest": 50
  },
  "timestamp": "..."
}
```

---

### 5.4) Preview invitation email (before sending)

- **POST** `/api/v1/tenant/invitations/preview`
- **Auth**: DepartmentHead
- **200 OK**

Request body:

```json
{
  "roleName": "Student",
  "firstName": "Abebe",
  "lastName": "Kebede",
  "subject": "Optional custom subject",
  "message": "Optional custom message (plain text)"
}
```

Notes:
- `firstName` / `lastName` are optional for preview.

Response (example):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "subject": "You're invited to join Academia",
    "htmlContent": "<!doctype html><html lang=\"en\">...",
    "textContent": "Hello,\n\nYou have been invited...",
    "acceptUrl": "http://localhost:3000/invitations/accept?token=preview-token",
    "loginUrl": "http://localhost:3000/login?tenantDomain=example",
    "expiresAt": "2026-03-09T10:00:00.000Z"
  },
  "timestamp": "..."
}
```

Frontend rendering (recommended):

- Render `data.htmlContent` inside an `iframe` using `srcDoc`.

---

### 5.5) Poll job status/result

- **GET** `/api/v1/tenant/invitations/bulk/jobs/:jobId`
- **Auth**: DepartmentHead
- **200 OK**

Response includes:
- `state`: `waiting` | `active` | `completed` | `failed` | ...
- `progress`: structured progress
- `result`: only present when `state === 'completed'`

Polling recommendation:
- Poll every 1–2 seconds until `completed` or `failed`

---

### 5.6) List invitations for your department

- **GET** `/api/v1/tenant/invitations`
- **Auth**: DepartmentHead
- **200 OK**

Optional query:
- `status`: `PENDING` | `ACCEPTED` | `EXPIRED` | `REVOKED`

---

### 5.7) Revoke an invitation

- **DELETE** `/api/v1/tenant/invitations/:id`
- **Auth**: DepartmentHead
- **200 OK**

---

### 5.8) Resend an invitation (rotates token + extends expiry)

- **POST** `/api/v1/tenant/invitations/:id/resend`
- **Auth**: DepartmentHead
- **200 OK**

---

## 6) Public acceptance API (creates user + returns temporary password once)

### 6.1) Preview invitation (confirm screen)

- **POST** `/api/v1/invitations/accept/preview`
- **Public**
- **200 OK**

Request body:

```json
{
  "token": "<invitation-token>"
}
```

---

### 6.2) Accept invitation

- **POST** `/api/v1/invitations/accept`
- **Public**
- **200 OK**

Request body:

```json
{
  "token": "<invitation-token>"
}
```

Success response includes:
- `temporaryPassword` (shown **once**)
- `mustChangePassword: true`

---

## 7) Auth endpoints used in this flow

### 7.1) Login

- **POST** `/api/v1/auth/login`

### 7.2) Change password

- **POST** `/api/v1/auth/change-password`

---

## 8) Frontend screens checklist (minimal)

1. **Invite Users** (Department Head)
   - Single invite form (`email`, `firstName`, `lastName`, `roleName`)
   - Bulk invite table (rows of `email`, `firstName`, `lastName`; max 50 per request)
  - Optional file import from Excel (see next section)

2. **Accept Invitation** (Public)
   - Read token from URL query `?token=...`
   - Call preview endpoint and display invited name as read-only
   - User confirms, then call accept endpoint
   - Show `temporaryPassword` once

---

## 9) Import students from Excel (frontend-only)

Goal: invite more than 50 students without manual typing.

Important:
- Backend bulk endpoints accept **max 50 invites per request**.
- Frontend should parse the file, validate rows, then **send in batches of 50**.
- This import flow is **Student-only** (`roleName: "Student"`).

### 9.1) File formats

Support:
- Excel file (`.xlsx`)

Template:
- Provide a “Download Excel template” button.
- The template should include an `INVITES` sheet with headers `email`, `firstName`, `lastName` and 50 blank rows.

Required columns (header row):
- `email`
- `firstName`
- `lastName`

### 9.2) Parsing + validation

Recommended libraries:
- Excel parsing: `xlsx`

Normalize:
- `email = email.trim().toLowerCase()`
- `firstName = firstName.trim()`
- `lastName = lastName.trim()`

Validate:
- email present and looks like an email
- firstName/lastName present

Deduplicate by normalized email.

### 9.3) Sending in batches of 50

Split `validInvites` into chunks of 50 and send sequentially:

- Sync: `POST /api/v1/tenant/invitations/bulk`
- Async: `POST /api/v1/tenant/invitations/bulk/jobs` (+ poll each job)
