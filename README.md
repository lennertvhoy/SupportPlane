# SupportPlane

SupportPlane is a governed AI support cockpit for IT teams and MSPs.

It is designed around one principle: the AI is helpful, but it is not the
authority. SupportPlane unifies tickets, calls, screen context, endpoint
diagnostics, remote support activity, and knowledge into governed
`SupportSession` workflows where policy, approvals, tool manifests, execution
gateways, and audit logs decide what is allowed.

## What This Repo Is (Local / Mock MVP)

This repository contains a **local-only, mock-data, development-grade MVP** that
demonstrates the core architecture and user experience. It is **not** production
software. Do not deploy it to production or use it with real customer data.

### What the MVP demonstrates

- **Support Cockpit UI** — Session list, ticket context, AI context quality, draft notes, audit trail, evidence bundles.
- **Tenant isolation & RBAC** — Local auth with admin/operator/viewer roles, server-side permission checks, cross-tenant denial.
- **Mock AI gateway** — Deterministic draft suggestions with visible model metadata and review-required gates.
- **Action / outbox workflow** — Create → submit → approve → queue → mock deliver, with durable PostgreSQL state and audit trail.
- **Delivery policy controls** — Kill switch, approval gates, mock-only enforcement, real network locked OFF.
- **Connector runtime boundary** — Config validation, runtime readiness, runtime resolver, credential reference metadata (no secret resolution).
- **Evidence bundles** — JSON and Markdown export with session summary, audit timeline, and honest mock disclaimers.
- **Call simulator** — Fake incoming call webhook, caller matching, call console lifecycle.

### What is intentionally not implemented

- **No real Zammad writeback** — All connector behavior is mock-only. See `docs/REAL_WRITEBACK_PATH_DESIGN.md` for the phased path to real writeback.
- **No real AI provider** — No OpenAI, Azure, or other model API calls. All AI output is deterministic mock text.
- **No real telephony / PBX** — Fake webhook simulation only. No voice, TTS, STT, or real phone integration.
- **No real screen capture** — Web-based mock metadata only. No Tauri app, no raw pixels, no OCR, no desktop monitoring.
- **No endpoint agent** — No Go agent, no device console, no remote diagnostics.
- **No production auth** — Local password auth only. No SSO, OAuth, SAML, OIDC, MFA, or password reset.
- **No production secrets management** — `secretRef` values are opaque placeholders. No Vault, KMS, or encrypted broker.
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

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Admin | `admin@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer | `viewer@supportplane.local` | `supportplane-demo` | `dev-tenant` |

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
  worker/              async jobs and evidence generation (local mock only)
packages/
  contracts/           Zod schemas and shared types
  policy/              Permission helpers
  connectors/          Ticketing adapter interface and mock adapter
  ai/                  Model gateway and mock provider
  audit/               Audit event types and integrity hash placeholder
  ui/                  Shared UI components
infra/
  docker-compose/      Podman-compatible compose file
  kubernetes/          Future K8s manifests (not implemented)
docs/
  MVP_COMPLETION_AUDIT.md   Current product truth and boundaries
  DEMO_GUIDE.md             Scripted demo walkthrough
  REAL_WRITEBACK_PATH_DESIGN.md   Design doc for future real writeback
  EVIDENCE_LOG.md           Proof ledger
  ACCEPTANCE_FREEZES.md     Accepted milestone ledger
scripts/
  reset_demo_data.sh        Deterministic demo database reset
  verify_*.sh               Feature-specific verification scripts
  health.js                 Runtime health check
  check_state_docs.py       Documentation hygiene gate
```

## Current Safety Boundary

- All connector runtime decisions return `realNetworkAllowed: false`.
- Delivery policy enforces `mockOnlyEnforced: true` and `allowRealNetworkCalls: false`.
- Config validation rejects `mockMode: false` and any secret-like or real-network fields.
- Credential references expose metadata only; `secretRef` is redacted to `[REDACTED]` in all API responses.
- Evidence bundles include mock/dev-only disclaimers and never include raw secrets.
- Viewer role is denied all mutation endpoints server-side with `403`.
- Cross-tenant access returns `404` for resources.

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
