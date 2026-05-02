# Implementation Phases for Real E2E Sandbox

**Backlog:** BL-102  
**Status:** Historical roadmap. Phases 0–11 accepted (BL-116 accepted 2026-04-30).

## Phase 0 - Current Local/Mock MVP Freeze

- **Goal:** Preserve the current local/mock MVP.
- **Files likely touched:** none unless regression docs are updated.
- **Backlog IDs:** BL-101 accepted; BL-102 accepted as roadmap after this slice.
- **Tests required:** existing full validation gate.
- **Browser proof required:** current mock header, connector mock boundary, delivery policy locked off, evidence disclaimer.
- **API proof required:** `/health`, mock runtime resolver, policy denies real network.
- **Safety gates:** no real writeback, no real secrets, no production claims.
- **Rollback plan:** return to BL-101 commit lineage.
- **Must not claim:** Kubernetes, real Zammad, Ollama, OpenBao, NATS worker, MinIO artifact persistence.
- **Exit criteria:** current MVP remains runnable and documented as mock/local.

## Phase 1 - Local Kubernetes/Podman Cluster Foundation

- **Status:** BL-103 cluster and namespace foundation accepted; BL-104 app manifests and BL-105 PostgreSQL persistence accepted.
- **Goal:** Choose and verify Kind/Podman, Minikube/Podman, or an alternative; create namespaces; add base manifest/Helm/kustomize structure; deploy SupportPlane API/Web/Worker and PostgreSQL; prove health checks and local image build/load.
- **Files likely touched:** `infra/kubernetes/local-podman/`, app Dockerfiles if needed, README/runbooks, scripts.
- **Backlog IDs:** BL-103, BL-104, BL-105.
- **Tests required:** state docs, lint/typecheck, Prisma validate/generate/migrate/seed, health checks from cluster.
- **Browser proof required:** Web reachable from localhost with DEV/MOCK/local auth/postgres badges.
- **API proof required:** `/health` from localhost and inside cluster.
- **Safety gates:** real writeback still disabled; no real credentials.
- **Rollback plan:** delete local cluster and keep compose/local dev path.
- **Must not claim:** real integration or production deployment.
- **Exit criteria met:** cluster, namespaces, app images, PostgreSQL persistence all accepted (BL-103/BL-104/BL-105).

## Phase 2 - Self-Hosted Service Topology (ACCEPTED as BL-106)

- **Goal:** Add Zammad, OpenBao, NATS JetStream, Mailpit, MinIO; decide whether Ollama runs inside cluster or as controlled host service; add readiness checks.
- **Files likely touched:** Kubernetes service manifests/charts, local runbook, prerequisite script.
- **Backlog IDs:** BL-106.
- **Tests required:** service health checks, namespace/PVC checks, no app real integration yet.
- **Browser proof required:** topology/status page if added, otherwise compact CLI proof page.
- **API proof required:** health/status endpoints if added.
- **Safety gates:** no SupportPlane real writeback or real credential resolution yet.
- **Rollback plan:** disable integration namespace workloads.
- **Must not claim:** SupportPlane uses these services until integration phases prove it.
- **Exit criteria:** services are healthy and isolated as local sandbox dependencies.

## Phase 3 - Zammad Sandbox Read Connector (ACCEPTED as BL-107)

- **Goal:** Real Zammad customer/ticket lookup and deterministic seed/bootstrap script.
- **Files likely touched:** `packages/connectors`, `apps/api`, seed/bootstrap scripts, docs/tests.
- **Backlog IDs:** BL-107.
- **Tests required:** Zammad read integration tests, tenant boundary, provenance, redaction.
- **Browser proof required:** Ticket Context panel showing real sandbox Zammad provenance.
- **API proof required:** ticket/customer read from sandbox and cross-tenant denial.
- **Safety gates:** no writeback yet.
- **Rollback plan:** revert connector installation to mock mode.
- **Must not claim:** production Zammad or writeback.
- **Exit criteria:** deterministic Zammad ticket/customer read works against sandbox.

