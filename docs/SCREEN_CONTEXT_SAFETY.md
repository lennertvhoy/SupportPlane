# Screen Context Safety

**Product:** SupportPlane  
**Scope:** BL-047/048/049 Screen Context Hardening Wave  
**Last updated:** 2026-04-27

## Purpose

This document states the safety boundaries for all screen-context features in SupportPlane. It exists so that operators, auditors, and future developers can verify that no surveillance-like behavior was introduced.

## What exists

- **Visible sharing indicator:** A per-session badge shows `Sharing: inactive`, `Sharing: active`, or `Sharing: paused`. The operator must explicitly start sharing.
- **Explicit controls:** Start, Pause, Resume, and Stop buttons transition sharing state. Invalid transitions are rejected.
- **Active-window metadata capture:** A form captures `appLabel`, `windowLabel`, `urlLabel`, and a free-text note. This is operator-entered/mock metadata only.
- **Manual screenshot metadata:** A form captures file name hint, app label, window label, and note. **Raw image retention is disabled** by default and hard-coded.
- **Structured observation upload:** Any `kind` can be uploaded with an explicit `source`. Content passes through pattern/placeholder redaction before storage.
- **Review gate:** Observations are created with `status: review_required`. They must be explicitly approved before an AI context packet can be created.
- **Redaction:** `redactPlaceholder()` and `redactString()` replace secret-like patterns with `[REDACTED]` and filesystem paths with `[REDACTED_PATH]`.
- **Evidence bundle integration:** Screen observations include `sharingState`, `rawImageRetention`, `redactionStatus`, `safetyFlags`, and honest mock disclaimers.

## What does not exist

- **No real screen capture:** No desktop, browser, or application content is captured.
- **No raw pixels:** `noRawPixels: true` is enforced. No bitmap, image, or encoded pixel data is stored.
- **No clipboard access:** `noClipboard: true` is enforced. No clipboard content is read.
- **No OCR:** `noOcr: true` is enforced. No optical character recognition is performed.
- **No credential capture:** `noCredentialCapture: true` is enforced.
- **No automatic or periodic capture:** All observations are explicit, manual actions.
- **No browser extension or native agent:** There is no desktop companion process, browser extension, or native OS integration in this slice.
- **No ambient surveillance:** Sharing state is per-session and must be explicitly activated.
- **No raw screenshot storage:** `rawImageRetention: disabled` is hard-coded.

## Redaction behavior

Before any observation text is stored or exported:

- Keys matching `apiToken`, `apiKey`, `authToken`, `password`, `secret`, `token`, `privateKey`, `credential`, `ZAMMAD_API_TOKEN`, etc. are replaced with `[REDACTED]`.
- Bearer/Token/Basic authorization strings are replaced with `[REDACTED]`.
- Long token-like strings (>20 chars) are replaced with `[REDACTED]`.
- Absolute filesystem paths (Unix `/path/to/file` and Windows `C:\path\to\file`) are replaced with `[REDACTED_PATH]`.

## Audit events

The following audit events record every sharing and capture action:

- `screen_observation_sharing_started`
- `screen_observation_sharing_paused`
- `screen_observation_sharing_stopped`
- `active_window_metadata_captured`
- `manual_screenshot_metadata_attached`
- `structured_screen_observation_uploaded`
- `screen_observation_redaction_applied`
- `screen_observation_reviewed`
- `screen_observation_discarded`
- `screen_observation_context_packet_created`
- `ai_context_loaded`

## Verification

1. Open the Call Console at `/call-console`.
2. Select a fake incoming call.
3. Observe the Operator Companion panel with the sharing indicator.
4. Click **Start mock sharing** and verify the badge changes to `Sharing: active`.
5. Use the capture forms and verify observations appear with `review_required` status.
6. Approve an observation and verify the **Create context packet** button appears.
7. Navigate to the Support Cockpit and verify the AI Context Quality panel shows the observation-derived packet with redaction status.
8. Generate an evidence bundle and verify the JSON does not contain raw secrets, tokens, paths, or image data.

## Known limitations

- Pattern-based redaction is not cryptographically guaranteed.
- All data is in-memory and lost on API restart.
- No real authentication; actor identity comes from mock dev headers.
- Screen observation summaries are operational review only, not surveillance or legal evidence.

## Future safe path

A future real Operator Companion should:

1. Be an explicit opt-in per session with a visible sharing indicator.
2. Capture active-window metadata only (window title, application name, URL) by default.
3. Require explicit user action for any screenshot or image capture.
4. Run as a separate desktop process with its own permission model.
5. Send structured observations through the same review gate before AI context packet creation.
6. Keep all redaction, audit, and evidence bundle behaviors unchanged.
