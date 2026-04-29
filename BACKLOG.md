# BACKLOG - Strategic Roadmap

**Product:** SupportPlane
**Execution Mode:** operating
**Updated At:** 2026-04-29

## Purpose

This backlog tracks stable delivery slices for SupportPlane. Active work is
pulled into `NEXT_ACTIONS.md` and must reference these IDs.

Status markers:
- `[accepted]` — closure-grade complete with evidence and acceptance freeze
- `[partial/local-mock]` — implemented locally with mock-only safety labels
- `[superseded by BL-xxx]` — covered by a newer cross-cutting slice
- `[planned]` — not yet started
- `[blocked]` — blocked by dependency or external factor

---

## NOW — Accepted Foundation

- [BL-001] `[accepted]` Initialize the application monorepo scaffold for `apps/*`, `packages/*`, and `infra/*`.
- [BL-002] `[accepted]` Define MVP 1 contracts and database model for SupportSession, AIContextPacket, TicketingAdapter, AuditEvent, and tenant scoping.
- [BL-003] `[accepted]` Build a mock-first ticket-aware API slice for sessions, ticket context, AI context packets, and audit logging.

## NEXT — Accepted UI Shell & AI Gateway

- [BL-004] `[accepted]` Build the first Support Cockpit UI shell with session timeline, ticket context, AI context quality, and draft note panel.
- [BL-005] `[accepted]` Add mock AI provider and model gateway abstraction with prompt/version/context hash metadata.
- [BL-006] `[accepted]` Add local Docker Compose or Podman-compatible topology for web, API, worker, PostgreSQL, NATS, and MinIO.
- [BL-007] `[accepted]` Add Zammad connector configuration, read operations, internal note draft/writeback, and connector audit events.
- [BL-008] `[accepted]` Add evidence bundle skeleton and exportable JSON/Markdown MVP format.
- [BL-009] `[accepted]` Add fake incoming call webhook and caller matching for MVP 2.

## MVP 0 - Foundation `[accepted]`

- [BL-010] `[accepted]` Initialize package manager, workspace config, TypeScript, linting, formatting, and test runner.
- [BL-011] `[accepted]` Add repo health/version contract exposed by API and web builds.
- [BL-012] `[accepted]` Add CI-equivalent local validation script for docs, types, lint, tests, and generated artifacts.
- [BL-013] `[accepted]` Add environment configuration model with safe defaults, example env files, and secret redaction rules.
- [BL-014] `[accepted]` Add shared error, pagination, ID, timestamp, and tenant-scoped envelope conventions.
- [BL-015] `[accepted]` Add development fixture strategy for tenants, users, customers, tickets, sessions, and audit events.
- [BL-016] `[accepted]` Initialize PostgreSQL, Prisma migrations, schema generation, and seed flow.

## MVP 1 - Ticket-Aware AI Cockpit

- [BL-017] `[superseded by BL-091]` Implement SupportSession persistence, status transitions, and timeline events.
- [BL-018] `[accepted]` Implement Tenant, User, Role, Permission, and basic local-auth entities for MVP.
- [BL-019] `[superseded by BL-091]` Implement tenant-scoped query helpers and tests that catch cross-tenant leakage.
- [BL-020] `[accepted]` Implement TicketReference, CustomerReference, and normalized ticket summary models.
- [BL-021] `[superseded by BL-091]` Implement TicketingAdapter interface with deterministic mock connector fixtures.
- [BL-022] `[partial/local-mock]` Implement Zammad connector read path for customer lookup, recent tickets, and ticket details. (mock-only fixtures)
- [BL-023] `[partial/local-mock]` Implement Zammad write path for internal notes and audited writeback outcomes. (mock-only, no real writeback)
- [BL-024] `[superseded by BL-091]` Implement AIContextPacket builder with customer, ticket, session, and policy context.
- [BL-025] `[partial/local-mock]` Implement redaction layer for PII/secrets before model calls and logs. (pattern-based redaction)
- [BL-026] `[partial/local-mock]` Implement model gateway with mock provider first and OpenAI/Azure OpenAI provider slots. (mock-only)
- [BL-027] `[partial/local-mock]` Implement AI chat endpoint that stores messages, model metadata, and context hashes. (mock-only)
- [BL-028] `[partial/local-mock]` Implement ticket summary generation with prompt template versioning. (mock-only)
- [BL-029] `[partial/local-mock]` Implement draft internal note generation and human-reviewed writeback flow. (mock-only)
- [BL-030] `[accepted]` Implement append-only AuditEvent writer with initial event types and hash-chain placeholder.
- [BL-031] `[superseded by BL-091]` Implement Support Cockpit session list, selected session view, and timeline.
- [BL-032] `[superseded by BL-091]` Implement AI Context Quality panel with loaded/missing/warning states.
- [BL-033] `[superseded by BL-091]` Implement ticket context panel for customer identity, related tickets, SLA/status placeholders, and prior resolutions.
- [BL-034] `[superseded by BL-091]` Implement AI chat and draft note panel with explicit review before writeback.
- [BL-035] `[superseded by BL-091]` Add API and UI smoke tests for the full mock MVP 1 flow.
- [BL-036] `[accepted]` Add runtime identity endpoint and UI-visible build/session proof for acceptance.
- [BL-037] `[accepted]` Create MVP 1 acceptance freeze after verified demo flow is accepted.

