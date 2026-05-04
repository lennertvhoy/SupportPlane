# SupportPlane User Testing Feedback Log

**Purpose:** Central log of all tester feedback collected during SupportPlane user
testing operations. Each row is one distinct piece of feedback.

**Linked documents:**

- `docs/user-testing/TRIAGE_WORKFLOW.md` — how to process these entries
- `docs/user-testing/FEEDBACK_TO_BACKLOG_RULES.md` — severity classification rules
- `docs/user-testing/TEST_ROUND_001_CONTROL.md` — tester slots and status
- `BACKLOG.md` — where BL items live

---

## Feedback Entries

| ID | Date | Tester ID | Persona | Round | Invited At | Completed At | Overall Go/No-Go | Top Quote | Clarity | Usefulness | Trust | Speed | Polish | Observed Hesitation | P0 Count | P1 Count | P2 Count | P3 Count | Backlog Items Created | Bug Context Captured | Next Follow-up | Top Issue | Severity | Tags | Resolution | BL-XXX | Status |
|----|------|-----------|---------|-------|------------|--------------|-------------------|-----------|---------|------------|-------|-------|--------|---------------------|----------|----------|----------|----------|-----------------------|----------------------|----------------|-----------|----------|------|------------|--------|--------|
| — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| FB-001 | 2026-05-03 | internal-dry-run | All | 1 | — | 2026-05-03 | GO | — | — | — | — | — | — | — | 0 | 0 | 0 | 0 | 0 | Yes | — | Stale session list (100+ entries) | P0 | demo-blocker, frontend | FIXED — `reset_demo_data.sh --yes` clears sessions. Seed now includes GLPI adapter. | — | Resolved |
| FB-002 | 2026-05-03 | internal-dry-run | All | 1 | — | 2026-05-03 | GO | — | — | — | — | — | — | — | 0 | 1 | 0 | 0 | 0 | Yes | — | Header API port label incorrect | P1 | trust-gap, frontend | FIXED — page.tsx now reads NEXT_PUBLIC_API_BASE_URL env var | — | Resolved |
| FB-003 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | 2026-05-04 | GO | — | — | — | — | — | — | — | 0 | 1 | 0 | 0 | 0 | Yes | — | GLPI adapter missing from seed | P1 | backend, connector | FIXED — Added glpi-adapter-001 to seed.ts | — | Resolved |
| FB-004 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | 2026-05-04 | GO | — | — | — | — | — | — | — | 0 | 0 | 1 | 0 | 0 | Yes | — | "Zammad mode" header label misleading | P2 | trust-gap, frontend | FIXED — Changed to "Sandbox mode" | — | Resolved |
| FB-005 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | 2026-05-04 | GO | — | — | — | — | — | — | — | 0 | 0 | 1 | 0 | 0 | Yes | — | No session search/filter | P2 | frontend | FIXED — Added in BL-141 session 152 | BL-141 | Resolved |
| FB-006 | 2026-05-04 | internal-preflight | Helpdesk | 1 | — | 2026-05-04 | GO | — | — | — | — | — | — | — | 0 | 0 | 1 | 0 | 0 | Yes | — | No "Start here" guided walkthrough | P2 | frontend, docs | FIXED — DemoGuidePanel added in BL-141 session 152 | BL-141 | Resolved |

---

## Summary Statistics

*Update after each testing round.*

| Round | Date | Total | P0 | P1 | P2 | P3 | P4 | Fixed | Backlogged | Documented |
|-------|------|-------|----|----|----|----|----|-------|------------|------------|
| 1 | 2026-05-04 | 6 | 0 | 1 | 3 | 0 | 0 | 2 | 4 | 0 |
