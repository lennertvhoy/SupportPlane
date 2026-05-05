# SupportPlane Demo Guide

**Purpose:** A scripted walkthrough of the standalone local MVP demo. For the full sandbox cluster demo, see [Enterprise Demo Guide](ENTERPRISE_DEMO_GUIDE.md).

> **Note:** This guide covers the standalone local MVP path (no Kubernetes cluster). For the full sandbox cluster demo with real Zammad/Ollama/OpenBao/NATS/MinIO/Mailpit, see [Enterprise Demo Guide](ENTERPRISE_DEMO_GUIDE.md).
> **Prerequisites:** PostgreSQL running on `localhost:5434`, API on `localhost:4110`, Web on `localhost:3200`.

---

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, NATS, MinIO)
podman compose -f infra/docker-compose/compose.yaml up -d

# 2. Reset to deterministic demo state (destroys all data and reseeds)
bash scripts/reset_demo_data.sh --force

# 3. Start API
cd apps/api && SUPPORTPLANE_STORE=postgres SUPPORTPLANE_AUTH_MODE=local npm run dev

# 4. Start Web (in a new terminal)
cd apps/web && NEXT_PUBLIC_API_BASE_URL=http://localhost:4110 npm run dev

# 5. Open http://localhost:3200
```

---

## Demo Credentials

| Role     | Email                         | Password            | Tenant       |
| -------- | ----------------------------- | ------------------- | ------------ |
| Admin    | `admin@supportplane.local`    | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer   | `viewer@supportplane.local`   | `supportplane-demo` | `dev-tenant` |

Alt-tenant admin: `admin@alt.supportplane.local` / `supportplane-demo` / `alt-tenant`

---

## Scripted Demo Path

### 1. Start services

Confirm running:

```bash
curl -s http://localhost:4110/health | jq .
curl -s http://localhost:3200/ | head
```

**Expected:** API returns `status: ok`, `storeMode: postgres`, `authMode: local`. Web returns HTML.

---

### 2. Log in as admin

Open `http://localhost:3200/`, log in with admin credentials.

**Expected visible labels:**

- Header: `DEV / MOCK DATA`
- Header: `API: localhost:4110`
- Header: `Auth: local · Store: postgres`
- Header identity pill: `Demo Admin / Acme Support Demo / admin`

---

### 3. Show local/mock badges

Point out the amber badges:

- `DEV / MOCK DATA` (top-left header)
- `Mock mode` (Connector panel)
- `Mock-only` / `Locked ON` (Connector installation settings)
- `Local / Mock Export Only` (Evidence Bundle panel before session selection)

---

### 4. Open/create a support session

Click **New** in the Sessions panel, title it "Demo Session — VPN Issue", then click **Create**.

**Expected:** Session appears in the left sidebar with `open` badge.

---

### 5. Load ticket context

In the **Ticket Context** panel, enter `TICKET-101` and click **Load**.

**Expected:**

- Ticket subject: "VPN not connecting for remote user"
- Customer: Acme BVBA
- Connector runtime provenance card visible (installation name, type, mode, network status, linked credential count)
- AI Context Quality panel populates with a ticket provenance packet

---

### 6. Show connector runtime provenance

Scroll to the **Connector** panel. Expand the installation card.

**Expected:**

- `Local Zammad Mock` — `zammad` type, `active` status (standalone mode: mock; cluster mode: real sandbox — see [Enterprise Demo Guide](ENTERPRISE_DEMO_GUIDE.md))
- `Mock mode` badge
- `Locked ON` mock mode toggle
- Credential reference: `Dev Zammad API Token (Placeholder)` — status `active`
- Config/Readiness buttons visible for admin

Click **Config** → expect `Valid` badge, `valid: true`, `mockMode: true`, `realNetwork: false`.

Click **Readiness** → expect `Mock ready` badge, `realReady: false`, `writebackEnabled: false`.

---

### 7. Generate local-only support note/action

