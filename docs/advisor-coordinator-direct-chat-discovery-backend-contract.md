# Backend Contract: Advisor-Safe Coordinator Discovery for Direct Chat

This document defines the backend contract required to let advisor users discover coordinators they are allowed to chat with, without using tenant-admin endpoints.

## Target frontend flow

Advisor page:

- `/dashboard/advisor/messages` (Direct Chat tab)

Related frontend files:

- `src/components/dashboard/shared/coordinator-advisor-direct-chat-page.tsx`
- `src/lib/api/direct-chat.ts`
- `src/lib/hooks/use-direct-chat.ts`
- `src/types/direct-chat.ts`

## Problem summary

Current advisor-side discovery cannot use tenant user directory endpoints such as:

- `GET /api/v1/tenant/users/paged?roleNames=COORDINATOR`

because advisor accounts receive `403` on those endpoints.

Direct room creation already works via:

- `GET /api/v1/coordinator-advisor-chat/room?counterpartUserId=<userId>`

but the advisor UI has no authorized way to discover valid coordinator `userId` values.

## Required endpoint

### Endpoint

- `GET /api/v1/coordinator-advisor-chat/advisors/me/coordinators`

### Purpose

Return only coordinators that the authenticated advisor is authorized to chat with.

### Auth

- Requires authenticated user
- Caller must have advisor role
- Backend must scope results to caller's tenant and permitted department membership rules

### Query parameters

All parameters are optional.

- `search`: string
- `limit`: integer, default `20`, max `100`
- `cursor`: opaque pagination cursor

Example:

- `GET /api/v1/coordinator-advisor-chat/advisors/me/coordinators?search=abebe&limit=20`

## Success response contract

Recommended envelope:

```json
{
	"items": [
		{
			"userId": "a53e5e8f-4e7d-4b67-b3af-e1d90b331111",
			"firstName": "Abebe",
			"lastName": "Kebede",
			"email": "abebe.kebede@academia.et",
			"avatarUrl": null,
			"roleName": "COORDINATOR",
			"departmentId": "d0e24df4-5bc6-4e8a-8f07-3df3fd5d2222",
			"departmentName": "Computer Science",
			"isDirectChatEligible": true,
			"existingRoomId": "c1d2e3f4-1122-3344-5566-77889900aabb"
		}
	],
	"pagination": {
		"limit": 20,
		"nextCursor": null,
		"hasNext": false,
		"total": 1
	}
}
```

## Field requirements

Required for each item:

- `userId` string
- `firstName` string or `null`
- `lastName` string or `null`
- `email` string
- `avatarUrl` string or `null`
- `roleName` exact string `COORDINATOR`
- `isDirectChatEligible` boolean

Optional but recommended:

- `departmentId`
- `departmentName`
- `existingRoomId` (if a room already exists)

## Authorization semantics

Backend must enforce these rules server-side:

- advisor can only discover coordinators from the same tenant
- advisor can only discover coordinators allowed by department policy
- results must not include disabled or soft-deleted users
- returning empty `items` is valid if no coordinators are eligible

## Error contract

### 401 Unauthorized

Missing or invalid auth token.

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"message": "Authentication required"
}
```

### 403 Forbidden

Authenticated user is not advisor role or lacks discovery permission.

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"message": "Advisor role is required"
}
```

### 400 Bad Request

Invalid query params (for example, `limit` out of range).

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"message": "limit must be between 1 and 100"
}
```

## Frontend integration contract

### New frontend API function

Add an advisor-safe discovery function (example name):

- `listAdvisorVisibleCoordinators(params)`

and call this endpoint instead of tenant user directory APIs.

### Existing room API remains unchanged

After user selects a coordinator from discovery list, frontend continues using:

- `GET /api/v1/coordinator-advisor-chat/room?counterpartUserId=<selectedCoordinatorUserId>`

No change required to existing direct room or message endpoints.

## Minimum guarantee for release

To unblock advisor UX in direct chat, backend must guarantee:

- advisor discovery endpoint returns at least one eligible coordinator when policy allows
- no advisor request to tenant-admin user directory is required
- every discovered `userId` is valid for room resolution via `coordinator-advisor-chat/room`

## Suggested test checklist

1. Advisor with one eligible coordinator gets non-empty `items`.
2. Advisor with no eligible coordinators gets `200` and `items: []`.
3. Non-advisor user receives `403`.
4. Discovered coordinator `userId` works with room endpoint and returns `roomId`.
5. Search and pagination return stable results and valid `nextCursor` behavior.

