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

| ID | Date | Source | Severity | Tags | Description | Resolution | BL-XXX |
|----|------|--------|----------|------|-------------|------------|--------|
| FB-001 | 2026-05-03 | internal-dry-run | P0 | demo-blocker, frontend | Session list has 100+ stale entries from prior testing — first-time testers overwhelmed | Documented as known limitation — `reset_demo_data.sh` required before testing | — |
| FB-002 | 2026-05-03 | internal-dry-run | P1 | trust-gap, frontend | Header API label shows `localhost:4110` but cluster API is on `4210` | Fixed — page.tsx now reads NEXT_PUBLIC_API_BASE_URL env var | — |

---

## Summary Statistics

*Update after each testing round.*

| Round | Date | Total | P0 | P1 | P2 | P3 | P4 | Fixed | Backlogged | Documented |
|-------|------|-------|----|----|----|----|----|-------|------------|------------|
| 1     | 2026-05-03 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |
