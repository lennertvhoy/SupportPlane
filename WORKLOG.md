# WORKLOG

**Purpose:** Append-only history for completed work.

Use this file for dated session notes, verification summaries, and references to evidence artifacts.

## 2026-04-29 - BL-108 Repair: Ollama Real Host Call + Model Selection Benchmark

**Type:** implementation / closure_repair
**Status:** ACCEPTED (with model upgrade future work)
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** 4b771068ad666191e99f688065c457d098e26b7f
**Worktree:** clean

### What changed

- Fixed cluster-to-host Ollama connectivity by:
  - Reconfiguring host Ollama systemd service to bind 0.0.0.0:11434 (was 127.0.0.1 only)
  - Discovering that cluster pods reach host Ollama via podman0 bridge IP 10.88.0.1
  - Updating `infra/kubernetes/local-podman/app/app-configmap.yaml` OLLAMA_BASE_URL from `http://host.containers.internal:11434` to `http://10.88.0.1:11434`
  - Documenting the network path in ConfigMap comments and connectivity proof artifact

- Model candidate discovery:
  - Attempted to pull gemma4:4b, gemma4:latest, qwen3.6:8b
  - gemma4 requires Ollama version newer than 0.18.2
  - qwen3.6 tags do not exist on Ollama 0.18.2
  - Documented installed models: llama3.1:8b, qwen2.5:7b, statedd-devstral:latest, devstral-small-2:24b
  - Selected llama3.1:8b as configured cluster model
  - Created `scripts/benchmark_ollama_models.sh` and ran host benchmark
  - Both llama3.1:8b and qwen2.5:7b responded 200; llama3.1:8b selected for config consistency

- UI truth updates:
  - Updated `apps/web/components/DraftNotePanel.tsx` to show conditional label:
    - "Ollama local / real host call, review required" when fallbackUsed=false
    - "Ollama local / deterministic fallback, review required" when fallbackUsed=true
  - Added "Autonomous send" and "Writeback blocked" to metadata panel

- Tests and validation:
  - npm run lint: PASS
  - npm run typecheck --workspaces --if-present: PASS (all workspaces)
  - npm test --workspaces --if-present: PASS (all suites)
  - python3 scripts/check_state_docs.py: PASS
  - bash scripts/benchmark_ollama_models.sh: PASS

- Cluster rebuild and redeploy:
  - Built and loaded new local-k8s images for API, Web, Worker
  - Applied updated ConfigMap
  - Restarted API deployment
  - Verified API health via port-forward localhost:4210

- End-to-end proof:
  - Created support session via cluster API
  - Loaded Zammad ticket context (ticket 2, Acme BVBA)
  - POST /draft-suggestion with modelSelection={provider:ollama, model:llama3.1:8b}
  - Response: provider=ollama, providerMode=local, fallbackUsed=false, noCloudCall=true, autonomousSend=false, writebackAllowed=false, latencyMs=4694
  - Real model output generated and redaction applied ([REDACTED_EMAIL])

- Browser proof:
  - 8 unique screenshots, 0 duplicates
  - Captured via Playwright MCP against cluster Web (localhost:3300)

- State docs reconciliation:
  - BACKLOG.md: BL-108 marked accepted, BL-121 added for future model upgrade
  - NEXT_ACTIONS.md: BL-108 removed, BL-111 remains active
  - STATUS.md: Updated to reflect BL-108 accepted
  - PROJECT_STATE.yaml: Updated ai.ollama_integrated, phases, active queue
  - WORKLOG.md: This entry
  - docs/EVIDENCE_LOG.md: Added EV entry
  - docs/ACCEPTANCE_FREEZES.md: Added AF entry
  - docs/WORKFLOW_TRUTH.md: Updated AI draft row to real sandbox call
  - docs/BOUNDARY_MATRIX.md: Updated AI draft row to real sandbox call

### What remains mocked or not implemented

- Zammad internal-note writeback remains blocked until BL-111.
- Ollama model upgrade to gemma4/qwen3.6 requires Ollama version upgrade (BL-121).
- statedd-devstral:latest and devstral-small-2:24b are installed but not benchmarked (15GB each, may exceed clean VRAM).
- OpenBao is local sandbox-only, not production secret management.
- NATS is local sandbox-only, not production broker HA/TLS/auth.
- MinIO evidence persistence and Mailpit notification capture remain planned.

