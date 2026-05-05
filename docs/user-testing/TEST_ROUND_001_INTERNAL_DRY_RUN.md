# SupportPlane — Test Round 001 Internal Dry Run

**Date:** 2026-05-03
**Tester:** Internal (coding agent simulation)
**Demo URL:** http://localhost:3300
**API URL:** http://localhost:4210

---

## What Was Clear

- **Header honesty badges are strong**: DEV/MOCK DATA, Sandbox Demo, All writeback blocked are immediately visible and set the right expectation.
- **Admin navigation is discoverable**: The "Admin" button in the header leads to a clean sidebar with Policies, Users, Roles, Model Usage, Audit Explorer, GDPR, and Connectors.
- **Policy editor renders correctly**: Four tabs (Delivery, Connector, AI, Retention) with kill switch, approval required, mock-only enforced (Locked ON), real network locked OFF.
- **Login is straightforward**: Local auth with seeded credentials. UI immediately shows the logged-in user, role, and tenant.
- **Session creation works**: New session form appears on demand, title field is clear, create/cancel buttons work.

---

## What Was Confusing

- **"API: localhost:4110" in header is wrong**: The cluster API runs on port 4210, but the header label says 4110. This is a P1 honesty gap — it could confuse technical testers who check which port to use. **Fixed in this round.**
- **Session list is enormous (100+ sessions from prior testing)**: A first-time tester would have to scroll through pages of old "BL-116 freeze E2E", "debug", "test" sessions before finding their own. This is overwhelming. **P0 — demo data must be reset before testing starts. Documented in test plan.**
- **"Zammad mode" in header**: The label says "Zammad mode" but the connector status shows both Zammad AND GLPI as configured/real. Testers might wonder: "Is GLPI also working? Why only Zammad mode?"
- **"Admin" button located in busy header**: The header has many buttons (Call Console, Device Console, Tool Registry, Approval Queue, Admin) plus Logout. Could overwhelm a first-time user scanning the page.

---

## Which Flows Felt Credible

- **Smoke test (10/10 PASS) proves backend integrity**: Zammad and GLPI both return real sandbox data, osTicket/MeshCentral/Fortinet are honestly labeled.
- **Connector status panel** (visible in cockpit, though scrunched among other panels): 5 connectors with clear mode/transport labels.
- **Admin policy editor**: Delivery policy shows kill switch, approval gates, mock-only enforced, real network locked off — exactly what governance testers want to see.

---

## Which Parts Felt Fake

- **Massive stale session data**: 100+ sessions from prior development cycles make the demo look like a production DB that was accidentally exposed, not a clean demo.
- **No session filtering or search**: With 100+ sessions and no search box, finding anything is impractical.
- **"Mock / Dev-Only" disclaimers everywhere**: While these are honest, the sheer volume of mock warnings might undermine confidence for enterprise buyers.

---

## Broken Links / Buttons / Errors

- **favicon.ico 404**: Console shows `Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3300/favicon.ico`. Minor (P3).
- **No other broken links found**: Admin sidebar all accessible, main panels render without errors.

---

## Unclear Labels

| Label                          | Issue                                   | Severity   |
| ------------------------------ | --------------------------------------- | ---------- |
| "API: localhost:4110"          | Port is wrong (should be 4210)          | P1 — FIXED |
| "Zammad mode"                  | Only mentions Zammad; GLPI is also real | P2         |
| "Connector Runtime Provenance" | Jargon-heavy for non-technical testers  | P3         |

---

## Demo Blockers Found

| #   | Blocker                                                        | Severity | Status                                                |
| --- | -------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| 1   | Session list has 100+ stale entries from prior testing         | P0       | Documented — must `reset_demo_data.sh` before testing |
| 2   | Header API port label shows `localhost:4110` instead of `4210` | P1       | FIXED — now reads from NEXT_PUBLIC_API_BASE_URL       |

---

## Screenshots Captured

- `02-demo-home.png` — Cockpit logged in as admin, showing session list and main panels
- `03-admin-governance.png` — Admin dashboard with policy editor (Delivery tab, kill switch, locked controls)
- `04-connector-status.png` — Scrolled cockpit showing Connector Status panel (filed in evidence)

---

## Pre-Testing Checklist for Real Testers

Before handing the demo URL to any tester, the demo operator MUST:

1. Run `bash scripts/reset_demo_data.sh` to clear all stale sessions.
2. Run `bash scripts/verify_user_testing_demo.sh` to confirm 10/10 PASS.
3. Confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:4210` in K8s config.
4. Hand the tester the FIRST_TEST_ROUND.md packet.
5. Assign a persona from TESTER_PERSONAS.md.
