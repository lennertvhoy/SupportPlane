# SupportPlane — Test Round 001 Plan

---

## Round Info

| Field | Value |
|-------|-------|
| **Round label** | `ROUND-001` |
| **Date** | 2026-05-03 |
| **Backlog ID** | BL-139 |
| **Status** | In progress |
| **Demo URL** | `http://localhost:3300` |
| **API URL** | `http://localhost:4210` |

---

## Tester List

| # | Name / ID | Role | Persona | Assigned flows | Status |
|---|-----------|------|---------|---------------|--------|
| 1 | `tester-001` | — | MSP Owner / IT Manager | A, B, C, D, E | Pending |
| 2 | `tester-002` | — | Helpdesk Operator | A, B, E | Pending |
| 3 | `tester-003` | — | Security / Governance Reviewer | A, C, D, E | Pending |
| 4 | `tester-004` | — | Technical Admin | C, D, E | Pending |
| 5 | `tester-005` | — | Skeptical Enterprise Buyer | A, B, C, D, E | Pending |
| 0 | `internal-dry-run` | — | All personas | All flows | In progress |

---

## Target Personas

See **[TESTER_PERSONAS.md](./TESTER_PERSONAS.md)** for full descriptions.

Each tester should be assigned exactly one persona from the table above before starting. The persona determines which flows to focus on and which questions to prioritize.

---

## Flows to Validate

| Flow | Description | Target time | Key evidence |
|------|-------------|-------------|-------------|
| **Flow A** | First impressions & cockpit layout | 5 min | Header badge clarity, panel labels, honesty signals |
| **Flow B** | Zammad real sandbox ticket | 5 min | Ticket context loads, provenance labels correct, transport=real |
| **Flow C** | GLPI real sandbox ticket | 5 min | Second connector verified, labels distinct from Zammad |
| **Flow D** | Governance, policy & audit | 5–8 min | Connector status panel, policy editor, audit explorer |
| **Flow E** | What feels wrong? | 5 min | Unlabeled friction, confusing terms, trust gaps |

---

## Success Criteria

| # | Criterion | How measured |
|---|-----------|--------------|
| 1 | All testers can log in without help | Zero assistance requests for login |
| 2 | All testers complete Flow B (Zammad) without hitting a dead-end | 100% completion rate |
| 3 | All testers complete Flow C (GLPI) without hitting a dead-end | 100% completion rate |
| 4 | 80%+ of testers correctly identify which connectors are real vs fixture | Post-test quiz or feedback form check |
| 5 | No P0 demo-blockers found | Zero issues tagged P0 |
| 6 | ≤ 3 P1 issues found | Small enough to fix this round |
| 7 | All SEC/BUG reviewers confirm no secrets visible in UI/API | Explicit check in feedback form |
| 8 | ≥ 3 testers rate Clarity ≥ 3/5 | Feedback form ratings table |

---

## Stop-Testing Criteria

Stop the round immediately and fix the issue before continuing to the next tester if:

1. **Any P0 demo-blocker found** — System crashes, unreachable, or shows wrong data to testers.
2. **Any honesty gap found** — A label or status message contradicts actual behavior (e.g., "real" when it's mock, "connected" when it's not).
3. **Any raw secret, token, or password exposed** — In UI, API response, browser dev tools, or evidence.
4. **3+ P1 issues in the same flow** — Indicates the flow is fundamentally broken.

See **[TRIAGE_WORKFLOW.md](./TRIAGE_WORKFLOW.md)** Section 6 for full stop-testing rules.

---

## Triage Meeting Checklist

After all testers have submitted feedback, run through this checklist before closing the round:

- [ ] Collect all feedback forms from this round
- [ ] Log every item in `FEEDBACK_LOG.md` with ID, severity, tags
- [ ] Classify each item: bug / honesty-gap / feature / known-limitation
- [ ] Prioritize: P0/P1 → fix now, P2 → next iteration, P3 → backlog, P4 → document
- [ ] Run `scripts/capture_demo_bug_context.sh` for any P0/P1 bug
- [ ] Create BL items for non-trivial P1/P2 items not already covered
- [ ] Update `KNOWN_DEMO_LIMITATIONS.md` if new limitations discovered
- [ ] Reset demo data if needed: `bash scripts/reset_demo_data.sh`
- [ ] Run smoke test before next round: `bash scripts/verify_user_testing_demo.sh`
- [ ] Summarize round in `WORKLOG.md`
- [ ] Update `FEEDBACK_LOG.md` summary statistics table
- [ ] Decide: proceed to Round 002, or fix blockers first

---

## Tester Briefing

Before each tester starts, the demo operator should:

1. Confirm the demo URL is accessible (`curl -s http://localhost:3300 | head` returns HTML).
2. Confirm the smoke test passes (`bash scripts/verify_user_testing_demo.sh` reports 10/10 PASS).
3. Hand the tester this plan and the **[FIRST_TEST_ROUND.md](./FIRST_TEST_ROUND.md)** packet.
4. Assign a persona (or let the tester self-select from the 5 options).
5. Remind the tester: **"You cannot break anything. Honest feedback is the goal."**
6. Do NOT walk through the flows with the tester — we want to see where they get stuck on their own.

---

## Round Close Criteria

This round is closed when:

1. All testers have submitted feedback.
2. All P0/P1 items are either fixed, backlogged, or documented as known limitations.
3. `FEEDBACK_LOG.md` is updated with all entries.
4. `WORKLOG.md` has a round summary.
5. `BACKLOG.md` reflects any new BL items created.
6. A round retrospective is written in `TEST_ROUND_001_INTERNAL_DRY_RUN.md`.
