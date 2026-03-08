# Frontend Integration Guide — Student Profile

This guide covers how to integrate the **Student Profile** feature from the frontend.

## Overview

Student profile data is stored in the `students` table (1:1 with `users`), and contains:

- `bio`
- Social links: `githubUrl`, `linkedinUrl`, `portfolioUrl`
- `techStack`: array of strings (e.g. `["NestJS", "PostgreSQL"]`)

### Visibility & Access Rules

- **Update (write):** only users with the `STUDENT` role can create/update their own student profile.
- **Read (public view):** any **authenticated** user can view a student’s profile **only if** they belong to the **same tenant**.

## Authentication

All endpoints require a valid JWT access token.

> In this frontend repo, requests are made via the shared axios client in `src/lib/api/client.ts`.
> Configure `NEXT_PUBLIC_API_BASE_URL` to include `/api/v1` (example: `https://api.example.com/api/v1`).
> Then frontend calls should use paths like `/profile/student` (without repeating `/api/v1`).

### 1) Login

Use the login endpoint to obtain an `accessToken`.

- Endpoint: `POST /api/v1/auth/login`
- Body example:

```json
{
  "email": "student@university.edu",
  "password": "Password123!",
  "tenantDomain": "foc"
}
```

- `tenantDomain` is optional in some setups (tenant may be inferred from email), but if your environment requires it, include it.

### 2) Send the token

Add the header on every request:

- `Authorization: Bearer <accessToken>`

## Endpoints

### A) Get my student profile (student-only)

- Method: `GET`
- Path: `/profile/student`
- Auth: required
- Role: `STUDENT`

**Response (200)**

```json
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "tenantId": "tenant-uuid"
  },
  "profile": {
    "bio": null,
    "githubUrl": null,
    "linkedinUrl": null,
    "portfolioUrl": null,
    "techStack": [],
    "updatedAt": null
  }
}
```

**Errors**
- `401`: missing/invalid token
- `403`: logged-in user is not a student

### B) Update my student profile (student-only)

- Method: `PATCH`
- Path: `/profile/student`
- Auth: required
- Role: `STUDENT`

This call will **upsert** (create if missing) the student profile row.

**Request body example**

```json
{
  "bio": "Final-year CS student focused on backend systems.",
  "githubUrl": "https://github.com/yourname",
  "linkedinUrl": "https://www.linkedin.com/in/yourname/",
  "portfolioUrl": "https://yourname.dev",
  "techStack": ["NestJS", "PostgreSQL"]
}
```

**Response (200)**

```json
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "tenantId": "tenant-uuid"
  },
  "profile": {
    "bio": "Final-year CS student focused on backend systems.",
    "githubUrl": "https://github.com/yourname",
    "linkedinUrl": "https://www.linkedin.com/in/yourname/",
    "portfolioUrl": "https://yourname.dev",
    "techStack": ["NestJS", "PostgreSQL"],
    "updatedAt": "2026-03-08T12:00:00.000Z"
  }
}
```

**Partial updates**

- All fields are optional.
- Omitted fields are left unchanged.

**Clearing fields**

- Send `null` for `bio`/URLs to clear them (e.g. `{"githubUrl": null}`).

**Validation rules (current)**

- `bio`: max length 2000
- `githubUrl` / `linkedinUrl` / `portfolioUrl`:
  - must be a valid `http`/`https` URL
- `techStack`:
  - array of strings
  - max 50 items
  - each item is trimmed
  - each item max length 50

**Errors**
- `400`: validation failed
- `401`: missing/invalid token
- `403`: logged-in user is not a student

### C) Get a student public profile (same tenant)

- Method: `GET`
- Path: `/students/:studentId/profile`
- Auth: required
- Visibility: only within the same tenant

**Response (200)**

```json
{
  "user": {
    "id": "student-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "tenantId": "tenant-uuid"
  },
  "profile": {
    "bio": "...",
    "githubUrl": "https://github.com/yourname",
    "linkedinUrl": null,
    "portfolioUrl": null,
    "techStack": ["NestJS", "PostgreSQL"]
  }
}
```

**Errors**
- `401`: missing/invalid token
- `403`: tenant mismatch (viewer and student are in different tenants)
- `404`: user not found OR user is not a student

## Swagger testing checklist

1. Login with a student user (`POST /api/v1/auth/login`).
2. Click **Authorize** in Swagger and set `Bearer <accessToken>`.
3. Call `GET /api/v1/profile/student`.
4. Call `PATCH /api/v1/profile/student` with sample data.
5. Call `GET /api/v1/profile/student` again to confirm persistence.
6. Copy the student `id` and call `GET /api/v1/students/:studentId/profile`.

## Frontend data model (suggested)

```ts
export type StudentProfile = {
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  techStack: string[];
};
```

## Where this is wired in the frontend

- Dashboard entry point: `src/app/dashboard/profile/page.tsx`
- Profile settings screen: `src/components/dashboard/settings/profile-settings.tsx`
- Student profile form section: `src/components/dashboard/settings/student-profile-section.tsx`
- API functions: `src/lib/api/profile.ts`
- Store actions/state: `src/store/auth-store.ts` (`fetchStudentProfile`, `updateStudentProfile`)

## Notes

- The backend stores `techStack` as JSON; treat it as a string array in the frontend.
- If you want to show this publicly outside auth (true public profiles), that would require a separate endpoint and tighter privacy controls.