## Phase 4 - Ollama Local AI Provider (ACCEPTED as BL-108)

- **Goal:** Real local AI draft/summary generation with model metadata, context hashing, prompt versioning, and deterministic test fallback.
- **Files likely touched:** `packages/ai`, `apps/api`, web draft panels, docs/tests.
- **Backlog IDs:** BL-108.
- **Tests required:** provider unit/integration tests; no cloud calls; fallback test mode.
- **Browser proof required:** Draft panel shows Ollama provider/model/local marker.
- **API proof required:** response includes prompt version/context hash/latency/local provider.
- **Safety gates:** no cloud provider call; no auto-send.
- **Rollback plan:** disable Ollama provider and return to mock provider.
- **Must not claim:** production model governance.
- **Exit criteria:** local Ollama draft works and stores provenance.

## Phase 5 - OpenBao Credential Resolver (ACCEPTED as BL-109)

- **Goal:** Credential reference resolves server-side; no raw secret response; disable path and audit events.
- **Files likely touched:** API credential resolver, connector runtime, OpenBao config, tests/docs.
- **Backlog IDs:** BL-109.
- **Tests required:** secret redaction, disable behavior, audit events, browser storage/log/evidence no-token proof.
- **Browser proof required:** Credential metadata only; no raw token visible.
- **API proof required:** resolver success metadata and no secret in response.
- **Safety gates:** local placeholders only; no production secrets.
- **Rollback plan:** disable resolver and keep metadata-only credential refs.
- **Must not claim:** production-grade secrets management.
- **Exit criteria:** server-side local placeholder resolution works without leakage.

## Phase 6 - NATS JetStream Worker Semantics (ACCEPTED as BL-110)

- **Goal:** Durable stream/consumer, outbox bridge, idempotency key, retry/dead-letter, worker status UI/API.
- **Files likely touched:** worker app, API outbox bridge, contracts, web delivery operations.
- **Backlog IDs:** BL-110.
- **Tests required:** stream publish/consume, ack/retry/DLQ, idempotency, restart survival.
- **Browser proof required:** worker status and attempt history.
- **API proof required:** queue/process/retry/dead-letter endpoints.
- **Safety gates:** no writeback until Phase 7.
- **Rollback plan:** pause consumer; keep PostgreSQL outbox state.
- **Must not claim:** production broker cluster.
- **Exit criteria:** durable worker semantics proven locally.

## Phase 7 - Sandbox-Only Zammad Internal Note Writeback (ACCEPTED as BL-111/BL-115)

- **Goal:** Internal notes only, sandbox connector installation only, approval required, kill switch, dry-run first, explicit real sandbox network-call evidence.
- **Files likely touched:** connector driver, worker, delivery policy, audit/evidence, web action center.
- **Backlog IDs:** BL-111 and BL-115.
- **Tests required:** writeback success, duplicate prevention, dry-run, kill-switch denial, viewer denial, cross-tenant denial, secret redaction.
- **Browser proof required:** allowed path and blocked paths.
- **API proof required:** Zammad article/internal-note result with idempotency marker.
- **Safety gates:** sandbox-only base URL; network egress allowlist; approval required.
- **Rollback plan:** kill switch ON; disable real connector installation; pause worker.
- **Must not claim:** production writeback, public replies, broad ticket mutations.
- **Exit criteria:** exactly one internal note writes to sandbox Zammad and duplicate processing does not duplicate it.

## Phase 8 - MinIO Evidence Artifact Persistence (ACCEPTED as BL-112)

