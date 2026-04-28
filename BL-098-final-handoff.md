# BL-098 Final Handoff — Connector Runtime Configuration + Credential Reference Readiness Foundation (Closure Repair)

## Commits

- `36e51607bee95232bec4f7d49f3aea67b4937053` — BL-098 closure repair: idempotent seed, provenance wiring, screenshot script, docs

## Worktree

```
## main
```
(Clean worktree — no uncommitted changes.)

## What Changed

- **prisma/seed.ts:** Converted all demo entity creation to `upsert` with fixed IDs. Canonical credential references: `cred-ref-dev-001` (active) and `cred-ref-dev-002` (inactive). Only `cred-ref-dev-001` linked to `conn-inst-dev-001`. Eliminates prior credential pollution (15 duplicate test creds from non-idempotent seed).
- **scripts/bl098_screenshots.js:** Complete rewrite.
  - Outputs to `output/playwright/session-099-bl098-closure-repair-final/`
  - Hard-fail on >20 screenshots and duplicate MD5 hashes
  - Pre-creates session and ticket context via API so UI panels populate with real data
  - Uses correct `POST /delivery-policies/{id}/validate` endpoint (fixed from prior 404 bug)
  - Captures 15 screenshots covering all required proof states
- **scripts/verify_connector_runtime_readiness.sh:** Updated step 10 to assert deterministic `len(creds)==1` after reset/seed.
- **apps/web/components/TicketContextPanel.tsx:** Added optional `connectorInstallation` prop rendering "Connector Runtime Provenance" card with installation name, type, mock mode, network status, linked credential count, and capabilities.
- **apps/web/app/page.tsx:** Added `connectorInstallations` state, `fetchConnectorInstallations` callback, and passes active installation to `TicketContextPanel`.
- **apps/api/src/connector-installations/connector-runtime.service.ts:** Removed unused `ConnectorCredentialReferenceShape` import (lint fix).
- **apps/api/test/api.test.ts:** Removed unused `installation` variable (lint fix).
- **Deleted old screenshot folder:** `output/playwright/session-098-connector-runtime-readiness-final-closure/` superseded and removed per repair rules.

## Verification

- `npm run lint` — passed
- `npm run typecheck --workspaces --if-present` — passed (0 errors across 9 workspaces)
- `npm run validate` — passed
- `npm run health` — passed
- `cd apps/api && npm test` — passed (142/142 tests, 14 suites)
- `npm test --workspace @supportplane/contracts` — passed (29/29 tests, 6 suites)
- `npm test --workspace @supportplane/web` — passed (15/15 tests, 1 suite)
- `npm test --workspace @supportplane/connectors` — passed (16/16 tests, 6 suites)
- `bash scripts/verify_connector_runtime_readiness.sh` — passed (12/12 checks)
- API runtime: `http://localhost:4110` (NestJS, PostgreSQL store, local auth)
- Web runtime: `http://localhost:3200` (Next.js)
- Screenshot script: 15 screenshots, 0 duplicate MD5 hashes
- Prisma validate/generate/migrate status: schema valid, client generated, database up to date

## Evidence Inventory

- **Folder:** `output/playwright/session-099-bl098-closure-repair-final/`
- **Count:** 15 screenshots
- **Duplicate MD5 hashes:** 0

| # | Filename | Proof State |
|---|----------|-------------|
| 1 | `01-admin-runtime-identity.png` | Admin runtime identity with tenant/role pill |
| 2 | `02-admin-connector-clean-credentials.png` | Connector panel with exactly 1 linked credential reference |
| 3 | `03-admin-config-validation-valid.png` | Config validation: valid=true, mock-only flags (label matches content) |
| 4 | `04-api-config-validation-unsafe-rejected.png` | Unsafe config rejected via API |
| 5 | `05-admin-runtime-readiness-panel.png` | Runtime readiness: mockReady, realNetwork:false, 1 linked credential |
| 6 | `06-api-runtime-resolve-credential-metadata.png` | Runtime resolver: credential metadata, no secretRef |
| 7 | `07-admin-ticket-context-provenance.png` | Ticket context panel: Connector Runtime Provenance card visible |
| 8 | `08-admin-evidence-bundle-summary.png` | Evidence bundle summary with connector safety fields |
| 9 | `09-api-evidence-bundle-json-no-secret.png` | Evidence bundle JSON (no secret leakage) |
| 10 | `10-api-audit-bl098-events.png` | Audit trail with populated BL-098 events (not empty) |
| 11 | `11-viewer-readonly-connector-panel.png` | Viewer read-only connector panel |
| 12 | `12-api-viewer-mutation-denied.png` | Viewer mutation denial via API (403) |
| 13 | `13-api-cross-tenant-denied.png` | Cross-tenant access denied (404) |
| 14 | `14-api-delivery-policy-denies-writeback.png` | Delivery policy denies writeback |
| 15 | `15-final-mock-no-secret-proof.png` | Final mock/no-secret proof with visible content |

## Risks and Limitations

- Config schema is hardcoded for mock-only Zammad-local development; no dynamic schema generation.
- Runtime readiness `mockReady` depends only on `mockMode && enabled` flags; no actual external health checks.
- Secret resolution is not implemented; `secretResolutionImplemented: false` is hardcoded on all credential metadata.
- No production credential broker, Vault/KMS, or encrypted secret storage exists.
- All behavior remains local/mock-only with visible UI warnings.

## Next Recommended Action

- **BL-099:** Connector Runtime Test Coverage + Documentation Hardening — review BL-098 for gaps, add unit tests for `ConnectorRuntimeService` edge cases, update architecture docs with runtime flow diagrams.
- **BL-100:** Real Writeback Path Design Document — draft architecture for real Zammad writeback with credential broker integration, approval gates, and audit trail.

## Handoff for CTO Lane

BL-098 closure repair is closure-grade complete. All prior defects fixed:
- Seed idempotency: exactly 1 credential ref linked, no pollution
- Screenshot labels match visible content; no contradictions
- Audit/evidence screenshots show populated data, not empty panels
- Ticket/customer connector provenance card is visibly rendered in UI
- All validation gates passed with exact counts
- Worktree clean, full commit hash recorded, old folder deleted
Ready for CTO review and next-slice assignment.
