# Sandbox Integration Acceptance

**Backlog:** BL-102  
**Status:** future acceptance contract. Nothing in this file claims the sandbox currently works.

## Cluster and Runtime Gates

- Local Kubernetes cluster starts on Podman.
- All namespaces exist: `supportplane-app`, `supportplane-data`, `supportplane-integrations`, `supportplane-observability`.
- SupportPlane API/Web/Worker deploy into cluster.
- PostgreSQL deploys with persistent storage.
- Zammad deploys and becomes healthy.
- Ollama deploys or is reachable as a controlled local service.
- OpenBao deploys and can return a local placeholder secret server-side.
- NATS JetStream deploys and supports durable stream/consumer.
- Mailpit deploys and captures SMTP messages.
- MinIO deploys and stores an evidence bundle artifact.
- Observability stack receives basic logs/metrics.

## Zammad Gates

- Deterministic demo customer exists.
- Deterministic demo ticket exists.
- SupportPlane can read customer/ticket from real Zammad sandbox.
- SupportPlane can write one internal note to Zammad sandbox only.
- The note includes SupportPlane provenance/idempotency marker.
- Duplicate processing does not create duplicate notes.

## AI Gates

- Ollama generates a local draft.
- Model name, prompt version, context hash, latency, and local-provider marker are stored.
- No cloud AI provider is called.
- Deterministic fallback is limited to tests and is visibly marked.

## Credential Gates

- OpenBao stores or returns the Zammad credential reference.
- SupportPlane resolves credentials only server-side.
- No token appears in API responses, screenshots, evidence bundles, browser local storage, logs, or PostgreSQL config.
- Credential resolution can be disabled.

## Outbox and Worker Gates

- Approved action queues durable job.
- Worker processes once or idempotently.
- Retry/dead-letter path works.
- Kill switch blocks writeback.
- Viewer cannot create, approve, or process writeback.
- Cross-tenant access is denied.

## Evidence Gates

- Evidence bundle includes Zammad ticket ID, writeback result, AI model metadata, policy decision, action state, audit timeline, object storage key, and checksum.
- Evidence artifact is stored in MinIO.
- Evidence clearly says `sandbox/local, not compliance certification`.

## Email Gates

- Mailpit captures notification email if enabled.
- No real internet email is sent.

## Safety and Non-Claim Gates

- No production deployment claim.
- No compliance claim.
- No real customer data.
- No uncontrolled network egress.
- No endpoint agent.
- No screen monitoring/OCR.
- No telephony/PBX unless a later phase explicitly implements it.

## Required Proof Package

- Exact cluster/runtime commands and results.
- Browser proof with runtime identity.
- API proof for allowed and blocked paths.
- Evidence artifact object key/checksum.
- Secret/no-token proof from API, UI, logs, evidence, and browser storage.
- Duplicate/idempotency proof for Zammad internal-note writeback.
- Rollback/disable proof for kill switch and resolver disablement.
