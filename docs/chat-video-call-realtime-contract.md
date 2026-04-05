# Chat Video Call Realtime Contract

This document defines the Socket.IO contract required by the project-group chat video call UI for both approved project-group members and assigned advisors.

For each call session, backend must issue a dedicated `meetingRoomName` (Jitsi room) and broadcast it to all participants.

## Scope

- Namespace: `/chat`
- Audience:
  - approved project-group members
  - assigned advisors for the linked project group
- Room fan-out target: `chat_room_<roomId>`
- Source of truth for participant count: backend (in-memory store or Redis)

## Client emits

### `call:start`

Payload:

```json
{
  "roomId": "string",
  "projectGroupId": "string",
  "meetingRoomName": "string",
  "at": "ISO-8601"
}
```

Behavior:
- Validate caller has access to `roomId` and the linked `projectGroupId`.
- Validate `meetingRoomName` belongs to this call session scope.
- Mark call active for `roomId`.
- If already active, keep active state (idempotent).

### `call:join`

Payload:

```json
{
  "roomId": "string",
  "projectGroupId": "string",
  "meetingRoomName": "string (optional; if absent backend uses active session value)",
  "at": "ISO-8601"
}
```

Behavior:
- Register caller as active participant in `roomId`.
- Recompute participant count.

### `call:leave`

Payload:

```json
{
  "roomId": "string",
  "projectGroupId": "string",
  "meetingRoomName": "string (optional; if absent backend uses active session value)",
  "at": "ISO-8601"
}
```

Behavior:
- Remove caller from active participant set.
- Recompute participant count.
- If count reaches 0, backend can auto-end call or wait for explicit `call:end`.

### `call:end`

Payload:

```json
{
  "roomId": "string",
  "projectGroupId": "string",
  "meetingRoomName": "string (optional; if absent backend uses active session value)",
  "at": "ISO-8601"
}
```

Behavior:
- Force close active call state for `roomId`.
- Clear participant set.
- Allow only authorized force-end users such as:
  - call starter
  - assigned advisor
  - project-group leader

## Server broadcasts

### `call:started`

Payload:

```json
{
  "roomId": "string",
  "meetingRoomName": "string",
  "startedByUserId": "string",
  "startedAt": "ISO-8601",
  "participantCount": 1
}
```

### `call:participantChanged`

Payload:

```json
{
  "roomId": "string",
  "meetingRoomName": "string (optional)",
  "participantCount": 2
}
```

### `call:ended`

Payload:

```json
{
  "roomId": "string",
  "meetingRoomName": "string (optional)",
  "endedByUserId": "string",
  "endedAt": "ISO-8601"
}
```

## Validation rules

- Reject if unauthenticated.
- Reject if user is neither an approved project-group member nor the assigned advisor for that linked project group.
- Reject if `roomId` does not map to the caller's authorized project group context.
- Ignore stale `at` value from client for server state decisions.
- Use server time for `startedAt`/`endedAt`.

## Suggested implementation notes (backend)

- Track active calls in Redis:
  - Key: `chat:call:<roomId>` for call metadata
  - Set: `chat:call:<roomId>:participants`
- On socket disconnect, treat user as `call:leave` for any joined call room.
- Emit broadcasts to `chat_room_<roomId>`.
- Keep operations idempotent to handle duplicate emits.

## Frontend integration status

Implemented in the student and advisor chat UI:
- emits: `call:start`, `call:join`, `call:leave`
- emits: `call:end` for advisor force-end flow
- listens: `call:started`, `call:participantChanged`, `call:ended`
- uses backend `meetingRoomName` as the active Jitsi room source of truth when a session exists
- fallback UX if no backend support: local call state still works for single-user session
