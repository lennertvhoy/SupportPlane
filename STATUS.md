# SupportPlane Status

**Updated At:** 2026-04-29 21:50 CEST
**Execution Mode:** operating
**Project State:** bl_108_109_110_115_accepted
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-110 and BL-115 are accepted. BL-108 now proves a real host-controlled Ollama model call from the cluster API with fallbackUsed=false.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster with PostgreSQL PVC. Self-hosted topology is deployed.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU, reachable from cluster pods via podman0 bridge (10.88.0.1:11434).
- **Runnable paths:** Local/mock MVP on localhost:4110/3200; cluster sandbox on localhost:4210/3300 with real Zammad read, OpenBao sandbox resolver, NATS JetStream bridge, and real Ollama local AI call.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows only local sandbox read and blocks writeback; NATS JetStream product stream/consumer bridges approved outbox items; Ollama provider performs real host-controlled model calls with llama3.1:8b, no cloud calls, no autonomous send, redaction before call.
- **What is still not real:** Zammad internal-note writeback (BL-111), MinIO evidence persistence, Mailpit notification capture, production auth/secrets, production broker HA, production AI governance, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance.

## Active Blockers

- Real writeback remains intentionally disabled until BL-111.
- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Ollama model selection upgrade (gemma4, qwen3.6) blocked by Ollama 0.18.2 version; tracked as BL-121.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
