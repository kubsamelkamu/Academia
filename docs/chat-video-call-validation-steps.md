# Chat Video Call Validation Steps (Step 6)

Use this checklist to validate the session-room based video call flow end-to-end.

## Preconditions

- Frontend branch includes session-room updates.
- Backend implements `meetingRoomName` in `call:start` and `call:started`.
- Two test users exist in the same approved project group.
- Both users can open student chat page.

## A. Single-user sanity checks

1. Open student chat and click video icon.
2. Prejoin opens and shows:
   - room name
   - camera/mic device status
3. Click `Join call`.
4. Expected:
   - dialog transitions to joining/live states
   - Jitsi UI loads
   - no infinite joining state
5. Click `Leave call`.
6. Expected:
   - call closes cleanly
   - state returns to idle

## B. Two-user session-room validation

### B1: Caller starts session

1. User A clicks video and joins.
2. Verify backend emits `call:started` with:
   - `roomId`
   - `meetingRoomName`
   - `participantCount=1`

### B2: Joiner uses same session room

1. User B sees ongoing call banner.
2. User B clicks `Join call`.
3. Expected:
   - B uses backend session room (`meetingRoomName`), not stale deterministic fallback
   - no Jitsi login/lobby loop caused by wrong room reuse
4. Verify both users receive `call:participantChanged` with count increment.

### B3: Leave/End behavior

1. User B leaves.
2. Expected:
   - participant count decrements via `call:participantChanged`
3. User A leaves/end.
4. Expected:
   - `call:ended` emitted
   - session room state cleared on both clients

## C. Compatibility fallback checks

### C1: Ongoing call but missing `meetingRoomName`

1. Simulate delayed/missing `meetingRoomName` in incoming call events.
2. Expected frontend behavior:
   - banner shows syncing message
   - Join button disabled while syncing
   - prejoin explains session syncing

### C2: New call creation fallback

1. No active call in room.
2. Click video and join.
3. Expected:
   - creation flow still works using local resolved room until backend broadcast confirms session

## D. Device capability checks

1. Test on device with no camera.
2. Prejoin should show:
   - `Camera: Not detected`
   - guidance for audio-only join
3. Test on device with no microphone.
4. Prejoin should show listener guidance.

## E. Error expectations (non-blocking)

These warnings can be non-blocking and may be ignored if call functions correctly:
- `external_api.js: Unrecognized feature: 'speaker-selection'`
- Gravatar 404s
- Browser extension `ERR_FAILED` noise

## F. Pass criteria

- Users can start and join calls without getting stuck in join loop.
- Joiners connect to the same backend-provided `meetingRoomName` session.
- Ongoing-call UI does not allow unsafe joins before session room sync.
- Leave/end updates participant count and clears session state correctly.
