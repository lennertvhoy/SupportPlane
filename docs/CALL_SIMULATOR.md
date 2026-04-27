# Call Simulator

**Product:** SupportPlane  
**Scope:** BL-009 Fake incoming call webhook, BL-041 Automatic SupportSession creation from incoming call events, BL-043 Call Console handoff, and BL-044 Telephony Bridge boundary  
**Last updated:** 2026-04-27

## Purpose

The Call Simulator provides a mock-only development tool for testing the incoming call → caller matching → support session creation flow without any real telephony integration.

## Behavior

### Fake incoming call endpoint

```http
POST /calls/fake-incoming
Content-Type: application/json
x-tenant-id: dev-tenant
x-user-id: dev-user

{
  "externalCallId": "FAKE-1234567890123",
  "rawCallerNumber": "03 555 01 01",
  "callerDisplayName": "Mock Caller",
  "autoCreateSession": true,
  "preferredSessionTitle": "Optional custom title",
  "preferredPriority": "high"
}
```

### Response shape

```json
{
  "callEvent": { /* CallEvent object */ },
  "autoCreateResult": "auto_created",
  "createdSession": { /* SupportSession object, if auto-created */ },
  "mockDevOnly": true,
  "receivedAt": "2026-04-26T20:51:47.933Z"
}
```

### Auto-create results

| Result | Condition |
|--------|-----------|
| `not_requested` | `autoCreateSession` is missing or `false` |
| `auto_created` | `autoCreateSession: true` and caller matched with strong confidence |
| `skipped_no_match` | `autoCreateSession: true` but caller not in fixtures |
| `skipped_invalid_phone` | `autoCreateSession: true` but phone number failed normalization |

### Matched caller behavior

When a known fixture number is used (e.g., `+32 3 555 01 01`):

- Phone number is normalized to canonical form (`+32 3 555 01 01`)
- Caller is matched to deterministic fixture data (Acme BVBA → TICKET-101, TICKET-102)
- If `autoCreateSession: true`, a new `SupportSession` is created with:
  - Title derived from customer name or custom preference
  - Priority from preference or default `normal`
  - `linkedTicketIds` pre-seeded with matched ticket IDs
  - `callEventIds` containing the incoming call
- Call event is linked to the session and status changes to `answered`
- Audit events are appended: `support_session_auto_created`, `call_auto_linked_to_session`

### No-match behavior

When an unknown number is used (e.g., `+32 9 999 9999`):

- Phone normalization succeeds (if valid format)
- Caller match returns `no_match`
- Call event is stored but no session is created
- `autoCreateResult` returns `skipped_no_match`

### Invalid phone behavior

When an invalid number is used (e.g., `not-a-number`):

- Phone normalization fails
- Caller match returns `invalid_number`
- Call event is stored with the raw number
- `autoCreateResult` returns `skipped_invalid_phone`

## Audit events

The following audit events are emitted during the fake incoming call flow:

- `call_event_received` — always appended when a fake call is created
- `caller_matched` — appended when a known fixture matches
- `support_session_auto_created` — appended when auto-creation succeeds
- `call_auto_linked_to_session` — appended when the call is linked to the auto-created session
- `call_linked_to_session` — appended during manual link flow

## UI flow

1. Open the Support Cockpit at `http://localhost:3200`
2. In the Call Simulator panel, check "Auto-create support session on matched call"
3. Enter a Belgian fixture number (default: `03 555 01 01`)
4. Click **Simulate incoming call**
5. Observe the auto-create result badge (`auto_created`, `skipped_no_match`, etc.)
6. If matched and auto-created, an "Auto-created session" card appears with an **Open in cockpit** button
7. Click **Open in cockpit** to select the session
8. Observe the session header showing `Tickets: 2` (from matched fixtures)
9. Scroll to the Audit Trail to verify `support_session_auto_created` and `call_auto_linked_to_session` events
10. Generate an Evidence Bundle and verify the Call Events section includes the linked session

## Known limitations

- **No real telephony:** This is a mock webhook only. No PBX, SIP, WebRTC, or external provider is connected.
- **Belgian-style phone normalization only:** International numbers outside the `+32` heuristic will fail validation.
- **Fixture-based caller matching:** Caller data is hard-coded mock data, not a real CRM or directory.
- **In-memory store:** All call events and auto-created sessions are lost on API restart.
- **No real authentication:** Actor identity comes from mock dev headers (`x-tenant-id`, `x-user-id`).

## Reserved / future result values

`AutoCreateSessionResult` includes a `linked_to_existing` enum value. This is **reserved for future work** and is **not currently emitted** by `POST /calls/fake-incoming`. The current API only emits:

- `not_requested`
- `auto_created`
- `skipped_no_match`
- `skipped_invalid_phone`

Future implementation may allow an incoming call to link to an existing open session for the same matched caller instead of always creating a new one. Until that slice is implemented, `linked_to_existing` is a contract placeholder only.

## Greeting suggestion from matched calls

When a matched incoming call auto-creates or is linked to a support session, the operator can request a suggested greeting:

1. Select the session in the Support Cockpit.
2. Open the **Greeting Suggestion** panel.
3. Choose a tone: `professional`, `friendly`, or `concise`.
4. Click **Generate suggested greeting**.
5. Review the generated text, model metadata, and context hash.
6. Copy or manually edit the greeting before using it.

The greeting is never spoken or sent automatically. It is a mock-AI suggestion only.

## Call Console handoff

BL-043 adds a dedicated `/call-console` route for reviewing fake incoming calls
after they have been created by the simulator or API. The Call Simulator remains
the dev-only call creation tool; the Call Console is the operator-facing mock
handling view for selected calls.

The Call Console shows:

- recent fake incoming calls
- caller identity and deterministic fixture match data
- matched customer and recent ticket hints
- linked support session context
- mock lifecycle controls
- greeting suggestion generation
- call timeline/audit history
- navigation back to the Support Cockpit

See `docs/CALL_CONSOLE.md` for the BL-043 route, lifecycle states, endpoints,
audit events, evidence bundle behavior, and limitations.

## Telephony Bridge boundary

BL-044 adds a separate mock provider bridge at
`POST /telephony/webhooks/fake-provider`. It maps fake provider lifecycle events
into the same `CallEvent` flow used by the simulator, appends telephony bridge
audit events, and exposes mock control intents through
`POST /telephony/calls/:id/control`.

This remains mock-only. No real provider webhook, PBX, SIP, WebRTC, voice media,
recording, transcription, queue, or provider credential flow is connected.

## Future path after Call Console UI

BL-043 completes the first dedicated Call Console UI. Later call-simulator slices
include:

- **BL-045:** End-to-end call simulator demo fixtures and smoke tests

The current Call Simulator panel will remain as the dev-only mock tool even after the Call Console UI is introduced.
