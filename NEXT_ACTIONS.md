# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-01 11:30 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-129] **Windows endpoint agent compatibility foundation**
  - Owner: current slice
  - Next action: complete browser proof, runtime identity verification, evidence capture, and documentation.
  - Exit criteria: Platform badges visible in UI, mocked Windows device in seed, policy tests prove platform denial, agent collectors are platform-aware, backlog truth repaired for BL-065/BL-067.

- [BL-065] **Low-risk remediation end-to-end result**
  - Owner: future remediation hardening slice
  - Next action: safely implement at least one low-risk remediation (e.g., flush DNS) so it executes end-to-end after approval and returns a real result.
  - Exit criteria: Approved remediation completes with result proof in API/browser evidence.

- [BL-130/BL-133] **Windows real-runner verification and packaging**
  - Owner: future Windows hardening slice
  - Next action: real Windows runner CI harness or manual verification on Windows host.
  - Exit criteria: Agent runs on Windows, registers, heartbeat, diagnostics proven on real Windows runtime.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
