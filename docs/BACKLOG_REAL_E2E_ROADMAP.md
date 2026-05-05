# Backlog Real E2E Roadmap

**Backlog:** BL-102  
**Status:** roadmap mapping. BL-103 through BL-117 are accepted. Optional endpoint/companion/OCR items remain partial or planned.

## Accepted Baseline

- **BL-001 through BL-009:** monorepo, contracts, mock API/UI, local compose topology, Zammad connector boundary, evidence skeleton, fake incoming call.
- **BL-018, BL-020, BL-041 through BL-050:** local auth/RBAC, ticket/customer models, call simulator, telephony boundary, web-based mock screen observation/persistence foundation.
- **BL-091 through BL-101:** support case workflow, durable local outbox, mock worker retry/dead-letter, delivery policies, connector runtime confidence, real writeback design, MVP completion audit/demo freeze.

## Partial Items (Status as of BL-116 Real Sandbox Freeze)

- **BL-022/023:** Zammad read/write are real sandbox (BL-107, BL-111 accepted). Previously fixture/mock only.
- **BL-026/027/028/029:** AI provider, chat, summaries, drafts are real Ollama sandbox calls (BL-108, BL-121 accepted). Previously deterministic mock only.
- **BL-046/051/052/053:** operator companion and screen context are web/mock only; no Tauri, raw pixels, OCR, or desktop monitoring.
- **BL-078:** evidence viewer/export exists; object storage artifact persistence is real sandbox MinIO (BL-112 accepted).
- **BL-084/085/088:** production secrets superseded by BL-109 (OpenBao sandbox resolver accepted); OpenTelemetry superseded by BL-114 (observability baseline accepted); Kubernetes superseded by BL-103/104/105 (all accepted).

## New Roadmap Groups

| Group                        | Backlog IDs                              | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Kubernetes foundation        | BL-103 accepted; BL-104, BL-105 accepted | Local Kubernetes/Podman cluster with API, Web, Worker, and PostgreSQL verified.          |
| Self-hosted service topology | BL-106 accepted                          | Zammad, OpenBao, NATS JetStream, Mailpit, MinIO deployed; Ollama host-controlled.        |
| Zammad real sandbox read     | BL-107 accepted                          | Deterministic Zammad sandbox data and real FetchZammadHttpClient connector.              |
| Ollama provider              | BL-108, BL-121 accepted                  | Real local AI drafts/summaries with gemma4:e4b, metadata, no cloud calls.                |
| OpenBao resolver             | BL-109 accepted                          | Server-side credential resolution with no secret leakage.                                |
| NATS worker                  | BL-110 accepted                          | Durable stream/consumer, outbox bridge, retry/dead-letter.                               |
| Zammad sandbox writeback     | BL-111, BL-115 accepted                  | Approval-gated internal-note writeback and network guardrails.                           |
| MinIO evidence artifacts     | BL-112 accepted                          | JSON/Markdown evidence artifact persistence and SHA-256 checksum.                        |
| Mailpit notifications        | BL-113 accepted                          | Local SMTP capture only.                                                                 |
| Observability                | BL-114 accepted                          | OTel/Grafana/Loki/Prometheus local baseline.                                             |
| Sandbox acceptance freeze    | BL-116 accepted                          | End-to-end accepted milestone after all core services verified.                          |
| Optional PBX                 | BL-117 accepted                          | Asterisk 22.8.2 AMI call-event bridge.                                                   |
| Optional endpoint/companion  | BL-118, BL-119, BL-120 partial/planned   | Read-only diagnostics partial, Tauri scaffold and consent-gated OCR/screen work planned. |

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