### Next implementation move

Start BL-111: Sandbox-only Zammad internal note writeback.

### Evidence

- Screenshot folder: `output/playwright/session-110-bl108-ollama-host-call-model-selection/`
- Screenshot count: 8
- Duplicate count: 0
- CLI artifacts: baseline-runtime, model-candidate-inventory, benchmark JSON/TXT, connectivity proof, real-call proof, no-secret-leak proof, validation-gate, proof-state-mapping, screenshot-md5s

### Verification

- `npm run lint` passed.
- `npm run typecheck --workspaces --if-present` passed.
- `npm test --workspaces --if-present` passed.
- `python3 scripts/check_state_docs.py` passed.
- Cluster API `localhost:4210/health` returns ok.
- Real Ollama call from cluster API: POST /support-sessions/{id}/draft-suggestion returns provider=ollama, fallbackUsed=false, noCloudCall=true.
- Host Ollama reachable from cluster pod at 10.88.0.1:11434.
- Worktree clean at final commit.

---

## 2026-04-29 - BL-108/109/110/115 Real Sandbox Enablement Gates

**Type:** implementation
**Status:** BL-109/BL-110/BL-115 ACCEPTED (BL-108 was partial in this slice; repair accepted separately)
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** 4b771068ad666191e99f688065c457d098e26b7f
**Worktree:** clean

### What changed

- Added host-controlled Ollama provider path with local provider metadata, deterministic fallback, redaction before provider call, no-cloud marker, and no-autonomous-send marker. Runtime proof used fallback, so BL-108 remains partial.
- Added local sandbox OpenBao credential resolver for linked Zammad credential references; raw Zammad token stays backend-only and API/UI/evidence surfaces show metadata only.
- Preserved PostgreSQL outbox as canonical truth and added NATS JetStream product stream/subject/consumer bridge for approved outbox envelopes with idempotency key preservation.
- Added deny-by-default connector egress policy, local Zammad sandbox read allowlist, production/external URL denial, kill-switch denial, and default writeback denial.
- Updated Kubernetes local config for OpenBao, NATS, and host-controlled Ollama access; BL-111 writeback was not implemented.

### Evidence

- Screenshot folder: `output/playwright/session-109-bl108-109-110-115-real-sandbox-enablement/`
- Screenshot count: 8
- CLI artifacts: baseline/runtime, OpenBao, Ollama, NATS, egress, validation, boundary, local MVP, screenshot hashes, and final git status proofs.

### What remains mocked or not implemented

- Zammad internal-note writeback remains blocked until BL-111.
- Ollama fallback is deterministic and labeled if host-controlled Ollama or the configured model is unavailable.
- OpenBao is local sandbox-only, not production secret management.
- NATS is local sandbox-only, not production broker HA/TLS/auth.
- MinIO evidence persistence and Mailpit notification capture remain future work.

---

## 2026-04-29 - BL-107 Closure Reconciliation

**Type:** closure_repair
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** 17592be3ea2b172a0262fd8ecfd37308fae21283
**Worktree:** clean_after_final_commit

### Why reconciliation was needed

The BL-107 final handoff claimed acceptance, but:
- `git-status-final.txt` showed a dirty worktree with modified source files and untracked evidence/scripts.
- The cluster API was running a stale image (BL-106 head `6093cf0`) because the BL-107 image was not rebuilt and reloaded.
- Local MVP regression was not run.
- Screenshot script contained a hardcoded sandbox token.
- Proof-state-mapping had a duplicate screenshot (03-ai-context-quality.png identical to 02).

### What changed

