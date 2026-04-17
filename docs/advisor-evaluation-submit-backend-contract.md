# Backend Contract: Advisor Project Evaluation Submit Endpoint

This document describes the backend endpoint required to formally submit advisor project evaluations so the coordinator preview flow can generate final grades.

## Target frontend flow

Advisor frontend pages:

- `/dashboard/advisor/evaluations/capstone-i`
- `/dashboard/advisor/evaluations/capstone-ii`
- group detail evaluation page used by `src/components/dashboard/advisor/capstone-group-evaluate-page.tsx`

Coordinator dependency:

- `/dashboard/coordinator/grade-management`

Related frontend files:

- `src/lib/api/advisor.ts`
- `src/lib/hooks/use-submit-advisor-project-evaluation.ts`
- `src/components/dashboard/advisor/capstone-group-evaluate-page.tsx`
- `src/app/dashboard/coordinator/grade-management/page.tsx`

## Problem summary

The frontend already supports these advisor actions:

- fetch advisor evaluation detail
- save advisor evaluation draft scores per student

What was missing on the backend is the formal advisor submit endpoint.

Because of that, the coordinator page can show:

- advisor scoring complete
- all students scored

but still block preview with:

- `Advisor evaluation must be submitted before preview is available.`

That behavior is correct.

The coordinator preview flow must only unlock after the advisor evaluation is formally submitted, not merely saved as draft.

## Existing frontend endpoints already in use

### 1. Advisor evaluation detail

The frontend already calls:

- `GET /api/v1/project-evaluations/advisors/me/projects/:projectId?stage=CAPSTONE_I`
- `GET /api/v1/project-evaluations/advisors/me/projects/:projectId?stage=CAPSTONE_II`

Important fields currently consumed from the response:

```json
{
  "stage": "CAPSTONE_I",
  "project": {
    "id": "project-id",
    "title": "Campus Navigation System",
    "status": "ACTIVE"
  },
  "group": {
    "id": "group-id",
    "name": "SUDO_NERS",
    "totalMembers": 3
  },
  "evaluation": {
    "stage": "CAPSTONE_I",
    "status": "IN_PROGRESS",
    "totalStudents": 3,
    "studentsEvaluated": 3,
    "studentsPendingEvaluation": 0,
    "lastSavedAt": "2026-04-17T07:38:00.000Z",
    "submittedAt": null
  },
  "students": [
    {
      "userId": "student-user-id",
      "fullName": "Yonas Kedir",
      "email": "yonas@academia.et",
      "evaluation": {
        "status": "EVALUATED",
        "score": 89,
        "comment": "participate well in software project documentation",
        "savedAt": "2026-04-17T07:38:00.000Z"
      }
    }
  ]
}
```

### 2. Advisor draft save

The frontend already calls:

- `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/draft?stage=CAPSTONE_I`
- `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/draft?stage=CAPSTONE_II`

Request body:

```json
{
  "students": [
    {
      "studentUserId": "student-user-id",
      "score": 89,
      "comment": "Strong documentation and team participation"
    }
  ]
}
```

Current draft semantics:

- persists advisor scores/comments
- updates `studentsEvaluated`
- updates `studentsPendingEvaluation`
- updates `lastSavedAt`
- does not count as final submission
- may keep `submittedAt = null`

## Missing endpoint to implement

The frontend is now wired to call this endpoint:

- `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/submit?stage=CAPSTONE_I`
- `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/submit?stage=CAPSTONE_II`

Recommended method:

- `POST`

Recommended query param:

- `stage`: `CAPSTONE_I | CAPSTONE_II`

Request body:

- no body required

The frontend sends `undefined` as request body.

## Required success response shape

Return a response compatible with the current frontend contract.

Recommended success envelope:

```json
{
  "success": true,
  "message": "Advisor project evaluation submitted successfully.",
  "data": {
    "message": "Advisor project evaluation submitted successfully.",
    "stage": "CAPSTONE_I",
    "projectId": "project-id",
    "evaluation": {
      "status": "SUBMITTED",
      "totalStudents": 3,
      "studentsEvaluated": 3,
      "studentsPendingEvaluation": 0,
      "lastSavedAt": "2026-04-17T07:38:00.000Z",
      "submittedAt": "2026-04-17T07:45:00.000Z"
    },
    "submittedStudents": [
      {
        "studentUserId": "student-user-id-1",
        "score": 89,
        "comment": "Strong documentation and team participation",
        "status": "EVALUATED"
      },
      {
        "studentUserId": "student-user-id-2",
        "score": 78,
        "comment": "Worked well with the team",
        "status": "EVALUATED"
      }
    ]
  },
  "timestamp": "2026-04-17T07:45:00.000Z"
}
```

The frontend also accepts the non-envelope form below, but the enveloped form is preferred because it matches the other evaluation APIs:

```json
{
  "message": "Advisor project evaluation submitted successfully.",
  "stage": "CAPSTONE_I",
  "projectId": "project-id",
  "evaluation": {
    "status": "SUBMITTED",
    "totalStudents": 3,
    "studentsEvaluated": 3,
    "studentsPendingEvaluation": 0,
    "lastSavedAt": "2026-04-17T07:38:00.000Z",
    "submittedAt": "2026-04-17T07:45:00.000Z"
  },
  "submittedStudents": [
    {
      "studentUserId": "student-user-id-1",
      "score": 89,
      "comment": "Strong documentation and team participation",
      "status": "EVALUATED"
    }
  ]
}
```

