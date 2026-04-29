# SupportPlane Status

**Updated At:** 2026-04-29 19:55 CEST
**Execution Mode:** operating
**Project State:** bl_107_zammad_sandbox_read_connector_accepted
**Public URL:** not configured

## Snapshot

- **BL-104, BL-105, BL-106, and BL-107 are accepted.** SupportPlane API, Web, and Worker run in the local Kind/Podman cluster. PostgreSQL runs in `supportplane-data` with a Bound PVC. Self-hosted service topology (Zammad, OpenBao, NATS JetStream, Mailpit, MinIO) is deployed. BL-107 adds real Zammad sandbox read: ticket 2 and customer 5 are fetched from the Zammad sandbox via real HTTP, displayed in the UI with explicit sandbox labels, and audit-logged.
- **Cluster foundation truth:** one Podman-backed Kind control-plane node is `Ready`; CoreDNS, kube-proxy, and local-path-provisioner are running; the four target namespaces are active.
- **Self-hosted topology truth:**
  - Zammad: Running in `supportplane-integrations`, HTTP 200 reachable, seeded with Acme BVBA customer and ticket 68002.
  - OpenBao: Running in `supportplane-integrations`, health endpoint returns initialized/unsealed.
  - NATS JetStream: Running in `supportplane-integrations`, file-backed stream verified.
  - Mailpit: Running in `supportplane-integrations`, SMTP port 1025 captures local test messages.
  - MinIO: Running in `supportplane-data`, API and console healthy.
  - Ollama: Host-controlled (not in-cluster); host has AMD GPU and models available.
- **Current product has two runnable paths:** Local/mock MVP freeze (BL-101) on API `localhost:4110`/Web `localhost:3200`; and cluster sandbox (BL-104 through BL-107) on API `localhost:4210`/Web `localhost:3300`. Cluster path now includes real Zammad read with explicit sandbox safety labels.
- **What is real now:** SupportPlane API reads real ticket/customer from Zammad sandbox; UI displays real sandbox data with "Zammad sandbox", "Read-only", "Sandbox · No writeback · No production data" labels; Connector Runtime Provenance shows "real sandbox" mode and "sandbox local cluster" network; audit trail records real Zammad ticket loaded event.
- **What is still not real:** Zammad writeback, real AI provider, OpenBao resolver, NATS worker semantics, MinIO evidence persistence, Mailpit notification capture, production auth, production secrets, real telephony/PBX, endpoint agent, Tauri companion, screen monitoring/OCR, production deployment, and compliance certification.

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
