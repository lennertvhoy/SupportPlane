# BACKLOG - Strategic Roadmap

**Product:** SupportPlane
**Execution Mode:** operating
**Updated At:** 2026-04-26

## Purpose

This backlog tracks stable delivery slices for SupportPlane. Active work is
pulled into `NEXT_ACTIONS.md` and must reference these IDs.

## NOW

- [BL-001] Initialize the application monorepo scaffold for `apps/*`, `packages/*`, and `infra/*`.
- [BL-002] Define MVP 1 contracts and database model for SupportSession, AIContextPacket, TicketingAdapter, AuditEvent, and tenant scoping.
- [BL-003] Build a mock-first ticket-aware API slice for sessions, ticket context, AI context packets, and audit logging.

## NEXT

- [BL-004] Build the first Support Cockpit UI shell with session timeline, ticket context, AI context quality, and draft note panel.
- [BL-005] Add mock AI provider and model gateway abstraction with prompt/version/context hash metadata.
- [BL-006] Add local Docker Compose or Podman-compatible topology for web, API, worker, PostgreSQL, NATS, and MinIO.
- [BL-007] Add Zammad connector configuration, read operations, internal note draft/writeback, and connector audit events.
- [BL-008] Add evidence bundle skeleton and exportable JSON/Markdown MVP format.
- [BL-009] Add fake incoming call webhook and caller matching for MVP 2.

## MVP 0 - Foundation

- [BL-010] Initialize package manager, workspace config, TypeScript, linting, formatting, and test runner.
- [BL-011] Add repo health/version contract exposed by API and web builds.
- [BL-012] Add CI-equivalent local validation script for docs, types, lint, tests, and generated artifacts.
- [BL-013] Add environment configuration model with safe defaults, example env files, and secret redaction rules.
- [BL-014] Add shared error, pagination, ID, timestamp, and tenant-scoped envelope conventions.
- [BL-015] Add development fixture strategy for tenants, users, customers, tickets, sessions, and audit events.
- [BL-016] Initialize PostgreSQL, Prisma migrations, schema generation, and seed flow.

## MVP 1 - Ticket-Aware AI Cockpit

- [BL-017] Implement SupportSession persistence, status transitions, and timeline events.
- [BL-018] Implement Tenant, User, Role, Permission, and basic local-auth entities for MVP.
- [BL-019] Implement tenant-scoped query helpers and tests that catch cross-tenant leakage.
- [BL-020] Implement TicketReference, CustomerReference, and normalized ticket summary models.
- [BL-021] Implement TicketingAdapter interface with deterministic mock connector fixtures.
- [BL-022] Implement Zammad connector read path for customer lookup, recent tickets, and ticket details.
- [BL-023] Implement Zammad write path for internal notes and audited writeback outcomes.
- [BL-024] Implement AIContextPacket builder with customer, ticket, session, and policy context.
- [BL-025] Implement redaction layer for PII/secrets before model calls and logs.
- [BL-026] Implement model gateway with mock provider first and OpenAI/Azure OpenAI provider slots.
- [BL-027] Implement AI chat endpoint that stores messages, model metadata, and context hashes.
- [BL-028] Implement ticket summary generation with prompt template versioning.
- [BL-029] Implement draft internal note generation and human-reviewed writeback flow.
- [BL-030] Implement append-only AuditEvent writer with initial event types and hash-chain placeholder.
- [BL-031] Implement Support Cockpit session list, selected session view, and timeline.
- [BL-032] Implement AI Context Quality panel with loaded/missing/warning states.
- [BL-033] Implement ticket context panel for customer identity, related tickets, SLA/status placeholders, and prior resolutions.
- [BL-034] Implement AI chat and draft note panel with explicit review before writeback.
- [BL-035] Add API and UI smoke tests for the full mock MVP 1 flow.
- [BL-036] Add runtime identity endpoint and UI-visible build/session proof for acceptance.
- [BL-037] Create MVP 1 acceptance freeze after verified demo flow is accepted.

## MVP 2 - Call Simulator

- [BL-038] Implement canonical CallEvent model and event ingestion endpoint.
- [BL-039] Implement fake incoming call webhook with signed/testable payloads.
- [BL-040] Implement phone normalization and customer matching by phone.
- [BL-041] Implement automatic SupportSession creation from incoming call events.
- [BL-042] Implement suggested greeting generation from call plus ticket context.
- [BL-043] Implement Call Console UI with caller, matched customer, recent tickets, and notes.
- [BL-044] Implement telephony adapter contract and bridge boundary for future PBX/WebRTC/phone-provider integration.
- [BL-045] Add call simulator demo fixtures and end-to-end smoke test.

## MVP 3 - Operator Companion

