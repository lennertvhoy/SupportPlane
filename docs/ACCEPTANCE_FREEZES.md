# ACCEPTANCE_FREEZES.md

**Purpose:** Append-only ledger of accepted user-facing or operator-facing milestones.

Use this when a screen, route, workflow, or other visible milestone is accepted
and must be protected from quiet regression.

## Entry Format

```yaml
- ID: AF-YYYY-MM-DD-001
  Milestone: short milestone name
  Scope: what was accepted
  repo_path: /absolute/path/to/repo
  branch: main
  head: abc1234
  process_or_container: npm dev | docker container name | other
  port_or_base_url: http://localhost:3000
  routes:
    - /
    - /settings
  rebuilt_in_slice: true
  duplicate_runtimes_checked: true
  evidence_refs:
    - EV-YYYY-MM-DD-001
  regression_guard:
    - later work must branch from this accepted lineage
    - route-role changes require explicit backlog scope and new evidence
  Notes: optional
```

## AF-2026-04-26-001: Support Cockpit UI shell (BL-004)

- ID: AF-2026-04-26-001
- Milestone: Support Cockpit UI shell
- Scope: First user-visible Support Cockpit with session list, ticket context, AI context quality, draft note, and audit trail panels.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 5c8a488da87772f2de33a3fc636ac83deef86e41
- process_or_container:
  - node process (NestJS API) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-009
  - EV-2026-04-26-010
  - EV-2026-04-26-011
  - EV-2026-04-26-012
  - EV-2026-04-26-013
  - EV-2026-04-26-014
  - EV-2026-04-26-015
  - EV-2026-04-26-016
  - EV-2026-04-26-017
- regression_guard:
  - Session list must remain createable and selectable.
  - Ticket context load must return mock connector data visibly.
  - AI Context Quality panel must show loaded/missing/warning states.
  - Draft note panel must remain non-persistent with disabled writeback.
  - Audit trail must display events with actor, timestamp, resource, and metadata.
- Notes:
  - This is a mock-first UI shell. No real ticketing system, database, or AI provider is connected.
  - Dev-only CORS is configured on the API and must be replaced before production.

## AF-2026-04-26-002: Mock AI draft suggestion workflow (BL-005)

- ID: AF-2026-04-26-002
- Milestone: Mock AI draft suggestion workflow
- Scope: Support Cockpit can request a deterministic mock AI support-note draft from current session, ticket, and AI context packet data, display provider/model/prompt/context hash metadata, append a model usage audit event, and keep writeback disabled.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - POST /support-sessions/:id/draft-suggestion
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-018
  - EV-2026-04-26-019
  - EV-2026-04-26-020
  - EV-2026-04-26-021
  - EV-2026-04-26-022
- regression_guard:
  - Draft suggestions must remain clearly labeled mock/dev-only until a real provider slice is explicitly accepted.
  - Provider, model, prompt version, and context hash metadata must remain visible with generated drafts.
  - Draft generation must append an audit event with model usage metadata.
  - Writeback must remain disabled until an explicit ticket writeback backlog slice is implemented and accepted.
- Notes:
  - No real AI provider, external AI API call, production model governance, real authentication, database persistence, or ticket writeback is implemented.

## Guidance

- Do not treat screenshots alone as an acceptance freeze.
- Tie the accepted state to repo truth, runtime truth, and evidence truth.
- If a later report conflicts with the freeze, prove runtime identity before drawing conclusions from git history.

## AF-2026-04-26-003: Zammad connector boundary (BL-007)

- ID: AF-2026-04-26-003
- Milestone: Zammad connector configuration, read, draft, and mock-safe writeback
- Scope: SupportPlane exposes a Zammad connector boundary with mock mode by default, configurable zammad mode via env, connector status/test endpoints, ticket context load through the connector, internal note draft generation, mock-safe writeback with review gate, and connector audit events visible in the audit trail.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 8cf2c22
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /
  - GET /connectors/zammad/status
  - POST /connectors/zammad/test
  - POST /support-sessions/:id/zammad/ticket-context
  - POST /support-sessions/:id/zammad/internal-note-draft
  - POST /support-sessions/:id/zammad/internal-note-writeback
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-027
  - EV-2026-04-26-028
  - EV-2026-04-26-029
  - EV-2026-04-26-030
  - EV-2026-04-26-031
  - EV-2026-04-26-032
- regression_guard:
  - Connector panel must remain visible with mode, health, capabilities, and honest mock labels.
  - Ticket context load must work through the Zammad connector boundary and append zammad_ticket_loaded audit events.
  - Draft note generation must remain mock-only with review-required state.
  - Writeback must be mock-safe by default and show success/failure state.
  - Audit trail must display connector read, draft, writeback attempted, and writeback succeeded/failed events.
  - Secrets must not be exposed in UI, API responses, or audit metadata.
- Notes:
  - No real Zammad API calls are made in mock mode.
  - Real Zammad mode requires ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN environment variables.
  - The adapter is a typed boundary only; production-ready verification requires a real Zammad instance with documented evidence.
