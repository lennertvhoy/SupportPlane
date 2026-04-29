# SupportPlane Status

**Updated At:** 2026-04-29 17:15 CEST
**Execution Mode:** operating
**Project State:** bl_106_selfhosted_service_topology_accepted
**Public URL:** not configured

## Snapshot

- **BL-104, BL-105, and BL-106 are accepted.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster. PostgreSQL runs in `supportplane-data` with a Bound PVC and proven restart survival. Self-hosted service topology (Zammad, OpenBao, NATS JetStream, Mailpit, MinIO) is deployed and verified in `supportplane-integrations` and `supportplane-data`. Ollama is documented as a host-controlled service.
- **Cluster foundation truth:** one Podman-backed Kind control-plane node is `Ready`; CoreDNS, kube-proxy, and local-path-provisioner are running; the four target namespaces are active.
- **Self-hosted topology truth:**
  - Zammad: Running in `supportplane-integrations`, HTTP 200 reachable, separate PostgreSQL and Redis dependencies.
  - OpenBao: Running in `supportplane-integrations`, health endpoint returns initialized/unsealed.
  - NATS JetStream: Running in `supportplane-integrations`, file-backed stream `TEST_STREAM` and consumer `TEST_CONSUMER` verified.
  - Mailpit: Running in `supportplane-integrations`, SMTP port 1025 captures local test messages, web UI on 8025.
  - MinIO: Running in `supportplane-data`, API and console healthy, bucket `bl106-bucket` and object `topology-proof.txt` verified.
  - Ollama: Host-controlled (not in-cluster); host has AMD GPU and models available.
- **Current product has two runnable paths:** Local/mock MVP freeze (BL-101) on API `localhost:4110`/Web `localhost:3200`/PostgreSQL `localhost:5434`; and cluster app/Postgres/topology (BL-104/BL-105/BL-106) on API `localhost:4210`/Web `localhost:3300`. Both use local auth, PostgreSQL store, mock connectors, deterministic mock AI, and mock-only writeback.
- **Strategic target is now explicit:** local Kubernetes sandbox on Podman with SupportPlane API/Web/Worker, PostgreSQL, Zammad, Ollama (host), OpenBao, NATS JetStream, Mailpit, MinIO, and observability.
- **What is still not real:** real Zammad read/write, real AI provider, OpenBao resolver, NATS worker semantics, MinIO evidence persistence, Mailpit notification capture, production auth, production secrets, real telephony/PBX, endpoint agent, Tauri companion, screen monitoring/OCR, production deployment, and compliance certification.

## Active Blockers

- Real Zammad read connector (BL-107) is the next active item.
- Ollama provider integration (BL-108), OpenBao resolver (BL-109), and NATS worker bridge (BL-110) are queued.
- Real writeback remains intentionally disabled.
- Credential references remain metadata/placeholder only.
- No production-grade secrets, auth, observability, or compliance boundary exists.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
