# Advisor Project Group Video Chat Validation Steps

Use this checklist to validate the advisor ↔ project-group session-room video call flow end-to-end.

## Preconditions

- Frontend branch includes the advisor chat/video integration flow.
- Backend implements advisor access for the supervised approved project-group room.
- Backend emits `meetingRoomName` in `call:started` and `call:participantChanged`.
- `CHAT_VIDEO_PRESENCE_ENABLED` is enabled on backend.
- Redis-backed presence is configured on backend.
- One advisor test user supervises the selected project.
- At least one approved project-group member can join the same room.

## A. Advisor room lookup checks

1. Open the advisor messages page for a supervised project.
2. Verify the frontend calls `GET /api/v1/project-groups/advisors/me/chat-room?projectId=<projectId>`.
3. Expected response includes:
   - `roomId`
   - `projectGroupId`
4. Expected behavior:
   - message history loads for that room
   - socket join is prepared with the returned `projectGroupId`

## B. Advisor socket join checks

1. Connect to the `/chat` namespace with the advisor JWT.
2. Emit `chat:join` with the returned `projectGroupId`.
3. Expected behavior:
   - backend joins the socket to `chat_room_<roomId>`
   - advisor starts receiving message, presence, typing, and call events for that room

## C. Advisor starts a call

1. From the advisor chat view, click the video call action.
2. Verify frontend emits `call:start` with:
   - `roomId`
   - `projectGroupId`
   - `meetingRoomName`
   - `at`
3. Expected backend behavior:
   - `call:started` is broadcast to `chat_room_<roomId>`
   - payload contains the authoritative `meetingRoomName`
   - `participantCount=1`
4. Expected frontend behavior:
   - advisor replaces any local fallback room with backend `meetingRoomName`
   - Jitsi joins the backend-provided room

## D. Project-group member joins advisor-started call

1. Open the same room as an approved project-group member.
2. Verify the member sees an ongoing-call state.
3. Join the call as the member.
4. Expected backend behavior:
   - `call:participantChanged` is broadcast with the same `meetingRoomName`
   - `participantCount` increments
5. Expected frontend behavior:
   - both advisor and group member stay on the same Jitsi room
   - no room mismatch or join-loop behavior appears

## E. Advisor joins an existing active call

1. Start a call first from an approved project-group member.
2. Open the advisor chat for that supervised project.
3. Join the active call as advisor.
4. Expected behavior:
   - advisor uses backend active `meetingRoomName`
   - backend emits `call:participantChanged`
   - participant count reflects all active users

## F. Leave behavior

1. While at least two participants are in the call, have one participant leave.
2. Expected behavior:
   - backend emits `call:participantChanged`
   - `participantCount` decrements correctly
   - remaining participant stays connected to the same session room
3. Have the last participant leave.
4. Expected behavior:
   - backend emits `call:ended`
   - session presence is cleared
   - frontend resets local call state

## G. Advisor force-end behavior

1. Start a call with at least one group member and the assigned advisor in the room.
2. Trigger `call:end` from the advisor UI.
3. Expected backend behavior:
   - active session is deleted
   - participant presence is cleared
   - `call:ended` is broadcast
4. Expected frontend behavior:
   - all clients exit the active-call state
   - local `meetingRoomName` state is cleared

## H. Disconnect cleanup

1. Join a call as advisor.
2. Close the advisor tab or simulate socket disconnect.
3. Expected backend behavior:
   - advisor is removed from participant presence automatically
   - `call:participantChanged` or `call:ended` is emitted depending on remaining count
4. Expected frontend behavior for remaining users:
   - participant count updates without manual refresh

## I. Authorization failures

1. Try opening advisor chat for a project not supervised by the advisor.
2. Try emitting call events for a mismatched `roomId` and `projectGroupId`.
3. Try force-ending a call as a user who is not the assigned advisor, call starter, or project-group leader.
4. Expected failures should map to one of:
   - `UNAUTHORIZED`
   - `FORBIDDEN`
   - `ROOM_NOT_FOUND`
   - `VALIDATION_ERROR`

## J. Pass criteria

- Advisor can resolve the supervised group chat room successfully.
- Advisor and approved project-group members receive the same call events in the same chat room.
- Backend-provided `meetingRoomName` remains the only active Jitsi room source of truth.
- Participant counts stay correct across join, leave, disconnect, and force-end flows.
- Unauthorized advisor access is rejected cleanly.