Scroll to the **Draft Note** panel. Click **Generate mock draft** (standalone mode; real Ollama AI is available in cluster mode — see [Enterprise Demo Guide](ENTERPRISE_DEMO_GUIDE.md)).

**Expected:**

- Textarea fills with `MOCK AI DRAFT` content
- Model metadata: Provider `mock`, Model `mock-support-note-v1`
- Writeback remains disabled

Then scroll to the **Support Note Draft** panel, enter a note, and click **Create draft**.

Then scroll to the **Action Center** panel, click **Create action** from the draft, then **Submit for review**, **Approve**, and **Queue**.

**Expected:** Action moves through states. Outbox item is created with `mode: mock`, `realNetwork: false`.

---

### 8. Approve/queue/mock-deliver via outbox

In the **Action Center** panel, click **Mock deliver**.

**Expected:**

- Delivery result shows `mock_delivered`
- Attempt history shows `realNetwork: false`, `writebackEnabled: false`
- Audit trail appends `action_mock_delivered` event

---

### 9. Show delivery policy gates

Scroll to the **Delivery Policy** panel.

**Expected:**

- `Mock-only enforced: ON` (locked)
- `Allow real network calls: OFF` (locked)
- `Kill switch: OFF`
- `Approval required: ON`
- Admin can toggle kill switch and approval settings; viewer sees read-only panel.

---

### 10. Show evidence bundle

Scroll to the **Evidence Bundle** panel and click **Generate**.

**Expected:**

- Summary tab shows Bundle ID, ticket count, packet count, audit events, AI usage, connectors.
- JSON tab shows structured export with `mockDevOnlyDisclaimers`.
- Markdown tab shows readable report with honest limitations.
- No secrets, tokens, or passwords visible.

---

### 11. Switch to viewer and prove read-only/RBAC behavior

Click **Logout**, then log in as `viewer@supportplane.local`.

**Expected:**

- Identity pill shows `Demo Viewer / Acme Support Demo / viewer`
- **New** session button is disabled
- Connector panel shows **Config**, **Readiness**, **Test** buttons disabled
- Delivery Policy panel shows read-only message: "View-only. Admin role required to modify policy."
- Attempting direct API mutation returns `403 Forbidden` (verified server-side)

---

### 12. Show real-writeback design boundary

Open `docs/REAL_WRITEBACK_PATH_DESIGN.md` in an editor or browser.

**Expected sections visible:**

- Current truth (sandbox writeback accepted, production writeback blocked)
- Why production writeback is blocked (sandbox writeback is accepted via BL-111)
- Required architecture (credential broker, encrypted storage, network egress, approval gates)
- Phased path: Phase 0 → Phase 4
- Explicit non-goals
- "Do not build until..." checklist

---

## Demo Reset

To return to a clean state at any time:

```bash
bash scripts/reset_demo_data.sh --force
```

This runs `npx prisma migrate reset --force` against local PostgreSQL only. It recreates the database from committed migrations and seeds deterministic demo data. It refuses to run against non-local databases.

**What is preserved after reset:**

- Tenants, roles, users
- Connector installations, credential references, delivery policies
- Ticket fixtures (TICKET-101, TICKET-102)

**What is destroyed:**

- All support sessions, call events, actions, outbox items, audit events, screen observations
- Any custom data created during the demo

---

## Ports and Endpoints

| Service    | URL / Port              |
| ---------- | ----------------------- |
| Web app    | `http://localhost:3200` |
| API        | `http://localhost:4110` |
| PostgreSQL | `localhost:5434`        |
| NATS       | `localhost:4222`        |
| MinIO      | `localhost:9000`        |

---

## Troubleshooting

- **Web shows login loop:** Ensure API is running and `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:4110`.
- **Database connection errors:** Ensure Podman Compose PostgreSQL is healthy (`podman compose -f infra/docker-compose/compose.yaml ps`).
- **Stale sessions after reset:** Run `scripts/reset_demo_data.sh --force` and refresh the browser.
- **Port conflicts:** The web dev server runs on `3200` and the API on `4110`. Change with `PORT=3201` or `API_PORT=4111` if needed.