- [BL-046] Scaffold Tauri operator companion with explicit start/stop sharing state.
- [BL-047] Implement active-window metadata capture and visible sharing indicator.
- [BL-048] Implement manual screenshot-to-session capture with raw image retention disabled by default.
- [BL-049] Implement local redaction placeholder and structured ScreenObservation upload.
- [BL-050] Implement screen observation API, persistence, timeline event, and audit event.
- [BL-051] Implement AI screen summary flow using structured observations.
- [BL-052] Implement cockpit screen context panel and AI Context Quality integration.
- [BL-053] Add privacy/consent checks and operator-companion acceptance evidence.

## MVP 4 - Endpoint Agent Read-Only Diagnostics

- [BL-054] Scaffold Go endpoint agent with build targets for Windows, Linux, and macOS.
- [BL-055] Implement agent registration, device identity, and outbound-only connection model.
- [BL-056] Implement heartbeat, version reporting, and device inventory basics.
- [BL-057] Implement read-only diagnostics for disk, network, service status, and installed software inventory.
- [BL-058] Implement endpoint command/result protocol with replay protection.
- [BL-059] Implement Device Console UI with known endpoints, status, diagnostics, and action history.
- [BL-060] Add endpoint agent integration tests against local API fixtures.

## MVP 5 - Approval-Gated Remediation

- [BL-061] Implement ToolManifest schema, signing/validation placeholder, and tool registry.
- [BL-062] Implement policy engine for role, tenant, device group, risk level, and tool allowlist checks.
- [BL-063] Implement approval request lifecycle, manager approval/rejection, and timeout behavior.
- [BL-064] Implement read-only tool invocation flow with audit events and before/after summaries.
- [BL-065] Implement low-risk tools: flush DNS, restart approved service, and clear temp directory.
- [BL-066] Implement execution gateway dispatch to endpoint agent fixed implementations only.
- [BL-067] Implement tool result summarization and ticket note draft from remediation outcome.
- [BL-068] Add remediation safety tests proving arbitrary shell is blocked.

## Integrations After MVP

- [BL-069] Add GLPI connector for assets, users, ITIL tickets, and configuration items.
- [BL-070] Add Asterisk/FreePBX CTI gateway behind SupportPlane API rather than direct browser access.
- [BL-071] Add MeshCentral device context and remote session launch metadata.
- [BL-072] Add Fortinet read-only connector only after screen-context workflow is proven.
- [BL-073] Add knowledge source ingestion for KB articles, known issues, and ticket-history summaries.
- [BL-074] Add pgvector-backed retrieval after plain PostgreSQL/search needs are proven.

## Admin, Governance, And Compliance Evidence

- [BL-075] Build Admin users, roles, teams, tenants, and connector installation screens.
- [BL-076] Build policy editor for tools, risk levels, approvals, model policies, and retention settings.
- [BL-077] Build audit explorer with filtering by tenant, session, actor, decision, target, and event type.
- [BL-078] Build evidence bundle viewer with timeline, AI context used, actions proposed, approvals, blocked actions, and writebacks.
- [BL-079] Add evidence export to JSON and Markdown, then PDF later.
- [BL-080] Add model usage log with provider, model, prompt version, hashes, latency, token usage, and cost estimate.
- [BL-081] Add tenant-level prompt/output retention controls.
- [BL-082] Add GDPR-oriented export/delete request groundwork without overclaiming compliance.

## Production Hardening

- [BL-083] Add OIDC-ready auth, MFA hooks, service accounts, and short-lived connector tokens.
- [BL-084] Add secrets encryption, secret references, and server-side credential broker boundaries.
- [BL-085] Add OpenTelemetry traces, structured logs, metrics, and correlation IDs.
- [BL-086] Add rate limits, request validation, body limits, and audit coverage for API gateway paths.
- [BL-087] Add backup/restore runbook for PostgreSQL, object storage, and configuration.
- [BL-088] Add Kubernetes manifests after Docker Compose topology is stable.
- [BL-089] Add threat-model review checkpoints and security regression tests.
- [BL-090] Add release packaging, demo dataset reset, and operator deployment documentation.

## Cross-cutting Workflow Integration

- [BL-091] End-to-end support case workflow foundation. Unify ticket summary API, ticket/session linking, caller-to-customer matching, unified case timeline, connector validate/test endpoints, deterministic local-only support note draft, and evidence bundle provenance into a coherent operator cockpit. Honest mock/local labels throughout. No real telephony, Zammad writeback, AI provider, or production deployment claims.

## WATCHLIST

- AI tool execution must stay policy-gated and auditable.
- Tenant scoping must be designed into schemas and query helpers from the first database slice.
- Zammad/GLPI/PBX claims stay planning claims until integration tests run against real or fixture-backed instances.
- Do not let screen capture become ambient surveillance; explicit active-window sharing is the default.
- Do not add arbitrary shell execution in v1.
- Keep `NEXT_ACTIONS.md` active-only even though this backlog is intentionally broad.
