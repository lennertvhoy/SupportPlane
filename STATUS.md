# SupportPlane Status

**Updated At:** 2026-04-28 17:30 CEST
**Execution Mode:** operating
**Project State:** bl_097_credential_reference_foundation_accepted
**Public URL:** not configured

## Snapshot

- BL-097 is **accepted**. Credential reference foundation implemented: `ConnectorCredentialReference` Prisma model with tenant scoping, CRUD API endpoints (`/credential-references`), link/unlink endpoints on connector installations, RBAC permissions (`credential_reference:read`, `credential_reference:write`), web UI credential reference display with link/unlink selector, and evidence bundle inclusion.
- `secretRef` is always an opaque local-dev placeholder (`local-dev-opaque-placeholder-NOT-A-REAL-SECRET`). All API responses redact `secretRef` to `[REDACTED]`. Evidence bundles never include secret values.
- Admin can link/unlink credential references to connector installations; viewer sees read-only credential reference list. Server-side enforcement denies viewer write operations with 403.
- ConnectorInstallation `secretReferenceIds` array references credentials by ID. No plain JSON secrets stored in installation config.
- Audit events track credential reference lifecycle: `credential_reference_created`, `credential_reference_updated`, `credential_reference_linked`, `credential_reference_unlinked`.
- BL-095 remains accepted. Connector installation settings foundation with editable safe fields, RBAC gating, config secret redaction, and mock-only safety.
- BL-094 delivery policy controls remain accepted. All delivery decisions still return `realNetworkAllowed: false`.
- PostgreSQL/local-auth baseline remains active: API `http://localhost:4110`, web `http://localhost:3200`, PostgreSQL `localhost:5434`, `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`.

## Immediate Priorities

1. Review backlog for next slice; no active blockers.

## Active Blockers

- Worker foundation is local process/API driven only; no production queue semantics, external broker-backed queue, or real writeback exists.
- No real external integrations exist yet.
- Local MVP auth exists for PostgreSQL mode, but no production SSO/OAuth/SAML/OIDC, MFA, password reset, rate limiting, or hardened auth exists.
- Mock AI draft and greeting generation are deterministic and dev-only; no real AI provider is connected.
- No real telephony or PBX integration exists.
- No real audio recording, playback, or storage exists.
- No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring exists.
- Durable action/outbox workflow is local PostgreSQL state and synchronous mock delivery only.
- Delivery policy controls enforce mock-only safety but do not implement real writeback readiness.
- No production credential broker or encrypted secret storage exists; `secretRef` values are local-dev opaque placeholders only.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