## MVP 2 - Call Simulator

- [BL-038] `[superseded by BL-043/BL-044]` Implement canonical CallEvent model and event ingestion endpoint.
- [BL-039] `[superseded by BL-009/BL-041]` Implement fake incoming call webhook with signed/testable payloads.
- [BL-040] `[superseded by BL-009/BL-041]` Implement phone normalization and customer matching by phone.
- [BL-041] `[accepted]` Implement automatic SupportSession creation from incoming call events.
- [BL-042] `[accepted]` Implement suggested greeting generation from call plus ticket context.
- [BL-043] `[accepted]` Implement Call Console UI with caller, matched customer, recent tickets, and notes.
- [BL-044] `[accepted]` Implement telephony adapter contract and bridge boundary for future PBX/WebRTC/phone-provider integration.
- [BL-045] `[accepted]` Add call simulator demo fixtures and end-to-end smoke test.

## MVP 3 - Operator Companion

- [BL-046] `[partial/local-mock]` Screen observation mock UI, capture/review/context-packet APIs, and sharing state are implemented in Call Console web panels with honest mock labels. Tauri operator companion scaffold does not exist. No native OS integration, real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring.
- [BL-047] `[accepted]` Implement active-window metadata capture and visible sharing indicator. (mock-only deterministic metadata; no real OS active window capture)
- [BL-048] `[accepted]` Implement manual screenshot-to-session capture with raw image retention disabled by default. (metadata-only capture; no real screenshot image storage)
- [BL-049] `[accepted]` Implement local redaction placeholder and structured ScreenObservation upload. (pattern-based redaction applied before storage)
- [BL-050] `[accepted]` Implement screen observation API, persistence, timeline event, and audit event. (Actual implementation scope was PostgreSQL persistence foundation including ScreenObservation and ScreenObservationSharingState models; screen observation APIs, timeline events, and audit events were covered by BL-046/047/048/049)
- [BL-051] `[partial/local-mock]` Implement AI screen summary flow using structured observations. (mock-only, limited)
- [BL-052] `[partial/local-mock]` Implement cockpit screen context panel and AI Context Quality integration. (panel exists, AI summary is mock-only)
- [BL-053] `[partial/local-mock]` Add privacy/consent checks and operator-companion acceptance evidence. (basic disclaimers visible, no full consent workflow)

## MVP 4 - Endpoint Agent Read-Only Diagnostics

- [BL-054] `[superseded by BL-118]` Scaffold Go endpoint agent with build targets for Windows, Linux, and macOS. Superseded by the optional endpoint diagnostics foundation path; no agent exists today.
- [BL-055] `[planned]` Implement agent registration, device identity, and outbound-only connection model.
- [BL-056] `[planned]` Implement heartbeat, version reporting, and device inventory basics.
- [BL-057] `[planned]` Implement read-only diagnostics for disk, network, service status, and installed software inventory.
- [BL-058] `[planned]` Implement endpoint command/result protocol with replay protection.
- [BL-059] `[planned]` Implement Device Console UI with known endpoints, status, diagnostics, and action history.
- [BL-060] `[planned]` Add endpoint agent integration tests against local API fixtures.