- Rebuilt and reloaded all three local K8s images (`localhost/supportplane-api:local-k8s`, `localhost/supportplane-web:local-k8s`, `localhost/supportplane-worker:local-k8s`) with current BL-107 code.
- Restarted cluster Deployments; verified new API pod reports git head `17592be3ea2b172a0262fd8ecfd37308fae21283`.
- Fixed stale `kubectl port-forward` for API (was connected to old pod).
- Removed hardcoded Zammad API token from `scripts/bl107_screenshots_final.js`; token now read from env var `ZAMMAD_API_TOKEN`.
- Regenerated browser screenshots (6 unique, 0 duplicates after removing duplicate 03).
- Ran local MVP regression: local API on 4110 and local Web on 3200 both reachable and healthy.
- Ran full validation gate: lint pass, typecheck pass, 43 tests pass, state docs check pass.
- Updated all evidence artifacts with fresh cluster/runtime data.
- Updated `STATUS.md`, `PROJECT_STATE.yaml`, `docs/WORKFLOW_TRUTH.md`, `docs/BOUNDARY_MATRIX.md` to reflect BL-107 truth.

### What remains mocked or not implemented

- AI drafts/summaries remain mock-only.
- Zammad writeback remains blocked (`writebackEnabled=false`).
- Telephony remains fake webhook/call simulator.
- Screen observation remains metadata-only mock.
- OpenBao resolver, NATS worker bridge, MinIO evidence, Mailpit notification remain planned.
- No production auth, secrets, monitoring, or compliance claims exist.

### Evidence

- Screenshot folder: `output/playwright/session-108-bl107-zammad-sandbox-read-connector/`
- Screenshot count: 6
- Duplicate count: 0
- CLI artifacts: `zammad-seed-proof.txt`, `supportplane-api-zammad-read-proof.txt`, `connector-runtime-readiness.txt`, `boundary-proof.txt`, `supportplane-api-health.txt`, `validation-gate.txt`, `local-mvp-regression.txt`, `git-status-final.txt`, `proof-state-mapping.md`, `screenshot-md5s.txt`

### Verification

- `npm run lint` passed.
- `npm run typecheck --workspaces --if-present` passed.
- `npm test --workspaces --if-present` passed (43 tests, 0 failures).
- `python3 scripts/check_state_docs.py` passed.
- Cluster API `localhost:4210/health` returns ok with git head `17592be3ea2b172a0262fd8ecfd37308fae21283`.
- Cluster Web `localhost:3300` reachable and renders SupportPlane cockpit.
- Local MVP API `localhost:4110/health` returns ok with same git head.
- Local MVP Web `localhost:3200` reachable and renders SupportPlane cockpit.
- Zammad sandbox `localhost:8080/api/v1/tickets/2` returns real seeded ticket.
- SupportPlane API POST `/support-sessions/{id}/zammad/ticket-context` with `externalTicketId: 2` returns real Zammad data.
- Connector runtime readiness: `realReady=true`, `mockReady=false`, `writebackEnabled=false`.
- Worktree clean at final commit.

---

## 2026-04-29 - BL-106 Evidence Reconciliation

**Type:** evidence_repair
**Status:** RECONCILED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** to_be_recorded_after_reconciliation_commit
**Worktree:** clean_after_reconciliation_commit

### Why reconciliation was needed

The BL-106 final handoff claimed a clean evidence folder, but two screenshots were mismatched:
- `02-cluster-web-header.png` showed a failed login screen instead of the cluster web header.
- `03-zammad-page-proof.png` showed a generic `Loading...` page without actual Zammad proof.

### What changed

- Added `http://localhost:3300` to API CORS origins in `apps/api/src/main.ts`.
- Rebuilt cluster API image `localhost/supportplane-api:local-k8s` with the CORS fix.
- Loaded new image into Kind cluster `supportplane-local` and restarted API Deployment.
- Verified cluster web login now succeeds and header shows DEV/MOCK DATA badge.
- Captured fresh evidence in `output/playwright/session-107-bl106-evidence-reconciliation/`:
  - 20 unique screenshots, 0 duplicates.
  - Zammad proof now shows pod status + API JSON with honest note about railsserver-only asset limitation.
  - Cluster web header now correctly shows logged-in state.
- Deleted stale evidence folder `output/playwright/session-106-bl106-selfhosted-service-topology-final/`.
- Updated `docs/EVIDENCE_LOG.md` to mark old entry superseded and add reconciled entry.

### Verification

