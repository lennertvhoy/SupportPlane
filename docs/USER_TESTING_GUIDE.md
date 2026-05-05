# SupportPlane User Testing Guide

**Purpose:** Walk a non-technical tester through a 15-minute evaluation of the SupportPlane governed AI support cockpit.

**Last updated:** 2026-05-03

---

## Before You Start

This is a **local development sandbox**. Nothing here is production. No real customer data is at risk. All credentials are sandbox-only dev defaults.

**What you need:**

- A web browser (Chrome or Firefox recommended)
- 15 minutes
- This guide

**What you do NOT need:**

- Repo or code access
- Kubernetes knowledge
- Any credentials (we'll give you the demo login)

---

## Getting the Demo Running

Ask your demo operator to run:

```bash
bash scripts/start_demo_mode.sh
```

This brings up the K8s cluster services and port-forwards. When ready, you'll see:

```
========================================
  SupportPlane Demo Mode — READY
========================================

  Web UI:    http://localhost:3300
  API:       http://localhost:4210
  ...
```

**Open your browser to the Web UI URL shown above.**

---

## Demo Login

Use these sandbox credentials:

| Field    | Value                      |
| -------- | -------------------------- |
| Email    | `admin@supportplane.local` |
| Password | `supportplane-demo`        |
| Tenant   | `dev-tenant`               |

You'll land on the **Support Cockpit** — the main operator dashboard.

---

## Quick Tour (2 minutes)

After login, notice these key areas:

1. **Header banner:** Shows "DEV / MOCK DATA" badge indicating sandbox mode.
2. **Session list** (left sidebar): Support sessions with status, priority.
3. **Ticket Context panel:** Shows loaded ticket details.
4. **Connector Status panel:** (if visible) Shows which ticket systems are real vs fixture.
5. **Admin nav:** Top nav or sidebar, depending on the build.

---

## Demo Flow A — Zammad Real Sandbox Ticket (3 minutes)

Zammad is a real ticketing system running in the local sandbox.

### What to do

1. In the left sidebar, find or create a new support session.
2. Enter `2` as the external ticket ID.
3. Load Zammad ticket context (click "Load ticket" or use the Zammad flow).
4. Observe:
   - **Ticket subject:** "VPN connection issue for remote office - TICKET-101"
   - **Customer:** Acme BVBA
   - **Connector provenance:** Zammad, real sandbox, transport=real
   - **Label:** "Zammad Sandbox" badge

### What this proves

SupportPlane can read real ticket data from a real Zammad instance without exposing credentials.

---

## Demo Flow B — GLPI Real Sandbox Ticket (3 minutes)

GLPI is an IT asset management system, also running real in the sandbox.

### What to do

1. Create a new support session.
2. Enter `1` as the external ticket ID.
3. Load GLPI ticket context.
4. Observe:
   - **Ticket subject:** "VPN connection issue"
   - **Status:** New, Priority: High
   - **Source adapter:** GLPI (glpi-adapter-001)
   - **Label:** Real sandbox with provenance

### What this proves

SupportPlane connects to multiple real ticketing systems (not just Zammad) with honest transport labels for each.

---

## Demo Flow C — Governance & Audit (4 minutes)

This flow shows the safety controls that govern AI and connector activity.

### What to do

1. Navigate to the **Connector Status** panel or admin area.
2. Observe the connector cards:
   - **Zammad:** configured/real (reads real sandbox data)
   - **GLPI:** configured/real (reads real sandbox data)
   - **osTicket:** fixture (returns demo data, not real)
   - **MeshCentral:** unconfigured (no instance connected)
   - **Fortinet:** unconfigured (no instance connected)

3. (If available) Check the **Policy Editor**:
   - Real network writeback is **locked OFF**.
   - AI policy allows secure, governed usage only.

4. Check **Audit Explorer** for recent actions. Every ticket load, session creation, and policy check is recorded.

### What this proves

The system is honest about what's real and what's not. Safety gates are visible and enforced. All actions are auditable.

---

## What to Ignore During This Test

- **osTicket:** Fixture data only. Not a real system. This is intentional and documented.
- **MeshCentral / Fortinet:** Unconfigured. No real instances exist yet.
- **Windows endpoint agents:** Proven through CI but not part of this browser demo.
- **Call Console / Telephony:** Mock/simulated only. Not real phone calls.

---

## How to Report Feedback

Use the tester feedback form at `docs/TESTER_FEEDBACK_TEMPLATE.md` or answer these questions directly:

1. What was your first impression?
2. What confused you?
3. What felt useful?
4. What felt fake?
5. What broke (if anything)?
6. What would you need before trusting this at work?
7. Score 1–5 for: clarity, usefulness, trust, speed.

---

## Known Limitations

See `docs/KNOWN_DEMO_LIMITATIONS.md` for the full honest list. Key points:

- **Not production.** All data is sandbox/dev. No compliance claimed.
- **No real email.** Notifications go to local Mailpit only.
- **No cloud AI.** AI uses local Ollama only (if running).
- **No internet writeback.** Sandbox-only. Production writeback blocked.
- **OpenBao is in-memory.** Credentials lost on pod restart (re-seed script exists).

---

## Expected Duration

**~15 minutes** for all three flows on a warm cluster. Add 5 minutes if the cluster needs to start cold.

---

## This is Sandbox/Local — NOT Production

> **IMPORTANT:** All connectors, credentials, and data in this demo are sandbox-only local development instances. No production systems, customer data, or real infrastructure are involved. The UI prominently labels sandbox vs fixture vs unconfigured status.
