# SupportPlane Enterprise Demo Guide

**Purpose:** Hands-on walkthrough for enterprise reviewers to evaluate the
governed AI support cockpit across both standalone local and full sandbox
cluster runtimes.

**Current-truth scope:** This guide covers all features accepted through
BL-136 (Session 132, 2026-05-03) and BL-069 (Session 142, 2026-05-03). Scenarios A (Zammad sandbox ticket read),
B (Ollama AI draft), and C (Governance/Audit/RBAC with viewer 403 denial) are verified with fresh browser/computer-use evidence.
GLPI connector is now accepted real sandbox (BL-069). Runtime HEAD matches commit HEAD (94c961). Scenario D (Windows endpoint) remains unverified.
All scenarios reference real code paths, never fabricated claims.

**Non-claims:** This guide does not demonstrate production writeback,
production AI providers, production telephony, production secrets management,
compliance certification, or real Windows endpoint execution. See
[Non-Claims](#non-claims) below for the full list.

**Last updated:** 2026-05-03 (Session 144, BL-137 accepted)

---

## Quick Demo Start (One Command)

The fastest way to start the full demo stack:

```bash
bash scripts/start_demo_mode.sh
```

This verifies the K8s cluster, starts API (port 4210) and Web (port 3300)
port-forwards, seeds OpenBao credentials, configures GLPI sandbox, and prints
exact demo URLs. Then run:

```bash
bash scripts/verify_user_testing_demo.sh
```

To verify 10/10 demo readiness checks pass.

---

## Pre-reading for Reviewers

Before evaluating the demo, reviewers should understand the product's
architecture and its current capability boundaries:

| Document | Why read it |
|----------|-------------|
| `docs/ARCHITECTURE.md` | Product architecture, authority chain (roles → policy → tool manifest → risk → approval → audit → execution), and what the AI may and must not do. |
| `docs/BOUNDARY_MATRIX.md` | Capability-by-capability truth table: real, mock, sandbox, partial, blocked. Every integration mapped. |
| `docs/WORKFLOW_TRUTH.md` | Current implementation truth for every capability, with acceptance status and known gaps. |
| `docs/REALITY_MATRIX.md` | Detailed system-by-system status: REAL_LOCAL_NOW, SANDBOX_CODE_READY, MOCK_BY_POLICY, MOCK_BY_GAP, PARTIAL. |
| `docs/BACKLOG_REAL_E2E_ROADMAP.md` | How current backlog items map to the full self-hosted sandbox vision. |
| `docs/SANDBOX_INTEGRATION_ACCEPTANCE.md` | Acceptance gates and evidence requirements for every sandbox integration. |

These documents are the canonical source of truth for what is real, what is
mock, and what is intentionally blocked.

---

## Runtime Options

SupportPlane has two operational modes. Pick the one that best demonstrates
the capabilities relevant to your review.

### Path A: Standalone Local MVP (runs NOW)

The fastest path. Requires only Podman (or Docker) and Node.js. All services
run on the host machine. No Kubernetes required.

**Quick start:**

```bash
# 1. Install dependencies
npm install

# 2. Build all workspaces
npm run build

# 3. Start infrastructure containers (PostgreSQL, NATS, MinIO)
podman compose -f infra/docker-compose/compose.yaml up -d

# 4. Reset database to deterministic demo state
bash scripts/reset_demo_data.sh --force

# 5. Start API (terminal 1)
cd apps/api
API_PORT=4110 \
SUPPORTPLANE_STORE=postgres \
SUPPORTPLANE_AUTH_MODE=local \
DATABASE_URL="postgresql://supportplane:supportplane_dev@localhost:5434/supportplane?schema=public" \
npm run dev

# 6. Start Web (terminal 2)
cd apps/web
NEXT_PUBLIC_API_BASE_URL=http://localhost:4110 npm run dev

# 7. Open http://localhost:3200
```

**What is real in Path A:**

| Real | Status |
|------|--------|
| PostgreSQL persistence | Full ORM, 60+ tables, Prisma migrations and seed |
| API runtime (NestJS) | Serves on localhost:4110; `/health` matches git HEAD |
| Web UI (Next.js 15) | Serves on localhost:3200; full Support Cockpit |
| RBAC and tenant scoping | CurrentIdentityMiddleware; admin/operator/viewer; cross-tenant denial |
| Audit events | Persisted to PostgreSQL; all operations emit audit entries |
| Redaction | Multi-layer: AI context, evidence bundles, telemetry, action errors |
| Policy engine | Delivery policy evaluator; kill switch, approval gates, action allowlist |
| Tool execution registry | 8 tools with integrity-validated manifests; idempotent upsert |
| Tool execution safety | Arbitrary shell blocked; fixed command templates only; audit events |
| Admin dashboard | `/admin` route; Policies, Users, Roles, Model Usage, Audit Explorer, GDPR, Connectors |
| Endpoint agent (Linux) | Outbound registration, heartbeat, inventory, read-only diagnostics |

**What is mock in Path A:**

| Mock | Reason |
|------|--------|
| AI providers | Mock provider is default. Ollama not configured locally (requires `OLLAMA_BASE_URL`). Honest `fallbackUsed` flag when mock path is used. |
| Connectors | Zammad, GLPI, osTicket, MeshCentral, Fortinet all use mock/fixture adapters. Honest transport labels in connector status API. |
| Writeback | Blocked by delivery policy. `writebackEnabled: false`, `realNetwork: false`. |
| Cloud AI | Intentionally blocked; `configured: false` with honest reason per provider. |

### Path B: Full Sandbox Cluster (requires cluster startup)

Requires Kind with Podman provider, `kubectl`, and the existing cluster
tooling. All sandbox integrations are real code — previously accepted
(BL-116 through BL-117). Cluster was last verified in Session 132
(2026-05-03): all 3 app pods (API/Web/Worker) Ready, runtime HEAD 94c961
matches commit HEAD. If the cluster has been shut down since, restart
with the steps below.

**Prerequisites:**

- Podman >= 5.0 (tested on 5.8.2)
- `kubectl` (configured for the `kind-supportplane-local` context)
- `kind` (tested with Kind 0.22+)
- Host Ollama on port 11434 with `gemma4:e4b` model (optional; cluster can use mock AI fallback if unavailable)

**Cluster startup:**

```bash
# 1. Create the cluster (or reuse existing)
bash scripts/create_local_k8s_cluster.sh

# 2. Apply all namespaces and workloads
kubectl apply -k infra/kubernetes/local-podman

# 3. Build and load application images
bash scripts/build_and_load_local_k8s_images.sh

# 4. Wait for all pods to become Ready
kubectl get pods -A --watch   # Ctrl+C when all Running/Ready

# 5. Port-forward API and Web (two terminals)
kubectl port-forward -n supportplane-app svc/supportplane-api 4210:4110
kubectl port-forward -n supportplane-app svc/supportplane-web 3300:3200

# 6. Open http://localhost:3300
```

**What is real sandbox in Path B:**

| Real Sandbox | Status |
|--------------|--------|
| Zammad ticket read | Real HTTP read from Zammad sandbox using server-side OpenBao-resolved credential. Seeded ticket 2 (TICKET-101/68002) and customer 5 (Acme BVBA). |
| Zammad internal-note writeback | Real approval-gated writeback to sandbox ticket via NATS JetStream worker. Idempotency proven. Sandbox-only. |
| Ollama local AI | Real model calls to `gemma4:e4b` via podman0 bridge (`10.88.0.1:11435`). `fallbackUsed: false`, `provider: ollama`, `providerMode: local`. Benchmarked 644 eval tokens at 79.91 tok/s. |
| OpenBao credential resolver | Server-side secret resolution. Raw token never leaves the backend. `secretExposed: false` in all API responses. |
| NATS JetStream worker bridge | PostgreSQL outbox remains canonical; NATS publishes and consumes durable product envelopes. Stream `SUPPORTPLANE_OUTBOX` survives pod restart. |
| MinIO evidence persistence | Real S3 PutObject with SHA-256 checksum. Direct object read/verify via boto3. |
| Mailpit notification capture | Real SMTP delivery to `mailpit:1025`. Subject: "SupportPlane sandbox writeback completed". Captured message with timestamp. |
| Keycloak OIDC | Available but not default. Full browser redirect/callback/PKCE flow; realm role mapping; service account tokens with SHA-256 hashing. Default is local auth. |
| Asterisk AMI bridge | Telephony event ingestion; caller matching; session auto-create. No PSTN. |

**What is mock in Path B:**

| Mock | Reason |
|------|--------|
| Non-Zammad connectors | GLPI: **accepted (BL-069)** — real sandbox read proven (Session 142). osTicket, MeshCentral, Fortinet remain fixture/unconfigured. Honest labels in connector status panel. |
| Cloud AI providers | Intentionally blocked with `configured: false`. |
| Production writeback | Blocked by delivery policy. Only sandbox Zammad internal notes allowed. |
| Production telephony | No PSTN, SIP trunk, recording, or transcription. |
| Windows endpoint | Fixed templates exist but no real Windows runner proof. |

---

## Credible Demo Scenarios

### Scenario A: Sandbox Ticket Intake (real Zammad → SupportPlane)

Demonstrates a production-like support workflow: the operator receives a
ticket loaded from a real external ticketing system through a governed
connector pipeline.

**Preconditions:**

- Path B cluster running (API on 4210, Web on 3300)
- Zammad sandbox seeded (automatic via `kubectl apply -k`)
- OpenBao seeded with Zammad credential (automatic)

**Demo user:** `operator@supportplane.local` / `supportplane-demo` / `dev-tenant`

**Steps:**

1. Open `http://localhost:3300` in a browser.
2. Log in as operator (`operator@supportplane.local`, password `supportplane-demo`, tenant `dev-tenant`).
3. Click **New** in the Sessions panel. Title: "Sandbox Review — TICKET-101".
4. In the **Ticket Context** panel, enter ticket ID `2` (Zammad internal ID for TICKET-101) and click **Load**.
5. Observe the loaded ticket context.

**Expected results:**

- Ticket subject: "VPN connection issue for remote office" (real Zammad data)
- Customer name: "Acme BVBA" (real Zammad data)
- Customer email visible with partial redaction
- Connector Runtime Provenance card shows:
  - Installation: "Local Zammad Sandbox"
  - Type: `zammad`
  - Mode: `real sandbox`
  - Network: `sandbox local cluster`
  - Credentials: `1 linked`
  - Capabilities: `read_tickets`, `read_customers`, `write_notes`
- UI badges: "Zammad Sandbox", "Read-only", "Sandbox · No writeback · No production data"
- AI Context Quality panel shows ticket provenance packet with `connectorMode: zammad`
- Case Timeline shows "Ticket loaded" event
- No raw Zammad API token visible anywhere in UI, API responses, or browser dev tools

**What's real:** Full HTTP read from Zammad sandbox at `zammad.supportplane-integrations.svc.cluster.local:3000/api/v1` using an
OpenBao-resolved API token. The connector HTTP client (`FetchZammadHttpClient`)
makes real network calls. The credential path is: API → OpenBao server-side →
Zammad sandbox. No credential touches the browser.

**What's mocked:** Non-Zammad connectors (osTicket, MeshCentral, Fortinet) remain fixture/unconfigured. GLPI is accepted real sandbox (BL-069). The operator sees honest labels for every connector in the Connector Status panel.

**Known limitations:** The sandbox has exactly 1 seeded ticket (ID 2) and 1
seeded customer (ID 5). Creating new tickets in Zammad sandbox requires
manual REST API calls. SupportPlane does not provide a ticket-creation UI.

**Evidence:** `output/playwright/session-108-bl107-zammad-sandbox-read-connector/`
(BL-107) and `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/`
(BL-116).

---

### Scenario B: Operator Cockpit with AI Draft and Evidence Trail

Demonstrates the full governed AI support workflow: the operator loads a real
ticket, receives an Ollama-generated draft note, submits it for review, an
admin approves it, and the system delivers the note through a durable worker
pipeline with evidence persistence.

**Preconditions:**

- Path B cluster running (API on 4210, Web on 3300)
- Ollama host reachable from cluster pods via podman0 bridge
- Zammad sandbox available

**Demo users:**

- Operator: `operator@supportplane.local` / `supportplane-demo` / `dev-tenant`
- Admin: `admin@supportplane.local` / `supportplane-demo` / `dev-tenant`

**Steps:**

1. **Login as operator.** Open `http://localhost:3300`, log in as operator.
2. **Load ticket.** Create a new session. In Ticket Context, load Zammad ticket `2`.
   Confirm real Zammad data loads with sandbox labels.
3. **Generate AI draft.** In the Draft Note panel, click **Generate draft**. The
   system calls the Ollama `gemma4:e4b` model hosted on the Docker/Podman host.
4. **Review metadata.** Observe the model metadata block:
   - Provider: `ollama`
   - Model: `gemma4:e4b`
   - Prompt version and context hash visible
   - `fallbackUsed: false`
   - Latency in milliseconds
5. **Create action.** Review the draft text. Click **Create action**.
6. **Submit for review.** Click **Submit for review**. Note: the system requires
   admin approval before queueing.
7. **Log in as admin.** Open a new tab or incognito window. Log in as
   `admin@supportplane.local`. Navigate to the same session.
8. **Approve and queue.** In the Action Center panel, click **Approve**, then
   **Queue**. The action moves to `queued` status.
9. **Verify delivery.** In the Delivery Operations panel, watch the outbox item
   progress from `queued` → `processing` → `sandbox_delivered`.
10. **Generate evidence bundle.** In the Evidence Bundle panel, click **Generate**.
    Switch between Summary, JSON, and Markdown tabs.

**Expected results:**

- AI draft text is coherent and references the loaded Zammad ticket context.
- Model metadata shows `provider: ollama`, `model: gemma4:e4b`, `fallbackUsed: false`,
  `noCloudCall: true`, `autonomousSend: false`.
- Action lifecycle transitions: `draft` → `review_required` → `approved` → `queued` → `sandbox_delivered`.
- Delivery Operations panel shows:
  - `deliveryMode: sandbox`
  - `realNetwork: true` (sandbox-only, Zammad)
  - `externalWriteAttempted: false` (production blocked)
  - `policyDecision: sandbox_allowed`
  - Attempt history with timestamp and outcome
- Evidence bundle includes:
  - Session summary, linked tickets, AI usage (model, provider, latency)
  - Connector operations (read, writeback)
  - Audit timeline with full event chain
  - SHA-256 checksum of the MinIO artifact
  - Object key: `dev-tenant/writebacks/{session}/{outbox}.json`
- **Verification via Zammad directly:** `curl -H "Authorization: Token token=$ZAMMAD_TOKEN" http://localhost:8080/api/v1/ticket_articles` shows the internal note article written by SupportPlane.
- **Verification via MinIO directly:** `boto3 head_object` confirms the evidence
  artifact exists with matching SHA-256 checksum.
- **Verification via Mailpit:** `curl http://localhost:8025/api/v1/messages` shows
  the captured notification with subject "SupportPlane sandbox writeback completed".

**What's real:** Ollama model call (real HTTP to `/api/generate`), Zammad ticket
read (real HTTP with OpenBao credential), Zammad internal-note writeback (real
HTTP POST with idempotency key), OpenBao credential resolution (server-side
fetch), NATS JetStream durable worker bridge (stream publish, consumer ack),
MinIO evidence artifact persistence (real S3 PutObject with SHA-256 checksum),
Mailpit SMTP notification capture (real SMTP delivery).

**What's mocked:** Non-Zammad connectors (osTicket, MeshCentral, Fortinet). GLPI is now accepted real sandbox (BL-069).

**Known limitations:**
- Output requires human review before any action. The system never autonomously sends.
- `gemma4:e4b` is an 8B parameter model (Q4_K_M quantized, ~9.6GB VRAM). Output quality
  varies with prompt complexity. Not production-grade AI.
- The model requires the Ollama host to be reachable from cluster pods via the
  `podman0` bridge IP (`10.88.0.1`). Cluster restart may change the bridge IP.
- Only one seeded ticket for the sandbox workflow.

**Evidence:** `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/`
(BL-116 acceptance freeze).

---

### Scenario C: Governance, Audit, and Policy Denial Proof

Demonstrates that the authority chain (roles → policy → approval → audit →
enforcement) is real, server-side, and cannot be bypassed. This scenario works
in either Path A or Path B.

**Preconditions:** Path A or Path B running.

**Demo users:**

- Admin: `admin@supportplane.local` / `supportplane-demo` / `dev-tenant`
- Viewer: `viewer@supportplane.local` / `supportplane-demo` / `dev-tenant`
- Alt-tenant admin: `admin@alt.supportplane.local` / `supportplane-demo` / `alt-tenant`

**Steps:**

**Part 1 — Policy Control Visibility (as admin)**

1. Log in as admin. Navigate to `/admin`.
2. Click **Policies** in the sidebar.
3. Show the four policy tabs:
   - **Delivery:** Kill switch, approval required, min approver role, allowed actions, max attempts. Mock-only enforced: Locked ON. Real network: Locked OFF. Writeback: Locked OFF.
   - **Connector:** Per-connector policy. Sandbox allowlist visible; production URLs denied.
   - **AI:** Kill switch, human review required, draft generation toggle, allowed providers. Autonomous send: Locked OFF. Cloud providers: Locked OFF.
   - **Retention:** Prompt retention mode (None/Metadata_only/Full), output retention mode. Auto-purge: Locked OFF.
4. Click **Connectors** in the sidebar. Show the Connector Status panel:
   - Zammad: `real sandbox` transport, `healthy` status, `read_tickets` + `read_customers` + `write_notes` capabilities
   - GLPI: `configured` transport, `real` mode, `read_tickets` + `read_customers` capabilities, "Sandbox" label
   - osTicket: `fixture` transport, `read_tickets` + `read_customers` capabilities
   - MeshCentral: `unconfigured` transport, `Not connected` status
   - Fortinet: `unconfigured` transport, `Not connected` status
5. Click **Audit Explorer** in the sidebar. Show event type filter, actor
   type filter, resource type filter, date range, and paginated event list.
6. Click **Model Usage** in the sidebar. Show summary cards (total calls,
   by provider, by feature) and data table with provider/model/status columns.

**Part 2 — RBAC Enforcement (as viewer)**

7. Log out. Log in as `viewer@supportplane.local`.
8. Navigate to `/admin` → **Policies**. Observe:
   - All toggles, dropdowns, and buttons are disabled.
   - Message: "View-only. Admin role required to modify policy."
9. Navigate to the main cockpit. Observe:
   - **New** session button is disabled.
   - **Generate draft** button is disabled.
   - Connector panel: **Config**, **Readiness**, **Test** buttons are disabled.
   - Delivery Policy panel: all controls read-only.
10. **Prove server-side RBAC** — open browser DevTools (Network tab). Attempt a
    direct API call as viewer:
    ```bash
    curl -b viewer-cookies.txt -X PATCH http://localhost:4210/admin/policies/policy-delivery-dev-tenant \
      -H "Content-Type: application/json" -d '{"mockEnforce":false}'
    # Expected: 403 Forbidden
    # Response body includes: "Admin or operator role required"
    ```
    This proves the UI restriction is not just client-side — the server enforces
    RBAC on every mutation.

**Part 3 — Cross-Tenant Isolation**

11. Log out. Log in as `admin@alt.supportplane.local` (alt-tenant admin).
12. Navigate to the main cockpit. Observe:
    - Session list is empty or shows only `alt-tenant` sessions.
13. Attempt to access a `dev-tenant` session directly via API:
    ```bash
    curl -b alt-admin-cookies.txt http://localhost:4210/support-sessions/{dev-tenant-session-id}
    # Expected: 404 Not Found
    ```
14. Attempt to create a session as `alt-tenant` but with `dev-tenant` in the body:
    ```bash
    curl -b alt-admin-cookies.txt -X POST http://localhost:4210/support-sessions \
      -H "Content-Type: application/json" \
      -d '{"title":"cross-tenant test","tenantId":"dev-tenant"}'
    # Expected: 403 Forbidden
    ```
    The server ignores the injected tenantId and enforces the authenticated
    user's tenant.

**What's real:** RBAC is server-side enforced via NestJS guards and
`CurrentIdentityMiddleware`. Tenant scoping is enforced at the Prisma query
level (`where: { tenantId }` on every scoped query). Policy evaluation
happens at the API layer before any action is queued. Audit events are
append-only and persisted to PostgreSQL. Redaction is applied before AI
calls, before evidence export, and before any data leaves the API.

**What's mocked:** GDPR panel shows dry-run only (no real deletion). Audit
Explorer shows events from the local database only — no cryptographic hash
chain for audit immutability. Evidence bundles are not cryptographically
signed. Retention auto-purge is locked OFF (no scheduled deletion worker).

**Known limitations:**
- No production audit immutability. Hash-chain placeholder only.
- Evidence bundles are unsigned JSON/Markdown with SHA-256 checksums, not
  compliance-grade digital signatures.
- No production credential broker. OpenBao is local sandbox only.
- No production RBAC integration with enterprise IdP (Keycloak OIDC is
  available but not default; local auth is the default path).

**Evidence:** `output/playwright/session-126-governed-ai-vertical-closure/`
(Session 126), `output/playwright/session-128-docs-governance-closure/`
(Session 128), and `output/playwright/session-118-bl083-bl086-bl087-bl090-production-readiness/`
(production readiness).

---

### Scenario D: Endpoint Diagnostics (Linux) and Windows-Aware Story

Demonstrates the endpoint agent model: outbound-only registration, fixed
read-only diagnostics, platform-aware tool registry, and non-Windows
fallback with honest labels.

**Preconditions:** Path A (local MVP) or Path B (cluster). Endpoint agent
source at `apps/endpoint-agent`.

**Demo user:** `operator@supportplane.local` / `supportplane-demo` / `dev-tenant`

**Steps:**

**Part 1 — Device Console Pre-Agent State**

1. Log in as operator. Navigate to `/device-console`.
2. Observe the initial state:
   - A "Windows Endpoint (Mock)" device is visible in the device list (seeded).
   - No heartbeat data yet (agent not connected).
   - Platform badge: "Windows" with mock indicator.

**Part 2 — Agent Registration and Diagnostics**

3. Open a terminal. Build and run the local endpoint agent:
   ```bash
   npx tsx apps/endpoint-agent/agent.ts
   ```
4. Observe agent output:
   - `registering device...` → device token saved locally
   - `sending heartbeat...` → status updated, last seen timestamp
   - `submitting inventory...` → inventory snapshot created
5. Refresh the Device Console in the browser. Observe:
   - A new Linux device appears in the device list.
   - Platform badge: "Linux".
   - Status: "online" or "active".
   - Last seen timestamp is recent.
   - Heartbeat count incremented.
6. Click the Linux device in the list. Observe the device detail page:
   - Device ID, tenant, platform, status, last seen.
   - Inventory snapshots with OS, hostname, CPU, memory.
   - Command history (initially empty).

**Part 3 — Read-Only Diagnostic Request**

7. In the Device Console, locate the "Request Diagnostic" section.
8. Select `diagnostic.disk` from the command kind dropdown.
9. Click **Request**. Observe:
   - Status changes to `queued`.
   - Endpoint command ID is generated.
   - The agent polls for pending commands and claims this one.
   - After agent processes the command, status changes to `succeeded`.
   - Result JSON appears: `diskFree`, `diskTotal`, `diskUsagePercent` with real
     values from the agent host's filesystem.
10. Repeat for `diagnostic.network` (shows interfaces, IPs) and
    `diagnostic.inventory` (shows OS, hostname, CPU, memory).

**Part 4 — Platform-Aware Tool Registry**

11. Navigate to the Admin page → Tool Registry (or query via API):
    ```bash
    curl -b cookies http://localhost:4210/admin/tools
    ```
12. Observe the 8 registered tools:
    - `diagnostic.inventory` — compatible: linux, win32, darwin
    - `diagnostic.disk` — compatible: linux, win32, darwin
    - `diagnostic.network` — compatible: linux, win32, darwin
    - `diagnostic.services` — compatible: linux, win32
    - `diagnostic.software` — compatible: linux, win32
    - `diagnostic.status` — compatible: linux, win32, darwin
    - `remediation.flush_dns_cache` — compatible: linux, win32
    - `remediation.clear_temp_preview` — compatible: linux (win32 unsupported)
13. Note the platform badges: "Windows" (compatible via fixed templates, not
    yet proven on real Windows), "Unsupported" for `clear_temp_preview` on
    Windows. Every label is honest.

**Part 5 — Safety and Denial Proof**

14. Attempt to invoke `remediation.flush_dns_cache`. Observe:
    - Status: `approval_required` (remediation requires approval).
    - No direct execution.
15. Attempt to invoke with arbitrary shell:
    ```bash
    curl -b cookies -X POST http://localhost:4210/admin/tool-invocations \
      -H "Content-Type: application/json" \
      -d '{"toolKey":"diagnostic.status","deviceId":"...","requestedInput":{"shell":"rm -rf /"}}'
    # Expected: 400 Bad Request
    # Response: "Rejected: arbitrary shell field not allowed"
    ```
16. Log in as viewer and attempt to invoke any tool.
    # Expected: 403 Forbidden

**What's real:** Linux collectors read real system data (`/proc`, `statfs`,
`hostname`, etc.). Tool execution safety (fixed command templates, arbitrary
shell rejection, approval gating, RBAC) is server-side enforced. Audit
events are generated for every invocation, approval, and result. Endpoint
agent communication is outbound-only.

