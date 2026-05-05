# SupportPlane — Test Round 001 Preflight Dry Run

**Date:** 2026-05-04 11:00 CEST
**Tester:** Internal (coding agent simulation — post-reset)
**Demo URL:** `http://localhost:3300`
**API URL:** `http://localhost:4210`
**Persona used:** Helpdesk Operator → Security/Governance Reviewer

---

## Preflight Checks (Before Dry Run)

- [x] `bash scripts/start_demo_mode.sh` — cluster running, pods Ready
- [x] `bash scripts/reset_demo_data.sh --yes` — DB reset + reseed successful
- [x] `bash scripts/verify_user_testing_demo.sh` — **10/10 PASS, 0 FAIL**
- [x] Web UI: `http://localhost:3300` returns HTTP 200
- [x] API health: `http://localhost:4210/health` reports status=ok
- [x] Zammad configured:real, GLPI configured:real
- [x] GLPI sandbox setup re-run (test ticket #1 recreated)
- [x] Session list: **7 sessions** (down from 100+) — clean state

---

## What Was Clear

- **Stale session clutter is FIXED.** After reset, only 7 sessions exist (mostly smoke-test artifacts). A first-time tester would not be overwhelmed. The P0 issue from the first internal dry run is resolved.
- **Login works first time.** `admin@supportplane.local` / `supportplane-demo` / `dev-tenant` enters without error.
- **Header badges are honest:** DEV/MOCK DATA, Sandbox Demo, All writeback blocked, Auth: local, Store: postgres.
- **API port label is correct:** The header now reads `API: localhost:4210` (was hardcoded `4110` before the P1 fix).
- **Zammad flow works.** Creating a session and loading ticket #2 shows "VPN connection issue for remote office - TICKET-101" with Zammad Sandbox labels and provenance card.
- **GLPI flow works.** Creating a session and loading ticket #1 shows "VPN connection issue" with GLPI adapter provenance.
- **Connector Status panel is honest.** Zammad configured/real, GLPI configured/real, osTicket fixture, MeshCentral/Fortinet unconfigured.
- **Policy Editor renders all 4 tabs** (Delivery, Connector, AI, Retention) without errors.
- **Audit trail populates** with session_created and ticket_linked events.

---

## What Still Felt Confusing

- **No session search/filter.** With 7 sessions it's fine, but any accumulation would make finding sessions annoying. P2.
- **"ALL TICKETS" panel shows empty or stale data** after reset. A tester might wonder why it's blank. P3.
- **favicon.ico 404** — console error, no functional impact. P3.
- **"Zammad mode" label in header** is misleading since GLPI is also real. P2.
- **No "Start Here" or guided first-visit walkthrough.** A completely new tester would need the TEST_SCRIPT.md to know where to click. P2.

---

## Whether Stale Sessions Are Fixed

**Yes.** The database reset (`--yes` mode) clears all stale sessions. After reset, only 7 sessions exist (from smoke tests run during this session). The session list is clean and manageable for a new tester.

The `reset_demo_data.sh --yes` flag makes this repeatable in the operator checklist without interactive prompts.

---

## Whether a Tester Can Follow the Script Without Repo Knowledge

**Mostly yes, with caveats:**

1. The TEST_SCRIPT.md gives explicit click paths (e.g., "Click New Session, enter a title, select it"). A non-technical tester should be able to follow it.
2. The login credentials are clearly listed.
3. What's confusing: some UI elements require scrolling or tab-switching to find (e.g., Connector Status is in the cockpit grid below the fold). The test script doesn't always say "scroll down."
4. The "Zammad mode" label in the header could mislead testers into thinking only Zammad is real.
5. Overall rating: **followable with minor friction.**

---

## P0 / P1 / P2 Findings

### P0 — None found

No demo-blockers. All 5 flows complete without crashes or wrong data. 10/10 smoke test passes.

### P1 — None found

The API port label was fixed in the previous round. No new P1 issues.

### P2 — Minor friction

- P2: "Zammad mode" header label — misleading since GLPI is also real
- P2: No session search/filter
- P2: No guided first-visit walkthrough or "Start here" link

### P3 — Cosmetic / Future

- P3: favicon.ico 404
- P3: "ALL TICKETS" panel blank after reset
- P3: Some panels require scrolling to find (Connector Status, Evidence Bundle)

---

## GLPI Seed Fix (Found During Preflight)

The database reset revealed that the `prisma/seed.ts` was missing a GLPI ticketing adapter and connector installation. The `loadGlpiTicketContext` code references `glpi-adapter-001` via `resolveCanonicalAdapterId('glpi')`, but this adapter ID was not seeded. This caused a FK constraint violation (`ticket_references_adapterId_fkey`) when loading GLPI context after a reset.

**Fix applied:** Added `glpi-adapter-001` ticketing adapter and `conn-inst-glpi-001` connector installation to `prisma/seed.ts`. Reseed verified. GLPI context now loads correctly after reset.

---

## Final Go/No-Go Recommendation

**GO** for real testers. All blockers are resolved:

- Stale sessions: FIXED (reset script `--yes` mode)
- API port label: FIXED (reads from env var)
- GLPI context after reset: FIXED (seed now includes GLPI adapter)
- Smoke test: 10/10 PASS
- Session list: clean (7 sessions)

**Pre-testing requirements for operator:**

1. Run `bash scripts/start_demo_mode.sh` if cluster isn't running
2. Run `bash scripts/reset_demo_data.sh --yes`
3. Run `bash scripts/setup_glpi_sandbox.sh` (GLPI has no PVC)
4. Run `bash scripts/verify_user_testing_demo.sh` — must be 10/10
5. Send SEND_TO_TESTERS.md to tester
