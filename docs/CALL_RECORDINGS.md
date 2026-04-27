# Call Recordings

**Status:** Mock foundation only. No real audio capture, playback, or storage.

## What Exists

- `CallRecording` contract with `available`, `unavailable`, `redacted`, `deleted`, `mock_only` statuses.
- `CallRecordingSource`: `mock_generated` or `provider_placeholder`.
- `CallRecordingStorageType`: `none`, `mock_inline`, `future_object_storage`.
- Deterministic mock metadata derived from `callEventId` (no real audio generated).
- API endpoints:
  - `POST /calls/:id/recordings/mock` — attach mock recording metadata
  - `GET /calls/:id/recordings` — list recordings for a call
  - `POST /calls/:id/recordings/:recordingId/review` — mark as reviewed
  - `POST /calls/:id/recordings/:recordingId/playback` — record playback-opened audit event
- Audit events: `call_recording_attached`, `call_recording_reviewed`, `call_recording_playback_opened`.
- Evidence bundle includes `callRecordings` summaries and mock/no-real-audio disclaimers.
- Call Console UI panel: attach, list, playback placeholder, mark reviewed.

## What Does Not Exist

- Real audio recording, capture, or encoding.
- Real audio playback, streaming, or HTML5 `<audio>` element.
- TTS, STT, transcription, or voice processing.
- Object storage (MinIO/S3) integration.
- Queue-backed recording jobs.
- Real telephony provider recording hooks.
- Compliance-grade retention or cryptographic signing.

## Tenant Isolation

All recording endpoints enforce tenant isolation via `getCall(identity, callId)` before accessing recording data. Cross-tenant access returns 404.
