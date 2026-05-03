# SupportPlane Reality Matrix

**Purpose:** Comprehensive inventory of current system status: real vs mock vs sandbox vs partial. Updated every session with this slice.
**Last updated:** 2026-05-03
**Session:** 132 — BL-136 Proof Repair

## Legend

| Classification | Meaning |
|---------------|---------|
| REAL_LOCAL_NOW | Running and verifiable on the local standalone runtime (API on 4110, Web on 3200, PostgreSQL on 5434) right now |
| REAL_SANDBOX_NOW | Running in the K8s cluster and previously verified (BL-116 accepted); code is real, cluster must be up to verify |
| MOCK_BY_POLICY | Intentionally mock because safety policy blocks real operation (e.g., production writeback, cloud AI calls) |
| MOCK_BY_GAP | Mock because implementation is incomplete — honest rejection error, fixture-only, or template scaffold |
| MOCK_NOT_IMPLEMENTED | No real implementation exists — mock/fixture only, with honest status labels |
| PARTIAL | Some parts real/local, others mock/unverified — documented gaps exist |
| SANDBOX_CODE_READY | Real code exists and was verified in previous cluster sessions — cluster must be running to re-verify |
| MANIFESTS_READY | Kubernetes manifests and deployment configs exist but cluster is down |
| NOT_VERIFIED_THIS_SESSION | Previously accepted but not re-verified in the current session |

## Core Platform

| System | Status | Evidence |
|--------|--------|----------|
| PostgreSQL persistence | REAL_LOCAL_NOW | PostgreSQL container running on 5434; API reports storeMode=postgres; 60+ Prisma models; migrations applied |
| API runtime | REAL_LOCAL_NOW | NestJS on localhost:4110; `/health` returns status:ok, head matching git HEAD |
| Web UI | REAL_LOCAL_NOW | Next.js 15 on localhost:3200; renders Support Cockpit |
| Worker/outbox | REAL_LOCAL_NOW | Code supports postgres-local-outbox mode (canonical PostgreSQL outbox); process-once works locally |
| NATS/queueing | SANDBOX_CODE_READY | Real NATS JetStream code in worker (loopNats, stream/consumer); cluster must be up to verify |
| RBAC / tenant scoping | REAL_LOCAL_NOW | CurrentIdentityMiddleware + service-level tenantId checks; admin/operator/viewer roles enforced |
| Audit events | REAL_LOCAL_NOW | AuditEvent model persisted to PostgreSQL; all actions emit audit events with tenant/actor/timestamp |
| Redaction | REAL_LOCAL_NOW | Multi-layer: AI context, evidence bundle, telemetry logs, action error messages; pattern-based PII/secret filtering |
| Policy gates | REAL_LOCAL_NOW | Delivery policy evaluator checks before queue/process; kill switch, approval requirements; currently defaults to mock delivery unless sandbox writeback env enabled |

## Connectors

