# Feedback-to-Backlog Triage Rules

**Purpose:** Consistent, evidence-backed rules for converting raw tester feedback
into actionable backlog items with correct severity, priority, and evidence
requirements.

---

## Severity Levels

### P0 — Demo Blocker
**Definition:** The demo is fundamentally broken. Tester cannot complete the
test script. Must fix before any further tester sessions.

**Examples:**
- API or Web unreachable during a tester session
- Login fails for all users
- Connector status shows "error" for a connector that should be "configured"
- Session creation fails
- Browser renders a blank or broken page
- Raw secret or credential exposed in UI or API response

**Action:** Stop the round. Fix immediately. Re-run full validation gate.
Re-assign tester after fix. Do NOT invite new testers until resolved.

**Evidence required before closing:** Git commit with fix, fresh smoke test
10/10, browser screenshot proving fix, updated validation gate.

---

### P1 — Trust/Confusion Gap
**Definition:** The demo works but the tester expressed significant doubt,
confusion, or mistrust about a core aspect. This undermines the demo's
credibility.

**Examples:**
- Connector shows "mock" or "fixture" when tester expected "real"
- Misleading labels or badges (e.g., "Zammad mode" when GLPI is also real)
- Tester cannot find a key feature without guidance
- Error message is cryptic or missing
- Blank panel with no explanation
- Tester questions whether data is real or simulated

**Action:** Create a backlog item targeted for the next sprint/slice.
Document the exact confusion point with tester quote.

**Evidence required before closing:** Affected UI panel or API response
screenshot showing the fix, plus validation gate pass.

---

### P2 — Polish/Surface Improvement
**Definition:** The demo works correctly but the tester noted something that
could be nicer, faster, or more intuitive.

**Examples:**
- Missing search/filter on a list
- No "Start here" guidance for new users
- Button placement or labeling could be clearer
- Favicon missing (404 in console)
- Loading states or empty states could be improved

**Action:** Group by frequency. If 2+ testers mention the same P2 issue,
escalate to P1. Otherwise, backlog for a future polish slice.

**Evidence required before closing:** Screenshot of the improvement, or
doc-only change with commit hash.

---

### P3 — Nice-to-Have / Future
**Definition:** Valid idea but not blocking demo credibility or workflow.

**Examples:**
- "It would be nice to have dark/light mode toggle"
- "Add keyboard shortcuts"
- "Support more connector types"
- "Add dashboards or analytics"

**Action:** Add to BACKLOG.md with [planned] status. Do not schedule
until higher-priority items are cleared.

**Evidence required:** None required at this stage. Only a backlog entry.

---

## Tagging Taxonomy

Apply these tags to each feedback entry in `FEEDBACK_LOG.md`:

| Tag | Meaning |
|-----|---------|
| `demo-blocker` | Prevents tester from completing the test script |
| `trust-gap` | Tester doubts the demo is real/serious |
| `ux-confusion` | Tester couldn't find or understand a feature |
| `frontend` | Issue in the Web UI |
| `backend` | Issue in the API or data layer |
| `connector` | Issue with Zammad, GLPI, osTicket, MeshCentral, Fortinet |
| `docs` | Missing or misleading documentation |
| `performance` | Slow loading, lag, or timeout |
| `security` | RBAC bypass, secret exposure, cross-tenant leak |
| `completeness` | Feature exists but is partial/mock when tester expected real |

## Triage Workflow Per Tester

1. **Collect** feedback form, bug reports, and debrief notes
2. **Log** each distinct finding in `FEEDBACK_LOG.md`
3. **Classify** each finding as P0/P1/P2/P3
4. **Tag** each finding with the taxonomy above
5. **Create** backlog items in `BACKLOG.md` for P0 and P1
6. **Fix** P0 items immediately (before next tester)
7. **Schedule** P1 items for the next sprint
8. **Update** `TEST_ROUND_001_CONTROL.md` with triage status
9. **Run** bug context capture for the session
10. **Run** close script to log and verify clean state