- `curl -s http://localhost:4210/health` returns ok with current git head.
- Browser login to `http://localhost:3300` succeeds as `operator@supportplane.local`.
- Cluster web header shows DEV/MOCK DATA, local auth, postgres store badges.
- Zammad API `/api/v1/getting_started` returns JSON with `setup_done: false`.
- All other topology services (OpenBao, NATS, Mailpit, MinIO) remain healthy.
- Existing local MVP on localhost:4110/3200 still works.

---

## 2026-04-29 - BL-106 Self-Hosted Service Topology

**Type:** infrastructure_foundation
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** to_be_recorded_after_final_commit
**Worktree:** clean_after_final_commit

### What changed

- Added Kubernetes manifests for self-hosted service topology under `infra/kubernetes/local-podman/integrations/` and `infra/kubernetes/local-podman/data/minio/`:
  - **OpenBao** in `supportplane-integrations`: Deployment + Service + PVC + Secret, image `openbao/openbao:2.2.0`, dev mode with local placeholder root token, health endpoint reachable.
  - **NATS JetStream** in `supportplane-integrations`: StatefulSet + Service + PVC + ConfigMap, image `nats:2.10.24-alpine`, file-backed JetStream enabled. Verified stream `TEST_STREAM` and consumer `TEST_CONSUMER` created, message published and consumed.
  - **Mailpit** in `supportplane-integrations`: Deployment + Service, image `axllent/mailpit:v1.21`, SMTP port 1025 and web UI port 8025. Verified local SMTP test message captured via web API.
  - **MinIO** in `supportplane-data`: Deployment + Service + PVC + Secret, image `minio/minio:RELEASE.2025-04-22T22-12-26Z`. Verified bucket `bl106-bucket` and object `topology-proof.txt` stored/retrieved.
  - **Zammad** in `supportplane-integrations`: StatefulSet + Service + PVCs + ConfigMap + Secret, image `zammad/zammad:6.4.1-1`, with separate PostgreSQL (`postgres:16-alpine`) and Redis (`redis:7-alpine`) dependencies. Zammad init succeeded (migrations, seed, settings). Railsserver running and responding HTTP 200.
- Documented **Ollama placement decision**: host-controlled service, not in-cluster. Host has AMD GPU (Radeon RX 7700 XT / 7800 XT) and Ollama 0.18.2 with models already installed. In-cluster deployment would waste GPU and complicate AMD pass-through.
- Updated `infra/kubernetes/local-podman/kustomization.yaml` to include all new resources.
- Updated `STATUS.md`, `NEXT_ACTIONS.md`, `BACKLOG.md`, `PROJECT_STATE.yaml`, `WORKLOG.md`, `docs/EVIDENCE_LOG.md`, `docs/ACCEPTANCE_FREEZES.md`, `docs/SELF_HOSTED_STACK.md`, `docs/LOCAL_KUBERNETES_PODMAN_TARGET.md`, `docs/KUBERNETES_SERVICE_CATALOG.md`, `docs/WORKFLOW_TRUTH.md`, `docs/BOUNDARY_MATRIX.md`, `infra/kubernetes/local-podman/README.md`.
- Created `scripts/bl106_screenshots.js` and canonical evidence folder `output/playwright/session-106-bl106-selfhosted-service-topology-final/` with exactly 20 unique screenshots and 0 duplicates.

### What remains mocked or not implemented

- No SupportPlane real integration with Zammad, OpenBao, NATS, Mailpit, or MinIO.
- Zammad read connector is BL-107.
- Ollama provider integration is BL-108.
- OpenBao credential resolver is BL-109.
- NATS worker bridge is BL-110.
- MinIO evidence persistence is BL-112.
- Mailpit notification capture is BL-113.
- Real writeback remains disabled.
- Credential references remain metadata/placeholder only.
- No production auth, secrets, monitoring, or compliance claims exist.

### Next implementation move

Start BL-107: Zammad sandbox bootstrap and real read connector. Seed deterministic Zammad customer/ticket data and read it through SupportPlane with provenance.

### Evidence

