# SupportPlane Status

**Updated At:** 2026-04-28 00:08 CEST
**Execution Mode:** operating
**Project State:** bl_092_durable_action_outbox_workflow_foundation_complete_pending_cto_review
**Public URL:** not configured

## Snapshot

- BL-092 Durable Action/Outbox Workflow Foundation complete pending CTO review: PostgreSQL-backed support actions, action outbox items, attempts, review/approval state, idempotency keys, mock delivery state, audit events, case timeline entries, evidence bundle provenance, and cockpit Action Center UX. Implementation commit: `6819301fa5af04a6b02bbe6af532ae669e7a880a`.
- BL-091 repair gate is complete: `internal_note_drafts` is represented in `prisma/schema.prisma` and committed migration `20260427124815_init_persistence_foundation`; AGENTS.md now forbids closure with hidden manual database drift. Local DB drift was cleared with `npx prisma migrate reset --force`, followed by seed and migration-status proof.
- PostgreSQL/local-auth baseline remains active: API `http://localhost:4110`, web `http://localhost:3200`, PostgreSQL `localhost:5434`, `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`.
- Current browser proof for BL-092 is in `output/playwright/session-092-durable-action-outbox-workflow-foundation/` with 17 screenshots covering login, session/ticket context, action create/submit/approval/queue/mock delivery, viewer read-only controls, evidence bundle, audit trail, and API-restart persistence.
- Recent accepted foundations remain BL-018 local auth/RBAC/tenant boundaries, BL-020 ticket/customer/connector safety, BL-050 PostgreSQL persistence, and BL-091 support case workflow foundation.
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
