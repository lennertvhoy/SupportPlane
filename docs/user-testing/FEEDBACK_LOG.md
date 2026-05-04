# SupportPlane User Testing Feedback Log

**Purpose:** Central log of all tester feedback collected during SupportPlane user
testing operations. Each row is one distinct piece of feedback.

**Linked documents:**

- `docs/user-testing/TRIAGE_WORKFLOW.md` — how to process these entries
- `docs/user-testing/KNOWN_DEMO_LIMITATIONS.md` — intentional limitations
- `docs/user-testing/USER_TESTING_GUIDE.md` — tester instructions
- `BACKLOG.md` — where BL items live

---

## Feedback Entries

| ID | Date | Tester | Persona | Round | Clarity | Usefulness | Trust | Speed | Polish | Top Issue | Severity | Tags | Resolution | BL-XXX | Status |
|----|------|--------|---------|-------|---------|------------|-------|-------|--------|-----------|----------|------|------------|--------|--------|
| — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| FB-001 | 2026-05-03 | internal-dry-run | All | 1 | — | — | — | — | — | Stale session list (100+ entries) | P0 | demo-blocker, frontend | FIXED — `reset_demo_data.sh --yes` clears sessions. Seed now includes GLPI adapter. | — | Resolved |
| FB-002 | 2026-05-03 | internal-dry-run | All | 1 | — | — | — | — | — | Header API port label incorrect | P1 | trust-gap, frontend | FIXED — page.tsx now reads NEXT_PUBLIC_API_BASE_URL env var | — | Resolved |
| FB-003 | 2026-05-04 | internal-preflight | Helpdesk/Governance | 1 | 4 | 3 | 3 | 4 | 3 | GLPI adapter missing from seed — FK violation after reset | P1 | backend, connector | FIXED — Added glpi-adapter-001 ticketing adapter + conn-inst-glpi-001 to seed.ts | — | Resolved |
| FB-004 | 2026-05-04 | internal-preflight | Helpdesk | 1 | 3 | 3 | 3 | 4 | 3 | "Zammad mode" header label misleading (GLPI also real) | P2 | trust-gap, frontend | Logged — minor honesty gap, not a demo-blocker | — | Open |
| FB-005 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | — | — | — | — | No session search/filter | P2 | frontend | Logged for future iteration | — | Open |
| FB-006 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | — | — | — | — | No "Start here" guided walkthrough | P2 | frontend, docs | Logged — TEST_SCRIPT.md is the walkthrough for now | — | Open |

---

## Summary Statistics

*Update after each testing round.*

| Round | Date | Total | P0 | P1 | P2 | P3 | P4 | Fixed | Backlogged | Documented |
|-------|------|-------|----|----|----|----|----|-------|------------|------------|
| 1     | 2026-05-04 | 6 | 0 | 1 | 3 | 0 | 0 | 2 | 4 | 0 |