- **Goal:** Store evidence bundle as JSON/Markdown object with checksum and object key in UI; retention marked dev/local.
- **Files likely touched:** evidence service, worker/API, MinIO config, web evidence panel.
- **Backlog IDs:** BL-112.
- **Tests required:** object write/read/checksum, no secrets, failure mode.
- **Browser proof required:** Evidence panel shows object key/checksum/local disclaimer.
- **API proof required:** artifact metadata endpoint or evidence response.
- **Safety gates:** no compliance claim.
- **Rollback plan:** disable object storage write and keep generated local bundle response.
- **Must not claim:** compliance-grade evidence.
- **Exit criteria:** evidence artifacts persist in MinIO with checksum.

## Phase 9 - Mailpit Local Notification Capture (ACCEPTED as BL-113)

- **Goal:** Send local SMTP notification to Mailpit and show captured-mail evidence.
- **Files likely touched:** notification service, Mailpit config, evidence/audit, web panel if needed.
- **Backlog IDs:** BL-113.
- **Tests required:** SMTP capture, disabled path, no internet email.
- **Browser proof required:** Mailpit UI/API capture proof or SupportPlane mail evidence panel.
- **API proof required:** notification metadata without credentials.
- **Safety gates:** SMTP host locked to Mailpit/local.
- **Rollback plan:** disable notifications.
- **Must not claim:** real email delivery.
- **Exit criteria:** Mailpit captures local message and no internet email is sent.

## Phase 10 - Observability (ACCEPTED as BL-114)

- **Goal:** OTel collector, logs/traces/metrics, correlation IDs; not production monitoring.
- **Files likely touched:** API/worker telemetry config, observability manifests, docs.
- **Backlog IDs:** BL-114.
- **Tests required:** trace/log/metric emission, no secrets in telemetry.
- **Browser proof required:** Grafana/log query proof if UI available.
- **API proof required:** correlation ID returned/propagated.
- **Safety gates:** no PII/secret telemetry.
- **Rollback plan:** disable exporters and keep local logs.
- **Must not claim:** production monitoring.
- **Exit criteria:** basic local telemetry query works by correlation ID.

## Phase 11 - Optional PBX/CTI (ACCEPTED as BL-117)

- **Goal:** Asterisk/FreePBX only after core flow works; internal SIP/test call only.
- **Files touched:** `packages/connectors/src/telephony-registry.ts`, `apps/api/src/telephony/telephony.controller.ts`, `apps/api/src/telephony/telephony.service.ts`, `apps/web/app/call-console/page.tsx`, `infra/kubernetes/local-podman/integrations/asterisk/*`, `scripts/asterisk_ami_bridge.js`.
- **Backlog IDs:** BL-117.
- **Tests completed:** 7 unit tests (telephony-registry.test.ts), internal call-event bridge, no PSTN, RBAC/audit via `CurrentIdentityMiddleware`.
- **Browser proof completed:** Call Console real sandbox CTI marker + telephony registry JSON.
- **API proof completed:** `POST /telephony/ami-events` with service-token auth; caller match; session auto-create.
- **Safety gates:** no PSTN, no audio/recording claim.
- **Rollback plan:** disable PBX adapter.
- **Must not claim:** production call-center integration, FreePBX GUI, PSTN.
- **Exit criteria met:** internal test call event reaches SupportPlane safely (BL-117 accepted).

## Phase 12 - Optional Endpoint Agent / Operator Companion / Screen Context

- **Goal:** osquery read-only diagnostics first, Tauri companion later, screen/OCR only after consent/privacy design, no arbitrary shell.
- **Files likely touched:** future apps, endpoint protocols, companion docs, consent model.
- **Backlog IDs:** BL-118, BL-119, BL-120.
- **Tests required:** read-only diagnostics, consent, no arbitrary shell, no raw screen retention by default.
- **Browser proof required:** explicit sharing/consent states.
- **API proof required:** policy-denied unsafe actions.
- **Safety gates:** no ambient surveillance, no arbitrary shell, no remote desktop without separate approval.
- **Rollback plan:** disable agent/companion enrollment.
- **Must not claim:** endpoint remediation or screen monitoring before accepted.
- **Exit criteria:** each optional capability has its own accepted slice and evidence.