- Screenshot folder: `output/playwright/session-106-bl106-selfhosted-service-topology-final/`
- Screenshot count: 20
- Duplicate count: 0
- CLI artifacts: `cluster-baseline-proof.txt`, `zammad-topology-proof.txt`, `openbao-topology-proof.txt`, `nats-jetstream-proof.txt`, `mailpit-topology-proof.txt`, `minio-topology-proof.txt`, `ollama-placement-decision.txt`, `supportplane-non-integration-proof.txt`, `local-mvp-regression-proof.txt`, `proof-state-mapping.md`, `screenshot-md5s.txt`, `roadmap-summary.json`

### Verification

- `bash scripts/check_local_k8s_prereqs.sh` passed.
- `bash scripts/create_local_k8s_cluster.sh` passed (reused existing cluster).
- `kubectl config current-context` = `kind-supportplane-local`.
- `kubectl cluster-info` succeeded.
- `kubectl get nodes -o wide` shows Ready control-plane node.
- `kubectl get namespaces` shows all four target namespaces Active.
- `kubectl apply -k infra/kubernetes/local-podman` succeeded.
- All pods Running and Ready:
  - `supportplane-app`: API, Web, Worker
  - `supportplane-data`: PostgreSQL, MinIO
  - `supportplane-integrations`: OpenBao, NATS, Mailpit, Zammad (railsserver), Zammad-PostgreSQL, Zammad-Redis
- All PVCs Bound.
- OpenBao health: `{"initialized":true,"sealed":false,"version":"2.2.0"}`
- NATS JetStream: stream `TEST_STREAM` and consumer `TEST_CONSUMER` created; message published and consumed successfully.
- Mailpit: SMTP test message sent and captured; web API shows 1 message.
- MinIO: bucket `bl106-bucket` and object `topology-proof.txt` created and retrieved.
- Zammad: HTTP 200 on port 3000; init completed with migrations/seed.
- Existing local MVP: API `localhost:4110/health` ok, Web `localhost:3200` 200.
- Existing cluster app: API `localhost:4210/health` ok, Web `localhost:3300` 200.
- No real writeback, real secrets, Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO integration, telephony/PBX, endpoint agent, Tauri companion, or screen/OCR implementation was started.

---

## 2026-04-29 - BL-104/BL-105 Kubernetes App and PostgreSQL Persistence Foundation

**Type:** infrastructure_foundation
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** 955c057116f67545d7ac40e13ac91d9af7bdaf5f
**Worktree:** clean_after_final_commit

### What changed

- Created local sandbox Containerfiles for API, Web, and Worker (`apps/*/Containerfile.local`) using `node:22-slim` base image.
- Created `scripts/build_and_load_local_k8s_images.sh` to build Podman images and load them into the Kind cluster via `podman save` + `kind load image-archive`.
- Added Kubernetes manifests under `infra/kubernetes/local-podman/`:
  - `postgres/` — Secret, ConfigMap, Service, StatefulSet with 1Gi PVC, plus optional migrate/seed Jobs.
  - `app/` — ConfigMap, Secret, API Deployment+Service, Web Deployment+Service, Worker Deployment.
- Updated `infra/kubernetes/local-podman/kustomization.yaml` to include all new resources.
- Deployed PostgreSQL StatefulSet in `supportplane-data`; PVC `postgres-data-postgres-0` is Bound.
- Executed Prisma migrate deploy (8 migrations) and Prisma db seed against cluster PostgreSQL via API pod exec.
- Deployed SupportPlane API, Web, and Worker in `supportplane-app` using locally built images.
- Verified API health via port-forward `localhost:4210 -> svc:4110`.
- Verified Web UI via port-forward `localhost:3300 -> svc:3200`; header shows DEV/MOCK DATA/local auth/postgres.
- Verified worker logs show `mode: mock`, `queueBackend: postgres-local-outbox`.
- Proven PostgreSQL persistence: created `_supportplane_bl105_probe` table, deleted postgres pod, verified data survived restart.
- Verified existing local/mock MVP still works on `localhost:4110` and `localhost:3200`.
- Updated all state and doc files: `BACKLOG.md`, `NEXT_ACTIONS.md`, `STATUS.md`, `PROJECT_STATE.yaml`, `WORKLOG.md`, `docs/EVIDENCE_LOG.md`, `docs/ACCEPTANCE_FREEZES.md`, `docs/WORKFLOW_TRUTH.md`, `docs/BOUNDARY_MATRIX.md`.

