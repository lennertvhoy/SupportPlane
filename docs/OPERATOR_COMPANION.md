# Operator Companion

**Product:** SupportPlane  
**Scope:** BL-046 Operator companion screen observations during active calls, hardened by BL-047/048/049 Screen Context Hardening Wave  
**Last updated:** 2026-04-27

## Purpose

The Operator Companion provides a mock-only boundary for screen-context observations during active support calls. It lets an operator attach structured mock metadata about their active window, application, or URL to a SupportSession, review it before use, and convert approved observations into AI context packets. No real screen capture, raw pixels, clipboard access, or OCR is performed.

## Threat / safety boundary

- **No ambient surveillance:** Observations are explicit, manual captures only. There is no continuous monitoring.
- **No raw pixels:** `noRawPixels: true` is enforced by default. No image data is captured, stored, or transmitted.
- **No clipboard access:** `noClipboard: true` is enforced by default. No clipboard content is read.
- **No OCR:** `noOcr: true` is enforced by default. No optical character recognition is performed.
- **No credential capture:** `noCredentialCapture: true` is enforced by default.
- **Review gate required:** An observation must be explicitly approved before it can become an AI context packet.
- **Pattern redaction only:** Any placeholder text passes through the same redaction layer as other evidence bundle content.

## What is captured

- `kind`: `active_window`, `application`, `url`, `manual_note`, `redacted_context`, `screenshot_metadata`
- `appLabel`: optional free-text application name (e.g., "Zammad")
- `windowLabel`: optional free-text window title (e.g., "Ticket #12345")
- `urlLabel`: optional free-text URL label (e.g., "https://help.example.com/ticket/123")
- `rawInputPlaceholder`: optional operator-entered note text (max 4096 chars)
- `redactedSummary`: auto-generated redacted summary of the placeholder text
- Deterministic mock metadata: `source: mock_operator_companion`, `mockDevOnly: true`
- `sharingState`: `inactive`, `active`, or `paused` — explicit sharing indicator state per session
- `rawImageRetention`: `disabled` (hard-coded; no raw image storage)
- `redactionStatus`: `not_needed`, `placeholder_redacted`, `pattern_redacted`, or `blocked`
- `safetyFlags`: structured object with `mockDevOnly`, `noRealScreenCapture`, `noRawPixels`, `noClipboardAccess`, `noOcr`, `noCredentialCapture`, `rawImageStored`

## What is not captured

- Real screenshot images, bitmaps, or encoded pixel data
- Clipboard contents
- OCR-extracted text from the screen
- Automatic or periodic captures
- Credential or password content
- Desktop file listings, browser history, or system state

## Mock observation fixtures

The mock capture endpoint generates deterministic metadata:

- `status`: `review_required` on creation
- `noRawPixels`, `noClipboard`, `noOcr`, `noCredentialCapture`: all `true`
- `mockDevOnly`: `true`
- `createdAt`: current ISO timestamp
- `redactedSummary`: derived from `rawInputPlaceholder` with pattern redaction applied

## Redaction behavior

Before any observation placeholder text is stored or exported:

- Keys matching `apiToken`, `apiKey`, `authToken`, `password`, `secret`, `token`, `privateKey`, `credential`, `ZAMMAD_API_TOKEN`, etc. are replaced with `[REDACTED]`.
- Env-like values are redacted.
- Bearer/Token/Basic authorization strings are redacted.
- Long alphanumeric strings that look like tokens are redacted.

## Sharing state lifecycle

Each session has an explicit sharing state stored in the API:

- `inactive` → `active`: operator clicks **Start mock sharing**
- `active` → `paused`: operator clicks **Pause**
- `active` → `inactive`: operator clicks **Stop**
- `paused` → `active`: operator clicks **Resume**
- `paused` → `inactive`: operator clicks **Stop**

Invalid transitions are rejected with `400 Bad Request`. The current state is visible as a badge in the Operator Companion panel ("Sharing: active/paused/inactive").

## API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /support-sessions/:id/screen-observations/mock` | POST | Capture a legacy mock screen observation for a session |
| `POST /support-sessions/:id/screen-observations/active-window/mock` | POST | Capture deterministic active-window metadata (kind=`active_window`) |
| `POST /support-sessions/:id/screen-observations/manual-screenshot` | POST | Attach manual screenshot metadata (kind=`screenshot_metadata`, retention=`disabled`) |
| `POST /support-sessions/:id/screen-observations/structured-upload` | POST | Upload any structured observation with explicit kind/source |
| `GET /support-sessions/:id/screen-observations/sharing-state` | GET | Read current sharing state for the session |
| `POST /support-sessions/:id/screen-observations/sharing-state` | POST | Transition sharing state (start/pause/resume/stop) |
| `GET /support-sessions/:id/screen-observations` | GET | List tenant-scoped observations for a session |
| `POST /support-sessions/:id/screen-observations/:observationId/review` | POST | Approve or discard an observation |
| `POST /support-sessions/:id/screen-observations/:observationId/context-packet` | POST | Create an AI context packet from an approved observation |

All endpoints require dev identity headers in local mode: `x-tenant-id` and `x-user-id`.