**What's mock/partial:** The seeded Windows endpoint is a fixture — it has
fixed `sc.exe` (service enumeration) and `reg.exe` (software inventory)
command templates with fixture parsers tested on Linux. Real Windows
execution is not yet proven. Installed software inventory is partial even
on Linux. Only one low-risk remediation path (flush DNS) is implemented.

**Known limitations:**
- Windows collectors have fixed templates but no real Windows runner proof.
- The `remediation.clear_temp_preview` template is scaffolded but marked
  unsupported on Windows.
- Only `flush_dns_cache` is a working remediation path (Linux: `resolvectl
  flush-caches`). Broader remediation coverage is planned (BL-065 partial).
- The endpoint agent is a dev-mode `tsx` runner, not a packaged binary.
  See `scripts/package_windows_endpoint_agent.ps1` for Windows packaging scaffold.

**Evidence:** `output/playwright/session-120-endpoint-agent-diagnostics/`
(BL-055/056/058/059/060), `output/playwright/session-121-bl061-068-tool-execution-safety-foundation/`
(BL-061 through BL-068), `output/playwright/session-122-windows-endpoint-foundation/`
(BL-129 through BL-132).

---

## Demo Reset

To return to a clean deterministic state at any time:

```bash
bash scripts/reset_demo_data.sh --force
```

