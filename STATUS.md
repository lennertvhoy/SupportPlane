# SupportPlane Status

**Updated At:** 2026-04-30 10:45 CEST
**Execution Mode:** operating
**Project State:** bl_111_112_113_accepted_bl_116_active
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-110, BL-115, BL-121, BL-111, BL-112, BL-113 are accepted.** BL-111/112/113 prove real sandbox writeback E2E: Zammad internal note (article 16 on ticket 2), MinIO evidence artifact, Mailpit notification capture, all via NATS JetStream worker with OpenBao credential resolution.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU, reachable from cluster pods via podman0 bridge (10.88.0.1:11435) with user-local Ollama v0.22.0 and gemma4:e4b.
- **Runnable paths:** Local/mock MVP on localhost:4110/3200; cluster sandbox on localhost:4210/3300 with real Zammad read/writeback, OpenBao sandbox resolver, NATS JetStream bridge, real Ollama local AI call, MinIO evidence, Mailpit notification.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows local sandbox read and sandbox writeback; NATS JetStream product stream/consumer bridges approved outbox items; worker processes sandbox writeback to Zammad, persists evidence to MinIO, sends Mailpit notification; Ollama provider performs real host-controlled model calls with gemma4:e4b; UI displays sandbox_delivered status in Action Center, Delivery Operations, Case Timeline, and Audit Trail.
- **What is still not real:** Production auth/secrets, production broker HA, production AI governance, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance, observability (BL-114).

## Active Blockers

- Observability remains planned (BL-114).
- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