### Capture request example

```http
POST /support-sessions/:id/screen-observations/mock
Content-Type: application/json
x-tenant-id: dev-tenant
x-user-id: dev-user

{
  "kind": "active_window",
  "appLabel": "Zammad",
  "windowLabel": "Ticket #101",
  "rawInputPlaceholder": "Operator sees ticket detail view"
}
```

### Review request example

```http
POST /support-sessions/:id/screen-observations/:observationId/review
Content-Type: application/json

{
  "status": "approved"
}
```

### Context packet request example

```http
POST /support-sessions/:id/screen-observations/:observationId/context-packet
Content-Type: application/json

{
  "provenance": "screen_observation"
}
```

A context packet can only be created if the observation status is `approved`.

## Audit events

- `screen_observation_captured` — appended when a legacy mock observation is created
- `screen_observation_sharing_started` — appended when sharing transitions from `inactive` to `active`
- `screen_observation_sharing_paused` — appended when sharing transitions from `active` to `paused`
- `screen_observation_sharing_stopped` — appended when sharing transitions to `inactive`
- `active_window_metadata_captured` — appended when active-window metadata is captured
- `manual_screenshot_metadata_attached` — appended when manual screenshot metadata is attached
- `structured_screen_observation_uploaded` — appended when a structured upload is received
- `screen_observation_redaction_applied` — appended when redaction is applied to an observation
- `screen_observation_reviewed` — appended when an observation is approved or discarded
- `screen_observation_discarded` — appended when an observation is discarded
- `screen_observation_context_packet_created` — appended when an approved observation is converted to an AI context packet
- `ai_context_loaded` — appended when the resulting context packet is saved to the session

Audit metadata includes `kind`, `source`, `mockDevOnly`, `noRawPixels`, `noClipboard`, `sharingState`, `redactionStatus`, `previousStatus`, `newStatus`, `reviewedBy`, `contextPacketId`, and `provenance`.

## UI flow

1. Open the Call Console at `http://localhost:3200/call-console`.
2. Link a support session to the selected call (or use a session already linked).
3. In the **Operator Companion** panel, click **Start mock sharing** to activate the visible sharing indicator.
4. Use **Active Window Metadata** to capture deterministic app/window/URL metadata.
5. Use **Manual Screenshot Metadata** to attach screenshot file metadata (no raw image stored).
6. Use **Structured Upload** to upload any structured observation with explicit kind.
7. Use **Legacy Mock Observation** to capture the original mock observation type.
8. Captured observations appear in the list with status `review_required`.
9. Click **Approve** to mark an observation as reviewed.
10. Click **Create context packet** to convert the approved observation into an AI context packet.
11. Click **Pause** or **Stop** to transition sharing state.
12. Navigate to the Support Cockpit and select the same session.
13. The **AI Context Quality** panel shows the observation-derived packet with `provenance: screen_observation`, `kind`, and redaction status.
14. The **Audit Trail** panel shows all new event types including `screen_observation_sharing_started`, `active_window_metadata_captured`, `manual_screenshot_metadata_attached`, etc.
15. Generate an **Evidence Bundle** and verify the `screenObservations` section includes `sharingState`, `rawImageRetention`, `redactionStatus`, `safetyFlags`, redacted summaries, and mock disclaimers.

## Evidence bundle inclusion

Evidence bundles include a `screenObservations` array with:

- `observationId`, `sessionId`, `callEventId`
- `kind`, `status`, `source`
- `sharingState`, `rawImageRetention`, `redactionStatus`
- `safetyFlags` (`mockDevOnly`, `noRealScreenCapture`, `noRawPixels`, `noClipboardAccess`, `noOcr`, `noCredentialCapture`, `rawImageStored`)
- `redactedSummary`
- `reviewStatus`
- `contextPacketId` (if created)
- `complianceDisclaimer`

The Markdown renderer includes a dedicated **Screen Observations** section with the above fields and honest mock disclaimers.

## Known limitations

- **No real screen capture:** This is mock metadata only. No desktop, browser, or application content is captured.
- **No real pixels, clipboard, or OCR:** All safety flags are hard-coded to `true`/`disabled`.
- **In-memory store:** All observations and sharing states are lost on API restart.
- **No real authentication:** Actor identity comes from mock dev headers.
- **Manual capture only:** There is no automatic or periodic capture.
- **Pattern-based redaction:** Not cryptographically guaranteed.
- **No compliance-grade evidence:** Screen observation summaries are operational review only, not surveillance or legal evidence.
- **Sharing state is session-scoped:** There is no global or per-user sharing state; each support session has its own independent sharing indicator.

## Future safe desktop/browser companion path

A future real Operator Companion should:

1. Be an explicit opt-in per session with visible sharing indicator.
2. Capture active-window metadata only (window title, application name, URL) by default, not raw pixels.
3. Require explicit user action for any screenshot or image capture.
4. Run as a separate desktop process (e.g., Tauri app) with its own permission model.
5. Send structured observations through the same review gate before AI context packet creation.
6. Keep all redaction, audit, and evidence bundle behaviors unchanged.
7. Never implement ambient surveillance, keylogging, or hidden capture.
