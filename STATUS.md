# SupportPlane Status

**Updated At:** 2026-04-29 16:30 CEST
**Execution Mode:** operating
**Project State:** bl_102_self_hosted_sandbox_roadmap_accepted
**Public URL:** not configured

## Snapshot

- **BL-102 is accepted as a planning/backlog/state integration slice.** It adds the real self-hosted local Kubernetes-on-Podman sandbox roadmap and docs. It does not implement a Kubernetes cluster or real integrations.
- **Current product remains the BL-101 local/mock MVP freeze.** API `http://localhost:4110`, Web `http://localhost:3200`, PostgreSQL `localhost:5434`, local username/password auth, PostgreSQL store, mock/local connectors, deterministic mock AI, and mock-only writeback remain the verified baseline.
- **Strategic target is now explicit:** local Kubernetes sandbox on Podman with SupportPlane API/Web/Worker, PostgreSQL, Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, and observability.
- **First real E2E target:** Zammad sandbox ticket/customer lookup -> Ollama draft -> human approval -> delivery policy/outbox -> NATS worker -> OpenBao credential resolution -> sandbox-only Zammad internal-note writeback -> MinIO evidence artifact, with optional Mailpit local capture.
- **What is still not real:** Kubernetes cluster, real Zammad read/write, real AI provider, OpenBao resolver, NATS worker semantics, MinIO evidence persistence, Mailpit notification capture, production auth, production secrets, real telephony/PBX, endpoint agent, Tauri companion, screen monitoring/OCR, production deployment, and compliance certification.
- **Next implementation recommendation:** BL-103 Local Kubernetes/Podman cluster foundation, followed by BL-104 app manifests and BL-105 PostgreSQL persistence.

## Active Blockers

- The local Kubernetes-on-Podman approach is not yet verified on this host.
- Real writeback remains intentionally disabled.
- Credential references remain metadata/placeholder only.
- NATS and MinIO may run in compose, but they are not the accepted worker/evidence runtime.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