**What is preserved after reset:**

- Tenants (`dev-tenant`, `alt-tenant`)
- Users and roles (`admin@supportplane.local`, `operator@supportplane.local`,
  `viewer@supportplane.local`, `admin@alt.supportplane.local`)
- Connector installations (Zammad, GLPI, osTicket, MeshCentral, Fortinet)
- Credential references
- Delivery policies (default delivery policy, AI policy, retention policy)

**What is destroyed:**

- All support sessions, call events, screen observations
- All actions and outbox items
- All audit events
- Any custom data created during the demo

The reset runs `npx prisma migrate reset --force` against local PostgreSQL
only and refuses to run against non-local databases.

---

## Port Reference

| Service | Standalone (Path A) | Cluster (Path B) |
|---------|---------------------|-------------------|
| Web | `localhost:3200` | `localhost:3300` (port-forward) |
| API | `localhost:4110` | `localhost:4210` (port-forward) |
| PostgreSQL | `localhost:5434` | in-cluster, `supportplane-data` |
| NATS | `localhost:4222` | in-cluster, `supportplane-integrations` |
| MinIO API | `localhost:9000` | `localhost:9000` (port-forward) |
| MinIO Console | `localhost:9001` | `localhost:9001` (port-forward) |
| Zammad | — | `localhost:8080` (port-forward) |
| OpenBao | — | `localhost:8200` (port-forward) |
| Mailpit | — | `localhost:8025` (port-forward) |
| Keycloak | — | `localhost:8081` (port-forward) |
| Asterisk AMI | — | in-cluster, `supportplane-integrations` |

