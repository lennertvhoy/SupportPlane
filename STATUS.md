# SupportPlane Status

**Updated At:** 2026-04-29 21:05 CEST
**Execution Mode:** operating
**Project State:** bl_109_110_115_accepted_bl108_partial
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-107 plus BL-109, BL-110, and BL-115 are accepted. BL-108 is partial.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster with PostgreSQL PVC. Self-hosted topology is deployed. BL-108 adds the Ollama local provider contract and labeled fallback, but the runtime proof used fallback rather than a successful host model call.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU.
- **Runnable paths:** Local/mock MVP on localhost:4110/3200; cluster sandbox on localhost:4210/3300 with real Zammad read, OpenBao sandbox resolver, NATS JetStream bridge, and local Ollama/fallback AI metadata.
- **What is real now:** API reads real Zammad sandbox ticket/customer; server-side OpenBao resolves the sandbox credential; egress policy allows only local sandbox read and blocks writeback; NATS JetStream product stream/consumer can bridge approved outbox items; Ollama provider path is implemented with deterministic fallback and no cloud calls.
- **What is still not real:** Zammad internal-note writeback, MinIO evidence persistence, Mailpit notification capture, production auth/secrets, production broker HA, production AI governance, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance.

## Active Blockers

- BL-108 needs a host-controlled Ollama call repair before it can be accepted.
- Real writeback remains intentionally disabled until BL-111.
- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