## Backend business rules

The submit endpoint should enforce these rules.

### Required validations

- authenticated user must be the advisor assigned to the project
- `projectId` must exist
- `stage` must be valid
- advisor evaluation record for the project and stage must exist or be creatable from draft state
- all project-group students for that stage must have advisor scores before submission succeeds

Recommended failure when any student is missing a score:

```json
{
  "success": false,
  "message": "Advisor evaluation is incomplete.",
  "error": {
    "code": "EVALUATION_INCOMPLETE",
    "message": "All students must be scored before submitting the advisor evaluation."
  }
}
```

### Idempotency

The endpoint should be idempotent.

If the evaluation is already submitted:

- return success again with the existing `submittedAt`, or
- return a stable conflict code with a clear message

Preferred behavior:

- return success with the existing submitted record so the frontend remains simple

### State transition

Recommended project evaluation state transition:

- `NOT_STARTED` -> `IN_PROGRESS` during draft save
- `IN_PROGRESS` -> `SUBMITTED` during submit

After successful submit:

- set `evaluation.status = SUBMITTED`
- set `evaluation.submittedAt = server timestamp`
- preserve `lastSavedAt`
- do not alter student scores unless the backend needs normalization

## Why this endpoint matters to coordinator preview

The coordinator page now intentionally distinguishes these two states:

### 1. Scoring complete

Meaning:

- advisor has entered scores for all students
- `studentsPendingEvaluation = 0`
- `submittedAt` may still be `null`

This shows as:

- `SCORING COMPLETE`

But it must still block preview.

### 2. Submitted

Meaning:

- advisor evaluation was formally submitted
- `submittedAt` is non-null, or backend detail/dashboard status is a submitted-equivalent state

This allows coordinator preview when evaluator submissions and weights are also complete.

Coordinator preview becomes available only when all of these are true:

- department weights are configured
- advisor evaluation is submitted
- all evaluator submissions are submitted
- finalization status is still `NOT_FINALIZED`

## Minimum data contract required by coordinator screens

The coordinator frontend treats advisor evaluation as submitted when either of these is true:

- `advisorEvaluation.submittedAt` is not null
- `advisorEvaluation.status` normalizes to one of:
  - `SUBMITTED`
  - `COMPLETED`
  - `FINALIZED`
  - `APPROVED`

Recommended backend choice:

- set status to `SUBMITTED`
- set `submittedAt` explicitly

That is the clearest and safest contract.

## Recommended database-side behavior

On submit, the backend should:

1. load the project, project group, advisor assignment, and stage evaluation aggregate
2. load all students that must be covered by the advisor evaluation
3. verify every required student has an advisor score for this stage
4. mark the advisor project evaluation aggregate as submitted
5. stamp `submittedAt` with server time
6. optionally stamp each student evaluation row with a submitted or locked state if your data model supports that
7. return the aggregate summary plus the submitted student list

## Suggested error cases

Recommended error codes/messages:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `PROJECT_NOT_FOUND`
- `INVALID_STAGE`
- `EVALUATION_INCOMPLETE`
- `EVALUATION_NOT_FOUND`
- `EVALUATION_ALREADY_SUBMITTED`

Example incomplete response:

```json
{
  "success": false,
  "message": "Advisor evaluation is incomplete.",
  "error": {
    "code": "EVALUATION_INCOMPLETE",
    "message": "All students must be scored before submitting the advisor evaluation."
  }
}
```

Example forbidden response:

```json
{
  "success": false,
  "message": "You are not allowed to submit this evaluation.",
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the assigned advisor can submit this project evaluation."
  }
}
```

## Acceptance checklist

- [ ] `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/submit?stage=CAPSTONE_I` exists
- [ ] `POST /api/v1/project-evaluations/advisors/me/projects/:projectId/submit?stage=CAPSTONE_II` exists
- [ ] endpoint requires assigned advisor auth
- [ ] endpoint fails when any student is missing an advisor score
- [ ] endpoint sets `evaluation.status` to `SUBMITTED`
- [ ] endpoint sets `evaluation.submittedAt`
- [ ] advisor detail endpoint returns the updated `submittedAt`
- [ ] advisor dashboard endpoint returns submitted state for the same project/stage
- [ ] coordinator dashboard/detail endpoints reflect advisor submitted state
- [ ] coordinator preview endpoint succeeds once weights and evaluator submissions are also complete

## Quick manual verification flow

1. Advisor opens a project evaluation and saves scores for every student.
2. Advisor submits the project evaluation.
3. Refresh advisor detail and confirm:
   - `evaluation.status = SUBMITTED`
   - `evaluation.submittedAt` is populated
4. Open coordinator grade management for the same project.
5. Confirm the advisor card shows `SUBMITTED`, not only `SCORING COMPLETE`.
6. If evaluator submissions and weights are complete, confirm preview becomes available.

## Recommended implementation note

If your backend already has evaluator submit logic, the advisor submit endpoint should mirror that pattern as closely as possible:

- same route style
- same envelope style
- same status semantics
- same audit timestamp behavior

That will keep the advisor and evaluator flows consistent across the system.