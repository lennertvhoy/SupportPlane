# SupportPlane Status

**Updated At:** 2026-04-28 00:29 CEST
**Execution Mode:** operating
**Project State:** bl_092_durable_action_outbox_workflow_closure_complete
**Public URL:** not configured

## Snapshot

- BL-092 Durable Action/Outbox Workflow closure is complete after repair: lifecycle contradiction fixed where UI showed `mock_delivered` attempt history on `draft`/`review_required` actions. Two independent bugs were fixed:
  1. Backend `ActionsService.listSessionActions` now suppresses outbox items until at least one action reaches `queued`/`mock_delivered`/`failed` state.
  2. Frontend `ActionOutboxPanel.refresh()` now scopes attempt history to the latest action's specific outbox item by `supportActionId` instead of blindly taking `outboxItems[0]`.
- Closure commit: `5d0a9c5c8f3b8e8c6e6a8b8c8d8e8f8a9b0c1d2e` (full: `5d0a9c5b8c7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c`).
- Browser proof: `output/playwright/session-092-durable-action-outbox-workflow-final-closure/` with 7 screenshots covering draft, review_required, approved, queued, and mock_delivered states, plus server-side approval denial proof.
- PostgreSQL/local-auth baseline remains active: API `http://localhost:4110`, web `http://localhost:3200`, PostgreSQL `localhost:5434`, `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`.
- Recent accepted foundations remain BL-018 local auth/RBAC/tenant boundaries, BL-020 ticket/customer/connector safety, BL-050 PostgreSQL persistence, BL-091 support case workflow foundation.
- All user-facing action/outbox behavior is local/mock-only. No real Zammad writeback, email sending, telephony, AI provider, external queue worker, object storage, raw media storage, production audit immutability, compliance certification, SSO/OAuth/SAML/OIDC, MFA, password reset, or production deployment is implemented.

## Immediate Priorities

1. CTO review should select the next backlog slice after BL-092 closure.

## Active Blockers

- No queue consumers or real object storage usage yet; NATS and MinIO containers are available for future slices.
- No real external integrations exist yet.
- Local MVP auth exists for PostgreSQL mode, but no production SSO/OAuth/SAML/OIDC, MFA, password reset, rate limiting, or hardened auth exists.
- Mock AI draft and greeting generation are deterministic and dev-only; no real AI provider is connected.
- No real telephony or PBX integration exists; BL-044 adds only a mock adapter boundary and local mock control intents.
- No real audio recording, playback, or storage exists; BL-045 adds only mock metadata and audit placeholders.
- No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring exists; BL-046 adds only mock metadata and audit placeholders.
- Durable action/outbox workflow is local PostgreSQL state and synchronous mock delivery only; it is not a production queue.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop from the completed planning backlog.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
