# SupportPlane Status

**Updated At:** 2026-04-30 16:35 CEST
**Execution Mode:** operating
**Project State:** bl_117_accepted
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-117, BL-121, and BL-122 are accepted.** BL-116 freezes the complete real self-hosted sandbox milestone. BL-117 adds local Asterisk AMI bridge.
- **BL-089/123/124/125/126/127 are accepted.** Plugin registry closure with runtime resolver, Zammad mode honesty fix, connector runtime expansion, adapter config schema discovery, and osTicket read-only adapter foundation. 16 evidence artifacts captured. Cluster redeployed at `5e5fc22`.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; API/web/worker pods running fresh images.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU, reachable from cluster pods via podman0 bridge (10.88.0.1:11435) with user-local Ollama v0.22.0 and gemma4:e4b.
- **Runnable paths:** Local/mock MVP API verified on localhost:4110 and local production web verified on localhost:3200. Cluster sandbox verified on localhost:4110/3200 with real Zammad read/writeback, OpenBao sandbox resolver, NATS JetStream bridge, real Ollama local AI call, MinIO evidence, Mailpit notification, and local observability.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows local sandbox read and sandbox writeback; NATS JetStream product stream/consumer bridges approved outbox items; worker processes sandbox writeback to Zammad, persists evidence to MinIO, sends Mailpit notification; Ollama provider performs real host-controlled model calls with gemma4:e4b; UI displays sandbox_delivered status in Action Center, Delivery Operations, Case Timeline, and Audit Trail; local-only observability exposes correlation IDs, structured logs, `/metrics`, `/observability/status`, Prometheus scrape/query, Grafana health, and Loki readiness; Asterisk AMI bridge accepts canonical call events, performs caller matching, auto-creates sessions; telephony registry lists mock-telephony and asterisk-ami adapters; Call Console shows Asterisk-sourced calls with honest sandbox labels.
- **What is still not real:** Production auth/secrets, production broker HA, production AI governance, production telephony/PSTN/SIP trunk, FreePBX GUI, endpoint agent, Tauri companion, screen monitoring/OCR, compliance, production monitoring.

## Active Blockers

- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Observability is local sandbox only, not production monitoring or alerting.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
