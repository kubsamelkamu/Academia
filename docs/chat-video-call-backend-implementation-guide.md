# Backend Guide — Video Calling in Existing Chat (Presence + Jitsi Session Room)

This guide explains how to add **video calling capability** to the existing chat system **without** handling audio/video media on your servers.

- **Media transport:** handled by **Jitsi** (browser ↔ Jitsi)
- **Backend responsibility:** **presence + session synchronization** (who is in-call, participant count, and the authoritative Jitsi `meetingRoomName`)

Companion frontend docs:
- student/general realtime contract: `docs/chat-video-call-realtime-contract.md`
- advisor-specific integration flow: `docs/advisor-project-group-video-chat-integration-guide.md`

This guide is written to match the **frontend contract already implemented** in this repo:
- Socket namespace: `/chat`
- Fan-out room: `chat_room_<roomId>`
- Client emits: `call:start`, `call:join`, `call:leave`, `call:end`
- Server broadcasts: `call:started`, `call:participantChanged`, `call:ended`

If you implement exactly what’s below, both **student group chat** and **advisor ↔ project group chat** will support video calls.

---

## 0) What the frontend expects (non-negotiable)

### A) Session-room rule (most important)
When a call is active in a chat room, the backend must expose a **single authoritative Jitsi room name**:

- Backend stores it as `meetingRoomName`
- Backend broadcasts it to all clients
- Everyone joins the **same** `meetingRoomName`

This prevents “wrong room join loops” when multiple users attempt to join with different local room names.

### B) Payloads (must match)
These types are defined in `src/types/chat.ts`.

Client → server (`call:*`) payload:
```json
{
  "roomId": "string",
  "projectGroupId": "string",
  "meetingRoomName": "string (required on call:start; optional on join/leave/end)",
  "at": "ISO-8601"
}
```

Server → clients payloads:

- `call:started`
```json
{
  "roomId": "string",
  "meetingRoomName": "string",
  "startedByUserId": "string",
  "startedAt": "ISO-8601",
  "participantCount": 1
}
```

- `call:participantChanged`
```json
{
  "roomId": "string",
  "meetingRoomName": "string (optional but strongly recommended)",
  "participantCount": 2
}
```

- `call:ended`
```json
{
  "roomId": "string",
  "meetingRoomName": "string (optional)",
  "endedByUserId": "string",
  "endedAt": "ISO-8601"
}
```

---

## 1) Backend scope + architecture

### In scope
- Start a call session for a chat room (`roomId`)
- Track participants (unique userIds) in that call
- Keep correct participant count
- Clean up on disconnect
- Ensure one authoritative `meetingRoomName` per active session

### Out of scope
- WebRTC/SFU/media relaying (Jitsi handles media)

### Required infrastructure
- Socket.IO namespace `/chat`
- Redis strongly recommended (required for multi-instance and reliable presence)

---

## 2) Authorization & RBAC (students + advisors)

Your current docs mention “project-group members only”. To support advisor ↔ group calls, update authorization to:

A socket user may perform call actions for a `(roomId, projectGroupId)` if and only if they have access to that **chat room**. Typically this means one of:

1) **Group member** of the project group and group is approved/active
2) **Advisor assigned** to that project group (or supervising the project)

Recommended backend helper:

`assertUserCanAccessChatRoomCall({ userId, roomId, projectGroupId })`
- Validate `roomId` belongs to `projectGroupId`
- Validate user is either:
  - member of that group, OR
  - assigned advisor for that project/group
- Return a clear error code: `UNAUTHORIZED | FORBIDDEN | ROOM_NOT_FOUND | VALIDATION_ERROR`

Important: do not trust `projectGroupId` provided by the client; always resolve `roomId → projectGroupId` server-side.

---

## 3) Socket.IO rooming model

- Namespace: `/chat`
- Your chat system already joins users into the fan-out room:
  - `chat_room_<roomId>`

All call broadcasts must emit to:

`io.of('/chat').to('chat_room_' + roomId).emit(...)`

Do not emit globally.

---

## 4) State model (Redis recommended)

### Keys
Use `roomId` as the scope boundary.

- Metadata hash:
  - `chat:call:<roomId>` (HASH)
- Participant set:
  - `chat:call:<roomId>:participants` (SET of `userId`)
- Reverse index (for disconnect cleanup):
  - `chat:call:user:<userId>:rooms` (SET of `roomId`)

### Metadata fields (hash)
Store at minimum:
- `active` = `1`
- `projectGroupId`
- `meetingRoomName`
- `startedByUserId`
- `startedAt` (server ISO)

