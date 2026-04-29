# Kubernetes Service Catalog

**Backlog:** BL-102
**Status:** BL-104/BL-105 verified app workloads and PostgreSQL persistence. BL-106 verified self-hosted service topology. Observability remains planned for BL-114.

| Workload/service | Namespace | Kind | Container image source | Local/upstream | Ports | Env vars | Secrets/configmaps | PVCs | Health checks | Startup dependencies | Phase | Acceptance test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `supportplane-web` | `supportplane-app` | Deployment + Service | Local build `localhost/supportplane-web:local-k8s` | Local | 3200 | `NEXT_PUBLIC_API_BASE_URL=http://localhost:4210` | ConfigMap for API URL | None | HTTP `/` | API reachable for full UI | Phase 1 | Browser reaches Web via port-forward 3300:3200 and shows DEV/MOCK/local auth/postgres badges. |
| `supportplane-api` | `supportplane-app` | Deployment + Service | Local build `localhost/supportplane-api:local-k8s` | Local | 4110 | `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`, `DATABASE_URL` | Secret for local DB password; ConfigMap for mode | None | HTTP `/health` | PostgreSQL | Phase 1 | `/health` returns ok via port-forward 4210:4110 with cluster runtime identity. |
| `supportplane-worker` | `supportplane-app` | Deployment | Local build `localhost/supportplane-worker:local-k8s` | Local | None | `DATABASE_URL`, `SUPPORTPLANE_API_URL`, future `NATS_URL`, `OPENBAO_ADDR` | Secret/ConfigMap TBD | None | Log-based readiness (no HTTP endpoint yet) | PostgreSQL; later NATS/OpenBao | Phase 1/6 | Worker logs show `mode: mock`, `queueBackend: postgres-local-outbox`. |
| `postgres` | `supportplane-data` | StatefulSet + Service | Upstream `docker.io/postgres:16-alpine` | Upstream | 5432 | `POSTGRES_DB`, `POSTGRES_USER` | Secret for local password | `postgres-data` | `pg_isready` | None | Phase 1 | Prisma migrate/seed works against cluster DB; data survives pod restart. |
| `zammad` | `supportplane-integrations` | StatefulSet + Service | Upstream `zammad/zammad:6.4.1-1` | Upstream | 3000 | `RAILS_ENV=production`, `ELASTICSEARCH_ENABLED=false`, `REDIS_URL`, `POSTGRESQL_*` | Secret for DB password; ConfigMap for app config | `zammad-storage` | HTTP `/` | Zammad PostgreSQL, Zammad Redis | Phase 2/3 | HTTP 200 reachable via port-forward 8080:3000; init completed with migrations/seed. |
| `zammad-postgres` | `supportplane-integrations` | StatefulSet + Service | Upstream `postgres:16-alpine` | Upstream | 5432 | `POSTGRES_DB=zammad`, `POSTGRES_USER=zammad` | Secret for local password | `zammad-postgres-data` | `pg_isready` | None | Phase 2 | Zammad database initialized and accepting connections. |
| `zammad-redis` | `supportplane-integrations` | Deployment + Service | Upstream `redis:7-alpine` | Upstream | 6379 | None | None | None | `redis-cli ping` | None | Phase 2 | Redis responds to ping; used by Zammad ActionCable. |
| `ollama` | Host-controlled | Host service | Host binary `ollama` version 0.18.2 | Host | 11434 | None | None | None | `ollama list` | GPU/CPU host capability | Phase 2/4 | Local draft generated; no cloud AI call. Host has AMD GPU. |
| `openbao` | `supportplane-integrations` | Deployment + Service | Upstream `openbao/openbao:2.2.0` | Upstream | 8200 | `BAO_ADDR=http://0.0.0.0:8200` | Secret for local dev root token placeholder | `openbao-data` | HTTP `/v1/sys/health` | None | Phase 2/5 | Health returns `initialized: true, sealed: false, version: 2.2.0`. |
| `nats` | `supportplane-integrations` | StatefulSet + Service | Upstream `nats:2.10.24-alpine` | Upstream | 4222, 8222 | JetStream enabled via ConfigMap | ConfigMap `nats-config` | `nats-jetstream-data` | HTTP `/healthz` on monitor port | None | Phase 2/6 | Durable stream `TEST_STREAM` and consumer `TEST_CONSUMER` created; message pub/consume verified. |
| `mailpit` | `supportplane-integrations` | Deployment + Service | Upstream `axllent/mailpit:v1.21` | Upstream | 1025, 8025 | None | None | None | HTTP `/api/v1/messages` on web port | None | Phase 2/9 | Captures local SMTP message; no internet email sent. Web UI shows captured messages. |
| `minio` | `supportplane-data` | Deployment + Service | Upstream `minio/minio:RELEASE.2025-04-22T22-12-26Z` | Upstream | 9000, 9001 | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Secret for local access key/secret placeholder | `minio-data` | `/minio/health/live`, `/minio/health/ready` | None | Phase 2/8 | Bucket `bl106-bucket` and object `topology-proof.txt` created and retrieved. |
| `otel-collector` | `supportplane-observability` | Deployment | Upstream collector image TBD | Upstream | 4317, 4318 | Collector pipeline config | ConfigMap | None | Collector health endpoint TBD | Loki/Prometheus optional | Phase 10 | Receives basic API/worker traces or logs with correlation ID. |
| `grafana` | `supportplane-observability` | Deployment + Service | Upstream Grafana image TBD | Upstream | 3000 mapped locally to 3001 | Datasource config | Local admin password placeholder | Optional dashboard PVC | HTTP `/api/health` | Loki/Prometheus | Phase 10 | Dashboard shows service health/log/metric source. |
| `loki` | `supportplane-observability` | StatefulSet/Deployment | Upstream Loki image TBD | Upstream | 3100 | Loki config | ConfigMap | Optional log storage PVC | `/ready` | None | Phase 10 | Logs query by correlation ID. |
| `prometheus` | `supportplane-observability` | StatefulSet/Deployment | Upstream Prometheus image TBD | Upstream | 9090 | Scrape config | ConfigMap | Optional metrics PVC | `/-/ready` | App metrics endpoints TBD | Phase 10 | Scrapes API/worker metrics. |

## Notes

- Exact image names and versions are pinned where deployed; observability images remain TBD for BL-114.
- BL-103 selected Kind with the Podman provider for the local foundation using `kindest/node:v1.31.4`.
- BL-103 proved local image loading by building a Podman smoke image, saving it to an archive, and loading it with `kind load image-archive`; direct `kind load docker-image` did not see the rootless Podman image.
- BL-104/BL-105 committed manifests deploy API, Web, Worker, and PostgreSQL into the cluster.
- BL-106 committed manifests deploy OpenBao, NATS JetStream, Mailpit, MinIO, and Zammad into the cluster.
- Ollama is host-controlled, not in-cluster, due to AMD GPU availability and Kind/Podman GPU pass-through complexity.
