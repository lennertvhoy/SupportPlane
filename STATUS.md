# SupportPlane Status

**Updated At:** 2026-04-29 21:55 CEST
**Execution Mode:** operating
**Project State:** bl_121_accepted_bl_111_active
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-110, BL-115, BL-121 are accepted. BL-121 proves real host-controlled Ollama model call from the cluster API with gemma4:e4b, fallbackUsed=false.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster with PostgreSQL PVC. Self-hosted topology is deployed.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU, reachable from cluster pods via podman0 bridge (10.88.0.1:11435) with user-local Ollama v0.22.0 and gemma4:e4b.
- **Runnable paths:** Local/mock MVP on localhost:4110/3200; cluster sandbox on localhost:4210/3300 with real Zammad read, OpenBao sandbox resolver, NATS JetStream bridge, and real Ollama local AI call.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows only local sandbox read and blocks writeback; NATS JetStream product stream/consumer bridges approved outbox items; Ollama provider performs real host-controlled model calls with gemma4:e4b on user-local Ollama v0.22.0, fallbackUsed=false, no cloud calls, no autonomous send, redaction before call.
- **What is still not real:** Zammad internal-note writeback (BL-111), MinIO evidence persistence, Mailpit notification capture, production auth/secrets, production broker HA, production AI governance, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance.

## Active Blockers

- Real writeback remains intentionally disabled until BL-111.
- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- BL-121 completed: user-local Ollama upgraded to v0.22.0, gemma4:e4b selected and verified. qwen3.6:27b also available but larger/slower.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