## Validation Commands for Reviewers

Run these to independently verify runtime health and code quality:

```bash
# API health check
curl -s http://localhost:4110/health | jq .
# Expected: {"service":"supportplane-api","status":"ok","head":"<full sha>","storeMode":"postgres","authMode":"local"}

# State documentation hygiene
python3 scripts/check_state_docs.py
# Expected: all checks pass

# Documentation hygiene
python3 scripts/check_docs_hygiene.py
# Expected: all 5 checks pass

# TypeScript type checking (all workspaces)
npm run typecheck
# Expected: zero errors

# ESLint (all workspaces)
npm run lint
# Expected: zero errors, zero warnings

# Test suite (all workspaces)
npm test
# Expected: all pass, zero failures

# Connector status (all 5 connectors with honest transport labels)
curl -b cookies.txt http://localhost:4110/connectors/status | jq .

# Connector runtime readiness (Zammad sandbox)
curl -b cookies.txt -X POST http://localhost:4110/connector-installations/conn-inst-dev-001/runtime-readiness | jq .

# Build verification
npm run build
# Expected: all workspaces build successfully

# Full validation
npm run validate
# Expected: all contract validation checks pass
```

For cluster (Path B) use port `4210` instead of `4110`.

---

## Non-Claims

The following capabilities are **not claimed** by this demo or by the current
SupportPlane codebase. Assertions to the contrary are false.

