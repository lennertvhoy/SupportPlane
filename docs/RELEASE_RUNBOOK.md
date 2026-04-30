# Release Runbook

**Backlog:** BL-090  
**Scope:** Local sandbox release packaging and deployment  
**Last updated:** 2026-04-30

---

> ⚠️ **NON-PRODUCTION WARNING**  
> This runbook is for local sandbox packaging and deployment only. It is not approved for production environments, customer data, or public-facing infrastructure.

---

## Pre-Release Checklist

Before building and deploying a release, verify the following:

- [ ] Git working tree is clean (`git status --short` returns empty)
- [ ] You are on the intended branch (`git branch --show-current`)
- [ ] All acceptance freezes for the target slice are documented in `docs/ACCEPTANCE_FREEZES.md`
- [ ] `scripts/build_and_load_local_k8s_images.sh` has been tested in this environment
- [ ] `infra/kubernetes/local-podman/` manifests apply cleanly with `kubectl apply -k`
- [ ] Local cluster `kind-supportplane-local` exists and is healthy
- [ ] `.env` values match the local sandbox topology
- [ ] No uncommitted secrets in manifests or ConfigMaps

---

## Image Build and Load Instructions

Build SupportPlane API, Web, and Worker images and load them into the local Kind cluster:

```bash
bash scripts/build_and_load_local_k8s_images.sh
```

Expected behavior:
- Podman builds three images tagged `localhost/supportplane-{api,web,worker}:local-k8s`
- Archives are saved to a temporary directory
- `kind load image-archive` pushes each archive into the cluster node
- `crictl images` on the control-plane node shows the loaded images

If the script fails:
- Verify Podman is running and the Kind cluster exists
- Check that `Containerfile.local` files exist in `apps/api/`, `apps/web/`, and `apps/worker/`

---

## Kubernetes Apply Instructions

Apply the full local sandbox manifest set:

```bash
kubectl apply -k infra/kubernetes/local-podman
```

Expected output:
- Four namespaces created: `supportplane-app`, `supportplane-data`, `supportplane-integrations`, `supportplane-observability`
- StatefulSets, Deployments, Services, ConfigMaps, Secrets, and PVCs created in each namespace
- No errors in `kubectl get events --all-namespaces`

To re-apply after manifest changes:

```bash
kubectl apply -k infra/kubernetes/local-podman
kubectl rollout restart deployment -n supportplane-app
```

---

## Port-Forward Instructions

After applying manifests, forward ports to access services from localhost:

```bash
# API
kubectl port-forward -n supportplane-app svc/supportplane-api 4210:4110 &

# Web
kubectl port-forward -n supportplane-app svc/supportplane-web 3300:3200 &

# Grafana
kubectl port-forward -n supportplane-observability svc/grafana 3301:3000 &

# Prometheus
kubectl port-forward -n supportplane-observability svc/prometheus 9090:9090 &
```

> **Note:** Zammad, MinIO, Mailpit, OpenBao, NATS, and PostgreSQL are accessed cluster-internally. Port-forward them only when debugging.

---

## Health Checks for Each Service

| Service | Check Command | Expected Result |
|---------|---------------|-----------------|
| API | `curl -s http://localhost:4210/health \| jq .` | `status: ok`, `storeMode: postgres`, `authMode: local` |
| Web | `curl -s http://localhost:3300/ \| head -n 1` | HTTP 200, HTML `<!DOCTYPE html>` |
| PostgreSQL | `kubectl exec -n supportplane-data postgres-0 -- pg_isready -U supportplane` | `accepting connections` |
| MinIO | `curl -s http://localhost:9000/minio/health/ready` | HTTP 200 |
| NATS | `curl -s http://localhost:8222/healthz` | HTTP 200 |
| OpenBao | `curl -s http://localhost:8200/v1/sys/health` | HTTP 200 or 429 (unsealed) |
| Zammad | `curl -s http://localhost:3000/ \| head -n 1` | HTTP 200 (after ~60s startup) |
| Mailpit | `curl -s http://localhost:8025/api/v1/messages` | HTTP 200, JSON array |
| Grafana | `curl -s http://localhost:3301/api/health` | HTTP 200 |
| Worker | Check pod logs: `kubectl logs -n supportplane-app deployment/supportplane-worker` | No crash loops, NATS connection logs |

---

## Default Local Accounts

