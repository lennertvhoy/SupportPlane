# ACCEPTANCE_FREEZES.md

**Purpose:** Append-only ledger of accepted user-facing or operator-facing milestones.

Use this when a screen, route, workflow, or other visible milestone is accepted
and must be protected from quiet regression.

## AF-2026-04-29-007: BL-108 Repair — Real Host-Controlled Ollama Model Call (ACCEPTED)

- ID: AF-2026-04-29-007
- Milestone: Real host-controlled Ollama model call from cluster API with fallbackUsed=false
- Scope: Cluster API performs a real Ollama generate call to host-controlled Ollama via podman0 bridge IP (10.88.0.1:11434). Model selected is llama3.1:8b. Response includes provider=ollama, providerMode=local, fallbackUsed=false, noCloudCall=true, autonomousSend=false, writebackAllowed=false, latencyMs, contextHash. Redaction applied before provider call. No secret leakage in API response, logs, or evidence. UI updated to show "Ollama local / real host call, review required" when fallbackUsed=false. Model upgrade to gemma4/qwen3.6 deferred to BL-121 (requires Ollama version upgrade).
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 4b771068ad666191e99f688065c457d098e26b7f
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - SupportPlane API, Web, Worker in `supportplane-app`
  - PostgreSQL StatefulSet in `supportplane-data`
  - Zammad, OpenBao, and NATS in `supportplane-integrations`
  - Host-controlled Ollama endpoint at 10.88.0.1:11434 (podman0 bridge IP)
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - / (cluster web)
  - /health (cluster API)
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /support-sessions/:id/draft-suggestion
  - POST /support-sessions/:id/zammad/internal-note-writeback
  - GET /outbox/worker/status
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-113 through EV-2026-04-29-120
- evidence_folder: output/playwright/session-110-bl108-ollama-host-call-model-selection/
- screenshot_count: 8
- duplicate_screenshot_count: 0
- regression_guard:
  - Ollama provider must continue to return provider=ollama, providerMode=local when host is reachable.
  - fallbackUsed must be false when host Ollama is reachable and model is available.
  - noCloudCall must remain true for all Ollama provider responses.
  - autonomousSend must remain false.
  - Redaction must be applied before provider call.
  - No raw secrets may appear in API response, logs, or evidence.
  - UI must show "real host call" label when fallbackUsed=false, and "deterministic fallback" when fallbackUsed=true.
  - All other AF-006 regression guards remain in force.
- known_limitations:
  - Model selection is limited to llama3.1:8b and qwen2.5:7b on Ollama 0.18.2.
  - gemma4 and qwen3.6 families require Ollama upgrade (BL-121).
  - Zammad internal-note writeback remains blocked until BL-111.
  - OpenBao is local sandbox-only, not production secret management.
  - NATS is local sandbox-only, not production broker HA/TLS/auth.
  - MinIO evidence persistence and Mailpit notification capture remain planned.
  - This remains a local sandbox topology, not production infrastructure.

## AF-2026-04-29-006: BL-109/110/115 Real Sandbox Enablement Gates and BL-108 Partial Provider Path

- ID: AF-2026-04-29-006
- Milestone: Real sandbox enablement gates before BL-111 writeback
- Scope: Local OpenBao sandbox credential resolver for Zammad read, NATS JetStream local outbox bridge, sandbox egress/writeback safety gates, and a partial Ollama provider path with deterministic fallback. BL-108 is not accepted because runtime proof used fallback rather than a successful host model call. Real Zammad internal-note writeback remains blocked and was not implemented.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded in final handoff for this slice
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - SupportPlane API, Web, Worker in `supportplane-app`
  - PostgreSQL StatefulSet in `supportplane-data`
  - Zammad, OpenBao, and NATS in `supportplane-integrations`
  - Host-controlled Ollama endpoint configured by `OLLAMA_BASE_URL`
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - / (cluster web)
  - /health (cluster API)
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /support-sessions/:id/draft-suggestion
  - POST /support-sessions/:id/zammad/internal-note-writeback
  - GET /outbox/worker/status
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-105 through EV-2026-04-29-112
- evidence_folder: output/playwright/session-109-bl108-109-110-115-real-sandbox-enablement/
- screenshot_count: 8
- duplicate_screenshot_count: 0
- regression_guard:
  - UI must continue to label local AI as Ollama local/no cloud AI and fallback when fallback is used.
  - BL-108 cannot be accepted until cluster runtime proves `fallbackUsed=false` for host-controlled Ollama.
  - UI/API must continue to show OpenBao sandbox resolver and server-side secret resolution without raw token exposure.
  - Worker status must continue to show NATS JetStream/local durable worker mode when enabled.
  - Egress policy must block uncontrolled external URLs, production-looking Zammad URLs, kill-switch paths, and all writeback until BL-111.
  - Zammad sandbox read must continue to work through OpenBao resolver.
- known_limitations:
  - Zammad internal-note writeback remains blocked until BL-111.
  - Ollama fallback is deterministic and labeled when host Ollama/model access is unavailable.
  - OpenBao is local sandbox-only, not production secret management.
  - NATS is local sandbox-only, not production broker HA/TLS/auth.
  - MinIO evidence persistence and Mailpit notification capture remain planned.
  - This remains a local sandbox topology, not production infrastructure.

## AF-2026-04-29-005: BL-107 Zammad Sandbox Read Connector

- ID: AF-2026-04-29-005
- Milestone: Zammad sandbox read connector
- Scope: SupportPlane API reads real ticket/customer data from Zammad sandbox via HTTP. UI displays real sandbox data with explicit "Zammad sandbox", "Read-only", "Sandbox - No writeback - No production data" labels. Connector Runtime Provenance shows "real sandbox" mode. Audit trail records `zammad_ticket_loaded` event. Writeback remains blocked (`writebackEnabled=false`). Local MVP regression verified. Evidence committed with clean worktree.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 17592be3ea2b172a0262fd8ecfd37308fae21283
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - SupportPlane API, Web, Worker in `supportplane-app`
  - PostgreSQL StatefulSet in `supportplane-data`
  - Zammad StatefulSet in `supportplane-integrations`
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - Zammad http://localhost:8080
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - / (cluster web)
  - /call-console (cluster web)
  - /health (cluster API)
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /connector-installations/:id/runtime-readiness
  - / (local MVP web)
  - /health (local MVP API)
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-099 through EV-2026-04-29-104
- evidence_folder: output/playwright/session-108-bl107-zammad-sandbox-read-connector/
- screenshot_count: 6
- duplicate_screenshot_count: 0
- regression_guard:
  - Zammad sandbox ticket 2 and customer 5 must remain readable via SupportPlane API.
  - UI must continue to display "Zammad sandbox", "Read-only", and "No writeback" labels for Zammad-loaded tickets.
  - Connector runtime readiness must report `realReady=true` and `writebackEnabled=false` for sandbox mode.
  - No real writeback, secrets, or production claims may be introduced without explicit backlog scope.
  - Local MVP on localhost:4110/3200 must remain runnable unless explicitly superseded.
  - Cluster app services must remain deployable via `kubectl apply -k infra/kubernetes/local-podman` and image build/load script.
- known_limitations:
  - Zammad writeback is blocked and not implemented.
  - AI drafts/summaries remain mock-only.
  - Telephony remains fake webhook/call simulator.
  - Screen observation remains metadata-only mock.
  - OpenBao resolver, NATS worker bridge, MinIO evidence, Mailpit notification remain planned.
  - All topology services use local dev placeholder credentials.
  - This is a local sandbox topology, not production infrastructure.

## AF-2026-04-29-004: BL-106 Self-Hosted Service Topology

- ID: AF-2026-04-29-004
- Milestone: Self-hosted service topology (Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, Ollama placement)
- Scope: Local sandbox topology only. This freeze accepts Kubernetes manifests and running workloads for OpenBao, NATS JetStream, Mailpit, MinIO, and Zammad in the local Kind/Podman cluster, plus the documented decision to keep Ollama as a host-controlled service. It does not accept any SupportPlane real integration with these services.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: to_be_recorded_after_reconciliation_commit
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - OpenBao pod in `supportplane-integrations`
  - NATS pod in `supportplane-integrations`
  - Mailpit pod in `supportplane-integrations`
  - MinIO pod in `supportplane-data`
  - Zammad pod in `supportplane-integrations`
  - Zammad-PostgreSQL pod in `supportplane-integrations`
  - Zammad-Redis pod in `supportplane-integrations`
  - Existing SupportPlane API/Web/Worker in `supportplane-app`
  - Existing PostgreSQL in `supportplane-data`
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - OpenBao health http://localhost:8200/v1/sys/health
  - Mailpit web http://localhost:8025
  - Zammad http://localhost:8080
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - / (cluster web)
  - /call-console (cluster web)
  - /health (cluster API)
  - / (local MVP web)
  - /call-console (local MVP web)
  - /health (local MVP API)
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-079 through EV-2026-04-29-098 (reconciled)
- evidence_folder: output/playwright/session-107-bl106-evidence-reconciliation/
- screenshot_count: 20
- duplicate_screenshot_count: 0
- regression_guard:
  - OpenBao must remain reachable in dev mode with health endpoint returning initialized/unsealed.
  - NATS JetStream must remain enabled with file storage and reachable on ports 4222/8222.
  - Mailpit must remain reachable on SMTP 1025 and web UI 8025.
  - MinIO must remain reachable on API 9000 and console 9001 with healthy readiness probes.
  - Zammad must remain reachable on HTTP 3000 with working PostgreSQL and Redis dependencies.
  - No SupportPlane real integration with any topology service may be enabled without explicit backlog scope (BL-107+).
  - No real writeback, secrets, or production claims may be introduced without explicit backlog scope.
  - Existing local MVP on localhost:4110/3200 must remain runnable unless explicitly superseded.
  - Cluster app services must remain deployable via `kubectl apply -k infra/kubernetes/local-podman`.
- known_limitations:
  - Zammad scheduler, worker, and websocket services are not deployed; only railsserver is running.
  - Zammad web UI assets are not served in railsserver-only deployment (no nginx); API endpoints are reachable.
  - Zammad Elasticsearch is disabled; database search is used instead.
  - Ollama is host-controlled, not in-cluster.
  - All topology services use local dev placeholder credentials.
  - This is a local sandbox topology, not production infrastructure.

## AF-2026-04-29-002: BL-104/BL-105 Kubernetes App and PostgreSQL Persistence Foundation

- ID: AF-2026-04-29-002
  Milestone: Kubernetes app services and PostgreSQL persistence foundation
  Scope: SupportPlane API, Web, Worker deployed in local Kind/Podman cluster with PostgreSQL StatefulSet+PVC; both local MVP and cluster paths runnable; no real integrations enabled.
  repo_path: /home/ff/Documents/Projects/SupportPlane
  branch: main
  head: 955c057116f67545d7ac40e13ac91d9af7bdaf5f
  process_or_container: Kind/Podman cluster `supportplane-local` with port-forwards
  port_or_base_url: Cluster API http://localhost:4210, Cluster Web http://localhost:3300, Local MVP API http://localhost:4110, Local MVP Web http://localhost:3200
  routes:
    - / (cluster web)
    - /call-console (cluster web)
    - /health (cluster API)
    - / (local MVP web)
    - /call-console (local MVP web)
    - /health (local MVP API)
  rebuilt_in_slice: true
  duplicate_runtimes_checked: true
  evidence_refs:
    - EV-2026-04-29-044 through EV-2026-04-29-058
  regression_guard:
    - Local MVP on localhost:4110/3200 must remain runnable unless explicitly superseded.
    - Cluster app services must remain deployable via `kubectl apply -k infra/kubernetes/local-podman` and image build/load script.
    - PostgreSQL PVC must remain Bound after StatefulSet restart.
    - No real writeback, secrets, or production claims may be introduced without explicit backlog scope.
  Notes: This is a local Kubernetes app/PostgreSQL foundation only, not production deployment. Images are local sandbox builds (`localhost/supportplane-*:local-k8s`).

