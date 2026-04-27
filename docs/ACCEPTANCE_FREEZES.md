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

## AF-2026-04-26-004: Evidence bundle skeleton (BL-008)

- ID: AF-2026-04-26-004
- Milestone: Evidence bundle skeleton with JSON and Markdown MVP export
- Scope: SupportPlane can generate a deterministic, tenant-scoped evidence bundle for a support session, export it to JSON and Markdown, display it in the Support Cockpit with summary/JSON/Markdown tabs, append evidence_bundle_generated and evidence_bundle_exported audit events, and redact secrets from all exported output.
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
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-033
  - EV-2026-04-26-034
  - EV-2026-04-26-035
  - EV-2026-04-26-036
  - EV-2026-04-26-037
  - EV-2026-04-26-038
- regression_guard:
  - Evidence Bundle panel must remain visible with Generate button and mock/disclaimer labels.
  - JSON export must include all required sections: sessionSummary, linkedTickets, contextPackets, aiUsage, connectorOperations, auditTimeline, mockDevOnlyDisclaimers, limitations, sourceProvenance.
  - Markdown export must include readable headers for all required sections.
  - Bundle generation must append evidence_bundle_generated and evidence_bundle_exported audit events.
  - Secrets must not be exposed in JSON or Markdown bundle output.
  - Tenant isolation must be enforced for all evidence bundle endpoints.
- Notes:
  - No real database persistence, object storage, cryptographic signing, or compliance-grade integrity is implemented.
  - Redaction is pattern-based, not zero-knowledge.
  - In-memory store means bundles are lost on API restart.

## AF-2026-04-26-007: Suggested greeting generation from call plus ticket context (BL-042)

- ID: AF-2026-04-26-007
- Milestone: Suggested greeting generation from call plus ticket context
- Scope: SupportPlane can generate a deterministic mock AI greeting suggestion for a support session based on caller and ticket context, display it in the Support Cockpit with tone selection, model metadata, and review-required labels, append a greeting_suggestion_generated audit event, and include greeting suggestion summaries in the evidence bundle with mock/disabled flags.
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
  - POST /support-sessions/:id/greeting-suggestion
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-128
  - EV-2026-04-26-129
  - EV-2026-04-26-130
  - EV-2026-04-26-131
  - EV-2026-04-26-132
  - EV-2026-04-26-133
- regression_guard:
  - Greeting Suggestion panel must remain visible with tone selector, generate button, honest mock labels, and "Not spoken or sent automatically" disclaimer.
  - POST /support-sessions/:id/greeting-suggestion must support tone selection, optional callEventId, and tenant-scoped session lookup.
  - Greeting generation must append a greeting_suggestion_generated audit event with provider, model, prompt version, context hash, tone, and mockOnly.
  - Evidence bundle must include greetingSuggestions array with text, tone, provider, model, and mock/disabled flags.
  - Tenant isolation must be enforced for the greeting suggestion endpoint.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - No real AI provider is connected; all greeting generation is deterministic mock output.
  - In-memory store means all data is lost on API restart.

## Guidance

- Do not treat screenshots alone as an acceptance freeze.
- Tie the accepted state to repo truth, runtime truth, and evidence truth.
- If a later report conflicts with the freeze, prove runtime identity before drawing conclusions from git history.

## AF-2026-04-27-002: Telephony adapter boundary (BL-044)

- ID: AF-2026-04-27-002
- Milestone: Telephony adapter contract and bridge boundary
- Scope: Mock-only telephony adapter contracts, connector boundary, `/telephony` API endpoints, Call Console Telephony Bridge panel, telephony audit events, and evidence bundle telephony summaries for future PBX/WebRTC/phone-provider integration.
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
  - /call-console
  - /
  - GET /telephony/status
  - POST /telephony/test
  - POST /telephony/webhooks/fake-provider
  - POST /telephony/calls/:id/control
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-009
  - EV-2026-04-27-010
  - EV-2026-04-27-011
  - EV-2026-04-27-012
  - EV-2026-04-27-013
  - EV-2026-04-27-014
  - EV-2026-04-27-015
  - EV-2026-04-27-016
- evidence_folder: output/playwright/session-044-telephony-adapter-boundary/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must keep the Telephony Bridge panel with honest mock labels.
  - `/telephony/status` must default to provider `mock`, mode `mock`, and verification `not_required`.
  - Fake provider webhook events must map into the existing CallEvent/caller matching flow without real provider calls.
  - Call controls must remain local mock state updates until a real provider slice is explicitly accepted.
  - Telephony audit events must not include tokens, signatures, Authorization headers, env values, or provider credentials.
  - Evidence bundles must include telephonyBridgeEvents and no-real-telephony disclaimers where telephony bridge events are present.
- Notes:
  - No real phone integration, voice/TTS/STT, recording, transcription, real telephony provider call, real AI provider call, real auth, real database persistence, queue-backed workflow, object storage, real Zammad call, production call-center integration, or production deployment is implemented.

## AF-2026-04-27-001: Call Console UI closure (BL-043)

