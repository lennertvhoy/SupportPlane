# Local Development Runbook

**Product:** SupportPlane  
**Scope:** Local Podman/Docker-compatible development topology and local auth
**Last updated:** 2026-04-28

## Prerequisites

- Node.js >= 22.0.0
- npm (with workspace support)
- Podman >= 5.0 (tested) **or** Docker Compose (expected compatible)
- curl (for health checks)
- Optional: `psql` (for direct Postgres access) or `nc` (for port checks)

> **Tested path:** Podman 5.8.2 with podman-compose 1.5.0 on Fedora Linux 43.  
> Docker Compose is expected to work with the same `compose.yaml` but has not been directly verified in this slice.

## Container/runtime strategy

**Infra containers verified + host-run apps documented.**

- PostgreSQL, NATS, and MinIO run in containers via `compose.yaml`.
- The API (NestJS) and Web (Next.js) run on the host via `npm run dev`.
- BL-093 adds a host-run local worker/process-once command that calls the API and uses PostgreSQL outbox state. The compose worker container may still be a placeholder; NATS is not consumed by BL-093.

## Port map

| Service        | Host Port | Container Port | Notes                                    |
|----------------|-----------|----------------|------------------------------------------|
| API (host)     | 4110      | —              | NestJS dev server                        |
| Web (host)     | 3200      | —              | Next.js dev server                       |
| PostgreSQL     | 5434      | 5432           | Mapped to 5434 to avoid host conflicts   |
| NATS client    | 4222      | 4222           | Messaging/queue                          |
| NATS HTTP mon  | 8222      | 8222           | Health and monitoring endpoint           |
| MinIO API      | 9000      | 9000           | S3-compatible object storage API         |
| MinIO Console  | 9001      | 9001           | Web-based MinIO admin UI                 |

## Environment setup

Copy the example environment file and edit if needed:

```bash
cp .env.example .env
```

The defaults in `.env.example` match the compose ports and credentials.

## Start local topology

### 1. Start infrastructure containers

Using Podman:

```bash
podman compose -f infra/docker-compose/compose.yaml up -d
```

Using Docker (expected compatible, not directly verified):

```bash
docker compose -f infra/docker-compose/compose.yaml up -d
```

### 2. Verify infrastructure

```bash
bash scripts/check_local_topology.sh
```

Expected output:
- PostgreSQL port 5434 listening and accepting connections
- NATS ports 4222 and 8222 listening, health endpoint returns HTTP 200
- MinIO ports 9000 and 9001 listening, health endpoint returns HTTP 200

### 3. Start API (host)

```bash
cd apps/api
npm run dev
```

For PostgreSQL/local-auth MVP mode:

```bash
API_PORT=4110 \
SUPPORTPLANE_STORE=postgres \
SUPPORTPLANE_AUTH_MODE=local \
DATABASE_URL="postgresql://supportplane:supportplane_dev@localhost:5434/supportplane?schema=public" \
npm run dev
```

The API listens on `http://localhost:4110`.

### 4. Start Web (host)

In a new terminal:

```bash
cd apps/web
npm run dev
```

The web app listens on `http://localhost:3200` by default.

### 5. Optional local worker commands

The worker is local/mock-only and API-driven:

```bash
npm run status --workspace @supportplane/worker
npm run process-once --workspace @supportplane/worker
```

It reports `queueBackend: "postgres-local-outbox"` and does not use NATS or any
external broker.

### 6. Full verification

With all services running:

```bash
bash scripts/check_local_topology.sh
bash scripts/verify_outbox_worker_retry_deadletter.sh
```

## Stop local topology

### Stop host-run apps

Press `Ctrl+C` in the API and Web terminal sessions.

### Stop infrastructure containers

Using Podman:

```bash
podman compose -f infra/docker-compose/compose.yaml down
```

To also remove named volumes (destructive):

```bash
podman compose -f infra/docker-compose/compose.yaml down -v
```

## Health checks

| Service     | Check method                                           |
|-------------|--------------------------------------------------------|
| PostgreSQL  | `pg_isready` via compose healthcheck; or `psql`        |
| NATS        | `wget http://localhost:8222/healthz`                   |
| MinIO       | `curl http://localhost:9000/minio/health/live`         |
| API         | `curl http://localhost:4110/health`                    |
| Web         | `curl http://localhost:3200/`                          |

## Known limitations

- **Persistence mode:** The API supports both `memory` (default) and `postgres` stores via `SUPPORTPLANE_STORE` env var. PostgreSQL persistence requires `SUPPORTPLANE_STORE=postgres` and `DATABASE_URL` pointing to the local PostgreSQL container (default port 5434). Run `npx prisma migrate deploy` and `npx prisma db seed` before first use in postgres mode.
- **Auth mode:** `SUPPORTPLANE_AUTH_MODE=local` requires seeded local login/session behavior. `SUPPORTPLANE_AUTH_MODE=dev` preserves old dev-only mock identity headers for tests and legacy dev flows.
- **No production authentication:** Local auth is not SSO/OAuth/SAML/OIDC and has no MFA, password reset, rate limiting, or production password policy claims.
- **No real AI provider:** The AI gateway uses deterministic mock output.
- **No real ticketing integration:** `MockTicketingAdapter` returns fixture data.
- **Zammad connector is mock-only by default:** Set `ZAMMAD_CONNECTOR_MODE=zammad`, `ZAMMAD_BASE_URL`, and `ZAMMAD_API_TOKEN` to enable real integration. See `docs/ZAMMAD_CONNECTOR.md`.
- **No worker runtime:** The worker container is a placeholder that sleeps; no background job processing exists yet.
- **No production deployment claims:** This topology is for local development only.

## Local auth seed users

Run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Seeded local-only password:

```text
supportplane-demo
```

Seeded users:

| Tenant slug | Email | Role |
|-------------|-------|------|
| `dev-tenant` | `admin@supportplane.local` | `admin` |
| `dev-tenant` | `operator@supportplane.local` | `operator` |
| `dev-tenant` | `viewer@supportplane.local` | `viewer` |
| `alt-tenant` | `admin@alt.supportplane.local` | `admin` |
| `alt-tenant` | `operator@alt.supportplane.local` | `operator` |

Use `scripts/verify_local_auth_rbac.sh` with API running in local auth mode to verify login/logout, RBAC denial, tenant-boundary denial, forged-header resistance, and no auth secret leakage in evidence output.

Use `scripts/verify_durable_action_outbox.sh` with API/Web running in
PostgreSQL + local-auth mode to verify BL-092 action creation, review, approval,
queueing, mock delivery, audit/timeline/evidence output, forged-header
resistance, cross-tenant denial, and no secret leakage.

## Docker vs Podman notes

- The `compose.yaml` avoids Docker-specific extensions and uses standard `healthcheck` blocks.
- `restart: unless-stopped` is used for infra services; `restart: "no"` is used for the worker placeholder to avoid restart loops.
- Podman runs rootless by default on Fedora; volume permissions should be handled automatically by the container images used.
- If you use Docker and encounter volume permission issues with PostgreSQL, ensure the `postgres_data` volume is writable by the container user.

## Troubleshooting

- **Port conflicts:** If 5434, 4222, 8222, 9000, or 9001 are already in use, edit `infra/docker-compose/compose.yaml` and `.env` to use different ports, then update `DATABASE_URL` and `NATS_URL` accordingly.
- **API or Web fail to start:** Ensure `npm install` was run at the repo root and that `npm run typecheck --workspaces --if-present` passes.
- **Health script fails on PostgreSQL:** Install `postgresql` client tools or ensure `nc` is available for basic port checks.