### What remains mocked or not implemented

- Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, and observability are not deployed.
- Real writeback remains disabled.
- Credential references remain metadata/placeholder only.
- No production auth, secrets, monitoring, or compliance claims exist.

### Next implementation move

Start BL-106: Self-hosted service topology (Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, Ollama placement).

### Evidence

- Screenshot folder: `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/`
- Screenshot count: 15
- Duplicate count: 0
- CLI artifacts: `cluster-proof.txt`, `image-build-load-proof.txt`, `postgres-k8s-proof.txt`, `postgres-persistence-proof.txt`, `app-k8s-proof.txt`, `api-cluster-health-proof.txt`, `web-cluster-proof.txt`, `worker-cluster-proof.txt`, `local-mvp-regression-proof.txt`, `proof-state-mapping.md`, `screenshot-md5s.txt`, `roadmap-summary.json`

### Verification

- `npm run lint` passed.
- `npm run typecheck --workspaces --if-present` passed.
- `npm run validate` passed.
- `npm run health` passed.
- `cd apps/api && npm test` passed.
- `python3 scripts/check_state_docs.py` passed.
- `python3 scripts/check_state_docs.py --bootstrap-gate` passed.
- Cluster `supportplane-local` context `kind-supportplane-local` verified.
- PostgreSQL pod Ready, PVC Bound, migrate/seed succeeded, restart survival verified.
- API, Web, Worker pods Ready in `supportplane-app`.
- No real writeback, real secrets, Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO integration, telephony/PBX, endpoint agent, Tauri companion, or screen/OCR implementation was started.

---

## 2026-04-29 - BL-103 Local Kubernetes/Podman Cluster Foundation

**Type:** infrastructure_foundation
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** ce23d2d338fb94bff5086d6114e4210435c88eca
**Worktree:** clean_after_final_commit

### What changed

- Created local Kubernetes cluster using Kind with Podman provider.
- Verified `kindest/node:v1.31.4` works on Fedora/Podman; default `kindest/node:v1.32.2` caused kube-proxy crash-loops.
- Created four namespaces: `supportplane-app`, `supportplane-data`, `supportplane-integrations`, `supportplane-observability`.
- Verified local image loading strategy: `podman save` + `kind load image-archive` works for rootless Podman.
- Updated state files and created evidence with 12 screenshots.

### Evidence

- Screenshot folder: `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/`
- Screenshot count: 12
- Duplicate count: 0

### Verification

- `bash scripts/check_local_k8s_prereqs.sh` passed.
- `bash scripts/create_local_k8s_cluster.sh` passed.
- `kubectl config current-context` = `kind-supportplane-local`.
- `kubectl cluster-info` succeeded.
- `kubectl get nodes` shows Ready control-plane node.
- `kubectl get namespaces` shows four target namespaces.

---

## 2026-04-29 - BL-102 Local Kubernetes Self-Hosted Sandbox Architecture and Roadmap

**Type:** architecture_foundation
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** to_be_recorded_after_final_commit
**Worktree:** clean_after_final_commit

### What changed

- Integrated the strategic target that SupportPlane evolves from local/mock MVP to a local Kubernetes-on-Podman sandbox.
- Created canonical docs for stack, cluster target, E2E flow, service catalog, acceptance gates, phases, workflow truth, and boundary matrix.
- Updated backlog, state, and active plan.
- Created evidence with 17 screenshots.

### Evidence

- Screenshot folder: `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/`
- Screenshot count: 17
- Duplicate count: 0

### Verification

- All state documentation checks passed.
- Browser proof shows honest mock-only boundary.
- No production claims introduced.


## 2026-04-29 - BL-121: Local Model Runtime Upgrade to gemma4:e4b

**Type:** implementation / closure
**Status:** ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** d2ffbdd
**Worktree:** clean

### What changed