- ID: AF-2026-04-27-001
- Milestone: Call Console UI closure
- Scope: Dedicated mock Call Console at `/call-console` with recent fake calls, caller identity/match panel, recent ticket hints, linked SupportSession panel, mock answer/hold/resume/end lifecycle controls, greeting suggestion integration, timeline/audit panel, Support Cockpit navigation, and evidence bundle inclusion of call lifecycle/greeting data and mock disclaimers.
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
  - /call-console
  - /
  - POST /calls/:id/status
  - GET /calls/:id/timeline
  - POST /support-sessions/:id/greeting-suggestion
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.md
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-001
  - EV-2026-04-27-002
  - EV-2026-04-27-003
  - EV-2026-04-27-004
  - EV-2026-04-27-005
  - EV-2026-04-27-006
  - EV-2026-04-27-007
  - EV-2026-04-27-008
- evidence_folder: output/playwright/session-043-call-console-ui-final-closure/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must remain reachable from the Support Cockpit and show honest mock telephony labels.
  - Recent fake incoming calls must be selectable and show caller match/ticket hints.
  - Linked SupportSession details and Open in cockpit navigation must remain visible.
  - Mock lifecycle transitions must remain constrained to ringing -> answered/missed, answered -> on_hold/ended, and on_hold -> answered/ended.
  - Timeline must distinguish call_resumed from first call_answered.
  - Greeting suggestions generated from the Call Console must remain visible with provider/model/prompt/context metadata and disabled auto-send/voice flags.
  - Evidence bundles must include callEvents, call_status_changed audit entries, greetingSuggestions, and mock telephony / mock AI disclaimers.
- Notes:
  - This supersedes the partial BL-043 screenshot folder `output/playwright/session-043-call-console-ui/`.
  - No real phone integration, voice/TTS/STT, real AI provider call, real auth, real database persistence, queue-backed workflow, object storage, real Zammad call, production call-center integration, or production deployment is implemented.

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

## AF-2026-04-26-005: Fake incoming call webhook and caller matching (BL-009)

- ID: AF-2026-04-26-005
- Milestone: Fake incoming call webhook and caller matching
- Scope: SupportPlane can simulate a fake incoming call via POST /calls/fake-incoming, normalize phone numbers (Belgian-style), match callers against deterministic fixture data, display normalized number, match status, customer name, and recent tickets in the Call Simulator panel, link the call to a selected SupportSession, and include call events in the evidence bundle with mock telephony disclaimers.
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
  - POST /calls/fake-incoming
  - GET /calls/recent
  - GET /calls/:id
  - POST /calls/:id/link-session
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-039
  - EV-2026-04-26-040
  - EV-2026-04-26-041
  - EV-2026-04-26-042
  - EV-2026-04-26-043
  - EV-2026-04-26-044
- regression_guard:
  - Call Simulator panel must remain visible with honest "No real telephony connected" labels.
  - Fake incoming call endpoint must normalize phone numbers and return match results.
  - Caller matching must use deterministic fixture data and display match status, customer name, and recent tickets.
  - Link call to session must update call status to "answered" and append call_linked_to_session audit event.
  - Evidence bundle must include callEvents section with mock telephony disclaimer.
  - All call operations must append audit events with tenant, actor, and metadata.
  - Tenant isolation must be enforced for all call endpoints.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - Phone normalization is Belgian-style only; international support is not implemented.
  - Caller matching is fixture-based mock data, not a real CRM or directory lookup.
  - In-memory store means call data is lost on API restart.


## AF-2026-04-26-006: Automatic SupportSession creation from incoming calls (BL-041)

- ID: AF-2026-04-26-006
- Milestone: Automatic SupportSession creation from incoming call events
- Scope: SupportPlane can optionally auto-create a SupportSession from a fake incoming call when the caller matches a fixture, link the call to the session, display the created session in the Call Simulator panel with an "Open in cockpit" button, append support_session_auto_created and call_auto_linked_to_session audit events, and include the linked call/session relationship in the evidence bundle with mock telephony and auto-created session disclaimers.
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
  - POST /calls/fake-incoming
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-26-116
  - EV-2026-04-26-117
  - EV-2026-04-26-118
  - EV-2026-04-26-119
  - EV-2026-04-26-120
  - EV-2026-04-26-121
  - EV-2026-04-26-122
  - EV-2026-04-26-123
  - EV-2026-04-26-124
  - EV-2026-04-26-125
  - EV-2026-04-26-126
  - EV-2026-04-26-127
- regression_guard:
  - Call Simulator panel must remain visible with auto-create checkbox, priority dropdown, optional session title input, and honest mock labels.
  - POST /calls/fake-incoming must support autoCreateSession, preferredSessionTitle, and preferredPriority.
  - preferredPriority must be validated; invalid values return 400; valid values are reflected in the auto-created session.
  - Matched caller with autoCreateSession=true must create a tenant-scoped SupportSession with linked tickets from caller matching.
  - Call event must be linked to the auto-created session and status updated to answered.
  - Audit trail must display support_session_auto_created and call_auto_linked_to_session events.
  - Evidence bundle must include callEvents with linkedSessionId and auto-created session disclaimers.
  - Tenant isolation must be enforced for auto-created sessions.
- Notes:
  - No real telephony, PBX, or phone provider integration exists.
  - Phone normalization is Belgian-style only; international support is not implemented.
  - Caller matching is fixture-based mock data, not a real CRM or directory lookup.
  - linked_to_existing is a reserved enum value, not yet implemented.
  - In-memory store means all data is lost on API restart.