| System | Status | Evidence |
|--------|--------|----------|
| Zammad connector | REAL_LOCAL_NOW | K8s cluster API verifies Zammad as mode=zammad, transport=real, credentialSource=vault, connected=true. Real Zammad sandbox ticket (#2, 68002, Acme BVBA) read proven via FetchZammadHttpClient with server-side OpenBao credential resolution. Session 131 confirms cluster API path works end-to-end with browser/CLI evidence. |
| GLPI connector | MOCK_BY_GAP | GlpiConnectorAdapter.connect() rejects with honest "Real GLPI HTTP client not implemented"; only MockGlpiHttpClient exists. Honest status labels in API/UI. |
| osTicket connector | MOCK_NOT_IMPLEMENTED | OsTicketConnectorAdapter returns fixture data only; no real HTTP client. Status shows fixture/unconfigured. |
| MeshCentral connector | MOCK_NOT_IMPLEMENTED | MockMeshCentralClient only; no real HTTP client. Status reports unconfigured unless mockMode set. |
| Fortinet connector | MOCK_NOT_IMPLEMENTED | MockFortinetClient only; no real HTTP client. Status reports unconfigured unless mockMode set. |
| Connector status API | REAL_LOCAL_NOW | GET /connectors/status returns all 5 connectors with honest transport/mode/health/capabilities |

## AI Provider

| System | Status | Evidence |
|--------|--------|----------|
| AI provider gateway | REAL_LOCAL_NOW | OllamaAiProvider with FetchOllamaClient (real HTTP to /api/generate); LmStudioAiProvider exists; MockAiProvider is backup. Cluster API calls real Ollama gemma4:e4b via podman0 bridge (10.88.0.1:11434). Provider readiness: ollama configured/enabled/enabledByPolicy=true. |
| AI chat | REAL_LOCAL_NOW | Chat session/message API endpoints exist with tenant AI policy gating and retention enforcement; mock provider used by default |
| Ticket summary | REAL_LOCAL_NOW | POST /ticket-summary exists, persists TicketSummary, checks tenant AI policy |
| Draft generation | REAL_LOCAL_NOW | 500 error repaired; safe model-selection parsing; policy-gated |
| Model usage logging | REAL_LOCAL_NOW | ModelUsageLog table, query/summary APIs, admin UI panel |
| Ollama real calls | REAL_LOCAL_NOW | Real model calls to gemma4:e4b proven in Session 131: provider=ollama, model=gemma4:e4b, fallbackUsed=false, noCloudCall=true, providerMode=local, latencyMs=13398. Ollama on localhost:11434, cluster API reaches via podman0 bridge. AI policy: allowedProviders includes ollama; mockOnly=true maintains safety gating. |

## Governance & Admin

| System | Status | Evidence |
|--------|--------|----------|
| Admin dashboard | REAL_LOCAL_NOW | /admin route with sidebar navigation; pages: Policies, Users, Roles, Model Usage, Audit Explorer, GDPR, Connectors |
| Audit explorer | REAL_LOCAL_NOW | GET /audit-events with filtering and pagination; AuditExplorerPanel UI |
| GDPR panel | REAL_LOCAL_NOW | Export-preview, delete-preview (dry-run only); DataSubjectRequest tracking; GdprRequestPanel UI |
| Evidence bundle builder | PARTIAL | JSON/Markdown export works; PDF export returns real PDF when fonts available, 501 otherwise |
| Evidence timeline | REAL_LOCAL_NOW | EvidenceBundleTimeline mounted in main cockpit |
| Policy editor | REAL_LOCAL_NOW | Admin CRUD API with RBAC; tabbed UI (Delivery, Connector, AI, Retention); tenant_policies migration applied; no more 500 error |
| Model usage admin | REAL_LOCAL_NOW | ModelUsagePanel with filters, summary cards, data table |
| Retention policy | REAL_LOCAL_NOW | Prompt/output retention modes; enforcement in AI pipeline; autoPurgeEnabled locked off |

## Sandbox Integrations (K8s Cluster Required to Verify)

| System | Status | Evidence |
|--------|--------|----------|
| OpenBao credential resolver | SANDBOX_CODE_READY | Real fetchOpenBaoSecret() with HTTP to OpenBao; enabled/disabled toggle; path sanitization. Default disabled. Cluster required. |
| MinIO evidence persistence | SANDBOX_CODE_READY | Real S3 PutObject via AWS SDK; object key, checksum, content type. Uses cluster DNS minio.supportplane-data.svc.cluster.local. Cluster required. |
| Mailpit notifications | SANDBOX_CODE_READY | Real nodemailer SMTP to mailpit.supportplane-integrations.svc.cluster.local:1025. Cluster required. |
| Keycloak OIDC | SANDBOX_CODE_READY | Full browser OIDC redirect/callback/PKCE flow; realm role mapping; service account tokens with SHA-256 hashing. oidcReady=false (OIDC_ISSUER_URL not set). Cluster required. |
| Kubernetes cluster | REAL_LOCAL_NOW | Cluster `supportplane-local` (Kind/Podman, node v1.31.4) healthy in Session 131. All 3 app pods (API/Web/Worker) Ready. All sandbox integrations (Zammad, OpenBao, NATS, MinIO, Mailpit) running. Cluster API serves via port-forward localhost:4210. |

## Endpoint Agent

| System | Status | Evidence |
|--------|--------|----------|
| Agent registration | REAL_LOCAL_NOW | Outbound-only; tenant enrollment token + device token |
| Heartbeat & inventory | REAL_LOCAL_NOW | Heartbeat updates status/last-seen/version; inventory snapshots |
| Read-only diagnostics | PARTIAL | Linux collectors real (/proc, statfs); Windows collectors have fixed templates but need real runner; software inventory partial |
| Device Console UI | REAL_LOCAL_NOW | /device-console; device list, detail, diagnostic controls, command history |
| Tool execution safety | REAL_LOCAL_NOW | Tool manifest with 8 tools; policy engine; approval lifecycle; audit events (7 types); arbitrary shell blocked |
| Low-risk remediation | PARTIAL | flush_dns_cache implemented (Linux resolvectl); approval-gated; fixed templates. Only one remediation path. |
| Windows endpoint | MOCK_BY_GAP | Fixed sc.exe/reg.exe templates; fixture parsers tested on Linux; UI platform badges; no real Windows runner proof |

## Summary Statistics

| Category | Count | Systems |
|----------|-------|---------|
| REAL_LOCAL_NOW | 22 | PostgreSQL, API, Web, Worker/outbox, RBAC, Audit, Redaction, Policy, Connector status API, AI chat, Ticket summary, Draft gen, Model usage, Admin dashboard, Audit explorer, GDPR panel, Evidence timeline, Policy editor, Model usage admin, Retention policy, Agent registration, Heartbeat, Device Console, Tool execution, Zammad connector, AI provider gateway, Ollama real calls, K8s cluster |
| SANDBOX_CODE_READY | 4 | NATS, OpenBao, MinIO, Mailpit, Keycloak |
| MOCK_BY_POLICY | 1 | Cloud AI providers (intentionally blocked; honest configured:false) |
| MOCK_BY_GAP | 2 | GLPI, Windows endpoint |
| MOCK_NOT_IMPLEMENTED | 3 | osTicket, MeshCentral, Fortinet |
| PARTIAL | 2 | Evidence bundle (PDF fallback), Endpoint diagnostics (Windows unverified), Low-risk remediation (one path only) |
| MANIFESTS_READY | 0 | — |

## Key Observations

1. **BL-136 E2E acceptance achieved (Session 132, proof repaired):** Scenarios A (Zammad sandbox ticket read), B (Ollama real AI draft with gemma4:e4b, fallbackUsed=false), and C (Governance/Audit/RBAC) all proven end-to-end from the K8s cluster API with fresh browser/computer-use evidence. Scenario D (Windows) remains unverified.

2. **K8s cluster fully operational:** All 3 app pods (API/Web/Worker) Ready; all sandbox integrations (Zammad, OpenBao, NATS, MinIO, Mailpit, Keycloak, Asterisk, Prometheus, Grafana, Loki) running. Cluster API serves via port-forward localhost:4210.

3. **Zammad connector is REAL_LOCAL_NOW:** Mode=zammad, transport=real, credentialSource=vault (OpenBao). Real sandbox ticket (#2, 68002, Acme BVBA) read proven. Writeback remains sandbox-only and approval-gated.

4. **Ollama is REAL_LOCAL_NOW:** gemma4:e4b real model calls from cluster API via podman0 bridge; fallbackUsed=false, noCloudCall=true, providerMode=local. AI policy allows ollama while maintaining mockOnly safety defaults.

5. **Safety mocks remain intentional:** Cloud AI providers blocked by policy. Production writeback, public replies, internet email blocked. These are safety features, not gaps.

6. **Remaining gaps are honestly labeled:** Windows endpoint (no runner), GLPI/osTicket/MeshCentral/Fortinet (no real instances), Evidence bundle PDF (font-dependent fallback).
