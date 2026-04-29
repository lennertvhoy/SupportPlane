# Backlog Real E2E Roadmap

**Backlog:** BL-102  
**Status:** roadmap mapping. No implementation.

## Accepted Baseline

- **BL-001 through BL-009:** monorepo, contracts, mock API/UI, local compose topology, Zammad connector boundary, evidence skeleton, fake incoming call.
- **BL-018, BL-020, BL-041 through BL-050:** local auth/RBAC, ticket/customer models, call simulator, telephony boundary, web-based mock screen observation/persistence foundation.
- **BL-091 through BL-101:** support case workflow, durable local outbox, mock worker retry/dead-letter, delivery policies, connector runtime confidence, real writeback design, MVP completion audit/demo freeze.

## Partial/Local-Mock Items That Stay Partial

- **BL-022/023:** Zammad read/write are fixture/mock only.
- **BL-026/027/028/029:** AI provider, chat, summaries, drafts are deterministic mock only.
- **BL-046/051/052/053:** operator companion and screen context are web/mock only; no Tauri, raw pixels, OCR, or desktop monitoring.
- **BL-078:** evidence viewer/export exists, but object storage and compliance-grade artifact storage do not.
- **BL-084/085/088:** production secrets, OpenTelemetry, and Kubernetes were planned but not implemented.

## New Roadmap Groups

| Group | Backlog IDs | Purpose |
|---|---|---|
| Kubernetes foundation | BL-103, BL-104, BL-105 | Local Kubernetes/Podman cluster, app manifests, PostgreSQL PVC. |
| Self-hosted service topology | BL-106 | Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, Ollama placement. |
| Zammad real sandbox read | BL-107 | Deterministic Zammad sandbox data and real read connector. |
| Ollama provider | BL-108 | Local AI drafts/summaries with metadata and no cloud calls. |
| OpenBao resolver | BL-109 | Server-side credential resolution with no secret leakage. |
| NATS worker | BL-110 | Durable stream/consumer, outbox bridge, retry/dead-letter. |
| Zammad sandbox writeback | BL-111, BL-115 | Approval-gated internal-note writeback and network guardrails. |
| MinIO evidence artifacts | BL-112 | JSON/Markdown evidence artifact persistence and checksum. |
| Mailpit notifications | BL-113 | Local SMTP capture only. |
| Observability | BL-114 | OTel/Grafana/Loki/Prometheus local baseline. |
| Sandbox acceptance freeze | BL-116 | End-to-end accepted milestone after all core services work. |
| Optional PBX | BL-117 | Asterisk/FreePBX call-event bridge after core flow. |
| Optional endpoint/companion | BL-118, BL-119, BL-120 | Read-only diagnostics, Tauri scaffold, consent-gated OCR/screen work. |

## Definition of Done: Real Sandbox Milestone

The real sandbox milestone is done only when the local Kubernetes-on-Podman cluster runs SupportPlane API/Web/Worker, PostgreSQL, Zammad, Ollama, OpenBao, NATS JetStream, Mailpit, MinIO, and observability; SupportPlane reads a deterministic Zammad ticket; Ollama generates a local draft; a human-approved action queues through durable worker semantics; OpenBao resolves the sandbox credential server-side; the worker writes one idempotent internal note to Zammad sandbox; Mailpit captures any local notification; MinIO stores the evidence artifact; UI/API/browser proof shows allowed and blocked paths; and all evidence clearly says sandbox/local, not production or compliance certification.

## Do Not Build Yet

- Production Zammad writeback.
- Public replies or broad ticket mutations.
- Cloud AI provider calls.
- Production OIDC/MFA claims.
- Production secret storage claims.
- PSTN/real PBX deployment.
- Endpoint agent command execution.
- Tauri companion or screen/OCR monitoring without consent/privacy design.
- Remote desktop observation/control.
- Compliance certification or tamper-evident evidence claims.
