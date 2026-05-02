# Sandbox Integration Acceptance

**Backlog:** BL-116
**Status:** Accepted (BL-116). All gates below were proven during BL-103 through BL-116
closure. The real self-hosted sandbox acceptance freeze was accepted on 2026-04-30.

**Evidence root:** `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/`
(20 files). Individual gate evidence folders are referenced per section below.

## Non-Claims

- No production deployment claim.
- No compliance certification claim.
- No real customer data.
- No uncontrolled network egress.
- No cloud AI calls (all AI runs on local Ollama).
- No public-reply Zammad writeback (internal notes only).

---

## Cluster and Runtime Gates — ACCEPTED

- Local Kubernetes cluster (Kind/Podman, `supportplane-local`) started and healthy.
  **BL-103** — `session-104-bl103-local-k8s-podman-foundation-final/`
- Namespaces `supportplane-app`, `supportplane-data`, `supportplane-integrations`,
  `supportplane-observability` created and active. **BL-103**
- SupportPlane API, Web, and Worker deployed into cluster.
  **BL-104** — `session-105-bl104-bl105-app-postgres-k8s-final/`
- PostgreSQL StatefulSet with PVC, data survives pod restart.
  **BL-105** — `session-105-bl104-bl105-app-postgres-k8s-final/`
- Zammad, OpenBao, NATS, Mailpit, and MinIO deployed and healthy.
  **BL-106** — `session-107-bl106-evidence-reconciliation/`
- Observability stack (Prometheus, Grafana, Loki, OTEL Collector) deployed with
  correlation IDs, metrics, and structured logs. **BL-114** —
  `session-114-bl114-observability-baseline/`

## Zammad Gates — ACCEPTED

- Deterministic demo customer (Acme BVBA, ID 5) and ticket (TICKET-101, ID 2)
  seeded in Zammad sandbox. **BL-107** —
  `session-108-bl107-zammad-sandbox-read-connector/`
- SupportPlane read real Zammad sandbox ticket/customer via `FetchZammadHttpClient`.
  **BL-107**
- SupportPlane wrote one approval-gated internal note to Zammad sandbox ticket 2
  (article 16) with provenance/idempotency marker. **BL-111** —
  `session-111-112-113-sandbox-writeback-closure-canonical/`
- Duplicate processing blocked by idempotency key. **BL-111**

## AI Gates — ACCEPTED

- Ollama generated a real local draft from the cluster API via podman0 bridge,
  with `fallbackUsed=false`, `provider=ollama`, `providerMode=local`.
  **BL-108** — `session-110-bl108-ollama-host-call-model-selection/`
- Model name (`gemma4:e4b`), prompt version, context hash, latency (8,611ms),
  and local-provider marker all persisted. **BL-121** —
  `session-111-bl121-local-model-runtime-upgrade/`
- No cloud AI provider was called; `noCloudCall=true` verified.
- Deterministic fallback is limited to tests and visibly marked.

## Credential Gates — ACCEPTED

- OpenBao stored and returned the Zammad credential reference server-side.
  **BL-109** — `session-109-bl108-109-110-115-real-sandbox-enablement/`
- Credential resolution is server-side only; `secretExposed=false` proven.
- No token appeared in API responses, screenshots, evidence bundles, browser
  local storage, logs, or PostgreSQL config.
- Credential resolution can be disabled (fail-closed/disabled modes).

## Outbox and Worker Gates — ACCEPTED

- Approved action queued durable NATS JetStream job with idempotency key.
  **BL-110** — `session-109-bl108-109-110-115-real-sandbox-enablement/`
- Worker processed via JetStream bridge; PostgreSQL remained canonical truth.
  **BL-110**
- Retry/dead-letter path worked; retry scheduling and admin cancel/dead-letter
  proven.
- Kill switch blocked writeback with `blocked_by_kill_switch` decision. **BL-115**
  — `session-109-bl108-109-110-115-real-sandbox-enablement/`
- Viewer could not create, approve, or process writeback.
- Cross-tenant access denied (404).

## Evidence Gates — ACCEPTED

- Evidence bundle included Zammad ticket ID, writeback result, AI model metadata,
  policy decision, action state, audit timeline, object storage key, and SHA-256
  checksum.
- Evidence artifact stored in MinIO (`dev-tenant/writebacks/{session}/{outbox}.json`)
  with direct read/checksum proof via boto3. **BL-112** —
  `session-111-112-113-sandbox-writeback-closure-canonical/`
- Evidence clearly labeled `sandbox/local, not compliance certification`.

## Email Gates — ACCEPTED

- Mailpit captured notification email (subject: "SupportPlane sandbox writeback
  completed") with message ID and timestamp. **BL-113** —
  `session-111-112-113-sandbox-writeback-closure-canonical/`
- No real internet email was sent.

## Safety and Non-Claim Gates — ACCEPTED

- No production deployment claim.
- No compliance claim.
- No real customer data.
- No uncontrolled network egress (deny-by-default connector egress evaluator
  enforced). **BL-115**
- Endpoint agent with read-only diagnostics implemented and accepted.
  **BL-055/056/058/059/060** — `session-120-endpoint-agent-diagnostics/`
- No screen monitoring or OCR.
- Asterisk AMI call-event bridge implemented; no PSTN, no SIP trunk, no
  recording, no transcription. **BL-117** —
  `session-117-bl117-asterisk-telephony-bridge/`

## Required Proof Package — ACCEPTED

All items below were completed during BL-116 closure. Evidence in:
`output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/`

- Exact cluster/runtime commands and results — `01-baseline-runtime-and-git.txt`,
  `02-cluster-topology-and-services-proof.txt`
- Browser proof with runtime identity — `12-ui-cockpit-overview.png`
- API proof for allowed and blocked writeback paths — `04-real-sandbox-e2e-flow-proof.txt`,
  `05-blocked-paths-and-safety-proof.txt`
- MinIO evidence object key and checksum — `04-real-sandbox-e2e-flow-proof.txt`
  and direct boto3 `head_object` verification
- Secret/no-token proof from API, UI, logs, evidence, and browser storage —
  `06-no-secret-no-cloud-no-production-proof.txt`
- Duplicate/idempotency proof for Zammad internal-note writeback — `04-real-sandbox-e2e-flow-proof.txt`
- Kill switch and resolver disablement proof — `05-blocked-paths-and-safety-proof.txt`

## Current Verification Status

- All gates above were proven during BL-103 through BL-116 closure sessions
  between 2026-04-29 and 2026-04-30.
- **The cluster is not currently running** (as of 2026-05-02).
- To re-verify: start the cluster with `bash scripts/create_local_k8s_cluster.sh`,
  apply manifests with `kubectl apply -k infra/kubernetes/local-podman`, build
  and load images with `bash scripts/build_and_load_local_k8s_images.sh`, then
  run `bash scripts/verify_bl116_real_sandbox_freeze.sh`.
- The canonical evidence snapshot is in
  `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/` (20 files).