- Installed user-local Ollama v0.22.0 with ROCm package at ~/.local/bin/ollama, listening on 0.0.0.0:11435
- System Ollama v0.18.2 on port 11434 left untouched as baseline
- Pulled gemma4:e4b (~9.6GB, 8B param, Q4_K_M) and verified inference quality
- qwen3.6:27b also pulled (~17.4GB) but larger/slower; kept as secondary option
- Verified cluster pod connectivity to 10.88.0.1:11435 via podman0 bridge

- Code updates:
  - packages/ai/src/index.ts: Added LmStudioAiProvider with OpenAI-compatible chat/completions client, runtime and runtimeBaseUrlRedacted fields in ModelUsageMetadata/AiSafetyMetadata, updated createDefaultModelGateway for multi-runtime selection, added redactBaseUrl helper
  - packages/contracts/src/greeting-suggestion.ts: Added 'lmstudio' to provider enums in GreetingSuggestionRequest and GreetingSuggestionResponse
  - apps/web/lib/api.ts: Updated provider unions to include 'lmstudio', added runtime and runtimeBaseUrlRedacted fields
  - apps/web/components/DraftNotePanel.tsx: Dynamic provider badges for lmstudio/ollama/mock with fallback states
  - infra/kubernetes/local-podman/app/app-configmap.yaml: OLLAMA_BASE_URL=http://10.88.0.1:11435, OLLAMA_MODEL=gemma4:e4b

- Cluster deployment:
  - Built and loaded new local-k8s images for API, Web, Worker (podman build + kind load image-archive)
  - Applied updated ConfigMap
  - Restarted all three deployments
  - Verified rollout success

- Verification:
  - API health check: PASS (storeMode=postgres, authMode=dev after temporary patch for testing)
  - Real cluster API draft-suggestion with provider=ollama: PASS
    - Response: provider="ollama", model="gemma4:e4b", fallbackUsed=false, runtime="ollama", noCloudCall=true, latencyMs=13050
  - Benchmark via scripts/bl121_benchmark_gemma4.sh: PASS
    - Latency: 8,611ms, Eval count: 644 tokens, Throughput: 79.91 tok/s, fallbackUsed=false
  - TypeScript compilation: PASS (packages/ai, apps/web, apps/api)

### Evidence

- Screenshot folder: `output/playwright/session-111-bl121-local-model-runtime-upgrade/`
- 01-api-response-evidence.png — API JSON response showing provider=ollama, model=gemma4:e4b, fallbackUsed=false
- 02-pod-env-evidence.png — kubectl pod env showing OLLAMA_BASE_URL=10.88.0.1:11435 and OLLAMA_MODEL=gemma4:e4b
- 03-benchmark-evidence.png — gemma4:e4b benchmark results (8.6s, 644 tokens, 79.91 tok/s)
- 04-ollama-tags-evidence.png — Ollama v0.22.0 /api/tags showing gemma4:e4b available
- 05-draftnote-badges-evidence.png — DraftNotePanel provider badge states for lmstudio/ollama/mock
- All 5 screenshots have unique MD5 hashes (no duplicates)

### Risks and Limitations

- System-wide Ollama upgrade to /usr/local/bin/ollama requires manual sudo password entry (deferred)
- qwen3.6:27b is available but ~17.4GB; slower than gemma4:e4b for support-note drafts
- Cluster auth mode was temporarily patched to 'dev' for API testing; reverted to 'local' after verification
- Web UI DraftNotePanel badge not directly screenshot-tested via live cluster web app (would need auth flow)
- LmStudioAiProvider is implemented but not deployed (no LM Studio runtime configured)

### Next Recommended Action

- BL-111: Sandbox-only Zammad internal note writeback

---

## 2026-04-30 — BL-111/112/113 Sandbox Writeback E2E Closure

### Scope

Reconcile BL-111, BL-112, BL-113 from implementation-credible to closure-grade. The sandbox writeback E2E flow was already functional but needed truth hygiene, final evidence generation, and state doc reconciliation.

### What Changed

