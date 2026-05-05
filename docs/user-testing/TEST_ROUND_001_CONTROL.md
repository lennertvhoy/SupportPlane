# Test Round 001 — Control Sheet

**Round:** 001
**Status:** OPEN — Awaiting first real tester
**Created:** 2026-05-04
**Round Owner:** SupportPlane development team

## Purpose

Track tester invitations, completed sessions, and feedback triage status for
the first live tester round.

## Tester Slots

| Slot | Tester ID | Assigned Persona | Invited | Scheduled | Completed | No-Show | Feedback Received | Bug Context Captured | Triage Status | Backlog Items |
| ---- | --------- | ---------------- | ------- | --------- | --------- | ------- | ----------------- | -------------------- | ------------- | ------------- |
| 1    | TBD       | (to assign)      | No      | No        | No        | No      | No                | No                   | Pending       | —             |
| 2    | TBD       | (to assign)      | No      | No        | No        | No      | No                | No                   | Pending       | —             |
| 3    | TBD       | (to assign)      | No      | No        | No        | No      | No                | No                   | Pending       | —             |
| 4    | TBD       | (to assign)      | No      | No        | No        | No      | No                | No                   | Pending       | —             |
| 5    | TBD       | (to assign)      | No      | No        | No        | No      | No                | No                   | Pending       | —             |

## Persona Assignment Guidelines

Assign each tester one of the 5 personas from `TESTER_PERSONAS.md`:

1. **MSP Owner** — Business value, workflow fit, trust assessment
2. **Helpdesk Operator** — Usability, speed, daily-task fit
3. **Security Reviewer** — RBAC, audit, policy, safety
4. **Technical Admin** — Connector setup, configuration, integration realism
5. **Skeptical Buyer** — Honesty, limitations, competitive comparison

Rotate personas across slots to ensure full coverage.

## Round Logistics

- **Demo URL:** http://localhost:3300 (local sandbox only — no public tunnel)
- **API URL:** http://localhost:4210
- **Test Script:** `TEST_SCRIPT.md` (20-30 min guided test)
- **Feedback Form:** `FEEDBACK_FORM.md`
- **Bug Report:** `BUG_REPORT_TEMPLATE.md`
- **Preflight Script:** `scripts/preflight_tester_session.sh`
- **Close Script:** `scripts/close_tester_session.sh`

## Pre-Session Checklist (per tester)

- [ ] Run `bash scripts/preflight_tester_session.sh` → GO/NO-GO
- [ ] Confirm demo reset complete (sessions list clean)
- [ ] Confirm Zammad and GLPI are configured/real
- [ ] Smoke test 10/10 PASS
- [ ] Assign persona and record in this sheet
- [ ] Send outreach message via `OUTREACH_MESSAGE.md`
- [ ] Confirm tester has access to Web URL
- [ ] Remind tester: sandbox only, no real data, writeback blocked

## Post-Session Checklist (per tester)

- [ ] Collect feedback form from tester
- [ ] Run `bash scripts/capture_demo_bug_context.sh --bug-id ROUND-001-{tester_id}`
- [ ] Log feedback in `FEEDBACK_LOG.md`
- [ ] Triage findings per `FEEDBACK_TO_BACKLOG_RULES.md`
- [ ] Create backlog items for P0/P1 findings
- [ ] Run `bash scripts/close_tester_session.sh`
- [ ] Update this control sheet with completion status

## Round Success Criteria

- [ ] ≥ 3 testers complete the full test script
- [ ] ≥ 3 personas covered
- [ ] All P0 demo blockers resolved before next tester
- [ ] All P1 trust/confusion gaps triaged into backlog
- [ ] Feedback log updated with structured entries
- [ ] Bug context captured for every session

## Stop-Testing Rules

Stop the round immediately if:

- Any tester encounters a P0 blocker that makes the demo unusable
- API or Web becomes unreachable during a session
- Any connector returns critical error (not just fixture/unconfigured)
- A security-sensitive issue is discovered (raw secrets, cross-tenant leak)

Do NOT resume testing until all P0 blockers are resolved and validated.
