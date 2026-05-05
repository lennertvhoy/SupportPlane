# SupportPlane User Testing Triage Workflow

**Purpose:** Define how to process tester feedback from the SupportPlane user testing
operations and turn it into actionable work.

**Demo URLs:** Web `http://localhost:3300` | API `http://localhost:4210`

**Demo Credentials:** `admin@supportplane.local` / `supportplane-demo` / `dev-tenant`

**Next Backlog ID:** BL-138 (last used: BL-137)

---

## 1. Severity Levels

Every issue found during testing must be assigned exactly one severity level.

| Severity          | Description                                                               | Action                                   |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| P0 / Demo-Blocker | Demo is unusable, crashes, or shows wrong data that would mislead testers | Fix immediately, pause testing           |
| P1 / Major        | Core flow broken or misleading, honest labels missing/contradictory       | Fix within current testing round         |
| P2 / Minor        | Cosmetic issue, confusing label, slow loading                             | Log for next iteration                   |
| P3 / Enhancement  | Feature request or nice-to-have                                           | Backlog for future milestone             |
| P4 / Noted        | Out of scope, intentional limitation, or expected mock behavior           | Document in known limitations, no action |

**P0 override rule:** If a tester cannot complete a documented demo flow because of an
unexpected error, missing feature, or contradictory label, it is P0 regardless of how
small the fix looks.

---

## 2. Issue Tagging Taxonomy

Each issue may carry one or more tags. Tags help route work to the right person and
track patterns across testing rounds.

| Tag            | Meaning                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| `demo-blocker` | Prevents testers from completing demo flows                                                |
| `UX-confusion` | Unclear labels, confusing navigation, missing context                                      |
| `trust-gap`    | Honesty issue — something labeled wrong, mock presented as real, or real presented as mock |
| `fake-feeling` | Feature feels simulated or placeholder (may be intentional)                                |
| `performance`  | Slow loading, timeouts, lag                                                                |
| `docs`         | Documentation is wrong, missing, or stale                                                  |
| `backend`      | API error, wrong response, missing endpoint                                                |
| `frontend`     | UI bug, layout issue, broken interaction                                                   |
| `connector`    | Zammad/GLPI/osTicket connector issue                                                       |
| `governance`   | Policy, RBAC, audit, or safety enforcement issue                                           |

**Tagging rules:**

- A `trust-gap` tag on any severity level **must** be treated as P1 or higher. Honesty
  is non-negotiable.
- If an item could be both `UX-confusion` and `docs`, prefer `docs` when the fix is a
  documentation change and `UX-confusion` when the fix is a UI change.
- `fake-feeling` is acceptable for known mock-only features; tag it `fake-feeling` +
  `P4` unless the mock behavior is hidden or misleading.

---

## 3. How to Turn Tester Feedback into Backlog Items

### Step 1: Collect Raw Feedback

Gather all input from:

- `FEEDBACK_FORM.md` responses
- `BUG_REPORT_TEMPLATE.md` submissions
- Tester notes, screenshots, or verbal comments transcribed during the session

### Step 2: Classify Each Item

For each distinct piece of feedback, assign:

1. A **severity level** (P0–P4) from the table in Section 1.
2. One or more **tags** from the taxonomy in Section 2.

### Step 3: Determine Disposition

| Type                 | Criteria                                                                      | Action                                                                         |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Bug**              | Code behaves incorrectly — crashes, wrong data, broken interaction            | Fix with verification, capture evidence                                        |
| **Honesty gap**      | Label, badge, or status message contradicts actual behavior                   | Fix labels/docs; add honest unavailable response if feature is missing         |
| **Feature request**  | A capability the tester wanted that does not exist                            | Backlog as `[planned]`, link to existing BL if it covers the scope             |
| **Known limitation** | Already documented in `KNOWN_DEMO_LIMITATIONS.md` or an accepted BL non-claim | Log as P4, no action; update `KNOWN_DEMO_LIMITATIONS.md` if not already listed |

### Step 4: Create Backlog Items

For non-trivial P1 and P2 items that are not already covered by an existing BL:

1. Assign the next available BL-XXX ID (start at BL-138).
2. Add a row to `BACKLOG.md` with honest status markers.
3. Link the BL to the feedback ID (FB-XXX) in the description.

### Step 5: Update the Active Queue

Add P0 and P1 items to `NEXT_ACTIONS.md` immediately. P2 items may wait until the
current active queue is drained.

### Step 6: Set Priority

Backlog priority maps directly from severity:

- P0 → immediate, blocks current round
- P1 → this round, before next tester
- P2 → next iteration
- P3 → future milestone (no urgency)
- P4 → no work item (document only)

---

## 4. Acceptance-Grade Proof for Fixes

When triage results in a code change, the fix is not complete until all of the
following are produced:

| Requirement                          | Evidence                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Code change committed                | Full commit hash in handoff                                                                    |
| Tests pass                           | Exact command and pass/fail count (e.g., `npm test --workspace apps/api — 210 pass, 0 fail`)   |
| Browser screenshot (if user-visible) | Screenshot in `output/playwright/session-NNN-.../` showing the fixed behavior                  |
| No regression                        | `npm run lint`, `npm run typecheck`, and relevant verifier scripts all pass                    |
| State docs updated                   | `BACKLOG.md`, `NEXT_ACTIONS.md`, `STATUS.md`, `PROJECT_STATE.yaml` reflect the change honestly |
| Clean worktree                       | `git status --short --branch` output shows zero modifications                                  |
| Evidence logged                      | New entry in `docs/EVIDENCE_LOG.md`                                                            |

**Trust-gap fix rule:** A fix for any `trust-gap` issue requires a **before** and
**after** screenshot plus an audit of all similar labels/components to ensure the same
gap does not exist elsewhere.

---

## 5. Testing Round Checklist

Run this checklist at the end of each testing round (or daily during active testing).

- [ ] Collect all feedback forms from current round
- [ ] Log every item in `FEEDBACK_LOG.md` with ID, severity, tags
- [ ] Classify each item: bug / honesty-gap / feature / known-limitation
- [ ] Prioritize: P0/P1 → fix now, P2 → next iteration, P3 → backlog, P4 → document
- [ ] Run `scripts/capture_demo_bug_context.sh` for any P0/P1 bug (captures cluster state, logs, and API health)
- [ ] Create BL items for non-trivial P1/P2 items not already covered
- [ ] Update `KNOWN_DEMO_LIMITATIONS.md` if new limitations discovered
- [ ] Reset demo data if test data accumulated: `bash scripts/reset_demo_data.sh`
- [ ] Run smoke test before next round: `bash scripts/verify_user_testing_demo.sh`
- [ ] Summarize round in `WORKLOG.md`

---

## 6. When to Stop Testing and Fix Blockers

Testing must pause under these conditions. Do not continue to the next tester until the
blocker is resolved and re-verified.

| Trigger                       | Action                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| ANY P0 demo-blocker found     | Stop testing. Fix. Re-verify with evidence before continuing.                              |
| 3+ P1 issues in the same flow | Stop testing for that flow only. Fix before next tester round.                             |
| Honesty gap (wrong label)     | Fix immediately. Re-capture evidence for the affected panel.                               |
| Secret exposure               | Stop everything. Redact. Fix root cause. Scan all evidence folders for the leaked pattern. |

**Secret exposure escalation:** If a raw secret, token, or password is found in any
evidence file, API response, UI element, or log output:

1. Stop all testing immediately.
2. Redact the secret from all committed files.
3. Identify and fix the root cause (missing redaction, debug log, etc.).
4. Run `grep -r <secret-pattern> output/playwright/` across all evidence folders.
5. Replace any contaminated evidence.
6. Do not resume testing until the scan is clean.

---

## 7. Feedback Log Template

The file `FEEDBACK_LOG.md` (same directory) tracks every piece of tester feedback with
the following table structure:

| ID     | Date       | Source      | Severity       | Tags       | Description              | Resolution                                | BL-XXX      |
| ------ | ---------- | ----------- | -------------- | ---------- | ------------------------ | ----------------------------------------- | ----------- |
| FB-001 | YYYY-MM-DD | Tester name | P0/P1/P2/P3/P4 | tag1, tag2 | What the tester reported | fix / documented / backlogged / no-action | BL-XXX or — |

**Column rules:**

- **ID:** Sequential, starting at FB-001. Never reuse IDs.
- **Date:** ISO format (`YYYY-MM-DD`).
- **Source:** Tester name or identifier.
- **Severity:** Must be one of the five defined levels.
- **Tags:** Comma-separated, must use values from the taxonomy.
- **Description:** One sentence summarizing the issue. Be specific.
- **Resolution:** What happened — `fixed`, `documented as known limitation`, `backlogged as BL-XXX`, `no action — P4`.
- **BL-XXX:** Backlog ID if a new BL item was created. Use `—` if no BL was created.
