# SupportPlane Status

**Updated At:** 2026-04-27 18:40 CEST
**Execution Mode:** operating
**Project State:** bl_020_ticket_context_connector_safety_foundation_complete_pending_cto_review
**Public URL:** not configured

## Snapshot

- BL-020 Ticket Context and Connector Safety Foundation complete: Prisma schema adds `CustomerReference`, `TicketSummary`, and `ConnectorInstallation` models with tenant scoping and relations; migration `20260427160804_ticket_context_connector_safety_foundation` applied; contracts `customer.ts` and `connector-installation.ts` added; Store interface extended with `saveCustomerReference`, `getCustomerReference`, `listCustomerReferences`, `saveConnectorInstallation`, `getConnectorInstallation`, `listConnectorInstallations`; `PrismaStore` and `InMemoryStore` implementations; `CustomersModule` with `GET /customers` and `GET /customers/:id`; `ConnectorInstallationsModule` with `GET /connector-installations` and `GET /connector-installations/:id`; RBAC permissions `customer:read/write` and `connector_installation:read/test`; evidence bundle builder includes `customerReferences` and `connectorInstallations` sections with redaction; web API client updated with new types and methods; `CustomerReferencePanel` and updated `ConnectorPanel` with installations list; `EvidenceBundlePanel` shows Customers and Connectors counts; seed data includes demo customers (Acme BVBA), tickets, and connector installations for both tenants; browser proof in `output/playwright/session-020-ticket-context-connector-safety-foundation/` with 13 screenshots. All new entities default to `mockDevOnly: true`. No real production Zammad, telephony, AI, or object storage is implemented.
- BL-018 Local Auth/RBAC/Tenant Boundary Foundation complete: PostgreSQL local auth schema/migration adds `User.passwordHash` and `LocalAuthSession`, seed creates demo tenants/users/roles, `SUPPORTPLANE_AUTH_MODE=local` requires local login/session cookies and ignores arbitrary identity headers, API resolves current actor/tenant/roles server-side, RBAC checks are enforced across support sessions/calls/telephony/recordings/observations/context/evidence/audit/connector routes, UI adds local login/logout and visible user/tenant/role indicator, viewer/operator/admin differences are browser-proven in `output/playwright/session-018-auth-rbac-tenant-boundary-foundation/` with 13 screenshots. This is local MVP auth only, not production SSO/OAuth/SAML/OIDC or compliance-grade security.
- BL-050 PostgreSQL Persistence Foundation complete: Prisma schema extended with all MVP persistence models (SupportSession, CallEvent, CallRecording, ScreenObservation, ScreenObservationSharingState, TicketReference, AIContextPacket, AuditEvent, InternalNoteDraft), migration `20260427124815_init_persistence_foundation` applied, `PrismaStore` implementing full CRUD with async tenant-scoped queries, `StoreModule` runtime switching via `SUPPORTPLANE_STORE` env var (`memory` | `postgres`), all service methods converted from sync to async, evidence bundle schema updated with `storeType`/`persistenceClaimed`, restart-survival verification script passed confirming data persists across API restarts in PostgreSQL mode.
- BL-047/048/049 Screen Context Hardening Wave complete: explicit sharing-state storage and lifecycle (inactive→active→paused→stopped), deterministic active-window metadata capture, manual screenshot metadata capture (no raw pixels), structured observation upload, enhanced redaction with `redactPlaceholder()`, expanded `ScreenObservation` contract with `sharingState`/`rawImageRetention`/`redactionStatus`/`safetyFlags`, 5 new API endpoints, new audit event types, evidence bundle integration of all new fields, Call Console Operator Companion panel with visible sharing indicator and new capture forms, Support Cockpit AI Context Quality panel showing redaction status, and canonical 10-screenshot browser-verified final closure proof with no-secret/no-raw-image evidence. No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring exists.
- BL-046 closure complete: mock screen observation capture/list/review/context-packet endpoints, `ScreenObservation` contracts, observation audit events, evidence bundle `screenObservations` summaries, Call Console Operator Companion panel, Support Cockpit AI Context Quality panel showing observation-derived packets, and canonical 9-screenshot browser-verified closure proof. No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring exists.
- BL-045 closure complete: mock call recording attachment/list/review/playback endpoints, `CallRecording` contracts, recording audit events, evidence bundle `callRecordings` summaries, Call Console Mock Recording panel, and canonical 8-screenshot browser-verified closure proof. No real audio, storage, TTS, STT, or provider integration exists.
- BL-044 complete: mock-only telephony adapter contracts, connector boundary, `/telephony` API endpoints, telephony audit events, Call Console Telephony Bridge panel, evidence bundle telephony summaries, and final 8-screenshot browser proof. No real PBX, provider, media, voice, TTS, STT, recording, transcription, or production telephony integration exists.
- BL-041 through BL-043, BL-008, BL-009 complete: Zammad connector boundary, local Podman-compatible topology, mock AI gateway, Support Cockpit UI shell, mock-first NestJS API slice, fake incoming call webhook/caller matching, automatic SupportSession creation, suggested greeting generation, dedicated Call Console UI with lifecycle controls and timeline/audit panel, evidence bundle skeleton with JSON/Markdown export and redaction, and MVP 1 domain contracts/Prisma schema.

## Immediate Priorities

1. CTO review should select the next backlog slice after BL-018 closure.

## Active Blockers

- No queue consumers or real object storage usage yet; NATS and MinIO containers are available for future slices.
- No real external integrations exist yet.
- Local MVP auth exists for PostgreSQL mode, but no production SSO/OAuth/SAML/OIDC, MFA, password reset, rate limiting, or hardened auth exists.
- Mock AI draft and greeting generation are deterministic and dev-only; no real AI provider is connected.
- No real telephony or PBX integration exists; BL-044 adds only a mock adapter boundary and local mock control intents.
- No real audio recording, playback, or storage exists; BL-045 adds only mock metadata and audit placeholders.
- No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring exists; BL-046 adds only mock metadata and audit placeholders.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop from the completed planning backlog.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
