# WORKLOG

**Purpose:** Append-only history for completed work.

Use this file for dated session notes, verification summaries, and references to evidence artifacts.

## 2026-04-29 - BL-108/109/110/115 Real Sandbox Enablement Gates

**Type:** implementation
**Status:** BL-108 PARTIAL; BL-109/BL-110/BL-115 ACCEPTED
**Repo Path:** /home/ff/Documents/Projects/SupportPlane
**Git Branch:** main
**Git Head:** recorded in final handoff for this slice
**Worktree:** clean_after_final_commit

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
- Cluster web header shows DEV/MOCK DATA, API: localhost:4110, Auth: local · Store: postgres, Mock mode.
- Zammad API `/api/v1/getting_started` returns JSON with `setup_done: false`.
- All other topology services (OpenBao, NATS, Mailpit, MinIO) remain healthy.
- Local MVP on localhost:4110/3200 still works.

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
  - **MinIO** in `supportplane-data`: Deployment + Service + PVC + Secret, image `minio/minio:RELEASE.2025-04-22T22-12-26Z`. Verified bucket `bl106-bucket` created and object `topology-proof.txt` stored/retrieved.
  - **Zammad** in `supportplane-integrations`: StatefulSet + Service + PVCs + ConfigMap + Secret, image `zammad/zammad:6.4.1-1`, with separate PostgreSQL (`postgres:16-alpine`) and Redis (`redis:7-alpine`) dependencies. Zammad init succeeded (migrations, seed, settings). Railsserver running and responding HTTP 200.
- Documented **Ollama placement decision**: host-controlled service, not in-cluster. Host has AMD GPU (Radeon RX 7700 XT / 7800 XT) and Ollama 0.18.2 with models already installed. In-cluster deployment would waste GPU and complicate AMD pass-through.
- Updated `infra/kubernetes/local-podman/kustomization.yaml` to include all new resources.
- Updated `STATUS.md`, `NEXT_ACTIONS.md`, `BACKLOG.md`, `PROJECT_STATE.yaml`, `docs/EVIDENCE_LOG.md`, `docs/ACCEPTANCE_FREEZES.md`, `docs/SELF_HOSTED_STACK.md`, `docs/LOCAL_KUBERNETES_PODMAN_TARGET.md`, `docs/KUBERNETES_SERVICE_CATALOG.md`, `docs/WORKFLOW_TRUTH.md`, `docs/BOUNDARY_MATRIX.md`, `infra/kubernetes/local-podman/README.md`.
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
