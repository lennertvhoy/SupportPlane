# Call Console

**Product:** SupportPlane  
**Scope:** BL-043 Call Console UI, extended by BL-044 Telephony Bridge boundary and BL-046 Operator Companion  
**Last updated:** 2026-04-27

## Purpose

The Call Console is a mock-only operator view for handling a simulated incoming
call after caller matching. It gathers recent fake calls, caller identity,
matched customer/ticket hints, linked support session context, mock lifecycle
controls, telephony bridge boundary status, greeting suggestions, and the call
timeline into one screen.

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
  6. Review the Telephony Bridge panel for mock mode and capability status.
  7. Review the linked support session.
  8. Use the Operator Companion panel to capture, review, and convert mock screen observations into AI context packets.
  9. Generate a mock AI greeting suggestion for operator review.
  10. Inspect the Call Timeline and generate an evidence bundle from the Support Cockpit.

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
| `/telephony/status` | GET | Return mock telephony bridge status/capabilities |
| `/telephony/test` | POST | Run deterministic mock bridge test |
| `/telephony/webhooks/fake-provider` | POST | Accept fake provider event and map to CallEvent |
| `/telephony/calls/:id/control` | POST | Apply mock telephony control intent to local state |
| `/support-sessions/:id/screen-observations/mock` | POST | Capture mock screen observation |
| `/support-sessions/:id/screen-observations` | GET | List observations for a session |
| `/support-sessions/:id/screen-observations/:observationId/review` | POST | Approve or discard an observation |
| `/support-sessions/:id/screen-observations/:observationId/context-packet` | POST | Create AI context packet from approved observation |
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
- `telephony_adapter_tested`
- `telephony_webhook_received`
- `telephony_webhook_verified`
- `telephony_call_control_requested`
- `telephony_call_control_succeeded`
- `telephony_call_control_failed`
- `greeting_suggestion_generated`
- `screen_observation_captured`
- `screen_observation_reviewed`
- `screen_observation_discarded`
- `screen_observation_context_packet_created`
- `evidence_bundle_generated`
- `evidence_bundle_exported`

Audit metadata includes mock/dev-only flags where applicable. Lifecycle events
record previous and new status.

## Telephony Bridge panel

BL-044 adds a small **Telephony Bridge** panel to the Call Console. It shows:

- provider type and adapter mode
- mock capability discovery
- webhook verification status
- mock/dev-only warning
- bridge test action and last test result
- fake provider webhook action
- last control intent/result

Required honest labels are preserved: "Telephony bridge boundary", "Mock mode",
"No real PBX connected", "No media or voice connected", and "Controls update
local mock state only".

## Operator Companion panel

BL-046 adds an **Operator Companion** panel to the Call Console when a call is
linked to a support session. It shows:

- mock screen observation safety disclaimers
- capture form with `kind`, `appLabel`, `windowLabel`, `urlLabel`, and note placeholder
- captured observation list with status badges (`review_required`, `approved`, `discarded`)
- **Approve** and **Discard** review buttons
- **Create context packet** button for approved observations
- honest mock labels: "Mock screen observation", "No real screen capture", "No raw pixels", "No clipboard access", "No OCR"

Required honest labels are preserved. See `docs/OPERATOR_COMPANION.md` for the
full feature documentation, API details, and future safe desktop/browser companion
path.

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
- `telephonyBridgeEvents` summaries for status/test, webhook, verification, and
  control audit events where present
- `auditTimeline` entries for call received, matched, linked, and status changes
- `greetingSuggestions` summaries with provider/model/prompt/context metadata
- mock telephony disclaimers
- mock AI disclaimers
- disabled auto-send and voice flags

The final BL-043 closure browser proof is in:

`output/playwright/session-043-call-console-ui-final-closure/`

The BL-044 telephony adapter boundary browser proof is in:

`output/playwright/session-044-telephony-adapter-boundary/`

The BL-046 Operator Companion canonical browser proof is in:

`output/playwright/session-046-operator-companion-closure-canonical/`

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
