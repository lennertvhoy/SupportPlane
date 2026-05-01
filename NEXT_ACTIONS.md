# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-01 09:20 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-061/BL-062/BL-064/BL-068] **Remote Tool Execution Safety Foundation**
  - Owner: next implementation slice
  - Next action: add ToolManifest schema/signing placeholder, explicit tool registry, policy evaluator for role/tenant/device/risk/allowlist, read-only tool invocation audit path, and safety tests proving arbitrary shell remains blocked.
  - Exit criteria: fixed read-only tools flow through policy and audit without arbitrary execution or remediation.

- [BL-057/BL-118] **Endpoint diagnostics completion gaps**
  - Owner: next endpoint hardening slice
  - Next action: add robust installed software/package inventory where portable, consent/enrollment hardening, and broader diagnostics evidence.
  - Exit criteria: BL-057 and BL-118 can be accepted without diagnostic coverage caveats.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
