# SupportPlane Status

**Updated At:** 2026-04-29 16:30 CEST
**Execution Mode:** operating
**Project State:** bl_104_bl_105_kubernetes_app_postgres_persistence_accepted
**Public URL:** not configured

## Snapshot

- **BL-104 and BL-105 are accepted.** SupportPlane API, Web, and Worker now run in the local Kind/Podman cluster `supportplane-local`. PostgreSQL runs in `supportplane-data` with a Bound PVC and proven restart survival.
- **Cluster foundation truth:** one Podman-backed Kind control-plane node is `Ready`; CoreDNS, kube-proxy, and local-path-provisioner are running; the four target namespaces are active; Podman-built images are loaded via `podman save` plus `kind load image-archive`.
- **Current product has two runnable paths:** Local/mock MVP freeze (BL-101) on API `localhost:4110`/Web `localhost:3200`/PostgreSQL `localhost:5434`; and cluster app/Postgres foundation (BL-104/BL-105) on API `localhost:4210`/Web `localhost:3300`/PostgreSQL `postgres.supportplane-data.svc.cluster.local:5432` with PVC. Both use local auth, PostgreSQL store, mock connectors, deterministic mock AI, and mock-only writeback.
- **Strategic target is now explicit:** local Kubernetes sandbox on Podman with SupportPlane API/Web/Worker, PostgreSQL, Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, and observability.
- **What is still not real:** real Zammad read/write, real AI provider, OpenBao resolver, NATS worker semantics, MinIO evidence persistence, Mailpit notification capture, production auth, production secrets, real telephony/PBX, endpoint agent, Tauri companion, screen monitoring/OCR, production deployment, and compliance certification.
- **Next implementation recommendation:** BL-106 self-hosted service topology (Zammad, OpenBao, NATS, Mailpit, MinIO, Ollama placement).

## Active Blockers

- Self-hosted integration services (Zammad, Ollama, OpenBao, NATS, Mailpit, MinIO) are not deployed into the cluster yet.
- Real writeback remains intentionally disabled.
- Credential references remain metadata/placeholder only.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
