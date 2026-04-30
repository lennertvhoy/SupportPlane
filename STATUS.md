# SupportPlane Status

**Updated At:** 2026-04-30 11:20 CEST
**Execution Mode:** operating
**Project State:** bl_114_accepted_bl_116_active
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-115, BL-121, and BL-122 are accepted.** BL-111/112/113 prove real sandbox writeback E2E: Zammad internal note (article 16 on ticket 2), MinIO evidence artifact, Mailpit notification capture, all via NATS JetStream worker with OpenBao credential resolution. BL-114 adds local-only observability with correlation IDs, structured logs, Prometheus metrics, OTel Collector, Grafana, and Loki-ready local stack.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU, reachable from cluster pods via podman0 bridge (10.88.0.1:11435) with user-local Ollama v0.22.0 and gemma4:e4b.
- **Runnable paths:** Local/mock MVP API verified on localhost:4110 and local production web verified on localhost:3201 because a pre-existing localhost:3200 dev server was stale/broken. Cluster sandbox verified on localhost:4210/3300 with real Zammad read/writeback, OpenBao sandbox resolver, NATS JetStream bridge, real Ollama local AI call, MinIO evidence, Mailpit notification, and local observability.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows local sandbox read and sandbox writeback; NATS JetStream product stream/consumer bridges approved outbox items; worker processes sandbox writeback to Zammad, persists evidence to MinIO, sends Mailpit notification; Ollama provider performs real host-controlled model calls with gemma4:e4b; UI displays sandbox_delivered status in Action Center, Delivery Operations, Case Timeline, and Audit Trail; local-only observability exposes correlation IDs, structured logs, `/metrics`, `/observability/status`, Prometheus scrape/query, Grafana health, and Loki readiness.
- **What is still not real:** Production auth/secrets, production broker HA, production AI governance, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance, production monitoring.

## Active Blockers

- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Observability is local sandbox only, not production monitoring or alerting.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