## MVP 5 - Approval-Gated Remediation

- [BL-061] `[planned]` Implement ToolManifest schema, signing/validation placeholder, and tool registry.
- [BL-062] `[planned]` Implement policy engine for role, tenant, device group, risk level, and tool allowlist checks.
- [BL-063] `[planned]` Implement approval request lifecycle, manager approval/rejection, and timeout behavior.
- [BL-064] `[planned]` Implement read-only tool invocation flow with audit events and before/after summaries.
- [BL-065] `[planned]` Implement low-risk tools: flush DNS, restart approved service, and clear temp directory.
- [BL-066] `[planned]` Implement execution gateway dispatch to endpoint agent fixed implementations only.
- [BL-067] `[planned]` Implement tool result summarization and ticket note draft from remediation outcome.
- [BL-068] `[planned]` Add remediation safety tests proving arbitrary shell is blocked.

## Integrations After MVP

- [BL-069] `[planned]` Add GLPI connector for assets, users, ITIL tickets, and configuration items.
- [BL-070] `[superseded by BL-117]` Add Asterisk/FreePBX CTI gateway behind SupportPlane API rather than direct browser access.
- [BL-071] `[planned]` Add MeshCentral device context and remote session launch metadata.
- [BL-072] `[planned]` Add Fortinet read-only connector only after screen-context workflow is proven.
- [BL-073] `[planned]` Add knowledge source ingestion for KB articles, known issues, and ticket-history summaries.
- [BL-074] `[planned]` Add pgvector-backed retrieval after plain PostgreSQL/search needs are proven.

## Admin, Governance, And Compliance Evidence

- [BL-075] `[partial/local-mock]` Build Admin users, roles, teams, tenants, and connector installation screens. (basic policy panel and auth UI exist; full admin screens not yet built)
- [BL-076] `[planned]` Build policy editor for tools, risk levels, approvals, model policies, and retention settings.
- [BL-077] `[planned]` Build audit explorer with filtering by tenant, session, actor, decision, target, and event type.
- [BL-078] `[partial/local-mock]` Build evidence bundle viewer with timeline, AI context used, actions proposed, approvals, blocked actions, and writebacks. (summary/JSON/Markdown tabs exist; full viewer not yet built)
- [BL-079] `[planned]` Add evidence export to JSON and Markdown, then PDF later.
- [BL-080] `[planned]` Add model usage log with provider, model, prompt version, hashes, latency, token usage, and cost estimate.
- [BL-081] `[planned]` Add tenant-level prompt/output retention controls.
- [BL-082] `[planned]` Add GDPR-oriented export/delete request groundwork without overclaiming compliance.

## Production Hardening

- [BL-083] `[planned]` Add OIDC-ready auth, MFA hooks, service accounts, and short-lived connector tokens.
- [BL-084] `[superseded by BL-109]` Add secrets encryption, secret references, and server-side credential broker boundaries. BL-109 now narrows the next step to local OpenBao sandbox credential resolution, not production secrets.
- [BL-085] `[superseded by BL-114]` Add OpenTelemetry traces, structured logs, metrics, and correlation IDs.
- [BL-086] `[planned]` Add rate limits, request validation, body limits, and audit coverage for API gateway paths.
- [BL-087] `[planned]` Add backup/restore runbook for PostgreSQL, object storage, and configuration.
- [BL-088] `[superseded by BL-103/BL-104]` Add Kubernetes manifests after Docker Compose topology is stable.
- [BL-089] `[planned]` Add threat-model review checkpoints and security regression tests.
- [BL-090] `[planned]` Add release packaging, demo dataset reset, and operator deployment documentation.

## Cross-cutting Workflow Integration