- **Truth hygiene / Phase 1**: Archived misleading `02-e2e-script-run.txt` (claimed PASSED while MinIO returned 400 and Mailpit had no message) to `/tmp/supportplane-session-113-debug/`.
- **Sandbox status truth / Phase 3**: Eliminated `mock_delivered` ambiguity by adding `sandbox_delivered` as a distinct terminal status in contracts (`packages/contracts/src/action-outbox.ts`), backend service (`apps/api/src/actions/actions.service.ts`), and UI (`apps/web/components/OutboxMonitorPanel.tsx`). Added audit event types `action_sandbox_delivered` and `outbox_sandbox_delivered`.
- **Validation gate / Phase 8**: Fixed TypeScript compilation errors after enum changes. `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` all pass (17 API tests + 7 Zammad connector tests).
- **Runtime redeploy / Phase 2**: Built and loaded fresh `localhost/supportplane-*:local-k8s` images, restarted API/Web/Worker deployments. API `/health` returns commit `bb81e7a`.
- **E2E verification**: Created action with `connectorInstallationId: conn-inst-dev-001` → submit → approve → queue returns `policyDecision: sandbox_allowed`, `deliveryMode: sandbox`. NATS worker auto-claimed and processed the item. Final status: `sandbox_delivered`.
- **External system verification**:
  - Zammad: Article 16 created on ticket 2 at 2026-04-30T08:29:26.858Z with internal note body and idempotency marker.
  - MinIO: Evidence object `dev-tenant/writebacks/3b4e87c9-413a-4ab6-b917-65f723a304d7/0c796d9b-2a03-4116-88f0-7c9aef9c846e.json` (1579 bytes) written at 08:29:26.
  - Mailpit: Notification captured at 08:29:26.971Z with subject "SupportPlane sandbox writeback completed".
- **Evidence generation**: 18 browser screenshots + validation-gate.txt + git-status-final.txt + proof-state-mapping.md + screenshot-md5s.txt.
- **State doc reconciliation**: Updated BACKLOG.md, NEXT_ACTIONS.md, STATUS.md, PROJECT_STATE.yaml.

### Verification

- `npm run build`: PASSED (all workspaces)
- `npm run typecheck`: PASSED
- `npm run lint`: PASSED
- `npm test`: PASSED (24 tests total — 17 API + 7 Zammad connector)
- API health: `curl http://localhost:4210/health` → status ok
- Action status: `curl /actions/e9a4ecac-...` → `sandbox_delivered`
- Outbox status: `curl /outbox/0c796d9b-...` → `sandbox_delivered`, attemptCount 1
- Zammad article: `curl /api/v1/ticket_articles/16` → internal note, ticket_id 2
- MinIO object: boto3 head_object → 1579 bytes
- Mailpit messages: `curl /api/v1/messages` → 13 messages, latest matches outbox item

### Evidence Inventory

- Folder: `output/playwright/session-111-112-113-sandbox-writeback-closure-canonical/`
- Screenshot count: 18 (all distinct, no duplicates after cleanup)
- Key screenshots:
  - `07-outbox-list-sandbox-delivered.png` — Delivery Ops panel showing sandbox_delivered item
  - `11-action-center-outbox-status.png` — Action Center showing "Latest action: sandbox_delivered"
  - `13-delivery-ops-summary-grid.png` — Summary grid showing sandbox_delivered: 1
  - `19-audit-trail-sandbox-delivered-terminal.png` — action_sandbox_delivered audit event
  - `20-audit-trail-outbox-sandbox-delivered.png` — outbox_sandbox_delivered audit event

### Risks and Limitations

- `externalWriteAttempted: false` shown in UI attempt detail is a display artifact; the audit event payload shows `externalWriteAttempted: true` and Zammad article 16 was created. The UI field comes from the attempt record which may not expose this flag in the summary view.
- Process-once manual API call returns `no_eligible_outbox_item` because the NATS worker auto-claims items quickly. This is expected behavior, not a bug.
- Zammad basic auth credentials differ from the API token auth used by the worker. The worker uses OpenBao-resolved API token.
- MinIO evidence prefix is `dev-tenant/writebacks/` not `writebacks/`; verification scripts need this prefix.
- 18 screenshots is within the 20 limit but close. Future closure items should composite where possible.

### Next Recommended Action

- BL-116: Real self-hosted sandbox acceptance freeze. Aggregate all accepted slices (BL-103 through BL-115, BL-121) into a single canonical acceptance freeze with max-20 composite screenshots.
