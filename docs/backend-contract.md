# Backend Contract: Coordinator Project Advisor Assignment

This document describes the backend contract needed for reliable advisor assignment on the coordinator projects page.

Target page:

- `/dashboard/coordinator/projects`

Related frontend files:

- `src/app/dashboard/coordinator/projects/page.tsx`
- `src/lib/api/projects.ts`
- `src/lib/hooks/use-projects.ts`
- `src/types/projects.ts`

## Problem Summary

The coordinator projects page can display cards derived from approved proposals before the frontend can reliably identify the real project record behind each card.

Advisor assignment uses:

- `PUT /api/v1/projects/:projectId/advisor`

That endpoint requires a real `project.id`.

The current frontend can already fetch:

- advisor directory from `GET /api/v1/projects/advisors?departmentId=...`
- department overview from `GET /api/v1/analytics/department/overview?departmentId=...`
- approved proposals from `GET /api/v1/projects/proposals?departmentId=...`

The failure happens when the frontend has an approved proposal card but cannot reliably map it to a real project id.

When that happens, the UI shows:

- `Advisor assignment is unavailable for this card yet.`

This is a frontend guard. It means the assign endpoint was not called because no trusted `projectId` was available.

## Current Frontend Integration

### 1. Advisor directory

The frontend calls:

- `GET /api/v1/projects/advisors?departmentId=<departmentId>`

It uses:

- `advisor.userId` as the value to send in the assignment request body
- `advisor.user.firstName`
- `advisor.user.lastName`
- `advisor.user.email`
- `advisor.user.avatarUrl`
- `advisor.currentLoad`
- `advisor.loadLimit`

Important:

- request body `advisorId` must be the advisor user id
- request body `advisorId` must not be the advisor profile id

### 2. Assignment mutation

The frontend calls:

- `PUT /api/v1/projects/:projectId/advisor`

Request body:

```json
{
  "advisorId": "advisor-user-id"
}
```

This part is already implemented correctly on the frontend.

### 3. The unstable part

The unstable part is not the assignment mutation itself.

The unstable part is resolving `projectId` for a visible card.

Today, the frontend may need to infer the real project record by matching proposal data against overview project data using:

- project title
- approved proposal title
- project group name

This is not reliable enough.

## Why The Failure Happens

The mapping fails when any of these conditions are true:

- approved proposal exists but project is not yet created
- project is created but not included in `DepartmentProjectsOverview.projects[]`
- overview returns summary counts but an empty `projects[]` array
- proposal title and project title do not match exactly
- group names differ between proposal payload and project payload
- multiple records share the same title, making title-only matching unsafe

## Required Backend Contract

The backend should provide a direct, stable relationship between approved proposals and real projects.

Preferred options are listed below.

### Option A: Add `projectId` to approved proposal payloads

Recommended endpoint:

- `GET /api/v1/projects/proposals?departmentId=...`

Recommended shape for approved proposals:

```json
{
  "id": "proposal-id",
  "status": "APPROVED",
  "projectId": "real-project-id",
  "title": "Final Project Title",
  "selectedTitleIndex": 1,
  "advisorId": null,
  "projectGroupId": "group-id",
  "projectGroup": {
    "id": "group-id",
    "name": "Group Alpha"
  }
}
```

Benefits:

- simplest frontend integration
- direct use of `projectId` for advisor assignment
- no title/group matching required

### Option B: Add `proposalId` to department overview project items

Recommended endpoint:

- `GET /api/v1/analytics/department/overview?departmentId=...`

Recommended shape for each project item:

```json
{
  "id": "project-id",
  "proposalId": "proposal-id",
  "projectName": "Final Project Title",
  "status": "ACTIVE",
  "group": {
    "id": "group-id",
    "name": "Group Alpha"
  },
  "advisor": {
    "id": "advisor-user-id",
    "firstName": "Alem",
    "lastName": "Bekele",
    "email": "alem@example.com",
    "avatarUrl": null
  },
  "milestoneProgressPercent": 40,
  "milestonesCompleted": 2,
  "milestonesTotal": 5
}
```

Benefits:

- lets frontend join overview projects to proposals using ids
- keeps project list authoritative for assignment

### Option C: Provide a dedicated coordinator project assignment list endpoint

Recommended endpoint example:

- `GET /api/v1/projects/assignment-candidates?departmentId=...`

Recommended response shape:

```json
[
  {
    "projectId": "project-id",
    "proposalId": "proposal-id",
    "projectName": "Final Project Title",
    "status": "ACTIVE",
    "advisorId": null,
    "group": {
      "id": "group-id",
      "name": "Group Alpha",
      "members": [
        {
          "id": "user-id-1",
          "firstName": "Sara",
          "lastName": "Ali",
          "email": "sara@example.com",
          "avatarUrl": null
        }
      ]
    }
  }
]
```

Benefits:

- cleanest contract for this page
- no cross-endpoint joining required
- frontend can render and assign from one source of truth

## Minimum Required Guarantee

At least one of these must be true for every assignable card:

- approved proposal includes `projectId`
- overview project includes `proposalId`
- coordinator page has a dedicated project list endpoint containing real `projectId`

Without one of these guarantees, advisor assignment will remain best-effort and sometimes blocked.

## Advisor Assignment Endpoint Contract

Endpoint:

- `PUT /api/v1/projects/:projectId/advisor`

Path parameter:

- `projectId` = real project id

Request body:

```json
{
  "advisorId": "advisor-user-id"
}
```

Rules:

- `advisorId` must be advisor `userId`
- `advisorId` must not be advisor profile `id`

Expected success behavior:

- update `project.advisorId`
- create or update advisor project membership if needed
- replace previous advisor membership role if reassigned
- return updated project record

Recommended frontend-safe response:

```json
{
  "id": "project-id",
  "proposalId": "proposal-id",
  "title": "Final Project Title",
  "advisorId": "advisor-user-id",
  "status": "ACTIVE"
}
```

## Required Backend Questions To Confirm

The backend team should answer these before frontend can remove the fallback guard:

1. When a proposal becomes approved, is a project created immediately?
2. If yes, where is that `projectId` exposed to the frontend?
3. Does `GET /analytics/department/overview` always include all assignable projects in `projects[]`?
4. Can overview counts be non-zero while `projects[]` is empty?
5. Can the backend add either `projectId` to proposals or `proposalId` to projects?

## Recommended Resolution

Recommended implementation:

1. Add `projectId` to approved proposal records returned to coordinator views.
2. Keep `advisorId` in advisor assignment requests as advisor `userId`.
3. Ensure department overview includes full `projects[]` when summary counts indicate projects exist.

This gives the frontend a direct path:

- render card
- read `projectId`
- call `PUT /projects/:projectId/advisor`
- refetch project data

## Acceptance Criteria

The backend contract is considered sufficient when all of the following are true:

1. Every assignable coordinator card has a real `projectId`.
2. The frontend does not need title/group-name matching to find a project.
3. Clicking assign always sends `PUT /projects/:projectId/advisor` with advisor `userId`.
4. After success, refetching project data shows the assigned advisor consistently.
5. The frontend can remove the `Advisor assignment is unavailable for this card yet.` guard for valid assignable items.