- [BL-095] `[accepted]` Connector installation settings foundation. Add editable safe non-secret fields (displayName, description, enabled, mockMode, capabilities, timeoutMs, validateBeforeWrite) to ConnectorInstallation. Enforce RBAC (admin/operator write, viewer read-only). Redact config secrets in API responses. Verify cross-tenant isolation, secret redaction, and evidence bundle inclusion. Update seed data, verification scripts, and docs. No real credential broker or production secret storage implemented.
- [BL-097] `[accepted]` Connector credential reference / secret broker foundation. Add `ConnectorCredentialReference` model with tenant scoping. Implement CRUD API (`/credential-references`), link/unlink endpoints on connector installations, RBAC permissions (`credential_reference:read`, `credential_reference:write`). Web UI shows credential references per installation with link/unlink selector for admin, read-only for viewer. All API responses redact `secretRef` to `[REDACTED]`; evidence bundles include credential reference summaries without secrets. Audit events track lifecycle. `secretRef` is local-dev opaque placeholder only; no production credential broker exists.
- [BL-098] `[accepted]` Connector Runtime Configuration + Credential Reference Readiness Foundation. Turn connector installation + credential reference work into a coherent mock-only runtime foundation: connector installations become tenant-scoped runtime metadata source; credential references linked/surfaced safely; connector config is schema-validated, redacted, auditable; ticket/customer connector operations expose provenance; all behavior remains local/mock-only with no real secret resolution or network writeback.
- [BL-091] `[accepted]` End-to-end support case workflow foundation. Unify ticket summary API, ticket/session linking, caller-to-customer matching, unified case timeline, connector validate/test endpoints, deterministic local-only support note draft, and evidence bundle provenance into a coherent operator cockpit. Honest mock/local labels throughout. No real telephony, Zammad writeback, AI provider, or production deployment claims.
- [BL-092] `[accepted]` Durable action/outbox workflow foundation. Add tenant-scoped support action review state, durable local outbox items, mock delivery attempts, idempotency keys, retry state, audit events, case timeline entries, evidence bundle provenance, and cockpit UX for local-only support-note actions. No real Zammad writeback, email sending, telephony, AI provider calls, external queue worker, object storage, raw media storage, production audit immutability, compliance certification, SSO/OAuth/SAML/OIDC, MFA, password reset, or production deployment claims.
- [BL-093] `[accepted]` Background outbox worker retry/dead-letter foundation. Add a local PostgreSQL-backed mock worker/process-once path, worker status, safe claim/lock fields, retry scheduling, deterministic mock connector failure simulation, dead-letter/cancel controls, audit events, case timeline and evidence-bundle provenance, and delivery operations UI. No real Zammad writeback, email sending, telephony/PBX integration, AI provider calls, external broker-backed queue, object storage, raw media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset claims.
- [BL-094] `[accepted]` Connector writeback readiness gates and delivery policy controls. Add configurable tenant/connector delivery policy for action writeback readiness, including dry-run mode, approval requirements, connector capability checks, kill switch, action-type allowlist, human-review requirements, and mock delivery enforcement. Central policy evaluator enforces decisions before queueing and processing. Connector readiness returns mock-only readiness and real-writeback denial. Worker and outbox APIs enforce policies. Evidence bundle and audit include policy truth. Max-20 screenshot closure proof captured in `output/playwright/session-095-bl094-final-closure-max20/`. No real Zammad writeback, email sending, telephony/PBX integration, AI provider calls, external broker-backed queue, object storage, raw media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset claims.
- [BL-099] `[accepted]` Connector Runtime Test Coverage + Documentation Hardening. Expanded API tests for config schema, valid/unsafe config validation, secret-like field rejection, real-network field rejection, runtime readiness mock-only behavior, runtime resolver output, no secretRef leakage, tenant isolation, viewer/operator/admin RBAC boundaries, deterministic linked credential count. Added contracts tests for Zod schema accept/reject behavior. Added web API client tests for connector runtime methods. Created `docs/CONNECTOR_RUNTIME_CONTRACT.md`. Created `scripts/verify_connector_runtime_contracts.sh` with 14 checks. All behavior remains mock-only.
- [BL-100] `[accepted]` Real Writeback Path Design Document. Created `docs/REAL_WRITEBACK_PATH_DESIGN.md` with current truth, blocked reasons, required architecture (credential broker, encrypted secret storage, tenant admin config, network egress policy, delivery policy gates, approval gates, audit/evidence requirements, retry/dead-letter, dry-run, kill switch, blast-radius controls), proposed phased path (Phase 0 mock-only through Phase 4 real writeback), explicit non-goals, acceptance gates, threat/risk table, test plan, rollback strategy, and "do not build until" checklist. No implementation.
- [BL-101] `[accepted]` MVP Completion Audit, Demo Freeze, and Final Polish. Created `docs/MVP_COMPLETION_AUDIT.md`, `docs/DEMO_GUIDE.md`, `scripts/reset_demo_data.sh`, updated `README.md`, UI header polish (auth/store mode badges), Evidence Bundle empty-state polish. Reconciled all state files. Screenshot proof captured. No new features. No production claims.
- [BL-102] `[accepted]` Local Kubernetes self-hosted sandbox architecture and roadmap. Integrated the strategic target that SupportPlane evolves from local/mock MVP to a local Kubernetes-on-Podman sandbox with Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, PostgreSQL, SupportPlane API/Web/Worker, and observability. Created canonical docs for stack, cluster target, E2E flow, service catalog, acceptance gates, phases, workflow truth, and boundary matrix. Dependencies: BL-101 freeze. Non-claims: no cluster, real writeback, real secrets, real AI, real broker, or production claim implemented. Evidence: docs proof plus running mock boundary screenshots in `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/`.

