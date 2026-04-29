# Local Podman Kubernetes Foundation

**Status:** BL-103 cluster foundation, BL-104/BL-105 app/PostgreSQL, BL-106 self-hosted service topology. This directory contains the complete local sandbox manifests.

The local sandbox cluster is named `supportplane-local` and uses Kind with the
Podman provider. BL-103 verified `kindest/node:v1.31.4` on this Fedora/Podman
host; the Kind v0.27.0 default `kindest/node:v1.32.2` started but left
`kube-proxy` crash-looping with `failed complete: too many open files`. All four namespaces are deployed along with their workloads:

- `supportplane-app`
- `supportplane-data`
- `supportplane-integrations`
- `supportplane-observability`

Apply the namespace foundation after the cluster exists:

```bash
bash scripts/check_local_k8s_prereqs.sh
bash scripts/create_local_k8s_cluster.sh
kubectl apply -k infra/kubernetes/local-podman
kubectl get namespaces
```

Current layout:

```text
infra/kubernetes/local-podman/
  README.md
  namespaces.yaml
  kustomization.yaml
  app/           # SupportPlane API, Web, Worker + ConfigMap/Secret
  postgres/      # PostgreSQL StatefulSet + Service + Secret + ConfigMap
  integrations/
    zammad/      # Zammad StatefulSet + Redis + dedicated PostgreSQL
    openbao/     # OpenBao Deployment + Service + Secret
    nats/        # NATS StatefulSet with JetStream + Service + ConfigMap
    mailpit/     # Mailpit Deployment + Service
    minio/       # MinIO Deployment + PVC + Service + Secret
  observability/ # Placeholder for future BL-114
```

Verification commands for BL-103:

```bash
kubectl config current-context
kubectl cluster-info
kubectl get nodes -o wide
kubectl get namespaces
kubectl get all -A
kubectl auth can-i get pods -A
KIND_EXPERIMENTAL_PROVIDER=podman kind get clusters
podman ps --format '{{.Names}} {{.Image}} {{.Status}}'
```

Local image strategy for Kind/Podman:

- Build local images with Podman: `bash scripts/build_and_load_local_k8s_images.sh`.
- Or manually: `podman build -f apps/api/Containerfile.local -t localhost/supportplane-api:local-k8s .`
- Save: `podman save -o /tmp/api.tar localhost/supportplane-api:local-k8s`
- Load: `KIND_EXPERIMENTAL_PROVIDER=podman kind load image-archive /tmp/api.tar --name supportplane-local`
- BL-103 proved this path with a smoke image. BL-104 proved it with API/Web/Worker images.

Deploy/verify runbook:

```bash
# 1. Verify cluster exists
bash scripts/check_local_k8s_prereqs.sh
bash scripts/create_local_k8s_cluster.sh

# 2. Apply all manifests (namespaces + postgres + app)
kubectl apply -k infra/kubernetes/local-podman

# 3. Build and load images
bash scripts/build_and_load_local_k8s_images.sh

# 4. Verify postgres
kubectl get pods -n supportplane-data
kubectl get pvc -n supportplane-data

# 5. Run Prisma migrate/seed against cluster DB
API_POD=$(kubectl get pods -n supportplane-app -l app.kubernetes.io/name=supportplane-api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n supportplane-app "$API_POD" -- sh -c "cd /app && npx prisma migrate deploy"
kubectl exec -n supportplane-app "$API_POD" -- sh -c "cd /app && DATABASE_URL=postgresql://supportplane:supportplane_dev@postgres.supportplane-data.svc.cluster.local:5432/supportplane npx prisma db seed"

# 6. Verify app pods
kubectl get pods -n supportplane-app

# 7. Port-forward for local access
kubectl -n supportplane-app port-forward svc/supportplane-api 4210:4110 &
kubectl -n supportplane-app port-forward svc/supportplane-web 3300:3200 &

# 8. Health checks
curl -s http://localhost:4210/health
curl -s http://localhost:3300/ | head
```

Verified BL-103/BL-104/BL-105 result:

- `supportplane-local` exists as a Kind cluster backed by a Podman container named `supportplane-local-control-plane`.
- `kubectl` context is `kind-supportplane-local`.
- The single control-plane node reported `Ready`.
- CoreDNS, kube-proxy, and local-path-provisioner reported running.
- The four namespaces in `namespaces.yaml` were applied and listed as `Active`.
- PostgreSQL StatefulSet `postgres` runs in `supportplane-data` with Bound PVC `postgres-data-postgres-0`.
- Prisma migrate (8 migrations) and seed succeeded against cluster PostgreSQL.
- SupportPlane API, Web, and Worker Deployments run in `supportplane-app`.
- Local images `localhost/supportplane-api:local-k8s`, `localhost/supportplane-web:local-k8s`, `localhost/supportplane-worker:local-k8s` are built and loaded.
- API health verified via `localhost:4210/health`.
- Web UI verified via `localhost:3300` with DEV/MOCK DATA/local auth/postgres badges.
- Worker logs show `mode: mock`, `queueBackend: postgres-local-outbox`.
- Existing local/mock MVP on `localhost:4110` and `localhost:3200` still works.

Non-claims:

- These manifests deploy local sandbox images only, not production-grade builds.
- These manifests do not deploy Zammad, Ollama, OpenBao, NATS, Mailpit, MinIO, or observability.
- No real Zammad writeback, real secrets, real AI provider, or production deployment is enabled.
- This is a local sandbox foundation only, not a production cluster.
