# Student Timeline Backend MVP Contract

This document defines the **minimum backend API contract** to support the Student Timeline page in MVP mode.

## Goal

Enable Timeline and List views to use real backend data instead of local mock items.

MVP scope:
- Read timeline items for the student’s active project.
- Server-side filtering by status/type/search.
- Pagination.

Out of scope for MVP:
- Creating/updating/deleting timeline items.
- Calendar-specific endpoint.
- Phase modeling endpoint.
- Comments and attachments detail endpoints.

## Endpoint

### `GET /api/v1/projects/{projectId}/timeline-items`

Returns timeline items for one project, scoped to the authenticated student and tenant.

### Auth and tenancy

- Requires authenticated user.
- Must enforce tenant isolation (from token/context).
- Must ensure caller is a member (or leader) of the project group linked to `{projectId}`.
- Return `403` if project exists but caller has no access.

## Query parameters

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `page` | number | No | `1` | 1-based page index |
| `limit` | number | No | `20` | Recommended max `100` |
| `status` | string | No | - | Enum, case-insensitive |
| `type` | string | No | - | Enum, case-insensitive |
| `search` | string | No | - | Match title/description |

### Allowed `status` values

- `PENDING`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`
- `OVERDUE`

### Allowed `type` values

- `MILESTONE`
- `TASK`
- `EVENT`
- `DEADLINE`
- `REVIEW`

## Success response

### `200 OK`

```json
{
  "items": [
    {
      "id": "2fb2f5e0-7f9a-4f14-95f3-1be86fbec4d3",
      "projectId": "2dfce214-89db-4e78-8b7c-6e440e8fa57f",
      "title": "SRS Document",
      "description": "Complete first draft of project SRS document",
      "type": "TASK",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "startDate": "2026-03-01",
      "dueDate": "2026-03-20",
      "completedDate": null,
      "progress": 75,
      "assignees": [
        {
          "userId": "b53c59f7-3f0a-4cb6-8b77-6f43fc8350dc",
          "firstName": "Emily",
          "lastName": "Brown",
          "avatarUrl": null
        }
      ],
      "dependencyIds": ["1f6a86d6-4ec8-4e58-87d8-a8d1e8f7f44f"],
      "tags": ["documentation", "research"],
      "commentCount": 2,
      "attachmentCount": 1,
      "createdAt": "2026-03-01T09:15:00.000Z",
      "updatedAt": "2026-03-10T11:45:00.000Z"
    }
  ],
  "pagination": {
    "total": 37,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

## Item schema (MVP)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | Yes | timeline item id |
| `projectId` | string | Yes | owning project id |
| `title` | string | Yes | display title |
| `description` | string \| null | No | display subtitle/details |
| `type` | enum | Yes | from allowed type set |
| `status` | enum | Yes | from allowed status set |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | Yes | UI badge |
| `startDate` | `YYYY-MM-DD` | Yes | used in details views |
| `dueDate` | `YYYY-MM-DD` | Yes | used for “days left” |
| `completedDate` | `YYYY-MM-DD` \| null | No | set when completed |
| `progress` | number | Yes | integer `0..100` |
| `assignees` | array | Yes | may be empty for events |
| `dependencyIds` | string[] | No | defaults to `[]` |
| `tags` | string[] | No | defaults to `[]` |
| `commentCount` | number | Yes | integer `>= 0` |
| `attachmentCount` | number | Yes | integer `>= 0` |
| `createdAt` | ISO-8601 | Yes | server timestamp |
| `updatedAt` | ISO-8601 | Yes | server timestamp |

### Assignee schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | string | Yes | user id |
| `firstName` | string \| null | No | |
| `lastName` | string \| null | No | |
| `avatarUrl` | string \| null | No | |

## Error responses

### `400 Bad Request`

Invalid query values (`page < 1`, invalid enum, `limit > max`, etc.)

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "status must be one of: PENDING, IN_PROGRESS, COMPLETED, BLOCKED, OVERDUE"
    }
  ]
}
```

### `401 Unauthorized`

No valid access token.

### `403 Forbidden`

Authenticated but not authorized for this project.

### `404 Not Found`

Project id not found.

### `500 Internal Server Error`

Unexpected server error.

## Backend processing rules

- Apply tenant scope first, then project scope.
- Normalize enum inputs to uppercase.
- `search` should match `title` and `description` (case-insensitive).
- `OVERDUE` can be stored or derived:
  - derived rule: `status != COMPLETED` and `dueDate < today`.
- Sort order for MVP: `dueDate ASC`, then `createdAt ASC`.

## Suggested database model (example)

`project_timeline_items`
- `id (uuid, pk)`
- `tenant_id (uuid, indexed)`
- `project_id (uuid, indexed)`
- `title (varchar)`
- `description (text, nullable)`
- `type (enum)`
- `status (enum)`
- `priority (enum)`
- `start_date (date)`
- `due_date (date)`
- `completed_date (date, nullable)`
- `progress (int)`
- `tags (jsonb/text[])`
- `created_at (timestamp)`
- `updated_at (timestamp)`

`project_timeline_item_assignees`
- `timeline_item_id (uuid, indexed)`
- `user_id (uuid, indexed)`

`project_timeline_item_dependencies`
- `timeline_item_id (uuid, indexed)`
- `depends_on_timeline_item_id (uuid, indexed)`

## Frontend compatibility notes

Current Student Timeline UI expects:
- timeline/list rendering from a unified item list.
- count badges for comments/attachments.
- assignees with avatar/name.
- date values parseable by JavaScript `Date`.

Enum mapping recommendation for frontend:
- Backend `IN_PROGRESS` -> UI `in-progress`
- Backend `MILESTONE` -> UI `milestone`

## Implementation checklist (backend)

1. Add read endpoint and DTOs.
2. Add auth + tenant + project membership guard.
3. Add filter/pagination validation.
4. Implement repository query with filters and pagination.
5. Return response in exact contract shape.
6. Add tests:
   - success (no filters)
   - status/type/search filters
   - pagination
   - unauthorized/forbidden/not-found

## Next endpoint after MVP

After this endpoint is stable, next API should be:

- `POST /api/v1/projects/{projectId}/timeline-items`

This unlocks the existing “Add Item” dialog in the Timeline page.