- **No production software claim.** This is a self-hosted sandbox and local
  development tool. It is not production-hardened.
- **No production Zammad writeback.** Sandbox-only internal notes to a local
  Zammad sandbox. No production Zammad instances, no public replies.
- **No cloud AI providers.** OpenAI, Azure OpenAI, and Anthropic providers
  return honest `configured: false`. Only local/mock AI is active.
- **No internet email.** Mailpit captures local SMTP only. No real SMTP
  relay or internet mail delivery.
- **No production telephony.** Asterisk AMI bridge is local sandbox only. No
  PSTN, SIP trunks, or real phone calls.
- **No production secrets management.** OpenBao is a local sandbox resolver
  for a single Zammad token. No rotation, no KMS, no production secrets.
- **No compliance certification.** Evidence bundles are unsigned JSON/Markdown
  with SHA-256 checksums. Not SOC2, ISO 27001, GDPR, or HIPAA compliant.
- **No Windows endpoint proof.** Windows collectors have fixed command
  templates and fixture parsers tested on Linux. No real Windows runner
  verification has been performed.
- **No autonomous AI actions.** Every action that modifies external state
  requires human approval. The AI may draft, suggest, and request — it may
  never execute autonomously.
- **No production audit immutability.** Audit events are append-only in
  PostgreSQL. No cryptographic hash chain, no WORM storage, no tamper-proof log.