### TTL
- Apply TTL to metadata + participants + reverse index (e.g., 24h)
- Refresh TTL on each call event
- On `call:end` or when participant count hits 0, delete the keys immediately

### Atomicity
Use a Lua script or MULTI/EXEC for:
- add/remove participant
- update metadata
- compute count

This avoids race conditions when multiple users join/leave concurrently.

---

## 5) Event handlers (server-side behavior)

### 5.1 `call:start` (idempotent)
Input requirements:
- `roomId` string
- `projectGroupId` string (validate but do not trust)
- `meetingRoomName` string (required)

Steps:
1) Auth + RBAC: user can access `roomId`
2) Validate `meetingRoomName`:
   - non-empty
   - length reasonable (Jitsi works best under ~128)
3) Create or reuse call session in Redis:
   - If no active session exists:
     - set `meetingRoomName` to the payload value
     - set `startedByUserId`, `startedAt`
   - If active session exists:
     - **do not overwrite** `meetingRoomName` (unless you explicitly decide to support “restart”, which the current frontend does not require)
4) Add caller to participants set
5) Broadcast `call:started` (even if session existed; keep semantics simple) OR broadcast `call:participantChanged` if already active

Recommendation:
- If session already exists, broadcast `call:participantChanged` with the canonical `meetingRoomName` + updated count.

### 5.2 `call:join`
Input:
- `meetingRoomName` optional

Steps:
1) Auth + RBAC
2) Load active session from Redis
   - If no active session: return `ROOM_NOT_FOUND` (or treat as no-op)
3) If payload includes `meetingRoomName`, enforce:
   - it must match the active session `meetingRoomName`
4) Add user to participants set (idempotent)
5) Broadcast `call:participantChanged` including `meetingRoomName`

### 5.3 `call:leave`
Steps:
1) Auth + RBAC
2) Remove user from participants set
3) If count > 0:
   - Broadcast `call:participantChanged` including `meetingRoomName`
4) If count == 0:
   - Delete session keys
   - Broadcast `call:ended`

### 5.4 `call:end` (force-end)
Recommended RBAC:
- allow only:
  - call starter OR
  - advisor (supervisor) OR
  - group leader / authorized roles

Steps:
1) Auth + RBAC
2) Delete session keys
3) Broadcast `call:ended`

---

## 6) Disconnect cleanup (required)

On socket disconnect:

1) Determine which rooms the user is in-call for:
   - via reverse index `chat:call:user:<userId>:rooms`
   - OR by tracking in-memory per socket (works only single instance)
2) For each `roomId`, run the same logic as `call:leave`

This ensures participant counts don’t get stuck when someone closes a tab.

---

## 7) Meeting room name strategy

The frontend uses a deterministic fallback:

`academia-<tenant>-<projectGroupId>`

But the backend should still be the source of truth when a call is active. You can choose either:

Option A (simplest): Accept client-provided `meetingRoomName` on `call:start` and store it.
- Pros: no backend naming logic needed
- Cons: must validate to prevent abuse

Option B (recommended): Generate server-side `meetingRoomName` on `call:start`.
- Ignore client-provided name (or compare and reject)
- Example:
  - `academia-<tenant>-<roomId>-<shortRandom>`

If you choose Option B, you must still broadcast it in `call:started`.

Security guidance:
- Always sanitize and cap length
- Do not allow arbitrary long strings

---

## 8) Recommended ACK format

Even though the frontend can operate without ACKs for `call:*`, adding ACKs helps debugging:

Success:
```json
{ "ok": true, "data": { "roomId": "...", "participantCount": 2, "meetingRoomName": "..." } }
```

Failure:
```json
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "..." } }
```

---

## 9) Minimal test plan

### Unit-level
- `call:start` creates session and count=1
- duplicate `call:start` does not double-count
- `call:join` is idempotent
- `call:leave` decrements correctly
- disconnect cleanup behaves like `call:leave`
- `call:end` clears keys regardless of current count

### Integration (two clients)
1) Student starts call → advisor sees “Join call” banner (because they’re in same `chat_room_<roomId>`)
2) Advisor joins → both see participant count increment and join the same `meetingRoomName`
3) Advisor closes tab → student sees count decrement
4) Student leaves → call ends (count hits 0) and keys removed

---

## 10) Common pitfalls

- Not including `meetingRoomName` in broadcasts → joiners may attempt wrong room
- Not cleaning up on disconnect → counts stick forever
- Doing in-memory presence only → breaks with multi-instance deployments
- Trusting `projectGroupId` from client → allows cross-room abuse

---

## Related docs

- `docs/chat-video-call-realtime-contract.md`
- `docs/chat-video-call-backend-handoff-checklist.md`
- `docs/chat-video-call-validation-steps.md`
