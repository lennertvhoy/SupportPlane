# Workflow Truth

**Backlog:** BL-102  
**Status:** BL-106 cluster topology deployed and verified. BL-107 adds real Zammad sandbox read connector. Remaining integrations (AI, writeback, OpenBao, NATS, MinIO, Mailpit) remain mock-only or planned.

| Capability | Current status | Current implementation truth | Target self-hosted service | Target milestone | Acceptance proof required | Risk level | Notes |
|---|---|---|---|---|---|---|---|
| Zammad connector | Real sandbox read | SupportPlane API reads real ticket/customer from Zammad sandbox via HTTP; writeback remains blocked. | Zammad sandbox | BL-107 accepted / BL-111 planned | Real sandbox read/write tests, browser provenance, idempotency proof. | High | Zammad is first real target. |
| Ticket/customer lookup | Real sandbox read | Reads deterministic customer/ticket from Zammad sandbox via real HTTP. | Zammad sandbox | BL-107 accepted | Read deterministic customer/ticket from Zammad sandbox. | Medium | No production customer data. |
| AI draft generation | Mock/local only | Deterministic mock draft. | Ollama | BL-108 | Local model output with model/prompt/context hash/latency; no cloud call. | Medium | Test fallback must be labeled. |
| AI summaries | Mock/local only | Deterministic mock summary behavior only. | Ollama | BL-108 | Local summary metadata and no cloud call proof. | Medium | Same provider boundary as drafts. |
| Incoming call / telephony | Mock/local only | Fake webhook/call simulator. | None in core sandbox | Later | Internal event proof only if later scoped. | High | PBX waits until core E2E works. |
| PBX/CTI | Future only | Adapter boundary exists; no real PBX. | Asterisk/FreePBX | BL-117 later | Internal SIP/test call event, no PSTN claim. | High | Not part of core path. |
| Writeback to ticketing system | Mock-only | Mock delivery/outbox; real network locked off. | Zammad sandbox | BL-111 | Approval-gated internal-note writeback, kill switch denial, duplicate prevention. | Critical | Sandbox only. |
| Email sending | Not real | No internet email; no real SMTP delivery. | Mailpit | BL-113 | Mailpit captures local SMTP; no internet email sent. | Medium | Local capture only. |
| External worker/broker semantics | Local/mock | PostgreSQL outbox/process-once; NATS not consumed. | NATS JetStream | BL-110 | Durable stream/consumer, retry/dead-letter, idempotency. | High | Current worker is not production queue. |
| Real credential resolution | Not real | Credential refs are metadata/placeholder; no resolver. | OpenBao | BL-109 | Server-side placeholder resolution and no leakage. | Critical | No production secrets. |
| Real secrets vault/KMS | Not real | No Vault/KMS; no encrypted broker. | OpenBao local sandbox | BL-109 | Local resolver with disable path and audit. | Critical | Production gap remains. |
| Real network egress | Blocked | Config/policy rejects real network. | Network policy/egress guardrails | BL-115 | Only local Zammad sandbox allowed; kill switch blocks. | Critical | No uncontrolled egress. |
| Production evidence/compliance | Not real | Local JSON/Markdown bundle; no object persistence or signing. | MinIO for local artifacts | BL-112/BL-116 | Object key/checksum and explicit local/non-compliance disclaimer. | High | MinIO alone is not compliance. |
| Endpoint agent | Future only | No agent app. | osquery/future agent | BL-118 | Read-only diagnostics and no arbitrary shell. | High | Later only. |
| Tauri/operator companion | Future only | Web mock screen panels only; no Tauri. | Tauri app later | BL-119 | Explicit sharing state in desktop app. | High | Later only. |
| Screen monitoring/OCR/remote desktop observation | Future only | No raw pixels, OCR, clipboard, or monitoring. | Tesseract/PaddleOCR or remote tool later | BL-120 future | Consent-gated proof, redaction, no ambient surveillance. | Critical | Do not build before privacy design. |
| Local Kubernetes/Podman cluster | Deployed and verified | Kind/Podman cluster `supportplane-local` and four namespaces; SupportPlane apps/PostgreSQL and self-hosted services deployed. | Kind on Podman | BL-103/104/105/106 accepted | Cluster starts, namespaces exist, all workloads healthy. | Low | Verified with `kindest/node:v1.31.4`; Ollama host-controlled. |
| SupportPlane API in cluster | Deployed and verified | API Deployment + Service in `supportplane-app`; health via port-forward `localhost:4210`. | Same | BL-104 accepted | `/health` returns ok with postgres/local auth runtime identity. | Low | Built from `localhost/supportplane-api:local-k8s`. |
| SupportPlane Web in cluster | Deployed and verified | Web Deployment + Service in `supportplane-app`; reachable via port-forward `localhost:3300`. | Same | BL-104 accepted | Browser loads, header shows DEV/MOCK DATA/local auth/postgres. | Low | Built from `localhost/supportplane-web:local-k8s`; `NEXT_PUBLIC_API_BASE_URL=http://localhost:4210`. |
| SupportPlane Worker in cluster | Deployed and verified | Worker Deployment in `supportplane-app`; logs in mock-only mode. | Same | BL-104 accepted | Worker logs show `mode: mock`, `queueBackend: postgres-local-outbox`. | Low | Built from `localhost/supportplane-worker:local-k8s`. |
| PostgreSQL in cluster | Deployed and verified | StatefulSet + PVC in `supportplane-data`; `postgres-data-postgres-0` Bound 1Gi. | Same | BL-105 accepted | Prisma migrate/seed succeed; restart survival proven. | Low | Upstream `postgres:16-alpine` image; local placeholder credentials only. |
| Object storage / MinIO evidence artifacts | Partial local infra only | MinIO compose exists; evidence is not stored there. | MinIO | BL-112 | Artifact write/read/checksum and UI metadata. | Medium | Not compliance-grade. |
| Observability | Planned | No OTel/Loki/Prometheus/Grafana runtime proof. | OTel/Grafana/Loki/Prometheus | BL-114 | Basic logs/metrics/traces with correlation ID. | Medium | Not production monitoring. |