---

## Demo Credentials

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Admin | `admin@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer | `viewer@supportplane.local` | `supportplane-demo` | `dev-tenant` |

**Cross-tenant test:** `admin@alt.supportplane.local` / `supportplane-demo` / `alt-tenant`

**Keycloak OIDC users (Path B only, when OIDC enabled):**
`oidc-admin@supportplane.local`, `oidc-operator@supportplane.local`,
`oidc-viewer@supportplane.local` (password: `supportplane-demo`).

---

## Evidence Reference

All claims in this guide are backed by verified evidence. The complete
evidence inventory is maintained in `docs/EVIDENCE_LOG.md`. Key sessions
referenced in this guide:

| Session Folder | What It Proves |
|----------------|----------------|
| `session-108-bl107-zammad-sandbox-read-connector/` | Real Zammad sandbox read; sandbox labels; connector provenance |
| `session-115-bl116-real-sandbox-acceptance-freeze/` | Full sandbox E2E freeze: read, writeback, Ollama AI, OpenBao, NATS, MinIO, Mailpit |
| `session-126-governed-ai-vertical-closure/` | AI governance: model usage, audit explorer, GDPR panel, retention, draft repair |
| `session-128-docs-governance-closure/` | Documentation governance infrastructure and doc hygiene |
| `session-118-bl083-bl086-bl087-bl090-production-readiness/` | Rate limits, body limits, security headers, backup/restore, release packaging |
| `session-120-endpoint-agent-diagnostics/` | Local endpoint agent registration, heartbeat, diagnostics |
| `session-121-bl061-068-tool-execution-safety-foundation/` | Tool registry, safety rejection, approval lifecycle, audit events |
| `session-122-windows-endpoint-foundation/` | Windows platform contracts, UI badges, fixture parsers |
| `session-123-real-connectors-golden-workflow/` | Connector status unification, knowledge retrieval, tool note drafts |
| `session-111-112-113-sandbox-writeback-closure-canonical/` | Sandbox writeback: Zammad article, MinIO artifact, Mailpit notification |