## Entry Format

```yaml
- ID: AF-YYYY-MM-DD-001
  Milestone: short milestone name
  Scope: what was accepted
  repo_path: /absolute/path/to/repo
  branch: main
  head: abc1234
  process_or_container: npm dev | docker container name | other
  port_or_base_url: http://localhost:3000
  routes:
    - /
    - /settings
  rebuilt_in_slice: true
  duplicate_runtimes_checked: true
  evidence_refs:
    - EV-YYYY-MM-DD-001
  regression_guard:
    - later work must branch from this accepted lineage
    - route-role changes require explicit backlog scope and new evidence
  Notes: optional
```

## AF-2026-04-29-003: BL-103 Local Kubernetes/Podman Cluster Foundation

- ID: AF-2026-04-29-003
- Milestone: Local Kubernetes/Podman Cluster Foundation
- Scope: Local sandbox cluster foundation only. This freeze accepts a Podman-backed Kind cluster named `supportplane-local`, the four namespace manifests, and a verified smoke-image archive load path. It is not a SupportPlane app deployment and does not implement real integrations.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - Podman container `supportplane-local-control-plane` for Kind Kubernetes
  - node process (NestJS API via tsx) on port 4110 for local/mock runtime boundary proof
  - node process (Next.js dev) on port 3200 for browser proof
  - Podman PostgreSQL on localhost:5434 for local MVP state when runtime proof was captured
- port_or_base_url:
  - Kubernetes API via context `kind-supportplane-local`
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - docs and terminal proof pages rendered by `scripts/bl103_screenshots.js`
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: false
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-032 through EV-2026-04-29-043
- evidence_folder: output/playwright/session-104-bl103-local-k8s-podman-foundation-final/
- screenshot_count: 12
- duplicate_screenshot_count: 0
- cluster:
  - provider: Kind with Podman provider
  - name: supportplane-local
  - context: kind-supportplane-local
  - node_image: kindest/node:v1.31.4
  - namespaces: supportplane-app, supportplane-data, supportplane-integrations, supportplane-observability
- regression_guard:
  - Future work must preserve the truth that BL-103 only creates the cluster and namespace foundation.
  - SupportPlane API/Web/Worker are not deployed into Kubernetes until BL-104 is implemented and verified.
  - PostgreSQL-in-cluster is not accepted until BL-105 is implemented and verified.
  - The direct `kind load docker-image` path must not be assumed for rootless Podman; BL-103 verified `podman save` plus `kind load image-archive`.
  - No real writeback may be enabled without approval gates, kill switch, credential resolution, egress guardrails, idempotency proof, audit/evidence proof, and sandbox-only boundaries.
  - No real credentials may be stored in repo files, API responses, browser storage, evidence bundles, logs, screenshots, or Kubernetes manifests.
  - Zammad, Ollama, OpenBao, NATS, Mailpit, MinIO, and observability remain undeployed by this freeze.
- known_limitations:
  - This is a local sandbox cluster foundation, not a production cluster.
  - Kind v0.27.0 default `kindest/node:v1.32.2` was not accepted because kube-proxy crash-looped with `failed complete: too many open files`.
  - No real writeback was enabled.
  - No real credentials were stored.
  - No production claims were introduced.
  - Next milestone is BL-104/BL-105: SupportPlane app manifests plus PostgreSQL Kubernetes persistence.

## AF-2026-04-29-002: BL-102 Local Kubernetes Self-Hosted Sandbox Architecture and Roadmap

- ID: AF-2026-04-29-002
- Milestone: Local Kubernetes Self-Hosted Sandbox Architecture and Roadmap
- Scope: Architecture/backlog/state freeze for the next strategic direction. This freeze defines the local Kubernetes-on-Podman self-hosted sandbox target and phased roadmap. It is not a working real Kubernetes cluster and does not implement real integrations.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110 for runtime boundary proof
  - node process (Next.js dev) on port 3200 for browser proof
  - Podman PostgreSQL on localhost:5434 for local MVP state when runtime proof was captured
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - docs proof pages rendered by `scripts/bl102_screenshots.js`
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: false
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-015 through EV-2026-04-29-031
- evidence_folder: output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/
- screenshot_count: 17
- duplicate_screenshot_count: 0
- created_docs:
  - docs/SELF_HOSTED_STACK.md
  - docs/LOCAL_KUBERNETES_PODMAN_TARGET.md
  - docs/REAL_E2E_SANDBOX_FLOW.md
  - docs/KUBERNETES_SERVICE_CATALOG.md
  - docs/SANDBOX_INTEGRATION_ACCEPTANCE.md
  - docs/IMPLEMENTATION_PHASES_REAL_E2E.md
  - docs/BACKLOG_REAL_E2E_ROADMAP.md
  - docs/WORKFLOW_TRUTH.md
  - docs/BOUNDARY_MATRIX.md
- regression_guard:
  - Future work must preserve the truth that the current repo is a local/mock MVP until a real integration is implemented and directly verified.
  - The Kubernetes/Podman target must remain marked as not verified until a cluster is created and tested.
  - No real writeback may be enabled without approval gates, kill switch, credential resolution, egress guardrails, idempotency proof, audit/evidence proof, and sandbox-only boundaries.
  - No real credentials may be stored in repo files, API responses, browser storage, evidence bundles, logs, or screenshots.
  - Zammad is the first real ticket/customer/writeback sandbox target.
  - Ollama is the first real local AI provider target.
  - OpenBao is the first real secret-resolution target.
  - NATS JetStream is the first durable worker/broker target.
  - Mailpit is local SMTP capture only, not internet email.
  - MinIO evidence artifacts remain local/sandbox evidence, not compliance certification by themselves.
  - Asterisk/FreePBX, endpoint agents, Tauri companion, screen monitoring, OCR, and remote-support observation remain later/future only.
- known_limitations:
  - This is an architecture/backlog freeze, not a working real Kubernetes cluster.
  - No real writeback was enabled.
  - No real credentials were stored.
  - No production claims were introduced.
  - Next milestone is BL-103 Local Kubernetes/Podman cluster foundation.

## AF-2026-04-29-001: BL-101 MVP Demo Freeze and Final Polish

- ID: AF-2026-04-29-001
- Milestone: MVP Demo Freeze and Final Polish
- Scope: Clean backlog truth, deterministic demo reset, honest product documentation, UI final polish, and canonical screenshot proof for the local/mock MVP demo baseline. Includes `docs/MVP_COMPLETION_AUDIT.md`, `docs/DEMO_GUIDE.md`, `scripts/reset_demo_data.sh`, updated `README.md`, header auth/store mode badges, Evidence Bundle empty-state polish, and full state reconciliation.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 8588ed78ea55ae99897620966f8153f8a690150e
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - /call-console
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-29-001 through EV-2026-04-29-014
- evidence_folder: output/playwright/session-102-bl101-mvp-demo-freeze-final/
- screenshot_count: 14
- regression_guard:
  - `README.md` must remain honest about mock-only/local-only boundaries and must not claim production readiness.
  - `docs/MVP_COMPLETION_AUDIT.md` must accurately reflect implemented vs planned vs not-implemented backlog items.
  - `scripts/reset_demo_data.sh` must refuse non-local DATABASE_URL and require explicit `--force` or `SUPPORTPLANE_DEMO_RESET=allow`.
  - Header must display `DEV / MOCK DATA`, API URL, and auth/store mode badges.
  - Evidence Bundle panel must show local/mock export disclaimer before a session is selected.
  - No page may imply production auth, compliance evidence, real telephony, real AI, real writeback, or real secret resolution.
- known_limitations:
  - All behavior remains local/mock-only.
  - Real writeback remains unimplemented.
  - No production auth, external integrations, or compliance claims exist.

## AF-2026-04-26-001: Support Cockpit UI shell (BL-004)

- ID: AF-2026-04-26-001
- Milestone: Support Cockpit UI shell
- Scope: First user-visible Support Cockpit with session list, ticket context, AI context quality, draft note, and audit trail panels.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 5c8a488da87772f2de33a3fc636ac83deef86e41
- process_or_container:
  - node process (NestJS API) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-009
  - EV-2026-04-26-010
  - EV-2026-04-26-011
  - EV-2026-04-26-012
  - EV-2026-04-26-013
  - EV-2026-04-26-014
  - EV-2026-04-26-015
  - EV-2026-04-26-016
  - EV-2026-04-26-017
- regression_guard:
  - Session list must remain createable and selectable.
  - Ticket context load must return mock connector data visibly.
  - AI Context Quality panel must show loaded/missing/warning states.
  - Draft note panel must remain non-persistent with disabled writeback.
  - Audit trail must display events with actor, timestamp, resource, and metadata.
- Notes:
  - This is a mock-first UI shell. No real ticketing system, database, or AI provider is connected.
  - Dev-only CORS is configured on the API and must be replaced before production.

## AF-2026-04-26-002: Mock AI draft suggestion workflow (BL-005)

- ID: AF-2026-04-26-002
- Milestone: Mock AI draft suggestion workflow
- Scope: Support Cockpit can request a deterministic mock AI support-note draft from current session, ticket, and AI context packet data, display provider/model/prompt/context hash metadata, append a model usage audit event, and keep writeback disabled.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - POST /support-sessions/:id/draft-suggestion
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-018
  - EV-2026-04-26-019
  - EV-2026-04-26-020
  - EV-2026-04-26-021
  - EV-2026-04-26-022
- regression_guard:
  - Draft suggestions must remain clearly labeled mock/dev-only until a real provider slice is explicitly accepted.
  - Provider, model, prompt version, and context hash metadata must remain visible with generated drafts.
  - Draft generation must append an audit event with model usage metadata.
  - Writeback must remain disabled until an explicit ticket writeback backlog slice is implemented and accepted.
- Notes:
  - No real AI provider, external AI API call, production model governance, real authentication, database persistence, or ticket writeback is implemented.

## AF-2026-04-26-004: Evidence bundle skeleton (BL-008)

- ID: AF-2026-04-26-004
- Milestone: Evidence bundle skeleton with JSON and Markdown MVP export
- Scope: SupportPlane can generate a deterministic, tenant-scoped evidence bundle for a support session, export it to JSON and Markdown, display it in the Support Cockpit with summary/JSON/Markdown tabs, append evidence_bundle_generated and evidence_bundle_exported audit events, and redact secrets from all exported output.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-033
  - EV-2026-04-26-034
  - EV-2026-04-26-035
  - EV-2026-04-26-036
  - EV-2026-04-26-037
  - EV-2026-04-26-038
- regression_guard:
  - Evidence Bundle panel must remain visible with Generate button and mock/disclaimer labels.
  - JSON export must include all required sections: sessionSummary, linkedTickets, contextPackets, aiUsage, connectorOperations, auditTimeline, mockDevOnlyDisclaimers, limitations, sourceProvenance.
  - Markdown export must include readable headers for all required sections.
  - Bundle generation must append evidence_bundle_generated and evidence_bundle_exported audit events.
  - Secrets must not be exposed in JSON or Markdown bundle output.
  - Tenant isolation must be enforced for all evidence bundle endpoints.
- Notes:
  - No real database persistence, object storage, cryptographic signing, or compliance-grade integrity is implemented.
  - Redaction is pattern-based, not zero-knowledge.
  - In-memory store means bundles are lost on API restart.

## AF-2026-04-26-007: Suggested greeting generation from call plus ticket context (BL-042)

