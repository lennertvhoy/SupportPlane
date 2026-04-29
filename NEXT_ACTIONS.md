# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-04-29 16:30 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

### P1 [BL-103] Local Kubernetes/Podman cluster foundation

- Owner: next coding-agent session.
- Next action: verify Kind/Podman vs Minikube/Podman on this host and create the first non-production `supportplane-local` cluster proof.
- Exit criteria: cluster starts on Podman, namespaces exist, local image strategy is proven or explicitly rejected, and no real integration/writeback is enabled.

### P2 [BL-104] SupportPlane API/Web/Worker manifests

- Owner: next coding-agent session after BL-103.
- Next action: add app manifests or kustomize/Helm structure for API, Web, and Worker using local image tags.
- Exit criteria: Web/API/Worker health is proven in cluster and the Web UI still shows local/mock runtime identity.

### P3 [BL-105] PostgreSQL Kubernetes persistence foundation

- Owner: next coding-agent session after BL-103.
- Next action: deploy PostgreSQL with PVC and prove Prisma migrate/generate/seed plus restart survival.
- Exit criteria: SupportPlane can use cluster PostgreSQL without losing demo data after pod restart.

### P4 [BL-106] Self-hosted service topology

- Owner: next coding-agent session after cluster foundation.
- Next action: add Zammad/OpenBao/NATS JetStream/Mailpit/MinIO topology and decide whether Ollama runs in-cluster or as controlled host service.
- Exit criteria: services are healthy as sandbox dependencies, with no SupportPlane real integration claim yet.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
