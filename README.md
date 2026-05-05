# SupportPlane

SupportPlane is a governed AI support cockpit for IT teams and MSPs.

It is designed around one principle: the AI is helpful, but it is not the
authority. SupportPlane unifies tickets, calls, screen context, endpoint
diagnostics, remote support activity, and knowledge into governed
`SupportSession` workflows where policy, approvals, tool manifests, execution
gateways, and audit logs decide what is allowed.

## Project Status: Real Self-Hosted Sandbox Accepted (BL-116)

The current repo has an **accepted real self-hosted sandbox** running on a local
Kubernetes-on-Podman cluster (BL-116 accepted). It demonstrates: Zammad sandbox
read/writeback, Ollama local AI, OpenBao credential resolution, NATS JetStream
worker bridge, MinIO evidence persistence, Mailpit notification capture,
observability baseline, and policy/audit/evidence governance. The local/mock MVP
still runs standalone without the cluster.

It is not production software and has no production deployment, production auth,
production Zammad writeback, cloud AI, internet email, production telephony,
production endpoint remediation, screen monitoring, production secrets, or
compliance claim.

The next major goal is expanding the self-hosted sandbox and hardening
partial/connector/Windows items toward broader acceptance.

Roadmap references:

- [Self-Hosted Stack](docs/SELF_HOSTED_STACK.md)
- [Local Kubernetes Podman Target](docs/LOCAL_KUBERNETES_PODMAN_TARGET.md)
- [Real E2E Sandbox Flow](docs/REAL_E2E_SANDBOX_FLOW.md)
- [Kubernetes Service Catalog](docs/KUBERNETES_SERVICE_CATALOG.md)
- [Sandbox Integration Acceptance](docs/SANDBOX_INTEGRATION_ACCEPTANCE.md)
- [Implementation Phases for Real E2E Sandbox](docs/IMPLEMENTATION_PHASES_REAL_E2E.md)
- [Backlog Real E2E Roadmap](docs/BACKLOG_REAL_E2E_ROADMAP.md)
- [Workflow Truth](docs/WORKFLOW_TRUTH.md)
- [Boundary Matrix](docs/BOUNDARY_MATRIX.md)
- [Real Writeback Path Design](docs/REAL_WRITEBACK_PATH_DESIGN.md)
- [Demo Guide](docs/DEMO_GUIDE.md)
- [MVP Completion Audit](docs/MVP_COMPLETION_AUDIT.md)

## What This Repo Is (Real Sandbox + Local MVP)

This repository contains a **real self-hosted sandbox** (accepted BL-116) running
on a local Kubernetes-on-Podman cluster, plus a standalone **local-only,
mock-data, development-grade MVP** that runs without the cluster. Neither is
production software. Do not deploy to production or use with real customer data.

### What the sandbox demonstrates (cluster)

- **Real Zammad sandbox read + writeback** — Reads real tickets/customers; approval-gated internal-note writeback to sandbox Zammad (BL-107, BL-111).
- **Local Ollama AI** — Real model calls to host-controlled Ollama with gemma4:e4b, no cloud fallback (BL-108, BL-121).
- **OpenBao credential resolution** — Server-side secret resolution for Zammad token, no raw secret in API/UI (BL-109).
- **NATS JetStream worker bridge** — Durable outbox consumer with PostgreSQL as canonical truth (BL-110).
- **MinIO evidence artifacts** — JSON/Markdown bundles persisted with SHA-256 checksum (BL-112).
- **Mailpit notification capture** — Local SMTP capture for writeback notifications (BL-113).
- **Observability** — Correlation IDs, Prometheus metrics, Grafana/Loki ready (BL-114).
- **Local Asterisk AMI bridge** — Call events from real Asterisk 22.8.2 sandbox (BL-117).
- **Network egress safety** — Deny-by-default, sandbox-only allowlist, kill switch (BL-115).

### What the local MVP demonstrates (standalone)

