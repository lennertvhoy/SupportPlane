# Local Kubernetes Podman Target

**Backlog:** BL-102  
**Status:** target architecture only. Host verification is still required.

## Target

SupportPlane should target a local Kubernetes cluster running on Podman for the real self-hosted sandbox. The working cluster name should be:

```text
supportplane-local
```

The local cluster is a development and proof environment. It is not a production cluster, not a cloud deployment, and not approved for customer data.

## Candidate Approaches

| Candidate | Why it is a candidate | Verification status |
|---|---|---|
| Kind with Podman provider | Common local Kubernetes workflow; good local image-load ergonomics; can avoid Docker Desktop. | To verify on host. |
| Minikube with Podman driver | Explicit local-driver workflow; supports add-ons, ingress, storage classes, and local image strategies. | To verify on host. |
| Kubernetes-in-Podman alternatives | Possible if Kind/Minikube fail with rootless Podman or host networking constraints. | To evaluate only if primary candidates fail. |

## Decision Criteria

- Works on Fedora.
- Works with Podman and does not require Docker Desktop.
- Has good local developer ergonomics.
- Supports ingress or reliable port-forwarding.
- Supports persistent volumes well enough for sandbox data.
- Works with local image builds for SupportPlane API, Web, and Worker.
- Can run Zammad, PostgreSQL, OpenBao, NATS JetStream, Mailpit, MinIO, and observability without pretending to be production.

## Recommended Default Path

Recommended starting path: **Kind with Podman provider**, marked **to verify on host**. If Kind/Podman fails on rootless networking, storage, or image loading, evaluate **Minikube with Podman driver** next.

No cluster has been created or verified in BL-102.

## Namespace Plan

| Namespace | Purpose |
|---|---|
| `supportplane-app` | SupportPlane Web, API, Worker. |
| `supportplane-data` | PostgreSQL and MinIO. |
| `supportplane-integrations` | Zammad, Ollama, OpenBao, NATS JetStream, Mailpit. |
| `supportplane-observability` | OpenTelemetry collector, Grafana, Loki, Prometheus. |

## Local Image and Tag Strategy

| Image | Suggested local tag | Load strategy |
|---|---|---|
| SupportPlane API | `localhost/supportplane-api:local-dev` | Kind image load or local registry; verify in Phase 1. |
| SupportPlane Web | `localhost/supportplane-web:local-dev` | Kind image load or local registry; verify in Phase 1. |
| SupportPlane Worker | `localhost/supportplane-worker:local-dev` | Kind image load or local registry; verify in Phase 1. |

Local image build/load must be proven before app manifests are accepted. Tags are local-dev only and must not imply production release.

## Networking Strategy

- Web and API should be reachable from localhost through ingress or port-forwarding.
- Cluster-internal calls should use Kubernetes service DNS, for example `supportplane-api.supportplane-app.svc.cluster.local`.
- Zammad, OpenBao, NATS, Mailpit, MinIO, and observability UIs should be exposed only through explicit local ports needed for the demo.
- Real writeback egress stays disabled by default until the relevant phase adds explicit network guardrails.
- Network egress policy target: block uncontrolled connector egress, then allow only the local Zammad sandbox endpoint during writeback acceptance.

## Storage Strategy

| Component | Storage target |
|---|---|
| PostgreSQL | PVC for canonical SupportPlane state. |
| Zammad | PVCs for application data plus chosen search/index dependency. |
| OpenBao | PVC or development storage backend for local sandbox secrets only. |
| MinIO | PVC for evidence artifacts. |
| NATS JetStream | PVC or ephemeral storage depending on Phase 6 durability test. |
| Mailpit | Optional persistence; acceptable to start ephemeral in Phase 2. |
| Observability | Local retention PVCs optional; production retention not claimed. |

## Secret Strategy

- Do not commit raw production secrets.
- Use local dev placeholders only.
- Kubernetes Secret is acceptable for non-production bootstrap placeholders but is not sufficient for production-grade secret management.
- Future OpenBao resolver is the target for server-side credential resolution.
- Resolved secrets must never appear in API responses, screenshots, evidence bundles, browser local storage, logs, or PostgreSQL config.

## Safety Strategy

- Real writeback disabled by default.
- Kill switch remains effective and should default to blocking real writeback until explicit sandbox phase acceptance.
- Tenant boundary and RBAC must be preserved in every cluster-deployed path.
- No uncontrolled real network egress for writeback until gates pass.
- Zammad writeback target is sandbox-only internal notes, not public replies or production tickets.

## Acceptance Gates: Cluster Exists

- Local Kubernetes cluster named `supportplane-local` starts on Podman.
- `kubectl cluster-info` and `kubectl get nodes` succeed.
- Namespaces exist: `supportplane-app`, `supportplane-data`, `supportplane-integrations`, `supportplane-observability`.
- Local image build/load strategy is documented and works for one SupportPlane image.
- PostgreSQL deploys with PVC and restarts without data loss.
- SupportPlane API/Web/Worker deploy and report health from inside the cluster.
- Browser proof shows SupportPlane Web reachable from localhost with runtime identity labels.

## Acceptance Gates: Real Sandbox E2E Works

- Zammad sandbox is healthy and contains deterministic demo customer/ticket data.
- SupportPlane reads customer/ticket data from real Zammad sandbox.
- Ollama generates a local draft and stores model/prompt/context metadata.
- Approval and delivery policy gates are enforced.
- Outbox item is queued durably and processed idempotently through NATS JetStream or the accepted bridge.
- Worker resolves Zammad credential server-side through OpenBao.
- Worker writes exactly one sandbox-only internal note to Zammad with a SupportPlane provenance/idempotency marker.
- MinIO stores JSON/Markdown evidence artifact with checksum.
- Mailpit captures optional local notification email without internet email.
- Viewer and cross-tenant denial paths are proven.
- Kill switch denial is proven.

## Non-Goals

- No production cluster.
- No cloud deployment.
- No production Zammad.
- No customer data.
- No compliance claim.
- No real telephony/PBX yet.
- No endpoint agent or remote desktop yet.
- No screen monitoring or OCR yet.
