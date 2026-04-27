# Telephony Adapters

**Product:** SupportPlane  
**Scope:** BL-044 Telephony adapter boundary  
**Last updated:** 2026-04-27

## Purpose

The telephony adapter boundary defines how future PBX, WebRTC, and phone
provider integrations can enter SupportPlane without giving the browser direct
provider access. This BL-044 slice is a mock-only foundation. It does not
connect to a real phone system.

## Architecture boundary

- Contracts live in `packages/contracts/src/telephony.ts`.
- The adapter interface and mock implementation live in
  `packages/connectors/src/telephony-adapter.ts`.
- API endpoints live under `/telephony`.
- The current Call Console consumes the SupportPlane API only.
- Provider secrets are represented by future server-side references, not raw
  values in UI responses, audit metadata, or evidence bundles.

## Provider types

The contract currently models these provider types:

- `mock`
- `webhook_bridge`
- `sip_bridge`
- `webrtc_bridge`
- `teams_phone`
- `twilio`
- `threecx`
- `asterisk`

Only `mock` is implemented. The others are boundary placeholders for future
work and have no provider-specific endpoint behavior in this slice.

## Mock mode behavior

Mock mode is deterministic and credential-free:

- provider type: `mock`
- adapter mode: `mock`
- webhook verification: `not_required`
- inbound calls: supported
- answer, hold, resume, and end intents: supported against local mock state
- transfer, recording, and transcription: unsupported
- no network calls are made
- no media, voice, TTS, STT, recording, or transcription exists

## Webhook assumptions

The fake provider webhook accepts a generic provider event shape and normalizes
it into the existing `CallEvent` model. Signature verification is abstracted as
`TelephonyWebhookVerification`, but in mock mode it returns `not_required`.

Provider-specific webhook formats, headers, replay protection, canonical
signature algorithms, and endpoint details are intentionally deferred.

## Control intent model

Browser controls send a `TelephonyCallControlIntent` to the SupportPlane API.
The mock adapter maps supported intents to existing local lifecycle states:

| Intent | Local mock state |
|--------|------------------|
| `answer` | `answered` |
| `hold` | `on_hold` |
| `resume` | `answered` |
| `end` | `ended` |
| `transfer` | unsupported |

Controls update local mock state only. They do not control a PBX, SIP endpoint,
WebRTC peer, call queue, or external provider.

## Secret handling rules

- Do not store real provider secrets in this slice.
- Do not return tokens, signatures, Authorization headers, API keys, passwords,
  env values, or credential material to the browser.
- Audit metadata uses sanitized provider errors only.
- Evidence bundles pass metadata through redaction before export.
- Future real adapters must resolve secrets server-side through a secret
  reference boundary.

## Supported operations

| Operation | Endpoint | Status |
|-----------|----------|--------|
| Adapter status | `GET /telephony/status` | mock-only |
| Adapter test | `POST /telephony/test` | mock-only |
| Fake provider webhook | `POST /telephony/webhooks/fake-provider` | mock-only |
| Call control intent | `POST /telephony/calls/:id/control` | mock-only |

All endpoints require local dev identity headers: `x-tenant-id` and `x-user-id`.

## Unsupported operations

- Real Twilio, Teams Phone, 3CX, Asterisk, SIP, PBX, WebRTC, or VoIP calls.
- Voice media, TTS, STT, recording, transcription, or call queue control.
- Real provider authentication or secret storage.
- Queue-backed provider workflows.
- Production audit-grade telephony evidence.

## Audit events

BL-044 adds these audit event types:

- `telephony_adapter_tested`
- `telephony_webhook_received`
- `telephony_webhook_verified`
- `telephony_call_control_requested`
- `telephony_call_control_succeeded`
- `telephony_call_control_failed`

Metadata includes tenant ID, actor ID, provider type, adapter mode, external
call ID, call event ID, control intent, verification status, success/failure,
mock/dev-only marker, and sanitized error metadata where applicable.

## Evidence bundle inclusion

Evidence bundles can include:

- telephony provider status/test events
- fake webhook received/verification events
- call control requested/succeeded/failed events
- mock/dev-only disclaimers
- no-real-telephony disclaimers

This is operational review evidence only. BL-044 does not claim legal,
compliance-grade, or production telephony evidence.

## Future provider path

Future Twilio, Teams Phone, 3CX, Asterisk, SIP, and WebRTC work should plug into
the `TelephonyAdapter` interface, add provider-specific verification and
capability discovery, and keep browser controls routed through SupportPlane API
policy/audit boundaries. Provider-specific endpoint details remain intentionally
deferred until those integrations are explicitly scoped and verified.
