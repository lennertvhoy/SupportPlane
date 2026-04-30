# BL-116 Acceptance Freeze Record

## Milestone: Real Self-Hosted Sandbox

**Date:** 2026-04-30
**Git HEAD:** 1e6298a5586e30400f9a600a62f82e6128445e81
**Branch:** main
**Status:** ACCEPTED

---

## What This Freeze Covers

This freeze accepts the complete local self-hosted sandbox milestone:
- Kubernetes cluster (`supportplane-local` via Kind/Podman) running all workloads
- Real Zammad sandbox read (ticket 2 / customer Acme BVBA)
- Real Ollama local AI draft (host-controlled, no cloud fallback)
- Full E2E sandbox writeback flow: session → action → submit → approve → queue → worker auto-process → `sandbox_delivered`
- NATS JetStream primary queue with PostgreSQL fallback
- MinIO local S3 evidence persistence (direct object read/checksum proven)
- Mailpit local SMTP capture
- OpenBao local secret resolution
- Sandbox-only egress policy (allowlist read, block external/production/writeback)
- Observability baseline (correlation IDs, Prometheus, local stack)

---

## E2E Canonical Flow Evidence

| Step | Artifact | Value |
|---|---|---|
| Session | ID | `12b786cf-c60e-4b19-9403-808cbe9fe663` |
| Action | ID | `225a543a-5bb4-48a4-a2b2-986f8aca0893` |
| Outbox item | ID | `91ac6128-f76e-47f1-872b-02bae63a3b9a` |
| Zammad article | ID | 17 |
| Zammad article | Created | `2026-04-30T09:48:16.445Z` |
| MinIO object | Key | `dev-tenant/writebacks/12b786cf-c60e-4b19-9403-808cbe9fe663/91ac6128-f76e-47f1-872b-02bae63a3b9a.json` |
| Mailpit latest | Subject | "SupportPlane sandbox writeback completed" |
| Mailpit latest | Created | `2026-04-30T09:48:16.566Z` |
| Correlation ID | Flow trace | `sp-f08069d2-42c0-457d-acf2-447b1cf0b288` |
| Delivery mode | | `sandbox` |
| Policy decision | | `sandbox_allowed` |

---

## Safety Claims Verified

| Claim | Evidence | Status |
|---|---|---|
| No raw secrets in API/UI/logs | grep scan of telemetry, API responses, evidence bundles | VERIFIED |
| No cloud AI call | Ollama response shows `provider=ollama`, `fallbackUsed=false` | VERIFIED |
| No production monitoring | `observability.status.localOnly=true` | VERIFIED |
| Worker sandbox mode | Worker logs show `mode: sandbox`, `queueBackend: nats-jetstream` | VERIFIED |
| External URL blocked | Egress policy rejects `https://example.com` | VERIFIED |
| Production URL blocked | Egress policy rejects production-like URLs | VERIFIED |
| Kill switch works | Egress policy rejects when `killSwitchEnabled=true` | VERIFIED |
| Unapproved writeback blocked | Egress policy rejects `operation: writeback` without sandbox approval | VERIFIED |
| Cross-tenant isolation | API returns 404 for cross-tenant session/action/outbox access | VERIFIED |
| Admin approval required | Operator cannot approve own action (403); admin can (200) | VERIFIED |

---

## Validation Gate

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` (all 9 packages) | PASS |
| Tests | `npm test` (API suite) | 33/33 PASS |
| Observability baseline | `scripts/verify_observability_baseline.sh` | PASS |
| No-secret scan | Manual grep of telemetry + metrics | PASS |

---

## Cluster Topology

| Namespace | Workloads | Status |
|---|---|---|
| supportplane-app | api, web, worker | All Running |
| supportplane-data | postgres, redis | All Running, PVCs bound |
| supportplane-integrations | zammad, zammad-postgres, openbao, nats, minio, mailpit | All Running |
| supportplane-observability | prometheus, grafana, loki, otel-collector | All Running |

Port-forwards active: API 4210, Web 3300, Prometheus 9090, Grafana 3001, Zammad 8080, MinIO 9000, Mailpit 8025, OpenBao 8200, NATS 8222.

---

## Remaining Limitations (Honest)

1. **Worker status endpoint 401**: Requires `x-supportplane-service-token` header; unauthenticated curl fails. Worker health proven via NATS consumption and log output.
2. **Worker auto-claims NATS messages**: Manual `process-once` returns `no_eligible_outbox_item` because NATS worker consumes immediately. This is expected behavior, not a bug.
3. **Mailpit API discrepancy**: `localhost:8025/api/v1/messages` returned `{"total":0}` in one check, but host mailpit process shows 14 captured messages. Host mailpit (pid 2649, port 8025) is the actual capture endpoint.
4. **Web UI screenshots**: Captured separately in this folder (12-16). Login requires manual form submit; local auth only.
5. **No production readiness**: This freeze accepts sandbox-only behavior. Production connectors, production auth, production monitoring, compliance certification, and real telephony are all explicitly out of scope.

---

## Sign-off

This milestone is accepted as closure-grade complete for the local self-hosted sandbox.