- **Support Cockpit UI** — Session list, ticket context, AI context quality, draft notes, audit trail, evidence bundles.
- **Tenant isolation & RBAC** — Local auth with admin/operator/viewer roles, server-side permission checks, cross-tenant denial.
- **Mock AI gateway** — Deterministic draft suggestions with visible model metadata and review-required gates (mock in standalone mode; real Ollama AI available in cluster mode).
- **Action / outbox workflow** — Create → submit → approve → queue → mock deliver, with durable PostgreSQL state and audit trail.
- **Delivery policy controls** — Kill switch, approval gates, mock-only enforcement, real network locked OFF.
- **Connector runtime boundary** — Config validation, runtime readiness, runtime resolver, credential reference metadata (no secret resolution).
- **Evidence bundles** — JSON and Markdown export with session summary, audit timeline, and honest mock disclaimers.
- **Call simulator** — Fake incoming call webhook, caller matching, call console lifecycle.
- **Endpoint diagnostics foundation** — Local outbound-only endpoint agent, heartbeat/inventory, fixed read-only diagnostics, Device Console, and audit trail. No arbitrary shell. Low-risk remediation (flush DNS) is partial (BL-065).

### What is intentionally not implemented

- **No production Zammad writeback** — Sandbox internal-note writeback is accepted (BL-111). No public replies or production writeback.
- **No cloud AI provider** — Local Ollama AI is accepted (BL-108/BL-121). No OpenAI, Azure, or other cloud model API calls.
- **No production telephony / PBX** — Local Asterisk AMI bridge is accepted (BL-117). No PSTN, SIP trunk, recording, or transcription.
- **No real screen capture** — Web-based mock metadata only. No Tauri app, no raw pixels, no OCR, no desktop monitoring.
- **No production endpoint remediation** — Low-risk flush-DNS is partial (BL-065). No arbitrary shell, service restart, remote desktop, or production remediation.
- **No production auth** — Local password auth and Keycloak OIDC login accepted (BL-083). No SSO, SAML, MFA enforcement, or password reset.
- **No production secrets management** — OpenBao local sandbox resolver accepted (BL-109). No production Vault, KMS, or encrypted broker.
- **No compliance certification** — Not SOC 2, ISO 27001, or GDPR compliant.

## How to Run It Locally

### Prerequisites

- Node.js >= 22
- Podman (or Docker) with Compose support
- PostgreSQL client tools (optional, for manual inspection)

### 1. Start infrastructure

```bash
podman compose -f infra/docker-compose/compose.yaml up -d
```

This starts PostgreSQL (port 5434), NATS (4222), and MinIO (9000).

### 2. Reset to deterministic demo state

```bash
bash scripts/reset_demo_data.sh --force
```

This recreates the local database from committed migrations and seeds demo
tenants, users, connector installations, credential references, delivery
policies, and ticket fixtures. It refuses to run against non-local databases.

### 3. Start the API

```bash
cd apps/api
SUPPORTPLANE_STORE=postgres SUPPORTPLANE_AUTH_MODE=local npm run dev
```

### 4. Start the Web app

```bash
cd apps/web
NEXT_PUBLIC_API_BASE_URL=http://localhost:4110 npm run dev
```

### 5. Open the cockpit

Navigate to `http://localhost:3200` and log in with one of the demo accounts:

| Role     | Email                         | Password            | Tenant       |
| -------- | ----------------------------- | ------------------- | ------------ |
| Admin    | `admin@supportplane.local`    | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer   | `viewer@supportplane.local`   | `supportplane-demo` | `dev-tenant` |

### 6. Start the local endpoint agent

With the API running, start the outbound-only read-only endpoint agent:

```bash
SUPPORTPLANE_API_URL=http://localhost:4110 \
SUPPORTPLANE_ENDPOINT_TENANT_ID=dev-tenant \
SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN=local-endpoint-enrollment-token \
npm run dev --workspace @supportplane/endpoint-agent
```

