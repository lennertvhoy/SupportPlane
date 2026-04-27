# Call Console

**Product:** SupportPlane  
**Scope:** BL-043 Call Console UI  
**Last updated:** 2026-04-27

## Purpose

The Call Console is a mock-only operator view for handling a simulated incoming
call after caller matching. It gathers recent fake calls, caller identity,
matched customer/ticket hints, linked support session context, mock lifecycle
controls, greeting suggestions, and the call timeline into one screen.

## Route / UX flow

- Route: `/call-console`
- Support Cockpit navigation: the Support Cockpit has a **Call Console** button.
- Call Console navigation: the Call Console has a **Support Cockpit** button and
  linked sessions expose **Open in cockpit**.
- Typical local flow:
  1. Create a fake incoming call through the Call Simulator or `POST /calls/fake-incoming`.
  2. Open `/call-console`.
  3. Select the fake incoming call from **Recent fake incoming calls**.
  4. Review caller identity, matched customer, and recent ticket hints.
  5. Use mock lifecycle controls to answer, hold, resume, or end the call.
  6. Review the linked support session.
  7. Generate a mock AI greeting suggestion for operator review.
  8. Inspect the Call Timeline and generate an evidence bundle from the Support Cockpit.

## Mock call lifecycle states

Current states:

- `ringing`
- `answered`
- `on_hold`
- `missed`
- `ended`

## Allowed status transitions

Allowed transitions are intentionally narrow and enforced by the API:

| From | To |
|------|----|
| `ringing` | `answered` |
| `ringing` | `missed` |
| `answered` | `on_hold` |
| `answered` | `ended` |
| `on_hold` | `answered` |
| `on_hold` | `ended` |

The `on_hold` to `answered` transition is displayed in the timeline as
`call_resumed`.

## API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/calls/recent` | GET | List recent tenant-scoped fake calls |
| `/calls/:id` | GET | Load one fake call |
| `/calls/:id/status` | POST | Apply an allowed mock lifecycle status transition |
| `/calls/:id/timeline` | GET | Return deterministic call timeline items |
| `/calls/:id/link-session` | POST | Link a call to an existing SupportSession |
| `/support-sessions/:id/greeting-suggestion` | POST | Generate mock AI greeting suggestion |
| `/support-sessions/:id/evidence-bundle` | GET | Generate JSON evidence bundle |
| `/support-sessions/:id/evidence-bundle.md` | GET | Generate Markdown evidence bundle |

All endpoints require dev identity headers in local mode: `x-tenant-id` and
`x-user-id`.

## Audit events emitted

The Call Console and underlying call flow use these audit events:

- `call_event_received`
- `caller_matched`
- `call_linked_to_session`
- `call_auto_linked_to_session`
- `support_session_auto_created`
- `call_status_changed`
- `greeting_suggestion_generated`
- `evidence_bundle_generated`
- `evidence_bundle_exported`

Audit metadata includes mock/dev-only flags where applicable. Lifecycle events
record previous and new status.

## Greeting suggestion integration

When a call is linked to a support session, the Call Console can call
`POST /support-sessions/:id/greeting-suggestion` with a selected tone and
`callEventId`. The returned suggestion is displayed with:

- greeting text
- provider and model
- prompt version
- context hash
- tone
- auto-send disabled state
- voice disabled state

The greeting is never spoken or sent automatically. It is deterministic mock AI
output for operator review only.

## Evidence bundle inclusion

Evidence bundles include BL-043 call-console proof through:

- `callEvents` summaries for linked calls
- `auditTimeline` entries for call received, matched, linked, and status changes
- `greetingSuggestions` summaries with provider/model/prompt/context metadata
- mock telephony disclaimers
- mock AI disclaimers
- disabled auto-send and voice flags

The final BL-043 closure browser proof is in:

`output/playwright/session-043-call-console-ui-final-closure/`

## Known limitations

- No real phone, PBX, SIP, WebRTC, or telephony provider is connected.
- No voice, TTS, or STT exists.
- No real AI provider call is made.
- No real authentication exists; local dev identity headers are used.
- No real database persistence exists; call/session data is in memory.
- No queue-backed lifecycle processing exists.
- No object storage is used for evidence bundles.
- No real Zammad call is made from this flow.
- No production deployment or production call-center integration exists.

## Future real telephony path

The future real telephony path should add a server-side CTI gateway before any
browser-facing call control is accepted. Asterisk/FreePBX or another PBX should
connect to SupportPlane through a backend adapter with tenant scoping, event
signature verification, replay protection, audit events, and policy checks. The
browser should continue to consume SupportPlane API state rather than directly
controlling a PBX.
