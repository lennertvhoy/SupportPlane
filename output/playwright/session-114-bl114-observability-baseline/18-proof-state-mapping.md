# BL-114 Proof State Mapping

Folder: `output/playwright/session-114-bl114-observability-baseline/`

| File | Claim proved |
|---|---|
| `01-baseline-runtime.txt` | Baseline git, cluster, app health, worker logs, and recent evidence inventory before BL-114 changes. |
| `02-bl111-113-regression-truth-proof.txt` | Prior sandbox delivery dependencies remain real enough to build on: Zammad, MinIO, Mailpit, OpenBao, NATS, worker service-auth, Ollama/Gemma, and `sandbox_delivered`. |
| `03-observability-architecture-proof.md` | BL-114 observability design, correlation contract, local-only limits, metric/log scope, and no-secret rules. |
| `04-otel-collector-proof.txt` | Observability namespace and OTel/Prometheus/Grafana/Loki pods/services exist locally; Loki log shipping is not claimed. |
| `05-api-worker-correlation-proof.txt` | API accepts/returns `X-Correlation-Id`; worker and outbox paths preserve safe correlation metadata. |
| `06-metrics-proof.txt` | Prometheus-compatible metrics exist and Prometheus can query SupportPlane counters. |
| `07-logs-proof.txt` | Structured safe logs include service/event/correlation fields without raw secrets. |
| `08-dashboard-or-query-proof.txt` | Grafana health/datasource status and Prometheus query proof exist for the local stack. |
| `09-no-secret-telemetry-proof.txt` | Telemetry artifacts were searched for secret/token leakage; no secret exposure is proven by the recorded checks. |
| `10-validation-gate.txt` | Exact lint/typecheck/test/state-doc/observability verification commands and pass results. |
| `11-cluster-redeploy-proof.txt` | Local Kubernetes images were rebuilt/redeployed and API/Web/Worker/observability rollouts succeeded. |
| `12-ui-observability-overview-proof.png` | Browser proof of the local observability overview, local-only warning, no-production-monitoring copy, and no-secret telemetry copy. |
| `13-ui-correlation-drilldown-proof.png` | Browser proof of correlation ID summary, API health, worker status, and queue backend. |
| `14-ui-sandbox-writeback-observability-proof.png` | Browser proof of NATS JetStream worker and sandbox writeback telemetry panel. |
| `15-state-docs-proof.png` | Browser-rendered proof that state docs were reconciled to BL-114 accepted and BL-116 active/not accepted. |
| `16-bl116-readiness-audit.md` | BL-116 readiness audit, dependency table, evidence-cap strategy, stale-evidence exclusions, and remaining freeze blockers. |
| `17-local-mvp-regression.txt` | Local API/Web MVP still reachable and local observability endpoint works outside the cluster. |
| `18-proof-state-mapping.md` | This mapping file. |
| `19-screenshot-md5s.txt` | Screenshot hash inventory and duplicate detection result. |
| `20-git-status-final.txt` | Final clean worktree proof output. |