- ID: AF-2026-04-26-007
- Milestone: Suggested greeting generation from call plus ticket context
- Scope: SupportPlane can generate a deterministic mock AI greeting suggestion for a support session based on caller and ticket context, display it in the Support Cockpit with tone selection, model metadata, and review-required labels, append a greeting_suggestion_generated audit event, and include greeting suggestion summaries in the evidence bundle with mock/disabled flags.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - POST /support-sessions/:id/greeting-suggestion
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-128
  - EV-2026-04-26-129
  - EV-2026-04-26-130
  - EV-2026-04-26-131
  - EV-2026-04-26-132
  - EV-2026-04-26-133
- regression_guard:
  - Greeting Suggestion panel must remain visible with tone selector, generate button, honest mock labels, and "Not spoken or sent automatically" disclaimer.
  - POST /support-sessions/:id/greeting-suggestion must support tone selection, optional callEventId, and tenant-scoped session lookup.
  - Greeting generation must append a greeting_suggestion_generated audit event with provider, model, prompt version, context hash, tone, and mockOnly.
  - Evidence bundle must include greetingSuggestions array with text, tone, provider, model, and mock/disabled flags.
  - Tenant isolation must be enforced for the greeting suggestion endpoint.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - No real AI provider is connected; all greeting generation is deterministic mock output.
  - In-memory store means all data is lost on API restart.

## Guidance

- Do not treat screenshots alone as an acceptance freeze.
- Tie the accepted state to repo truth, runtime truth, and evidence truth.
- If a later report conflicts with the freeze, prove runtime identity before drawing conclusions from git history.

## AF-2026-04-27-007: Local auth, RBAC, and tenant boundary foundation (BL-018)