These accounts are seeded by `prisma/seed.ts` after running `npx prisma db seed` or the `postgres-seed` Job:

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Admin | `admin@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer | `viewer@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Alt Admin | `admin@alt.supportplane.local` | `supportplane-demo` | `alt-tenant` |

---

## Strict Non-Production Warning Banner

Every deployed manifest includes the label:

```yaml
supportplane.io/sandbox: local-podman
supportplane.io/non-production: "true"
```

The Web UI displays a persistent amber banner:

```
DEV / MOCK DATA
```

No release produced by this runbook should be deployed to production or exposed to customer data.

---

## Known Ports and Services Table

| Service | Namespace | Cluster DNS | Local Forward | Purpose |
|---------|-----------|-------------|---------------|---------|
| supportplane-api | supportplane-app | `supportplane-api.supportplane-app.svc.cluster.local:4110` | `localhost:4210` | API HTTP |
| supportplane-web | supportplane-app | `supportplane-web.supportplane-app.svc.cluster.local:3200` | `localhost:3300` | Web HTTP |
| supportplane-worker | supportplane-app | — | — | Background worker |
| postgres | supportplane-data | `postgres.supportplane-data.svc.cluster.local:5432` | — | Main PostgreSQL |
| minio | supportplane-data | `minio.supportplane-data.svc.cluster.local:9000` | `localhost:9000` | Object storage |
| openbao | supportplane-integrations | `openbao.supportplane-integrations.svc.cluster.local:8200` | — | Secret resolution |
| nats | supportplane-integrations | `nats.supportplane-integrations.svc.cluster.local:4222` | `localhost:4222` | Messaging |
| mailpit | supportplane-integrations | `mailpit.supportplane-integrations.svc.cluster.local:8025` | `localhost:8025` | SMTP capture |
| zammad | supportplane-integrations | `zammad.supportplane-integrations.svc.cluster.local:3000` | — | Ticketing sandbox |
| zammad-postgres | supportplane-integrations | `zammad-postgres.supportplane-integrations.svc.cluster.local:5432` | — | Zammad PostgreSQL |
| grafana | supportplane-observability | `grafana.supportplane-observability.svc.cluster.local:3000` | `localhost:3301` | Observability UI |
| prometheus | supportplane-observability | `prometheus.supportplane-observability.svc.cluster.local:9090` | `localhost:9090` | Metrics |

---

## Rollback Steps

If a deployment fails after a new image load:

1. **Revert image tag in manifests** (if you changed tags):
   ```bash
   git checkout -- infra/kubernetes/local-podman/
   ```

2. **Re-apply prior manifests**:
   ```bash
   kubectl apply -k infra/kubernetes/local-podman
   ```

3. **Roll back a specific deployment**:
   ```bash
   kubectl rollout undo deployment/supportplane-api -n supportplane-app
   kubectl rollout undo deployment/supportplane-web -n supportplane-app
   kubectl rollout undo deployment/supportplane-worker -n supportplane-app
   ```

4. **Verify rollback**:
   ```bash
   kubectl get pods -n supportplane-app
   curl -s http://localhost:4210/health | jq .
   ```

5. **Full teardown and re-deploy** (nuclear option):
   ```bash
   kubectl delete -k infra/kubernetes/local-podman
   kubectl apply -k infra/kubernetes/local-podman
   ```

> **Data preservation:** PostgreSQL and MinIO use PVCs. Deleting the kustomization will delete PVCs if the StatefulSet `volumeClaimTemplates` are not retained. To preserve data, scale down instead:
> ```bash
> kubectl scale deployment supportplane-api -n supportplane-app --replicas=0
> ```

---

## Post-Deploy Verifier Checklist

After deploying, run through these checks:

- [ ] `kubectl get pods --all-namespaces` shows all pods Running or Completed
- [ ] `curl http://localhost:4210/health` returns JSON with `status: ok`
- [ ] `curl http://localhost:3300/` returns HTML
- [ ] Log in as `admin@supportplane.local` / `supportplane-demo`
- [ ] Header shows `DEV / MOCK DATA` banner
- [ ] Create a support session and confirm it appears in the sidebar
- [ ] Load ticket `TICKET-101` and verify context populates
- [ ] Check Grafana at `http://localhost:3301` (login: `admin` / `supportplane-local`)
- [ ] Worker logs show no repeated crashes: `kubectl logs -n supportplane-app deployment/supportplane-worker --tail=50`
