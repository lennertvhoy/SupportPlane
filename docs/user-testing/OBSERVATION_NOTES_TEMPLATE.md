# SupportPlane — Tester Observation Notes

**Purpose:** Structured template for observing a tester during their demo session.
Fill this out during or immediately after each tester session. Use one template
per tester.

---

## Session Metadata

| Field                   | Value                                             |
| ----------------------- | ------------------------------------------------- |
| **Tester name/persona** |                                                   |
| **Date/time**           |                                                   |
| **Screen share?**       | Yes / No                                          |
| **Recording?**          | Yes / No                                          |
| **Flow attempted**      | (e.g., all 5 flows, Zammad only, governance only) |
| **Duration**            | (actual time spent)                               |

---

## Observation Log

### Where Did the Tester Hesitate?

> Describe any point where the tester paused, looked confused, or asked for help.
> Include timestamps if possible.

-

### What Did the Tester Say? (Verbatim Quotes)

> Exact quotes are more valuable than paraphrases.

-

### What Flowed Well?

> Parts the tester navigated without help or hesitation.

-

### What Bugs or Errors Appeared?

> Any visible error messages, blank panels, broken links, or unexpected behavior.

| #   | Panel / Action | What Happened | Severity (P0-P4) |
| --- | -------------- | ------------- | ---------------- |
| 1   |                |               |                  |
| 2   |                |               |                  |

### Trust Gaps

> Did the tester express doubt about the product? About the demo vs real
> distinction? About AI safety? About completeness?

-

### Next Action for This Tester

> What should the operator do next? Follow-up question, re-test specific flow,
> file a bug, etc.

- ***

## Evidence Reference

| Artifact             | Path                                 |
| -------------------- | ------------------------------------ |
| Bug context captured | `output/playwright/bug-context/`     |
| Evidence folder      | `output/playwright/session-NNN-.../` |
| Tester feedback form | (from tester)                        |

---

## Post-Session Checklist

- [ ] Bug context captured (`bash scripts/capture_demo_bug_context.sh --bug-id ROUND-XXX`)
- [ ] Feedback logged in `docs/user-testing/FEEDBACK_LOG.md`
- [ ] Severity triaged per `docs/user-testing/TRIAGE_WORKFLOW.md`
- [ ] Backlog item created if P0/P1
- [ ] Demo reset for next tester (`bash scripts/reset_demo_data.sh --yes`)