- ID: AF-2026-04-27-007
- Milestone: Local auth, RBAC, and tenant boundary foundation
- Scope: PostgreSQL-backed local login/logout, seeded demo tenants/users/roles, local session cookie, current actor/tenant resolution, server-side RBAC checks, tenant-boundary denial proof, visible user/tenant/role shell indicator, viewer/operator/admin browser proof, and local auth/RBAC verification script.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - /call-console
  - POST /auth/local/login
  - GET /auth/me
  - POST /auth/logout
  - GET /auth/audit-events
  - /support-sessions/*
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-051 through EV-2026-04-27-063
- evidence_folder: output/playwright/session-018-auth-rbac-tenant-boundary-foundation/
- screenshot_count: 13
- regression_guard:
  - Local auth mode must not trust arbitrary `x-tenant-id`, `x-user-id`, or `x-user-role` headers.
  - Missing/invalid local auth must return 401.
  - Valid auth with insufficient role must return 403.
  - Cross-tenant session access must be denied server-side.
  - Viewer role must remain visibly restricted and server-side denied for create/operator work.
  - Evidence bundle and auth responses must not expose passwords, password hashes, session tokens, token hashes, raw media, or private credentials.
- Notes:
  - This is local MVP auth only, not production authentication, SSO/OAuth/SAML/OIDC, MFA, compliance-grade audit immutability, or production deployment.

## AF-2026-04-27-002: Telephony adapter boundary (BL-044)

- ID: AF-2026-04-27-002
- Milestone: Telephony adapter contract and bridge boundary
- Scope: Mock-only telephony adapter contracts, connector boundary, `/telephony` API endpoints, Call Console Telephony Bridge panel, telephony audit events, and evidence bundle telephony summaries for future PBX/WebRTC/phone-provider integration.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - GET /telephony/status
  - POST /telephony/test
  - POST /telephony/webhooks/fake-provider
  - POST /telephony/calls/:id/control
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-009
  - EV-2026-04-27-010
  - EV-2026-04-27-011
  - EV-2026-04-27-012
  - EV-2026-04-27-013
  - EV-2026-04-27-014
  - EV-2026-04-27-015
  - EV-2026-04-27-016
- evidence_folder: output/playwright/session-044-telephony-adapter-boundary/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must keep the Telephony Bridge panel with honest mock labels.
  - `/telephony/status` must default to provider `mock`, mode `mock`, and verification `not_required`.
  - Fake provider webhook events must map into the existing CallEvent/caller matching flow without real provider calls.
  - Call controls must remain local mock state updates until a real provider slice is explicitly accepted.
  - Telephony audit events must not include tokens, signatures, Authorization headers, env values, or provider credentials.
  - Evidence bundles must include telephonyBridgeEvents and no-real-telephony disclaimers where telephony bridge events are present.
- Notes:
  - No real phone integration, voice/TTS/STT, recording, transcription, real telephony provider call, real AI provider call, real auth, real database persistence, queue-backed workflow, object storage, real Zammad call, production call-center integration, or production deployment is implemented.

## AF-2026-04-27-001: Call Console UI closure (BL-043)

- ID: AF-2026-04-27-001
- Milestone: Call Console UI closure
- Scope: Dedicated mock Call Console at `/call-console` with recent fake calls, caller identity/match panel, recent ticket hints, linked SupportSession panel, mock answer/hold/resume/end lifecycle controls, greeting suggestion integration, timeline/audit panel, Support Cockpit navigation, and evidence bundle inclusion of call lifecycle/greeting data and mock disclaimers.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - POST /calls/:id/status
  - GET /calls/:id/timeline
  - POST /support-sessions/:id/greeting-suggestion
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-001
  - EV-2026-04-27-002
  - EV-2026-04-27-003
  - EV-2026-04-27-004
  - EV-2026-04-27-005
  - EV-2026-04-27-006
  - EV-2026-04-27-007
  - EV-2026-04-27-008
- evidence_folder: output/playwright/session-043-call-console-ui-final-closure/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must remain reachable from the Support Cockpit and show honest mock telephony labels.
  - Recent fake incoming calls must be selectable and show caller match/ticket hints.
  - Linked SupportSession details and Open in cockpit navigation must remain visible.
  - Mock lifecycle transitions must remain constrained to ringing -> answered/missed, answered -> on_hold/ended, and on_hold -> answered/ended.
  - Timeline must distinguish call_resumed from first call_answered.
  - Greeting suggestions generated from the Call Console must remain visible with provider/model/prompt/context metadata and disabled auto-send/voice flags.
  - Evidence bundles must include callEvents, call_status_changed audit entries, greetingSuggestions, and mock telephony / mock AI disclaimers.
- Notes:
  - This supersedes the partial BL-043 screenshot folder `output/playwright/session-043-call-console-ui/`.
  - No real phone integration, voice/TTS/STT, real AI provider call, real auth, real database persistence, queue-backed workflow, object storage, real Zammad call, production call-center integration, or production deployment is implemented.

## AF-2026-04-26-003: Zammad connector boundary (BL-007)

- ID: AF-2026-04-26-003
- Milestone: Zammad connector configuration, read, draft, and mock-safe writeback
- Scope: SupportPlane exposes a Zammad connector boundary with mock mode by default, configurable zammad mode via env, connector status/test endpoints, ticket context load through the connector, internal note draft generation, mock-safe writeback with review gate, and connector audit events visible in the audit trail.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 8cf2c22
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - GET /connectors/zammad/status
  - POST /connectors/zammad/test
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /support-sessions/:id/zammad/internal-note-draft
  - POST /support-sessions/:id/zammad/internal-note-writeback
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-027
  - EV-2026-04-26-028
  - EV-2026-04-26-029
  - EV-2026-04-26-030
  - EV-2026-04-26-031
  - EV-2026-04-26-032
- regression_guard:
  - Connector panel must remain visible with mode, health, capabilities, and honest mock labels.
  - Ticket context load must work through the Zammad connector boundary and append zammad_ticket_loaded audit events.
  - Draft note generation must remain mock-only with review-required state.
  - Writeback must be mock-safe by default and show success/failure state.
  - Audit trail must display connector read, draft, writeback attempted, and writeback succeeded/failed events.
  - Secrets must not be exposed in UI, API responses, or audit metadata.
- Notes:
  - No real Zammad API calls are made in mock mode.
  - Real Zammad mode requires ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN environment variables.
  - The adapter is a typed boundary only; production-ready verification requires a real Zammad instance with documented evidence.

## AF-2026-04-26-005: Fake incoming call webhook and caller matching (BL-009)

- ID: AF-2026-04-26-005
- Milestone: Fake incoming call webhook and caller matching
- Scope: SupportPlane can simulate a fake incoming call via POST /calls/fake-incoming, normalize phone numbers (Belgian-style), match callers against deterministic fixture data, display normalized number, match status, customer name, and recent tickets in the Call Simulator panel, link the call to a selected SupportSession, and include call events in the evidence bundle with mock telephony disclaimers.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - POST /calls/fake-incoming
  - GET /calls/recent
  - GET /calls/:id
  - POST /calls/:id/link-session
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-039
  - EV-2026-04-26-040
  - EV-2026-04-26-041
  - EV-2026-04-26-042
  - EV-2026-04-26-043
  - EV-2026-04-26-044
- regression_guard:
  - Call Simulator panel must remain visible with honest "No real telephony connected" labels.
  - Fake incoming call endpoint must normalize phone numbers and return match results.
  - Caller matching must use deterministic fixture data and display match status, customer name, and recent tickets.
  - Link call to session must update call status to "answered" and append call_linked_to_session audit event.
  - Evidence bundle must include callEvents section with mock telephony disclaimer.
  - All call operations must append audit events with tenant, actor, and metadata.
  - Tenant isolation must be enforced for all call endpoints.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - Phone normalization is Belgian-style only; international support is not implemented.
  - Caller matching is fixture-based mock data, not a real CRM or directory lookup.
  - In-memory store means call data is lost on API restart.


## AF-2026-04-26-006: Automatic SupportSession creation from incoming calls (BL-041)

- ID: AF-2026-04-26-006
- Milestone: Automatic SupportSession creation from incoming call events
- Scope: SupportPlane can optionally auto-create a SupportSession from a fake incoming call when the caller matches a fixture, link the call to the session, display the created session in the Call Simulator panel with an "Open in cockpit" button, append support_session_auto_created and call_auto_linked_to_session audit events, and include the linked call/session relationship in the evidence bundle with mock telephony and auto-created session disclaimers.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - POST /calls/fake-incoming
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-116
  - EV-2026-04-26-117
  - EV-2026-04-26-118
  - EV-2026-04-26-119
  - EV-2026-04-26-120
  - EV-2026-04-26-121
  - EV-2026-04-26-122
  - EV-2026-04-26-123
  - EV-2026-04-26-124
  - EV-2026-04-26-125
  - EV-2026-04-26-126
  - EV-2026-04-26-127
- regression_guard:
  - Call Simulator panel must remain visible with auto-create checkbox, priority dropdown, optional session title input, and honest mock labels.
  - POST /calls/fake-incoming must support autoCreateSession, preferredSessionTitle, and preferredPriority.
  - preferredPriority must be validated; invalid values return 400; valid values are reflected in the auto-created session.
  - Matched caller with autoCreateSession=true must create a tenant-scoped SupportSession with linked tickets from caller matching.
  - Call event must be linked to the auto-created session and status updated to answered.
  - Audit trail must display support_session_auto_created and call_auto_linked_to_session events.
  - Evidence bundle must include callEvents with linkedSessionId and auto-created session disclaimers.
  - Tenant isolation must be enforced for auto-created sessions.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - Phone normalization is Belgian-style only; international support is not implemented.
  - Caller matching is fixture-based mock data, not a real CRM or directory lookup.
  - linked_to_existing is a reserved enum value, not yet implemented.
  - In-memory store means all data is lost on API restart.

## AF-2026-04-27-003: Call recording mock foundation (BL-045)

- ID: AF-2026-04-27-003
- Milestone: Call recording attachment and playback mock foundation
- Scope: Mock-only call recording contracts, in-memory recording storage, `POST /calls/:id/recordings/mock`, `GET /calls/:id/recordings`, `POST /calls/:id/recordings/:recordingId/review`, `POST /calls/:id/recordings/:recordingId/playback`, Call Console Mock Recording panel with attach/playback-placeholder/review UI, evidence bundle `callRecordings` summaries, and recording audit events.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 2ff8061df7a0cda93806c4397ab0439fbb730909
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - POST /calls/:id/recordings/mock
  - GET /calls/:id/recordings
  - POST /calls/:id/recordings/:recordingId/review
  - POST /calls/:id/recordings/:recordingId/playback
- rebuilt_in_slice: false
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-017
  - EV-2026-04-27-018
  - EV-2026-04-27-019
  - EV-2026-04-27-020
  - EV-2026-04-27-021
  - EV-2026-04-27-022
  - EV-2026-04-27-023
  - EV-2026-04-27-024
- evidence_folder: output/playwright/session-045-call-recording-mock-final-closure/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must keep the Mock Recording panel with honest mock labels.
  - `POST /calls/:id/recordings/mock` must attach deterministic mock metadata with `noRealAudio: true` and `mockDevOnly: true`.
  - `GET /calls/:id/recordings` must list tenant-scoped recordings for a call.
  - `POST /calls/:id/recordings/:recordingId/review` must update status to `mock_only` and append `call_recording_reviewed` audit event.
  - `POST /calls/:id/recordings/:recordingId/playback` must append `call_recording_playback_opened` audit event with `placeholderOnly: true`.
  - Evidence bundles must include `callRecordings` summaries with mock disclaimers.
  - Audit events must not include raw audio data, tokens, or secrets.
- Notes:
  - No real audio recording, playback, TTS, STT, transcription, object storage, or provider integration exists.
  - The Markdown evidence bundle renderer does not yet include a dedicated "Call Recordings" section; recording data is present in JSON and via audit timeline entries in Markdown.

## AF-2026-04-27-004: BL-046 Operator Companion Screen Observations

- id: AF-2026-04-27-004
- date: 2026-04-27
- backlog_id: BL-046
- title: Operator companion screen observations during active calls
- status: accepted
- verification_method: browser + api
- runtime_identity:
  - api_url: http://localhost:4110
  - web_url: http://localhost:3200
  - api_process: NestJS (tsx src/main.ts, API_PORT=4110)
  - web_process: Next.js (next dev -p 3200)
  - store: in-memory
- git_head: recorded_at_commit
- branch: main
- verified_paths:
  - /call-console
  - /
  - POST /support-sessions/:id/screen-observations/mock
  - GET /support-sessions/:id/screen-observations
  - POST /support-sessions/:id/screen-observations/:observationId/review
  - POST /support-sessions/:id/screen-observations/:observationId/context-packet
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-033
  - EV-2026-04-27-034
  - EV-2026-04-27-035
  - EV-2026-04-27-036
  - EV-2026-04-27-037
  - EV-2026-04-27-038
  - EV-2026-04-27-039
  - EV-2026-04-27-040
  - EV-2026-04-27-041
- evidence_folder: output/playwright/session-046-operator-companion-closure-canonical/
- screenshot_count: 9
- regression_guard:
  - `/call-console` must keep the Operator Companion panel with honest mock labels.
  - `POST /support-sessions/:id/screen-observations/mock` must return observation with `mockDevOnly: true`, `noRawPixels: true`, `noClipboard: true`, `status: review_required`.
  - `GET /support-sessions/:id/screen-observations` must list tenant-scoped observations.
  - `POST .../review` must return `{observation, previousStatus, newStatus}` and append `screen_observation_reviewed` or `screen_observation_discarded` audit event.
  - `POST .../context-packet` must require `approved` status, return `{observation, contextPacketId, mockDevOnly: true}`, and append `screen_observation_context_packet_created` + `ai_context_loaded` audit events.
  - Evidence bundles must include `screenObservations` summaries with mock disclaimers and safety flags.
  - Audit events must not include raw pixels, clipboard data, or secrets.
- Notes:
  - No real screen capture, raw pixels, clipboard access, OCR, desktop monitoring, or native OS integration exists.
  - No real database persistence; all data is in-memory and lost on API restart.
  - Closure hygiene pass fixed API controller to return wrapped `ScreenObservationCaptureResponse` and resolved lint errors.
  - Backlog truth audit (2026-04-28): the accepted scope is web-based mock screen observations in Call Console UI panels. The BACKLOG.md text 'Scaffold Tauri operator companion' was not fulfilled; no Tauri app, Rust code, or `apps/operator-companion/` directory exists. BL-046 downgraded to `[partial/local-mock]` in BACKLOG.md to reflect this gap.

## AF-2026-04-27-005: BL-047/048/049 Screen Context Hardening Wave final closure

- ID: AF-2026-04-27-005
- Milestone: Screen Context Hardening Wave (BL-047, BL-048, BL-049)
- Scope: Explicit sharing-state storage and lifecycle, deterministic active-window metadata capture, manual screenshot metadata capture with raw image retention disabled, structured observation upload, enhanced redaction with path redaction, expanded ScreenObservation contract, new audit event types, evidence bundle integration, Call Console Operator Companion panel with visible sharing indicator and capture forms, Support Cockpit AI Context Quality panel showing observation-derived packets with redaction status, and canonical 10-screenshot browser-verified closure proof with no-secret/no-raw-image proof.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 8c4619164972f61f1c1b60151cdca3b9ae79d61d
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - GET /support-sessions/:id/screen-observations/sharing-state
  - POST /support-sessions/:id/screen-observations/sharing-state
  - POST /support-sessions/:id/screen-observations/active-window/mock
  - POST /support-sessions/:id/screen-observations/manual-screenshot
  - POST /support-sessions/:id/screen-observations/structured-upload
  - GET /support-sessions/:id/screen-observations
  - POST /support-sessions/:id/screen-observations/:observationId/review
  - POST /support-sessions/:id/screen-observations/:observationId/context-packet
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-042
  - EV-2026-04-27-043
  - EV-2026-04-27-044
  - EV-2026-04-27-045
  - EV-2026-04-27-046
  - EV-2026-04-27-047
  - EV-2026-04-27-048
  - EV-2026-04-27-049
  - EV-2026-04-27-050
  - EV-2026-04-27-051
- evidence_folder: output/playwright/session-047-049-screen-context-hardening-final-closure/
- screenshot_count: 10
- regression_guard:
  - `/call-console` must keep the Operator Companion panel with honest mock labels and visible sharing indicator.
  - Sharing state transitions must remain constrained to inactive -> active, active -> paused, active -> inactive, paused -> active, paused -> inactive.
  - `POST /support-sessions/:id/screen-observations/active-window/mock` must return observation with `mockDevOnly: true`, `noRawPixels: true`, `rawImageRetention: disabled`.
  - `POST /support-sessions/:id/screen-observations/manual-screenshot` must return observation with `kind: screenshot_metadata` and `rawImageRetention: disabled`.
  - `POST /support-sessions/:id/screen-observations/structured-upload` must apply redaction before storage and return `redactionStatus: pattern_redacted` when secrets/paths are present.
  - Evidence bundle JSON and Markdown must include `screenObservations` with `sharingState`, `rawImageRetention`, `redactionStatus`, `safetyFlags`, and mock disclaimers.
  - Audit trail must display `screen_observation_sharing_started`, `active_window_metadata_captured`, `manual_screenshot_metadata_attached`, `structured_screen_observation_uploaded`, `screen_observation_redaction_applied`, `screen_observation_reviewed`, `screen_observation_context_packet_created`, and `ai_context_loaded` events.
  - No secrets, tokens, Authorization headers, filesystem paths, or raw image content may appear in UI or exported bundle output.
- Notes:
  - No real screen capture, raw pixels, clipboard access, OCR, desktop monitoring, or native OS integration exists.
  - No real database persistence; all data is in-memory and lost on API restart.
  - The earlier partial screenshot folder `output/playwright/session-047-049-screen-context-hardening/` is superseded by this final closure folder.


## AF-2026-04-27-008: BL-020 Ticket Context and Connector Safety Foundation

- ID: AF-2026-04-27-008
- Milestone: Ticket Context and Connector Safety Foundation
- Scope: Persistent tenant-scoped CustomerReference, TicketSummary, and ConnectorInstallation models; Prisma migration; GET /customers and GET /customers/:id with RBAC; GET /connector-installations and GET /connector-installations/:id with RBAC; evidence bundle integration with redaction; CustomerReferencePanel and updated ConnectorPanel/EvidenceBundlePanel in web UI; seed data for demo customers, tickets, and connector installations.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 208d8fa83b3bddc93b496c1c035777049e0e1cbe
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - GET /customers
  - GET /customers/:id
  - GET /connector-installations
  - GET /connector-installations/:id
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-064 through EV-2026-04-27-075
- evidence_folder: output/playwright/session-020-ticket-context-connector-safety-foundation-final-closure/
- screenshot_count: 12
- regression_guard:
  - CustomerReferencePanel must remain visible with tenant-scoped customer list.
  - ConnectorPanel must show Installations section with status, type, and safety flags.
  - EvidenceBundlePanel must include Customers and Connectors counts.
  - GET /customers and GET /connector-installations must enforce tenant isolation and RBAC.
  - Evidence bundle JSON/Markdown must include customerReferences and connectorInstallations sections with redaction.
  - No connector credentials, tokens, or raw secrets may appear in UI, API responses, or evidence exports.
- Notes:
  - TicketSummary model exists but has no dedicated API endpoint or UI panel yet.
  - Connector installation PATCH/validate/test endpoints are deferred.
  - Full customer lookup by email/phone query params is accepted but adapter-backed lookup is not implemented.
  - All new entities default to mockDevOnly: true.
  - No real production Zammad, telephony, AI, or object storage is implemented.

---

## AF-2026-04-27-006: BL-050 PostgreSQL Persistence Foundation

- Date: 2026-04-27
- Commit: `9f5b5821c3767e02411c598234ea7df7f635d559`
- Scope: PostgreSQL persistence foundation with PrismaStore and runtime store switching
- Frozen behaviors:
  - `SUPPORTPLANE_STORE=postgres` selects PrismaStore; default or `memory` selects InMemoryStore.
  - PrismaStore uses Prisma v7.8.0 with `@prisma/adapter-pg` and `pg` Pool adapter.
  - All store methods are async and tenant-scoped.
  - Evidence bundle `sourceProvenance.storeType` reports `"memory"` or `"postgres"`.
  - Evidence bundle `sourceProvenance.persistenceClaimed` is `true` when `storeType === "postgres"`.
  - `scripts/verify_postgres_persistence.sh` must pass all 3 phases (create, restart-survive, bundle-store-type).
- Verification script: scripts/verify_postgres_persistence.sh
- Evidence ref: EV-2026-04-27-052
- Notes:
  - Canonical dev seed: `npx prisma db seed` (prisma/seed.ts with PrismaPg adapter).
  - Standalone script seeds via raw SQL for isolated verification.
  - PostgreSQL container must be running (sp-postgres on localhost:5434).
  - All previous in-memory behavior remains unchanged when `SUPPORTPLANE_STORE` is unset or `memory`.

## AF-2026-04-27-009: BL-091 Support Case Workflow Foundation

- ID: AF-2026-04-27-009
- Milestone: Support Case Workflow Foundation
- Scope: End-to-end support case workflow unifying calls, customers, tickets, sessions, observations, connector validation, support note drafts, and evidence bundles. New TicketsModule with GET /tickets and GET /tickets/:id (tenant-scoped, RBAC-protected). Connector installation PATCH/validate/test endpoints with honest mock-only behavior. CaseTimelinePanel showing unified session/call/ticket/link/observation/draft events. SupportNoteDraftPanel generating deterministic local-only mock drafts with visible warnings. Evidence bundle including supportNoteDrafts in JSON and Markdown. Viewer role restrictions enforced server-side.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 1dba4bbe0b75bfb26112619e4b0b2b7af7426132
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - GET /tickets
  - GET /tickets/:id
  - PATCH /connector-installations/:id
  - POST /connector-installations/:id/validate
  - POST /connector-installations/:id/test
  - POST /support-sessions/:id/support-note-drafts
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-076 through EV-2026-04-27-095
- evidence_folder: output/playwright/session-091-support-case-workflow-foundation/
- screenshot_count: 20
- regression_guard:
  - TicketSummaryPanel must remain visible with tenant-scoped ticket list and search.
  - GET /tickets and GET /tickets/:id must enforce tenant isolation and `ticket:read` RBAC.
  - ConnectorPanel must show per-installation Test and Validate buttons with honest mock results.
  - PATCH /connector-installations/:id must validate status literals and enforce `connector_installation:write`.
  - POST /connector-installations/:id/validate and POST /connector-installations/:id/test must return explicit `mode: "mock"`, `realNetwork: false`, `writebackEnabled: false`.
  - SupportNoteDraftPanel must show "Local mock only — not sent to Zammad — requires human review" warning.
  - POST /support-sessions/:id/support-note-drafts must persist InternalNoteDraft records and append `internal_note_drafted` audit events.
  - Evidence bundle JSON and Markdown must include `supportNoteDrafts` section with `mockDevOnly: true`, `notSentToZammad: true`, `requiresHumanReview: true`.
  - CaseTimelinePanel must display session_created, call_linked, ticket_linked, observation_created, draft_generated, and evidence_bundle_exported events.
  - Viewer role must be denied `connector_installation:write/test` and `ticket:write` server-side with 403.
  - Cross-tenant access must return 404 for resources and 403 for permission denied.
- Notes:
  - BL-091 closure was repaired on 2026-04-27 by verifying `internal_note_drafts` in `prisma/schema.prisma` and `prisma/migrations/20260427124815_init_persistence_foundation/migration.sql`; `npx prisma validate` and `npx prisma migrate status` passed against `localhost:5434`.
  - During BL-092 validation, live local database drift on `internal_note_drafts` foreign keys was detected and cleared with `npx prisma migrate reset --force`; schema was recreated from committed migrations and seed data.
  - No real Zammad, telephony, AI provider, queue, object storage, SSO, MFA, or password reset implemented.
  - All new behavior is deterministic local/mock-only with visible UI warnings.

---

## AF-2026-04-28-010: BL-092 Durable Action/Outbox Workflow Foundation

- ID: AF-2026-04-28-010
- Backlog ID: BL-092
- Milestone: Durable Action/Outbox Workflow Foundation
- Scope: Tenant-scoped support action drafts, human review state, approval/rejection, durable local outbox queueing, mock delivery attempts, idempotency keys, retry state, connector provenance, audit events, case timeline integration, evidence-bundle action/outbox summaries, and cockpit Action Center UX.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- implementation_commit: 6819301fa5af04a6b02bbe6af532ae669e7a880a
- closure_repair_commit: 5d0a9c54bd56e714da75bcfe84b8a809a417f6d8
- final_closure_commit: 4c7697de0f143cba09ec60c9f1de05725ec659c7
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - GET /support-sessions/:id/actions
  - POST /support-sessions/:id/actions
  - GET /actions/:id
  - POST /actions/:id/submit-for-review
  - POST /actions/:id/approve
  - POST /actions/:id/reject
  - POST /actions/:id/queue
  - POST /actions/:id/mock-deliver
  - POST /actions/:id/cancel
  - GET /outbox
  - GET /outbox/:id
  - POST /outbox/:id/retry
  - POST /outbox/:id/mock-deliver
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- database_reproducibility:
  - `npx prisma migrate reset --force` recreated the schema from committed migrations.
  - `npx prisma db seed` reseeded local demo tenants, users, adapters, customers, tickets, and connector installations.
  - `npx prisma migrate status` reported database schema is up to date after reset.
- evidence_refs:
  - EV-2026-04-27-096 through EV-2026-04-27-112
  - EV-2026-04-28-001
  - EV-2026-04-28-002
- evidence_folder: output/playwright/session-092-durable-action-outbox-workflow-final-closure/
- screenshot_count: 17
- validation_summary:
  - `npm install` passed; npm reported 10 vulnerabilities (8 moderate, 2 high), with no dependency changes introduced in BL-092.
  - `npm run lint`, `npm run typecheck --workspaces --if-present`, `npm run validate`, and `npm run health` passed.
  - `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`, and `npx prisma db seed` passed.
  - `scripts/verify_postgres_persistence.sh` passed (fixed to use alternative port when 4110 is occupied).
  - `scripts/verify_local_auth_rbac.sh` passed.
  - `scripts/verify_ticket_context_connector.sh` passed (114/114 API tests).
  - `scripts/verify_support_case_workflow.sh` passed.
  - `scripts/verify_durable_action_outbox.sh` passed.
  - API tests: 114/114 pass.
  - Contracts tests: 29/29 pass.
  - Web tests: 15/15 pass.
  - AI tests: 9/9 pass.
  - Connectors build/test passed; connector tests: 16/16 pass.
  - Web build passed with existing Next ESLint-plugin warning.
  - State docs and bootstrap gate checks passed.
  - Python compilation passed.
- regression_guard:
  - Viewer can inspect actions/outbox but cannot mutate.
  - Operator/support_agent can create drafts and submit for review.
  - Admin/owner can approve/reject/queue approved actions.
  - Cross-tenant action/outbox access returns not found/denied server-side.
  - Forged identity headers are ignored in local auth mode.
  - Mock delivery must report `mode: "mock"`, `realNetwork: false`, `writebackEnabled: false`, and `externalWriteAttempted: false`.
  - Evidence bundle action/outbox summaries must not expose connector tokens, password hashes, session tokens, raw env secrets, raw audio, raw screen pixels, or private credentials.
- Known limitations:
  - Durable action/outbox workflow is local PostgreSQL state and synchronous mock delivery only, not a production queue or worker.
  - No failed/unavailable connector path was implemented beyond retry support for failed outbox records.
  - Legacy BL-007 writeback route still exists but BL-092 workflow does not call it.
- Explicit non-claims:
  - No real production Zammad writeback, real email sending, real telephony/PBX integration, real AI provider calls, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.

---

## AF-2026-04-28-011: BL-093 Background Outbox Worker Retry/Dead-Letter Foundation

- ID: AF-2026-04-28-011
- Backlog ID: BL-093
- Milestone: Background outbox worker retry/dead-letter foundation
- Scope: Local PostgreSQL-backed mock outbox worker/process-once path, safe claim/lock fields, attempt history, retry scheduling, dead-letter/cancel controls, deterministic mock connector failure scenarios, worker status, RBAC/tenant boundaries, audit events, case timeline entries, evidence-bundle provenance, worker CLI, verification script, and cockpit Delivery Operations UI.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- final_closure_commit: f5c101da467384bce940f886f0e8226478180bfa
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- worker_mode: local_mock_worker/process-once
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- migration: prisma/migrations/20260428120000_outbox_worker_retry_deadletter_foundation/
- evidence_refs:
  - EV-2026-04-28-004
  - EV-2026-04-28-005
- evidence_folder: output/playwright/session-093-outbox-worker-retry-deadletter-foundation/
- screenshot_count: 24
- validation_summary:
  - `npm install` passed; npm reported 10 vulnerabilities (8 moderate, 2 high), treated as pre-existing audit debt.
  - `npm run lint`, `npm run typecheck --workspaces --if-present`, `npm run validate`, and `npm run health` passed after replacing a stale ESLint suppression with a selected-item ref.
  - `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`, and `npx prisma db seed` passed.
  - `npx prisma migrate deploy` applied the BL-093 migration before final status reported schema up to date.
  - `scripts/verify_postgres_persistence.sh`, `scripts/verify_local_auth_rbac.sh`, `scripts/verify_ticket_context_connector.sh`, `scripts/verify_support_case_workflow.sh`, `scripts/verify_durable_action_outbox.sh`, and `scripts/verify_outbox_worker_retry_deadletter.sh` passed.
  - API tests: 114/114 pass.
  - Contracts tests: 29/29 pass.
  - Web tests: 15/15 pass.
  - AI tests: 9/9 pass.
  - Connectors build/test passed; connector tests: 16/16 pass.
  - Worker build passed.
  - Web build passed with existing Next ESLint-plugin warning.
- known_limitations:
  - Worker processing is local/mock-only and API/CLI driven; it is not production queue infrastructure.
  - Claiming is sufficient for the local PostgreSQL MVP but not a distributed queue guarantee.
  - No real connector writeback, email, telephony, AI provider call, external broker, object storage, raw media storage, production audit immutability, compliance claim, SSO/OAuth/SAML/OIDC, MFA, password reset, or production deployment was implemented.
- explicit_non_claims:
  - No real production Zammad writeback was implemented.
  - No real email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.

---

## AF-2026-04-28-012: BL-094 Delivery Policy Controls and Connector Readiness Gates

- ID: AF-2026-04-28-012
- Backlog ID: BL-094
- Milestone: Connector writeback readiness gates and delivery policy controls
- Scope: Tenant-scoped DeliveryPolicy model with Prisma migration, policy evaluation service with ordered gates (killSwitch → enabled → allowedActionTypes → approvalRequired → minimumApproverRole → requireHumanReview → requireEvidenceBundle → requireConnectorValidation), connector readiness check returning readyForRealWriteback=false, policy enforcement in ActionsService.queue() and processClaimedOutbox(), real writeback toggle blocked with 400, admin/viewer policy panel in Support Cockpit, delivery_policy:read/write RBAC, policy audit events (delivery_policy_evaluated, delivery_policy_blocked), evidence bundle policy provenance, and verification script with 14 checks.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- final_closure_commit: 93afe787847964b666e502d083b0dbc63cc79d86
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - GET /delivery-policies
  - GET /delivery-policies/:id
  - PATCH /delivery-policies/:id
  - POST /delivery-policies/:id/validate
  - POST /delivery-policies/:id/connector-readiness
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- migration: prisma/migrations/20260428094012_delivery_policy_controls/
- evidence_refs:
  - EV-2026-04-28-006
  - EV-2026-04-28-007
  - EV-2026-04-28-008
  - EV-2026-04-28-009
  - EV-2026-04-28-010
  - EV-2026-04-28-011
- evidence_folder: output/playwright/session-095-bl094-final-closure-max20/
- screenshot_count: 20
- governance_repair_note: prior closure used 24 screenshots in session-094-delivery-policy-controls-final-closure/, violating AGENTS.md cap. this acceptance freeze updated to the canonical max-20 folder after governance repair.
- validation_summary:
  - `npm install` passed; npm reported 10 vulnerabilities (8 moderate, 2 high), treated as pre-existing audit debt.
  - `npm run lint`, `npm run typecheck --workspaces --if-present`, `npm run validate`, and `npm run health` passed.
  - `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`, and `npx prisma db seed` passed.
  - `scripts/verify_postgres_persistence.sh` passed.
  - `scripts/verify_local_auth_rbac.sh` passed.
  - `scripts/verify_ticket_context_connector.sh` passed.
  - `scripts/verify_support_case_workflow.sh` passed.
  - `scripts/verify_durable_action_outbox.sh` passed.
  - `scripts/verify_outbox_worker_retry_deadletter.sh` passed.
  - `scripts/verify_delivery_policy_controls.sh` passed all 14 checks.
  - API tests: 114/114 pass.
  - Contracts tests: 29/29 pass.
  - Web tests: 15/15 pass.
  - AI tests: 9/9 pass.
  - Connectors build/test passed; connector tests: 16/16 pass.
  - Web build passed with existing Next ESLint-plugin warning.
  - State docs and bootstrap gate checks passed.
  - Python compilation passed.
- regression_guard:
  - Delivery Policy panel must remain visible in Support Cockpit with policy state, kill switch, approval required, minimum approver role, mock-only locked ON, real network calls locked OFF.
  - Admin role must be able to PATCH safe policy fields (killSwitch, approvalRequired, minimumApproverRole, allowedActionTypes, maxAttempts).
  - Viewer role must see read-only policy panel with disabled controls.
  - PATCH requesting `allowRealNetworkCalls=true`, `writebackEnabled=true`, or `externalWriteAllowed=true` must return 400.
  - `POST /delivery-policies/:id/validate` must return `decision: mock_only_allowed` with `allowed: true` under default policy.
  - `POST /connector-installations/:id/readiness` must return `readyForRealWriteback: false`.
  - ActionsService.queue() must evaluate policy and throw ForbiddenException with policy decision if blocked; blocked actions must be dead-lettered with `policy_blocked` attempts.
  - ActionsService.queue() must evaluate policy and throw ForbiddenException with policy decision if blocked.
  - ActionsService.processClaimedOutbox() must re-evaluate policy and create `policy_blocked` attempt if blocked.
  - Audit trail must display `delivery_policy_evaluated` and `delivery_policy_blocked` events with full decision metadata.
  - Evidence bundle must include policy provenance with `mockOnly: true`, `realNetworkAllowed: false`, `writebackEnabled: false`.
  - Cross-tenant policy access must be denied server-side.
  - Forged identity headers must be ignored in local auth mode.
- known_limitations:
  - Real writeback readiness gates are structural only; real writeback requires future connector credential management, network path validation, and tenant admin configuration.
  - Policy evaluation uses a hardcoded default fallback (`mock_only_allowed`) for dev-mode compatibility when no DB policy exists.
  - No production queue semantics, external broker, or distributed worker infrastructure exists.
- explicit_non_claims:
  - No real production Zammad writeback was implemented.
  - No real email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.


## AF-2026-04-28-013: BL-095 Connector Installation Settings Foundation

- ID: AF-2026-04-28-013
- Backlog ID: BL-095
- Milestone: Connector installation settings foundation
- Scope: ConnectorInstallation Prisma model extended with `displayName`, `description`, `capabilities`, `mockMode`, `enabled`, `timeoutMs`, and `validateBeforeWrite` safety flag. Prisma migration `20260428131300_bl095_connector_installation_settings` applied. API endpoints `POST /connector-installations`, `PATCH /connector-installations/:id`, `POST /connector-installations/:id/validate`, `POST /connector-installations/:id/test` with Zod contract validation, RBAC enforcement (`connector_installation:read/write/test`), server-side secret redaction (`[REDACTED]`), cross-tenant denial (404), viewer mutation denial (403). Web UI ConnectorPanel with expandable installation cards, safe field editing, mock mode locked ON, credentials placeholder (`•••••••• managed server-side`), and viewer read-only state. Evidence bundle includes `connectorInstallations` summaries with redaction. Connector readiness returns `readyForRealWriteback: false`. Delivery policy still denies real writeback.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- final_closure_commit: ff83fdf8d530d549fd7a24c6820f07251f0aaeb5
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - POST /connector-installations
  - PATCH /connector-installations/:id
  - POST /connector-installations/:id/validate
  - POST /connector-installations/:id/test
  - POST /connector-installations/:id/readiness
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- migration: prisma/migrations/20260428131300_bl095_connector_installation_settings/
- evidence_refs:
  - EV-2026-04-28-044
  - EV-2026-04-28-045
  - EV-2026-04-28-046
  - EV-2026-04-28-047
  - EV-2026-04-28-048
  - EV-2026-04-28-049
  - EV-2026-04-28-050
  - EV-2026-04-28-051
  - EV-2026-04-28-052
  - EV-2026-04-28-053
  - EV-2026-04-28-054
  - EV-2026-04-28-055
  - EV-2026-04-28-056
  - EV-2026-04-28-057
- evidence_folder: output/playwright/session-096-bl095-connector-installation-settings-final-closure/
- screenshot_count: 14
- closure_repair_note: prior closure used conflicting session-095 folder name (BL-094 already owns session-095), incomplete validation gate, missing 18-section handoff, short commit hash, and under-proven cross-tenant/server-side denial. this acceptance freeze uses the canonical session-096 folder after closure repair.
- validation_summary:
  - `npm install` passed; npm reported 10 vulnerabilities (8 moderate, 2 high), treated as pre-existing audit debt.
  - `npm run lint`, `npm run typecheck --workspaces --if-present`, `npm run validate`, and `npm run health` passed.
  - `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`, and `npx prisma db seed` passed.
  - `scripts/verify_delivery_policy_controls.sh` passed all 14 checks.
  - `scripts/verify_ticket_context_connector.sh` passed all 14 checks.
  - `scripts/verify_support_case_workflow.sh` passed all 15 checks.
  - `cd apps/api && npm test` passed: 124/124 tests (12 suites).
  - `npm test --workspace @supportplane/contracts` passed: 29/29 tests.
  - `npm test --workspace @supportplane/web` passed: 15/15 tests.
  - `npm test --workspace @supportplane/connectors` passed: 16/16 tests.
  - Web build passed with existing Next ESLint-plugin warning.
  - State docs and bootstrap gate checks passed.
  - Python compilation passed.
- regression_guard:
  - ConnectorInstallation Prisma model must keep `displayName`, `description`, `capabilities`, `mockMode`, `enabled`, `timeoutMs` fields.
  - `POST /connector-installations` must create installations with `mockMode: true`, `enabled: false`, `status: 'inactive'`.
  - `PATCH /connector-installations/:id` must validate `status` against `active|inactive|error`, enforce `connector_installation:write`, and reject viewer with 403.
  - GET responses must redact secret-like config keys to `[REDACTED]`.
  - Cross-tenant access must return 404 for both GET and PATCH.
  - Evidence bundle JSON must include `connectorInstallations` array with `safetyFlags` redacted.
  - UI must show mock mode locked ON, credentials placeholder, and viewer view-only message.
  - `POST /connector-installations/:id/readiness` must return `readyForRealWriteback: false`.
- known_limitations:
  - Credential/config JSON storage is local/mock/dev-only; not production credential management.
  - No production credential broker, encrypted secret storage, or secret reference resolution exists.
  - The global `/connectors/zammad/*` singleton remains separate from per-tenant DB-backed `ConnectorInstallation`.
- explicit_non_claims:
  - No real production Zammad writeback, email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.


---

## AF-2026-04-28-014 — BL-097 Credential Reference Foundation

- backlog_id: BL-097
- status: accepted
- accepted_at: 2026-04-28T17:30:00+02:00
- accepted_by: coding-agent
- commit: b6b42ce571edbccb742eaff447338afb622aa8a3
- evidence_refs:
  - EV-2026-04-28-058
  - EV-2026-04-28-059
  - EV-2026-04-28-060
  - EV-2026-04-28-061
  - EV-2026-04-28-062
  - EV-2026-04-28-063
- evidence_folder: output/playwright/session-097-credential-reference-foundation-final-closure/
- screenshot_count: 6
- validation_summary:
  - `npx tsc --noEmit -p apps/api/tsconfig.json` passed (0 errors).
  - `npx tsc --noEmit -p apps/web/tsconfig.json` passed (0 errors).
  - `npx prisma generate` passed.
  - `npx prisma migrate deploy` applied migration `20260428160000_bl097_credential_reference_foundation`.
  - `npx prisma db seed` passed.
  - `cd apps/api && npm test` passed: 134/134 tests (13 suites).
  - `npm test --workspace @supportplane/contracts` passed: 29/29 tests.
  - `npm test --workspace @supportplane/web` passed: 15/15 tests.
  - `npm test --workspace @supportplane/connectors` passed: 16/16 tests.
  - `python3 scripts/check_state_docs.py` passed.
  - `python3 -m py_compile scripts/check_state_docs.py scripts/init_template.py` passed.
  - API runtime verified via curl with dev headers.
  - Web runtime verified via curl HTTP 200.
- regression_guard:
  - `ConnectorCredentialReference` Prisma model must keep all fields including `secretRef`.
  - `GET /credential-references` and `GET /credential-references/:id` must always return `secretRef: "[REDACTED]"`.
  - `POST /credential-references` must require `credential_reference:write` permission.
  - `POST /connector-installations/:id/link-credential` and `/unlink-credential` must require `connector_installation:write`.
  - Viewer role must be denied write operations with 403.
  - Evidence bundle JSON must include `credentialReferences` array with metadata only (no `secretRef`).
  - `ConnectorPanel.tsx` must show credential references per installation with status badges and link/unlink controls for admin.
- known_limitations:
  - `secretRef` values are local-dev opaque placeholders only. No production credential broker, Vault/KMS, or encrypted secret storage exists.
  - No secret reference resolution at connector runtime; global connector singleton remains env-driven.
  - Credential reference validation is stored but not actively verified against real endpoints.
- explicit_non_claims:
  - No real production Zammad writeback, email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.
  - No real secret broker, credential vault, or encrypted secret storage was implemented.


---

## AF-2026-04-28-015 — BL-098 Connector Runtime Configuration + Credential Reference Readiness Foundation (Repaired)

- backlog_id: BL-098
- status: accepted
- accepted_at: 2026-04-28T21:15:00+02:00
- accepted_by: coding-agent
- commit: 298ea8f57bbef9c3e69509c72e183001e9852e25
- evidence_refs:
  - EV-2026-04-28-094
  - EV-2026-04-28-095
  - EV-2026-04-28-096
  - EV-2026-04-28-097
  - EV-2026-04-28-098
  - EV-2026-04-28-099
  - EV-2026-04-28-100
  - EV-2026-04-28-101
  - EV-2026-04-28-102
  - EV-2026-04-28-103
  - EV-2026-04-28-104
  - EV-2026-04-28-105
  - EV-2026-04-28-106
  - EV-2026-04-28-107
  - EV-2026-04-28-108
- evidence_folder: output/playwright/session-100-bl098-evidence-repair-final/
- screenshot_count: 15
- cli_artifacts:
  - evidence-bundle-no-secret-summary.json
  - audit-bl098-events-summary.json
  - screenshot-md5s.txt
  - proof-state-mapping.md
- validation_summary:
  - `npm run lint` passed
  - `npm run typecheck --workspaces --if-present` passed for all 9 workspaces
  - `npm run validate` passed
  - `npm run health` passed
  - `npx prisma validate` passed
  - `npx prisma generate` passed
  - `npx prisma migrate status` passed (schema up to date)
  - `npx prisma db seed` passed (idempotent, exactly 1 cred linked)
  - `cd apps/api && npm test` passed: 142/142 tests (14 suites)
  - `npm test --workspace @supportplane/contracts` passed: 29/29 tests (6 suites)
  - `npm test --workspace @supportplane/web` passed: 15/15 tests (1 suite)
  - `npm test --workspace @supportplane/connectors` passed: 16/16 tests (6 suites)
  - `scripts/verify_connector_runtime_readiness.sh` passed all 12/12 checks
  - `python3 scripts/check_state_docs.py` passed
  - `python3 scripts/check_state_docs.py --bootstrap-gate` passed
  - API runtime verified via curl: all endpoints return correct mock-only safety fields
  - Web runtime verified via Playwright browser automation: 15 screenshots captured in `session-100-bl098-evidence-repair-final/`, 0 duplicate MD5 hashes, all ≤900px height
  - Screenshot 03 visibly shows `valid: true` with Valid badge
  - Screenshot 08 shows generated evidence bundle summary (not empty state)
  - Screenshot 15 shows connector panel Mock-only proof (not empty state)
  - Screenshots 09 and 10 are compact styled API pages (not unreadable tall JSON dumps)
- regression_guard:
  - `GET /connector-installations/:id/config-schema` must return `mockOnly: true`, `safeFields`, and `rejectedFields`.
  - `POST /connector-installations/:id/validate-config` must reject `mockMode: false` with error `MOCK_MODE_REQUIRED`.
  - `POST /connector-installations/:id/validate-config` must reject unsafe fields (`apiToken`, `baseUrl`, `realEndpoint`) with severity `error`.
  - `POST /connector-installations/:id/runtime-readiness` must return `realReady: false`, `realNetwork: false`, `writebackEnabled: false`, `externalWriteAttempted: false`.
  - `GET /connector-installations/runtime/resolve` must return `mode: 'mock'`, `realNetwork: false`, `writebackEnabled: false`.
  - `GET /connector-installations/runtime/resolve` credential references must never include `secretRef`; must include `secretResolutionImplemented: false`.
  - Viewer role must be denied config validation and readiness mutations with 403.
  - Cross-tenant access must return 404 on all runtime endpoints.
  - Evidence bundle JSON must include connector installations with `realNetwork: false`, `writebackEnabled: false`, `externalWriteAttempted: false`.
- known_limitations:
  - Config schema is hardcoded for mock-only Zammad-local development; no dynamic schema generation from real connector manifests.
  - Runtime readiness `mockReady` depends only on `mockMode && enabled`; no actual health checks against external endpoints.
  - Secret resolution is not implemented; `secretResolutionImplemented: false` is hardcoded.
  - No production credential broker, Vault/KMS, or encrypted secret storage exists.
- explicit_non_claims:
  - No real production Zammad writeback, email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.
  - No real secret broker, credential vault, or encrypted secret storage was implemented.

## BL-099 — Connector Runtime Test Coverage + Documentation Hardening

- accepted_at: 2026-04-28T21:30:00+02:00
- scope: connector_runtime_test_coverage_documentation_hardening
- backlog_id: BL-099
- final_commit: 298ea8f57bbef9c3e69509c72e183001e9852e25
- verification:
  - lint: pass
  - typecheck (9 workspaces): pass
  - validate: pass
  - health: pass
  - prisma validate/generate/migrate status/db seed: pass
  - apps/api tests: 147/147 pass (14 suites)
  - packages/contracts tests: 43/43 pass (7 suites)
  - apps/web tests: 19/19 pass (1 suite)
  - packages/connectors tests: 16/16 pass (6 suites)
  - scripts/verify_connector_runtime_readiness.sh: 12/12 pass
  - scripts/verify_connector_runtime_contracts.sh: 14/14 pass
  - screenshot script: 13 screenshots, 0 duplicate MD5 hashes
- what_is_frozen:
  - Connector runtime config schema, validation, readiness, and resolver endpoints
  - Mock-only safety enforcement: mockMode required, unsafe fields rejected
  - No secretRef leakage in any runtime response
  - Credential metadata only in resolver output
  - RBAC boundaries: viewer 403, operator/admin allowed on safe operations
  - Cross-tenant isolation: 404 on all runtime endpoints
  - Audit event emission for config validation, readiness, runtime resolve
- regression_guard:
  - `GET /connector-installations/:id/config-schema` must return `mockOnly: true`
  - `POST .../validate-config` safe config → valid:true, mockMode:true, realNetwork:false
  - `POST .../validate-config` unsafe config → valid:false with ≥3 errors (MOCK_MODE_REQUIRED, UNSAFE_FIELD_REJECTED, REAL_NETWORK_FIELD_REJECTED)
  - `POST .../runtime-readiness` → realReady:false, realNetwork:false, writebackEnabled:false
  - `GET .../runtime/resolve` → mode:'mock', no secretRef, secretResolutionImplemented:false
  - Viewer denied 403 on validate-config and runtime-readiness
  - Cross-tenant access returns 404
  - Evidence bundles remain secret-free
- known_limitations:
  - Config schema is hardcoded for mock-only Zammad-local development
  - Runtime readiness depends only on static flags; no actual external health checks
  - Secret resolution is not implemented; `secretResolutionImplemented: false` is hardcoded
  - No production credential broker, Vault/KMS, or encrypted secret storage exists
- explicit_non_claims:
  - No real production Zammad writeback, email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.
  - No real secret broker, credential vault, or encrypted secret storage was implemented.

## BL-100 — Real Writeback Path Design Document

- accepted_at: 2026-04-28T21:30:00+02:00
- scope: real_writeback_path_design_document
- backlog_id: BL-100
- final_commit: 298ea8f57bbef9c3e69509c72e183001e9852e25
- verification:
  - lint: pass
  - typecheck (9 workspaces): pass
  - validate: pass
  - health: pass
  - design document reviewed and accepted
- what_is_frozen:
  - `docs/REAL_WRITEBACK_PATH_DESIGN.md` as the canonical design document for real writeback
  - Current truth section documents mock-only state honestly
  - Block reasons section documents why real writeback is not safe today
  - Required architecture section documents all components needed before real writeback
  - Phased path (Phase 0→4) defines incremental, gated rollout
  - Explicit non-goals prevent scope creep and unsafe shortcuts
- regression_guard:
  - No implementation of real writeback without satisfying all "Do not build until" checklist items
  - No credential broker, encrypted storage, or network egress policy may be implemented without design-doc alignment
  - No production writeback may be enabled before Phase 3 dry-run and Phase 4 approval gates + kill switch
- known_limitations:
  - Design document only; no implementation
  - No credential broker exists
  - No encrypted secret storage exists
  - No network egress policy exists
  - No approval gate UI exists
  - No kill switch exists
- explicit_non_claims:
  - No real production Zammad writeback, email sending, telephony/PBX integration, AI provider call, external broker-backed queue, object storage, raw screenshot storage, raw audio/media storage, production audit immutability, compliance certification, production deployment, SSO/OAuth/SAML/OIDC, MFA, or password reset was implemented.
  - No real secret broker, credential vault, or encrypted secret storage was implemented.
  - Design document does not constitute implementation or readiness for real writeback.


---

## BL-107 — Zammad Sandbox Bootstrap and Real Read Connector

- frozen_at: 2026-04-29T19:55:00+02:00
- backlog_id: BL-107
- final_commit: 0fafced39863317269c825627ea689e2d612d4a9
- verification:
  - lint: pass
  - typecheck (all workspaces): pass
  - tests: 43/43 pass
  - zammad_sandbox_reachable: yes (localhost:8080)
  - cluster_api_reachable: yes (localhost:4210)
  - cluster_web_reachable: yes (localhost:3300)
  - real_zammad_ticket_read: yes (ticket 2, customer 5)
  - ui_sandbox_labels_visible: yes
  - writeback_blocked: yes (writebackEnabled=false)
- what_is_frozen:
  - Zammad sandbox seeded with deterministic customer (Acme BVBA, ID 5) and ticket (68002, ID 2)
  - SupportPlane API reads real ticket/customer from Zammad sandbox via FetchZammadHttpClient
  - UI displays real sandbox data with explicit "Zammad sandbox", "Read-only", "Sandbox · No writeback · No production data" labels
  - Connector Runtime Provenance shows "real sandbox" mode and "sandbox local cluster" network
  - Audit trail records `zammad_ticket_loaded` event
  - Contracts updated to allow `mockMode: boolean`, `realNetwork: boolean`, `mode: 'mock' | 'zammad'`
  - Contract tests accept sandbox mode values while maintaining `writebackEnabled: false` safety boundary
  - Kubernetes manifests include ZAMMAD_BASE_URL, ZAMMAD_CONNECTOR_MODE, ZAMMAD_API_TOKEN
- regression_guard:
  - Any change to connector runtime contracts must preserve the `writebackEnabled: false` boundary for mock/sandbox mode
  - Any new connector mode must include explicit safety labels in UI
  - Real network mode must require explicit `mockMode=false` and env-based credentials
- known_limitations:
  - Writeback is explicitly blocked; no real write path exists
  - Zammad API token stored in Kubernetes secret only (not production-grade)
  - No OpenBao credential resolver yet
  - No NATS worker bridge yet
  - No Ollama AI provider yet
  - No MinIO evidence persistence yet
  - No Mailpit notification capture yet
- explicit_non_claims:
  - No production Zammad read/write
  - No real Zammad writeback
  - No public replies
  - No production secrets vault
  - No production auth/OIDC/MFA
  - No compliance certification
  - No real AI provider calls
  - No real telephony/PBX integration

---

## BL-111/112/113 — Sandbox Writeback E2E with MinIO Evidence and Mailpit Notification

- frozen_at: 2026-04-30T10:45:00+02:00
- backlog_id: BL-111, BL-112, BL-113
- final_commit: bb81e7a9029d212fd01507c564635c0a455a6140
  note: This freeze covers the pre-existing commit where sandbox_delivered status was added. No new code changes were needed for closure; the work was evidence generation, truth hygiene, and state reconciliation.
- verification:
  - lint: pass
  - typecheck (all workspaces): pass
  - tests: 24/24 pass
  - cluster_api_reachable: yes (localhost:4210)
  - cluster_web_reachable: yes (localhost:3300)
  - zammad_sandbox_reachable: yes (localhost:8080)
  - real_zammad_writeback: yes (article 16 on ticket 2, internal note)
  - minio_evidence_persistence: yes (1579 bytes, SHA-256 checksum)
  - mailpit_notification_capture: yes (13 messages, latest matches)
  - ui_sandbox_delivered_visible: yes (Action Center, Delivery Ops, Case Timeline, Audit Trail)
  - sandbox_delivered_status_distinct: yes (not conflated with mock_delivered)
- what_is_frozen:
  - Sandbox-only Zammad internal note writeback with approval gate, delivery policy, kill switch, idempotency
  - `sandbox_delivered` as distinct terminal status from `mock_delivered`
  - MinIO evidence artifact persistence with checksum, bucket, object key, disclaimer
  - Mailpit local SMTP notification capture with subject, timestamp, message ID
  - OpenBao server-side credential resolution for Zammad API token
  - NATS JetStream durable worker bridge with fallback to PostgreSQL local outbox
  - Audit events: `action_sandbox_delivered`, `outbox_sandbox_delivered`, `outbox_item_attempted`, `outbox_processing_succeeded`
  - UI panels show sandbox_delivered with green badge, summary counts, attempt history
- regression_guard:
  - `sandbox_delivered` must remain a distinct terminal status; do not merge with `mock_delivered`
  - Any change to delivery policy must preserve approval-required and kill-switch boundaries
  - MinIO evidence must include checksum, disclaimer, and no-secret proof
  - Mailpit notification must include local-only disclaimer
  - Zammad writeback must remain internal-note only; no public replies
- known_limitations:
  - Sandbox writeback is local cluster only; no production writeback
  - Zammad API token stored in Kubernetes secret (not production-grade)
  - OpenBao is local sandbox only, not production secret management
  - NATS is local JetStream only, not production broker HA
  - MinIO evidence is local sandbox only, not compliance-grade
  - Mailpit is local capture only, no internet email
  - UI `externalWriteAttempted` summary may show false in some views despite true in audit payload
- explicit_non_claims:
  - No production Zammad read/write
  - No public replies or broad ticket mutation
  - No production secrets vault
  - No production auth/OIDC/MFA
  - No compliance certification
  - No production broker HA
  - No production AI governance
  - No real telephony/PBX integration
  - No endpoint agent or screen monitoring

---

## BL-114 — Local Observability Baseline

- frozen_at: 2026-04-30T11:20:00+02:00
- backlog_id: BL-114
- final_commit: recorded in final handoff for this slice
- verification:
  - lint: pass
  - typecheck (all workspaces with scripts): pass
  - tests (all workspaces with tests): pass
  - state_docs_check: pass
  - observability_baseline_script: pass
  - cluster_api_reachable: yes (localhost:4210)
  - cluster_web_reachable: yes (localhost:3300)
  - worker_healthy: yes
  - observability_namespace_ready: yes
  - prometheus_query: yes
  - grafana_health: yes
  - ui_observability_panel_visible: yes
- what_is_frozen:
  - API request correlation ID middleware with response header propagation
  - Safe in-memory telemetry and Prometheus-compatible `/metrics`
  - `/observability/status` operator status endpoint without secrets
  - Worker/outbox correlation propagation and structured logs
  - Sandbox writeback, MinIO, Mailpit, NATS, OpenBao, and local AI telemetry events
  - Local Kubernetes OpenTelemetry Collector, Prometheus, Grafana, and Loki manifests
  - Operator Local Observability panel with explicit local-only/no-production-monitoring copy
  - BL-116 readiness audit only; BL-116 remains unaccepted
- regression_guard:
  - Do not add raw session IDs or raw customer/ticket content as global metric labels
  - Do not log or expose tokens, credential values, raw prompts, raw model outputs, raw customer emails, or raw ticket bodies in telemetry
  - Do not claim production monitoring, alerting, or compliance coverage from this local baseline
  - Keep Loki log aggregation unclaimed until a committed shipper and query proof exist
- known_limitations:
  - Local-only observability baseline; no production monitoring or alerting
  - OTel collector is deployed but app OTLP trace export is not implemented
  - Loki is deployed but no log shipper is committed
  - Telemetry is in-memory in the app process and not a durable audit source
  - One wrong-token probe produced a 401 telemetry anomaly before the corrected service-auth proof
- explicit_non_claims:
  - No cloud telemetry
  - No production monitoring
  - No production alerting
  - No compliance certification
  - No production secrets vault
  - No production writeback
  - No distributed tracing guarantee
  - No Loki-backed log search acceptance

## AF-2026-04-30-008: BL-116 Real Self-Hosted Sandbox Acceptance Freeze (ACCEPTED)

- ID: AF-2026-04-30-008
- Milestone: Complete local self-hosted sandbox acceptance freeze
- Scope: Freeze the complete real sandbox E2E milestone after cluster, Zammad read/writeback, Ollama local AI, OpenBao sandbox resolver, NATS JetStream worker bridge, MinIO evidence persistence, Mailpit notification capture, observability baseline, RBAC, kill switch, evidence bundle, and no-secret gates all pass.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 1e6298a5586e30400f9a600a62f82e6128445e81
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - SupportPlane API, Web, Worker in `supportplane-app`
  - PostgreSQL StatefulSet in `supportplane-data`
  - Zammad, OpenBao, NATS, Mailpit, MinIO in `supportplane-integrations`
  - Prometheus, Grafana, Loki, OTel Collector in `supportplane-observability`
  - Host-controlled Ollama at 10.88.0.1:11435 (podman0 bridge IP)
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - / (cluster web cockpit)
  - /call-console (cluster web call console)
  - /health (cluster API)
  - /metrics (cluster API)
  - /observability/status (cluster API)
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /support-sessions/:id/draft-suggestion
  - POST /support-sessions/:id/zammad/internal-note-writeback
  - POST /actions/:id/approve
  - POST /actions/:id/queue
  - GET /outbox
  - GET /outbox/worker/status
  - POST /outbox/process-once
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-30-005
- evidence_folder: output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/
- screenshot_count: 5
- cli_artifact_count: 15
- total_artifact_count: 20
- duplicate_screenshot_count: 0
- regression_guard:
  - All AF-001 through AF-007 regression guards remain in force.
  - Zammad sandbox read must continue to work via real HTTP with server-side OpenBao credential resolution.
  - Zammad sandbox writeback must remain approval-gated, kill-switch protected, and idempotent.
  - Ollama provider must continue to return provider=ollama, providerMode=local, fallbackUsed=false when host is reachable.
  - NATS JetStream bridge must remain durable with idempotency key preservation.
  - MinIO evidence persistence must continue to write objects with SHA-256 checksums.
  - Mailpit must continue to capture SMTP notifications locally.
  - Observability must remain localOnly=true with no production monitoring.
  - Egress policy must continue to block external URLs, production URLs, and unapproved writeback.
  - No raw secrets may appear in API responses, logs, telemetry, screenshots, or evidence bundles.
- known_limitations:
  - Worker status endpoint requires service token header.
  - Mailpit API occasionally shows zero messages; host process is the canonical capture source.
  - All integrations remain local sandbox only; no production readiness claim.
  - No production auth, secrets, broker HA, observability, telephony, endpoint agent, or compliance.
- reconciliation_notes:
  - 2026-04-30: BL-116 closure reconciliation fixed three proof blockers:
    1. Committed untracked evidence folder and verification script to make worktree clean.
    2. Fixed boundary matrix contradiction: Zammad internal-note writeback and MinIO evidence persistence are now marked as real sandbox accepted, not mock-only.
    3. Proved MinIO direct object read/checksum via boto3 (ContentLength=1643, SHA-256=dfb12da6916febe8d5e186dced66cdb2f854d6b37894b98bcc0f6c54b08f8675); removed the previous limitation about direct access being blocked.
    4. Fixed canonical verifier script `scripts/verify_bl116_real_sandbox_freeze.sh`:
       - Added `connectorInstallationId` to action create payload so policy evaluation finds the seeded delivery policy (fixes `deliveryMode=mock` fallback).
       - Fixed jq paths for policy decision and outbox status to match actual API response shapes.
       - Fetched Zammad API token from k8s secret instead of invalid `TestToken` default.
       - Updated Zammad body check to match actual sandbox writeback template.
       - Added outbox polling loop to handle NATS worker auto-claim race condition.
       - Verifier now passes 3/3 consecutive end-to-end runs with exit code 0.


## AF-009: BL-089/123/124/125/126/127 Registry Closure and Sandbox Truth Fields

- frozen_at: 2026-04-30T14:00:00+02:00
- frozen_by: coding-agent session
- backlog_ids: [BL-089, BL-123, BL-124, BL-125, BL-126, BL-127]
- git_head: 5e5fc226b93d0dff0457494c87663d5974ed3b26
- branch: main
- worktree_status: clean

### What was accepted

- Ticketing adapter registry (`packages/connectors/src/registry.ts`) registers zammad, osticket, and mock factories by `adapterType`.
- `ConnectorRuntimeService` validates config, resolves credentials, and instantiates adapters via registry.
- Runtime mode is honest: `mode: "sandbox"` when sandbox writeback is enabled, not `"mock"`.
- `ConnectorRuntimeReadinessResult` and `ConnectorReadinessResult` include `sandboxWritebackReady`, `productionWritebackReady`, `publicReplyEnabled`.
- `resolveCanonicalAdapterId()` eliminates hardcoded adapter IDs across backend services.
- osTicket read-only adapter foundation exists with capabilities `['read_tickets', 'read_customers']`; no writeback claimed.
- Delivery policy service computes truthful sandbox fields based on env var.
- UI displays connector readiness with truthful labels.
- Contract tests pass (47/47). Policy tests pass (7/7). Typecheck clean (all 8 workspaces).
- Cluster redeployed with fresh images at `5e5fc22`.

### Evidence location

- `output/playwright/session-116-bl089-bl123-bl124-bl125-plugin-registry/`
- 16 artifacts total (2 screenshots, 14 CLI/text artifacts)
- Screenshot duplicates: 0

### Regression guards

- All AF-001 through AF-008 regression guards remain in force.
- Registry must continue to list all pre-registered adapters.
- Runtime resolver must return `mode: "sandbox"` when sandbox writeback is enabled.
- `sandboxWritebackReady` must be true when env var `SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED=true`.
- `productionWritebackReady` and `publicReplyEnabled` must remain false.
- `resolveCanonicalAdapterId()` must be used for all adapter ID resolution.
- Credential `secretRef` must never appear in API responses.
- osTicket adapter must remain read-only (no `write_notes` capability).

### Known limitations

- osTicket adapter is fixture-only; no real osTicket instance deployed.
- osTicket seed data exists but was not applied to running database.
- UI connector readiness panel may show "Sandbox writeback: No" for unsupported action types; API truth fields are authoritative.
- Next.js web image built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4210`.

### Reconciliation notes

- 2026-04-30: BL-089/123-127 closure reconciliation:
  1. Expanded connector runtime contracts with sandbox truth fields.
  2. Fixed runtime mode contradiction (mock vs sandbox).
  3. Created osTicket read-only adapter factory.
  4. Centralized adapter ID resolution with `resolveCanonicalAdapterId()`.
  5. Built and loaded local-k8s images, restarted deployments, verified API reports `5e5fc22`.
  6. Captured 16 evidence artifacts under max 20 budget.
  7. Updated BACKLOG.md, STATUS.md, NEXT_ACTIONS.md, PROJECT_STATE.yaml, WORKLOG.md, EVIDENCE_LOG.md, and ACCEPTANCE_FREEZES.md.


## AF-2026-04-30-009: BL-117 Local Asterisk AMI Call-Event Bridge (ACCEPTED)

- ID: AF-2026-04-30-009
- Milestone: Local Asterisk AMI call-event bridge with canonical event ingestion, caller matching, and session auto-creation
- Scope: Asterisk 22.8.2 sandbox deployed in `supportplane-integrations` namespace. AMI event ingestion endpoint at `POST /telephony/ami-events` accepts canonical call events with service-token auth. Telephony registry lists `mock-telephony` and `asterisk-ami` adapters. Call Console UI shows Asterisk-sourced calls with honest sandbox labels ("No PSTN", "No recording", "No transcription"). Caller matching by normalized phone number works (Acme BVBA fixture). Support sessions auto-created from matched call events. FreePBX GUI deferred. No PSTN, no SIP trunk, no RTP, no recording, no transcription.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: TBD after final commit
- process_or_container:
  - Kind/Podman cluster `supportplane-local` with port-forwards
  - SupportPlane API, Web, Worker in `supportplane-app`
  - PostgreSQL StatefulSet in `supportplane-data`
  - Asterisk sandbox in `supportplane-integrations`
  - Zammad, OpenBao, NATS, Mailpit, MinIO in `supportplane-integrations`
- port_or_base_url:
  - Cluster API http://localhost:4210
  - Cluster Web http://localhost:3300
  - Local MVP API http://localhost:4110
  - Local MVP Web http://localhost:3200
- routes:
  - /call-console (cluster web)
  - GET /telephony/registry
  - POST /telephony/ami-events
  - GET /health
- rebuilt_in_slice: true (API force --no-cache rebuild)
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-30-137 through EV-2026-04-30-152
- evidence_folder: output/playwright/session-117-bl117-asterisk-telephony-bridge/
- screenshot_count: 2
- duplicate_screenshot_count: 0
- regression_guard:
  - Telephony registry must continue to list both `mock-telephony` and `asterisk-ami` adapters.
  - `POST /telephony/ami-events` must continue to create call events, match callers, and auto-create sessions.
  - Call Console must continue to show Asterisk-sourced calls with sandbox labels.
  - No PSTN, SIP trunk, recording, or transcription claims may appear.
  - AMI credentials must never appear in API responses, UI, logs, or evidence.
  - All other AF-008 regression guards remain in force.
- known_limitations:
  - FreePBX GUI is deferred; only raw Asterisk AMI bridge exists.
  - Asterisk AMI adapter factory is a stub (returns `connected: false`); full persistent AMI connection not implemented.
  - No real SIP trunk or PSTN connectivity.
  - No call recording or transcription.
  - osTicket remains fixture-only.
- as_of: 2026-04-30T16:35:00+02:00