## Real Self-Hosted Sandbox Roadmap

- [BL-103] `[accepted]` Local Kubernetes/Podman cluster foundation. Verified Kind with the Podman provider on this Fedora/Podman host using cluster `supportplane-local`, context `kind-supportplane-local`, and node image `kindest/node:v1.31.4`. Applied namespaces `supportplane-app`, `supportplane-data`, `supportplane-integrations`, and `supportplane-observability`; proved `kubectl` health, Podman backing via `supportplane-local-control-plane`, and local image loading through `podman save` plus `kind load image-archive`. Dependencies: BL-102. Non-claims: no SupportPlane app services, PostgreSQL-in-cluster, Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO/observability integration, real writeback, real secrets, production cluster, or compliance claim. Evidence: cluster commands, namespace proof, Podman proof, image strategy proof, and local/mock boundary screenshots in `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/`.
- [BL-104] `[accepted]` Kubernetes manifests for SupportPlane app services. Deployed API, Web, and Worker to `supportplane-app` namespace with local images `localhost/supportplane-api:local-k8s`, `localhost/supportplane-web:local-k8s`, `localhost/supportplane-worker:local-k8s`. Health verified via port-forward. Dependencies: BL-103. Non-claims: no real external integrations. Evidence: cluster commands, pod status, API/Web health, worker logs, and browser screenshots in `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/`. Add deployable local manifests or kustomize/Helm structure for API, Web, and Worker with health checks and local image tags. Dependencies: BL-103. Non-claims: no real external integrations. Evidence expected: Web/API health and browser runtime identity from cluster.
- [BL-105] `[accepted]` PostgreSQL Kubernetes persistence foundation. Deployed PostgreSQL StatefulSet with PVC in `supportplane-data` namespace. Prisma migrate and seed executed against cluster DB. Data survives pod restart proven with `_supportplane_bl105_probe` table. Dependencies: BL-103/BL-104. Non-claims: no production database ops. Evidence: migration/seed output, PVC Bound, restart survival, and browser screenshots in `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/`. Deploy PostgreSQL with PVC, Prisma migrate/generate/seed path, and restart survival proof. Dependencies: BL-103/BL-104. Non-claims: no production database ops. Evidence expected: migration/seed output and persisted data after pod restart.
- [BL-106] `[planned]` Self-hosted service topology: Zammad, OpenBao, NATS, Mailpit, MinIO. Deploy or document exact local workloads for Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, and Ollama placement. Dependencies: BL-103. Non-claims: SupportPlane does not use them until later items. Evidence expected: health/readiness and PVC/port proof.
- [BL-107] `[planned]` Zammad sandbox bootstrap and real read connector. Seed deterministic Zammad customer/ticket data and read it through SupportPlane with provenance. Dependencies: BL-106. Non-claims: no writeback. Evidence expected: API/browser proof against real sandbox and cross-tenant denial.
- [BL-108] `[planned]` Ollama local AI provider integration. Add local provider path for drafts/summaries with model name, prompt version, context hash, latency, and deterministic test fallback. Dependencies: BL-106/BL-107. Non-claims: no cloud AI or autonomous send. Evidence expected: local-provider metadata and no-cloud-call proof.
- [BL-109] `[planned]` OpenBao credential resolver foundation. Resolve sandbox credential references server-side through OpenBao with disable path and no raw secret exposure. Dependencies: BL-106/BL-107. Non-claims: no production secret management. Evidence expected: API/UI/evidence/log/browser no-token proof.
- [BL-110] `[planned]` NATS JetStream durable worker/outbox bridge. Move or bridge outbox processing to durable streams/consumers with idempotency, retry, dead-letter, and worker status. Dependencies: BL-106. Non-claims: no production broker cluster. Evidence expected: durable stream, restart, retry/DLQ, and browser worker-state proof.
- [BL-111] `[planned]` Sandbox-only Zammad internal note writeback. Write exactly one approval-gated internal note to Zammad sandbox only, with dry-run, kill switch, idempotency marker, redacted HTTP result, and audit/evidence. Dependencies: BL-107/BL-109/BL-110/BL-115. Non-claims: no production writeback, public replies, or broad ticket mutation. Evidence expected: allowed path, blocked path, duplicate prevention.
- [BL-112] `[planned]` MinIO evidence artifact persistence. Store evidence JSON/Markdown artifacts in MinIO with object key, checksum, and local/sandbox disclaimer in UI/API. Dependencies: BL-106/BL-111. Non-claims: no compliance-grade evidence. Evidence expected: object write/read/checksum and no-secret proof.
- [BL-113] `[planned]` Mailpit local notification capture. Send optional local SMTP notification to Mailpit and record captured-message evidence. Dependencies: BL-106/BL-111. Non-claims: no internet email. Evidence expected: Mailpit capture and disabled/no-egress proof.
- [BL-114] `[planned]` Observability baseline. Add OTel collector plus Grafana/Loki/Prometheus or equivalent local stack with correlation IDs. Dependencies: BL-103/BL-104. Non-claims: no production monitoring. Evidence expected: logs/metrics/traces query by correlation ID and no-secret telemetry proof.
- [BL-115] `[planned]` Network egress and writeback safety hardening. Add sandbox allowlist, kill-switch enforcement, tenant/RBAC guardrails, and explicit denial for uncontrolled connector egress. Dependencies: BL-103/BL-106/BL-109. Non-claims: no production firewall. Evidence expected: allowed local Zammad path and blocked external path proof.
- [BL-116] `[planned]` Real self-hosted sandbox acceptance freeze. Freeze the complete real sandbox E2E milestone after cluster, Zammad read/write, Ollama, OpenBao, NATS, MinIO, Mailpit, observability, RBAC, kill switch, evidence, and no-secret gates pass. Dependencies: BL-103 through BL-115. Non-claims: still not production/compliance. Evidence expected: max-20 canonical proof set plus CLI artifacts.
- [BL-117] `[planned]` Optional Asterisk/FreePBX call-event bridge. Add internal test-call CTI bridge only after core flow works. Dependencies: BL-116. Non-claims: no PSTN, production call center, or media recording. Evidence expected: internal call event and no-PSTN proof.
- [BL-118] `[planned]` Optional endpoint diagnostics foundation. Start read-only diagnostics with osquery or equivalent after core flow works. Dependencies: BL-116. Non-claims: no arbitrary shell or remediation. Evidence expected: read-only diagnostics, consent, RBAC, and denial proof.
- [BL-119] `[planned]` Optional Tauri operator companion scaffold. Create desktop companion scaffold only after privacy/consent requirements are explicit. Dependencies: BL-116/BL-118 as applicable. Non-claims: no screen capture or OCR by scaffold alone. Evidence expected: explicit start/stop sharing state.
- [BL-120] `[planned]` Optional consent-gated screen/OCR observation. Add OCR/screen text extraction only after consent, retention, redaction, and privacy design are accepted. Dependencies: BL-119 and separate privacy design. Non-claims: no ambient surveillance, raw pixel retention by default, or remote desktop observation. Evidence expected: consent-gated OCR fixture and redaction/no-secret proof.

## WATCHLIST

- AI tool execution must stay policy-gated and auditable.
- Tenant scoping must be designed into schemas and query helpers from the first database slice.
- Zammad/GLPI/PBX claims stay planning claims until integration tests run against real or fixture-backed instances.
- Do not let screen capture become ambient surveillance; explicit active-window sharing is the default.
- Do not add arbitrary shell execution in v1.
- Keep `NEXT_ACTIONS.md` active-only even though this backlog is intentionally broad.
