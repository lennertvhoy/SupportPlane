# SupportPlane Status

**Updated At:** 2026-04-29 15:55 CEST
**Execution Mode:** operating
**Project State:** bl_103_local_kubernetes_podman_cluster_foundation_accepted
**Public URL:** not configured

## Snapshot

- **BL-103 is accepted as the local Kubernetes/Podman cluster foundation.** Kind with the Podman provider was verified on this host using cluster `supportplane-local`, context `kind-supportplane-local`, and node image `kindest/node:v1.31.4`.
- **Cluster foundation truth:** one Podman-backed Kind control-plane node is `Ready`; CoreDNS, kube-proxy, and local-path-provisioner are running; the four target namespaces are active; Podman-built smoke image loading works through `podman save` plus `kind load image-archive`.
- **Current product remains the BL-101 local/mock MVP freeze.** API `http://localhost:4110`, Web `http://localhost:3200`, PostgreSQL `localhost:5434`, local username/password auth, PostgreSQL store, mock/local connectors, deterministic mock AI, and mock-only writeback remain the verified baseline.
- **Strategic target is now explicit:** local Kubernetes sandbox on Podman with SupportPlane API/Web/Worker, PostgreSQL, Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, and observability.
- **First real E2E target:** Zammad sandbox ticket/customer lookup -> Ollama draft -> human approval -> delivery policy/outbox -> NATS worker -> OpenBao credential resolution -> sandbox-only Zammad internal-note writeback -> MinIO evidence artifact, with optional Mailpit local capture.
- **What is still not real:** SupportPlane app services in Kubernetes, PostgreSQL in Kubernetes, real Zammad read/write, real AI provider, OpenBao resolver, NATS worker semantics, MinIO evidence persistence, Mailpit notification capture, production auth, production secrets, real telephony/PBX, endpoint agent, Tauri companion, screen monitoring/OCR, production deployment, and compliance certification.
- **Next implementation recommendation:** bundle BL-104 app manifests with BL-105 PostgreSQL Kubernetes persistence foundation.

## Active Blockers

- SupportPlane API/Web/Worker are not deployed into the cluster yet.
- PostgreSQL remains the local MVP Podman runtime, not the Kubernetes persistence foundation yet.
- Real writeback remains intentionally disabled.
- Credential references remain metadata/placeholder only.
- NATS and MinIO may run in compose, but they are not the accepted worker/evidence runtime.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
