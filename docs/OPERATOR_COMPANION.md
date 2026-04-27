# Operator Companion

**Product:** SupportPlane  
**Scope:** BL-046 Operator companion screen observations during active calls  
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

- `kind`: `active_window`, `application`, `url`, `manual_note`, or `redacted_context`
- `appLabel`: optional free-text application name (e.g., "Zammad")
- `windowLabel`: optional free-text window title (e.g., "Ticket #12345")
- `urlLabel`: optional free-text URL label (e.g., "https://help.example.com/ticket/123")
- `rawInputPlaceholder`: optional operator-entered note text (max 4096 chars)
- `redactedSummary`: auto-generated redacted summary of the placeholder text
- Deterministic mock metadata: `source: mock_operator_companion`, `mockDevOnly: true`

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

## API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /support-sessions/:id/screen-observations/mock` | POST | Capture a mock screen observation for a session |
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

- `screen_observation_captured` — appended when a mock observation is created
- `screen_observation_reviewed` — appended when an observation is approved
- `screen_observation_discarded` — appended when an observation is discarded
- `screen_observation_context_packet_created` — appended when an approved observation is converted to an AI context packet
- `ai_context_loaded` — appended when the resulting context packet is saved to the session

Audit metadata includes `kind`, `source`, `mockDevOnly`, `noRawPixels`, `noClipboard`, `previousStatus`, `newStatus`, `reviewedBy`, `contextPacketId`, and `provenance`.

## UI flow

1. Open the Call Console at `http://localhost:3200/call-console`.
2. Link a support session to the selected call (or use a session already linked).
3. In the **Operator Companion** panel, select a `kind` and optionally enter `appLabel`, `windowLabel`, `urlLabel`, and a note.
4. Click **Capture mock observation**.
5. The observation appears in the list with status `review_required`.
6. Click **Approve** to mark it as reviewed.
7. Click **Create context packet** to convert the approved observation into an AI context packet.
8. Navigate to the Support Cockpit and select the same session.
9. The **AI Context Quality** panel shows the observation-derived packet with `provenance: screen_observation`.
10. The **Audit Trail** panel shows `screen_observation_captured`, `screen_observation_reviewed`, and `screen_observation_context_packet_created` events.
11. Generate an **Evidence Bundle** and verify the `screenObservations` section includes redacted summaries and mock disclaimers.

## Evidence bundle inclusion

Evidence bundles include a `screenObservations` array with:

- `observationId`, `sessionId`, `callEventId`
- `kind`, `status`, `source`
- `redactedSummary`
- `reviewStatus`
- `contextPacketId` (if created)
- `mockDevOnly`, `noRealScreenCapture`, `noRawPixels`, `noClipboardAccess`
- `complianceDisclaimer`

The Markdown renderer includes a dedicated **Screen Observations** section with the above fields and honest mock disclaimers.

## Known limitations

- **No real screen capture:** This is mock metadata only. No desktop, browser, or application content is captured.
- **No real pixels, clipboard, or OCR:** All safety flags are hard-coded to `true`.
- **In-memory store:** All observations are lost on API restart.
- **No real authentication:** Actor identity comes from mock dev headers.
- **Manual capture only:** There is no automatic or periodic capture.
- **Pattern-based redaction:** Not cryptographically guaranteed.
- **No compliance-grade evidence:** Screen observation summaries are operational review only, not surveillance or legal evidence.

## Future safe desktop/browser companion path

A future real Operator Companion should:

1. Be an explicit opt-in per session with visible sharing indicator.
2. Capture active-window metadata only (window title, application name, URL) by default, not raw pixels.
3. Require explicit user action for any screenshot or image capture.
4. Run as a separate desktop process (e.g., Tauri app) with its own permission model.
5. Send structured observations through the same review gate before AI context packet creation.
6. Keep all redaction, audit, and evidence bundle behaviors unchanged.
7. Never implement ambient surveillance, keylogging, or hidden capture.
