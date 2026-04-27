# Support Case Workflow Foundation (BL-091)

**Purpose:** Document the end-to-end support case workflow that unifies calls, customers, tickets, sessions, observations, connector validation, support note drafts, and evidence bundles into a coherent cockpit.

**Status:** Implemented and closure-verified. All behavior is deterministic local/mock-only with visible UI warnings.

## Workflow Overview

1. **Login** → Local auth with tenant-scoped identity
2. **Session Management** → Create or select a SupportSession
3. **Call Simulation** → Simulate incoming call with caller matching (mock-only)
4. **Call Linking** → Link matched call to selected session
5. **Ticket Context** → Load ticket from Zammad connector (mock-only)
6. **Connector Validation** → Test and validate connector installations (mock-only)
7. **Support Note Drafts** → Generate deterministic local-only draft (not real AI, not sent to Zammad)
8. **Case Timeline** → View unified timeline of all session events
9. **Evidence Bundle** → Export session data as JSON/Markdown with mock disclaimers

## API Endpoints

### Tickets
- `GET /tickets` — List tickets for tenant (requires `ticket:read`)
- `GET /tickets/:id` — Get single ticket by ID (requires `ticket:read`)

### Connector Installations
- `GET /connector-installations` — List installations (requires `connector_installation:read`)
- `GET /connector-installations/:id` — Get single installation (requires `connector_installation:read`)
- `PATCH /connector-installations/:id` — Update installation (requires `connector_installation:write`)
- `POST /connector-installations/:id/validate` — Validate installation (requires `connector_installation:test`)
- `POST /connector-installations/:id/test` — Test installation (requires `connector_installation:test`)

### Support Note Drafts
- `POST /support-sessions/:id/support-note-drafts` — Create support note draft (requires `ticket:write`)
  - Body: `{ externalTicketId: string, operatorNotes?: string }`
  - Persists `InternalNoteDraft` record to PostgreSQL
  - Returns deterministic mock draft with ticket/customer context

### Evidence Bundle
- `GET /support-sessions/:id/evidence-bundle` — JSON evidence bundle
- `GET /support-sessions/:id/evidence-bundle.json` — JSON evidence bundle
- `GET /support-sessions/:id/evidence-bundle.md` — Markdown evidence bundle
- All include `supportNoteDrafts` section when drafts exist

## RBAC Permissions

| Permission | Operator | Support Agent | Viewer |
|---|---|---|---|
| `ticket:read` | ✓ | ✓ | ✓ |
| `ticket:write` | ✓ | ✓ | ✗ |
| `connector_installation:read` | ✓ | ✓ | ✓ |
| `connector_installation:write` | ✓ | ✓ | ✗ |
| `connector_installation:test` | ✓ | ✓ | ✗ |

## Mock Behavior and Honest Labels

All new endpoints return explicit mock indicators:
- Connector validate/test: `mode: "mock"`, `realNetwork: false`, `writebackEnabled: false`
- Support note drafts: UI shows "Local mock only — not sent to Zammad — requires human review"
- Evidence bundle: Includes `mockDevOnly: true`, `notSentToZammad: true`, `requiresHumanReview: true`

## Database Notes

The `internal_note_drafts` table was created manually for this slice. A proper Prisma migration should be generated before production deployment.

## Evidence

- Browser proof: `output/playwright/session-091-support-case-workflow-foundation/` (20 screenshots)
- Verification script: `scripts/verify_support_case_workflow.sh`