Open `http://localhost:3200/device-console` as an operator or admin to see the
registered endpoint, heartbeat, inventory, and fixed read-only diagnostic
commands. Viewer can inspect devices but cannot request diagnostics.

## How to Run Tests

```bash
# All workspace tests
npm run test --workspaces --if-present

# API integration tests
cd apps/api && npm test

# Contracts tests
npm test --workspace @supportplane/contracts

# Web client tests
npm test --workspace @supportplane/web
```

## How to Run the Demo Reset

```bash
bash scripts/reset_demo_data.sh --force
```

Or with an environment variable:

```bash
SUPPORTPLANE_DEMO_RESET=allow bash scripts/reset_demo_data.sh
```

## Project Structure

```text
apps/
  web/                 Next.js support cockpit
  api/                 NestJS API
  worker/              async jobs and evidence generation (NATS JetStream bridge accepted)
packages/
  contracts/           Zod schemas and shared types
  policy/              Permission helpers
  connectors/          Ticketing adapter interface, mock adapter, and Zammad sandbox adapter
  ai/                  Model gateway, mock provider, and Ollama local provider
  audit/               Audit event types and integrity hash placeholder
  ui/                  Shared UI components
infra/
  docker-compose/      Podman-compatible compose file
  kubernetes/          Local Podman/Kubernetes manifests (BL-103 through BL-114 accepted)
docs/
  README.md                 Documentation index
  DOC_STANDARD.md           Documentation standard and update triggers
  MVP_COMPLETION_AUDIT.md   Current product truth and boundaries
  DEMO_GUIDE.md             Scripted demo walkthrough
  REAL_WRITEBACK_PATH_DESIGN.md   Design doc for future real writeback
  EVIDENCE_LOG.md           Proof ledger
  ACCEPTANCE_FREEZES.md     Accepted milestone ledger
scripts/
  reset_demo_data.sh        Deterministic demo database reset
  create_local_k8s_cluster.sh   BL-103 Kind/Podman local cluster helper
  check_local_k8s_prereqs.sh    Read-only local Kubernetes prerequisite check
  verify_*.sh               Feature-specific verification scripts
  health.js                 Runtime health check
  check_state_docs.py       State documentation hygiene gate
  check_docs_hygiene.py     Docs index and freshness hygiene gate
```

## Current Safety Boundary

- Connector runtime decisions default to `realNetworkAllowed: false` except for explicit sandbox Zammad allowlist (BL-115).
- Delivery policy enforces `mockOnlyEnforced: true` for local MVP; sandbox writeback requires explicit enablement and policy gates.
- Config validation rejects `mockMode: false` and any secret-like or real-network fields unless sandbox-enabled.
- Credential references expose metadata only; `secretRef` is redacted to `[REDACTED]` in all API responses.
- Evidence bundles include sandbox/local disclaimers and never include raw secrets.
- Viewer role is denied all mutation endpoints server-side with `403`.
- Cross-tenant access returns `404` for resources.
- Network egress deny-by-default; sandbox-only allowlist enforced (BL-115).

## Evidence and Documentation

- `docs/EVIDENCE_LOG.md` — Structured ledger of browser and API proof artifacts.
- `docs/ACCEPTANCE_FREEZES.md` — Accepted milestones with regression guards.
- `output/playwright/` — Canonical screenshot folders per backlog item (max 20 per item).

## Development Workflow

Read order for coding sessions:

1. `AGENTS.md`
2. `STATUS.md`
3. `PROJECT_STATE.yaml`
4. `PROJECT_DNA.yaml`
5. `NEXT_ACTIONS.md`

Use `BACKLOG.md` for roadmap IDs and `WORKLOG.md` for completed work history.

Run documentation hygiene checks after state/doc changes:

```bash
python3 scripts/check_state_docs.py
```

## License

See `LICENSE`.
