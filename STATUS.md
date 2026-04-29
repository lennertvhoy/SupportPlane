# SupportPlane Status

**Updated At:** 2026-04-29 20:17 CEST
**Execution Mode:** operating
**Project State:** bl_107_zammad_sandbox_read_connector_accepted
**Public URL:** not configured

## Snapshot

- **BL-104 through BL-107 are accepted.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster with PostgreSQL PVC. Self-hosted topology (Zammad, OpenBao, NATS, Mailpit, MinIO) is deployed. BL-107 adds real Zammad sandbox read with explicit sandbox labels and audit logging.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; four namespaces active.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU.
- **Runnable paths:** Local/mock MVP on localhost:4110/3200; cluster sandbox on localhost:4210/3300 with real Zammad read.
- **What is real now:** API reads real Zammad sandbox ticket/customer; UI displays sandbox data with provenance and safety labels; Connector Runtime shows real sandbox mode; audit records real Zammad ticket loaded event.
- **What is still not real:** Zammad writeback, real AI, OpenBao resolver, NATS worker bridge, MinIO evidence, Mailpit capture, production auth/secrets, telephony, endpoint agent, Tauri companion, screen monitoring/OCR, compliance.

## Active Blockers

- Ollama provider integration (BL-108) is the next active item.
- OpenBao resolver (BL-109) and NATS worker bridge (BL-110) are queued.
- Real writeback remains intentionally disabled.
- Credential references remain metadata/placeholder only.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
