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

## AF-2026-04-27-007: Local auth, RBAC, and tenant boundary foundation (BL-018)

- ID: AF-2026-04-27-007
- Milestone: Local auth, RBAC, and tenant boundary foundation
- Scope: PostgreSQL-backed local login/logout, seeded demo tenants/users/roles, local session cookie, current actor/tenant resolution, server-side RBAC checks, tenant-boundary denial proof, visible user/tenant/role shell indicator, viewer/operator/admin browser proof, and local auth/RBAC verification script.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: recorded_in_final_handoff
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - /call-console
  - POST /auth/local/login
  - GET /auth/me
  - POST /auth/logout
  - GET /auth/audit-events
  - /support-sessions/*
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-051 through EV-2026-04-27-063
- evidence_folder: output/playwright/session-018-auth-rbac-tenant-boundary-foundation/
- screenshot_count: 13
- regression_guard:
  - Local auth mode must not trust arbitrary `x-tenant-id`, `x-user-id`, or `x-user-role` headers.
  - Missing/invalid local auth must return 401.
  - Valid auth with insufficient role must return 403.
  - Cross-tenant session access must be denied server-side.
  - Viewer role must remain visibly restricted and server-side denied for create/operator work.
  - Evidence bundle and auth responses must not expose passwords, password hashes, session tokens, token hashes, raw media, or private credentials.
- Notes:
  - This is local MVP auth only, not production authentication, SSO/OAuth/SAML/OIDC, MFA, compliance-grade audit immutability, or production deployment.

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

## AF-2026-04-27-003: Call recording mock foundation (BL-045)

- ID: AF-2026-04-27-003
- Milestone: Call recording attachment and playback mock foundation
- Scope: Mock-only call recording contracts, in-memory recording storage, `POST /calls/:id/recordings/mock`, `GET /calls/:id/recordings`, `POST /calls/:id/recordings/:recordingId/review`, `POST /calls/:id/recordings/:recordingId/playback`, Call Console Mock Recording panel with attach/playback-placeholder/review UI, evidence bundle `callRecordings` summaries, and recording audit events.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 2ff8061df7a0cda93806c4397ab0439fbb730909
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - POST /calls/:id/recordings/mock
  - GET /calls/:id/recordings
  - POST /calls/:id/recordings/:recordingId/review
  - POST /calls/:id/recordings/:recordingId/playback
- rebuilt_in_slice: false
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-017
  - EV-2026-04-27-018
  - EV-2026-04-27-019
  - EV-2026-04-27-020
  - EV-2026-04-27-021
  - EV-2026-04-27-022
  - EV-2026-04-27-023
  - EV-2026-04-27-024
- evidence_folder: output/playwright/session-045-call-recording-mock-final-closure/
- screenshot_count: 8
- regression_guard:
  - `/call-console` must keep the Mock Recording panel with honest mock labels.
  - `POST /calls/:id/recordings/mock` must attach deterministic mock metadata with `noRealAudio: true` and `mockDevOnly: true`.
  - `GET /calls/:id/recordings` must list tenant-scoped recordings for a call.
  - `POST /calls/:id/recordings/:recordingId/review` must update status to `mock_only` and append `call_recording_reviewed` audit event.
  - `POST /calls/:id/recordings/:recordingId/playback` must append `call_recording_playback_opened` audit event with `placeholderOnly: true`.
  - Evidence bundles must include `callRecordings` summaries with mock disclaimers.
  - Audit events must not include raw audio data, tokens, or secrets.
- Notes:
  - No real audio recording, playback, TTS, STT, transcription, object storage, or provider integration exists.
  - The Markdown evidence bundle renderer does not yet include a dedicated "Call Recordings" section; recording data is present in JSON and via audit timeline entries in Markdown.

## AF-2026-04-27-004: BL-046 Operator Companion Screen Observations

- id: AF-2026-04-27-004
- date: 2026-04-27
- backlog_id: BL-046
- title: Operator companion screen observations during active calls
- status: accepted
- verification_method: browser + api
- runtime_identity:
  - api_url: http://localhost:4110
  - web_url: http://localhost:3200
  - api_process: NestJS (tsx src/main.ts, API_PORT=4110)
  - web_process: Next.js (next dev -p 3200)
  - store: in-memory
- git_head: recorded_at_commit
- branch: main
- verified_paths:
  - /call-console
  - /
  - POST /support-sessions/:id/screen-observations/mock
  - GET /support-sessions/:id/screen-observations
  - POST /support-sessions/:id/screen-observations/:observationId/review
  - POST /support-sessions/:id/screen-observations/:observationId/context-packet
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-033
  - EV-2026-04-27-034
  - EV-2026-04-27-035
  - EV-2026-04-27-036
  - EV-2026-04-27-037
  - EV-2026-04-27-038
  - EV-2026-04-27-039
  - EV-2026-04-27-040
  - EV-2026-04-27-041
- evidence_folder: output/playwright/session-046-operator-companion-closure-canonical/
- screenshot_count: 9
- regression_guard:
  - `/call-console` must keep the Operator Companion panel with honest mock labels.
  - `POST /support-sessions/:id/screen-observations/mock` must return observation with `mockDevOnly: true`, `noRawPixels: true`, `noClipboard: true`, `status: review_required`.
  - `GET /support-sessions/:id/screen-observations` must list tenant-scoped observations.
  - `POST .../review` must return `{observation, previousStatus, newStatus}` and append `screen_observation_reviewed` or `screen_observation_discarded` audit event.
  - `POST .../context-packet` must require `approved` status, return `{observation, contextPacketId, mockDevOnly: true}`, and append `screen_observation_context_packet_created` + `ai_context_loaded` audit events.
  - Evidence bundles must include `screenObservations` summaries with mock disclaimers and safety flags.
  - Audit events must not include raw pixels, clipboard data, or secrets.
- Notes:
  - No real screen capture, raw pixels, clipboard access, OCR, desktop monitoring, or native OS integration exists.
  - No real database persistence; all data is in-memory and lost on API restart.
  - Closure hygiene pass fixed API controller to return wrapped `ScreenObservationCaptureResponse` and resolved lint errors.

## AF-2026-04-27-005: BL-047/048/049 Screen Context Hardening Wave final closure

- ID: AF-2026-04-27-005
- Milestone: Screen Context Hardening Wave (BL-047, BL-048, BL-049)
- Scope: Explicit sharing-state storage and lifecycle, deterministic active-window metadata capture, manual screenshot metadata capture with raw image retention disabled, structured observation upload, enhanced redaction with path redaction, expanded ScreenObservation contract, new audit event types, evidence bundle integration, Call Console Operator Companion panel with visible sharing indicator and capture forms, Support Cockpit AI Context Quality panel showing observation-derived packets with redaction status, and canonical 10-screenshot browser-verified closure proof with no-secret/no-raw-image proof.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 8c4619164972f61f1c1b60151cdca3b9ae79d61d
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
- routes:
  - /call-console
  - /
  - GET /support-sessions/:id/screen-observations/sharing-state
  - POST /support-sessions/:id/screen-observations/sharing-state
  - POST /support-sessions/:id/screen-observations/active-window/mock
  - POST /support-sessions/:id/screen-observations/manual-screenshot
  - POST /support-sessions/:id/screen-observations/structured-upload
  - GET /support-sessions/:id/screen-observations
  - POST /support-sessions/:id/screen-observations/:observationId/review
  - POST /support-sessions/:id/screen-observations/:observationId/context-packet
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-042
  - EV-2026-04-27-043
  - EV-2026-04-27-044
  - EV-2026-04-27-045
  - EV-2026-04-27-046
  - EV-2026-04-27-047
  - EV-2026-04-27-048
  - EV-2026-04-27-049
  - EV-2026-04-27-050
  - EV-2026-04-27-051
- evidence_folder: output/playwright/session-047-049-screen-context-hardening-final-closure/
- screenshot_count: 10
- regression_guard:
  - `/call-console` must keep the Operator Companion panel with honest mock labels and visible sharing indicator.
  - Sharing state transitions must remain constrained to inactive -> active, active -> paused, active -> inactive, paused -> active, paused -> inactive.
  - `POST /support-sessions/:id/screen-observations/active-window/mock` must return observation with `mockDevOnly: true`, `noRawPixels: true`, `rawImageRetention: disabled`.
  - `POST /support-sessions/:id/screen-observations/manual-screenshot` must return observation with `kind: screenshot_metadata` and `rawImageRetention: disabled`.
  - `POST /support-sessions/:id/screen-observations/structured-upload` must apply redaction before storage and return `redactionStatus: pattern_redacted` when secrets/paths are present.
  - Evidence bundle JSON and Markdown must include `screenObservations` with `sharingState`, `rawImageRetention`, `redactionStatus`, `safetyFlags`, and mock disclaimers.
  - Audit trail must display `screen_observation_sharing_started`, `active_window_metadata_captured`, `manual_screenshot_metadata_attached`, `structured_screen_observation_uploaded`, `screen_observation_redaction_applied`, `screen_observation_reviewed`, `screen_observation_context_packet_created`, and `ai_context_loaded` events.
  - No secrets, tokens, Authorization headers, filesystem paths, or raw image content may appear in UI or exported bundle output.
- Notes:
  - No real screen capture, raw pixels, clipboard access, OCR, desktop monitoring, or native OS integration exists.
  - No real database persistence; all data is in-memory and lost on API restart.
  - The earlier partial screenshot folder `output/playwright/session-047-049-screen-context-hardening/` is superseded by this final closure folder.


## AF-2026-04-27-008: BL-020 Ticket Context and Connector Safety Foundation

- ID: AF-2026-04-27-008
- Milestone: Ticket Context and Connector Safety Foundation
- Scope: Persistent tenant-scoped CustomerReference, TicketSummary, and ConnectorInstallation models; Prisma migration; GET /customers and GET /customers/:id with RBAC; GET /connector-installations and GET /connector-installations/:id with RBAC; evidence bundle integration with redaction; CustomerReferencePanel and updated ConnectorPanel/EvidenceBundlePanel in web UI; seed data for demo customers, tickets, and connector installations.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 208d8fa83b3bddc93b496c1c035777049e0e1cbe
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - GET /customers
  - GET /customers/:id
  - GET /connector-installations
  - GET /connector-installations/:id
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-064 through EV-2026-04-27-075
- evidence_folder: output/playwright/session-020-ticket-context-connector-safety-foundation-final-closure/
- screenshot_count: 12
- regression_guard:
  - CustomerReferencePanel must remain visible with tenant-scoped customer list.
  - ConnectorPanel must show Installations section with status, type, and safety flags.
  - EvidenceBundlePanel must include Customers and Connectors counts.
  - GET /customers and GET /connector-installations must enforce tenant isolation and RBAC.
  - Evidence bundle JSON/Markdown must include customerReferences and connectorInstallations sections with redaction.
  - No connector credentials, tokens, or raw secrets may appear in UI, API responses, or evidence exports.
- Notes:
  - TicketSummary model exists but has no dedicated API endpoint or UI panel yet.
  - Connector installation PATCH/validate/test endpoints are deferred.
  - Full customer lookup by email/phone query params is accepted but adapter-backed lookup is not implemented.
  - All new entities default to mockDevOnly: true.
  - No real production Zammad, telephony, AI, or object storage is implemented.

---

## AF-2026-04-27-006: BL-050 PostgreSQL Persistence Foundation

- Date: 2026-04-27
- Commit: `9f5b5821c3767e02411c598234ea7df7f635d559`
- Scope: PostgreSQL persistence foundation with PrismaStore and runtime store switching
- Frozen behaviors:
  - `SUPPORTPLANE_STORE=postgres` selects PrismaStore; default or `memory` selects InMemoryStore.
  - PrismaStore uses Prisma v7.8.0 with `@prisma/adapter-pg` and `pg` Pool adapter.
  - All store methods are async and tenant-scoped.
  - Evidence bundle `sourceProvenance.storeType` reports `"memory"` or `"postgres"`.
  - Evidence bundle `sourceProvenance.persistenceClaimed` is `true` when `storeType === "postgres"`.
  - `scripts/verify_postgres_persistence.sh` must pass all 3 phases (create, restart-survive, bundle-store-type).
- Verification script: scripts/verify_postgres_persistence.sh
- Evidence ref: EV-2026-04-27-052
- Notes:
  - Canonical dev seed: `npx prisma db seed` (prisma/seed.ts with PrismaPg adapter).
  - Standalone script seeds via raw SQL for isolated verification.
  - PostgreSQL container must be running (sp-postgres on localhost:5434).
  - All previous in-memory behavior remains unchanged when `SUPPORTPLANE_STORE` is unset or `memory`.

## AF-2026-04-27-009: BL-091 Support Case Workflow Foundation

- ID: AF-2026-04-27-009
- Milestone: Support Case Workflow Foundation
- Scope: End-to-end support case workflow unifying calls, customers, tickets, sessions, observations, connector validation, support note drafts, and evidence bundles. New TicketsModule with GET /tickets and GET /tickets/:id (tenant-scoped, RBAC-protected). Connector installation PATCH/validate/test endpoints with honest mock-only behavior. CaseTimelinePanel showing unified session/call/ticket/link/observation/draft events. SupportNoteDraftPanel generating deterministic local-only mock drafts with visible warnings. Evidence bundle including supportNoteDrafts in JSON and Markdown. Viewer role restrictions enforced server-side.
- repo_path: /home/ff/Documents/Projects/SupportPlane
- branch: main
- head: 1dba4bbe0b75bfb26112619e4b0b2b7af7426132
- process_or_container:
  - node process (NestJS API via tsx) on port 4110
  - node process (Next.js dev) on port 3200
  - Podman container `sp-postgres` on port 5434
- port_or_base_url:
  - http://localhost:4110
  - http://localhost:3200
  - PostgreSQL localhost:5434
- routes:
  - /
  - GET /tickets
  - GET /tickets/:id
  - PATCH /connector-installations/:id
  - POST /connector-installations/:id/validate
  - POST /connector-installations/:id/test
  - POST /support-sessions/:id/support-note-drafts
  - GET /support-sessions/:id/evidence-bundle
  - GET /support-sessions/:id/evidence-bundle.json
  - GET /support-sessions/:id/evidence-bundle.md
- store_mode: postgres
- auth_mode: local
- rebuilt_in_slice: true
- duplicate_runtimes_checked: true
- evidence_refs:
  - EV-2026-04-27-076 through EV-2026-04-27-095
- evidence_folder: output/playwright/session-091-support-case-workflow-foundation/
- screenshot_count: 20
- regression_guard:
  - TicketSummaryPanel must remain visible with tenant-scoped ticket list and search.
  - GET /tickets and GET /tickets/:id must enforce tenant isolation and `ticket:read` RBAC.
  - ConnectorPanel must show per-installation Test and Validate buttons with honest mock results.
  - PATCH /connector-installations/:id must validate status literals and enforce `connector_installation:write`.
  - POST /connector-installations/:id/validate and POST /connector-installations/:id/test must return explicit `mode: "mock"`, `realNetwork: false`, `writebackEnabled: false`.
  - SupportNoteDraftPanel must show "Local mock only — not sent to Zammad — requires human review" warning.
  - POST /support-sessions/:id/support-note-drafts must persist InternalNoteDraft records and append `internal_note_drafted` audit events.
  - Evidence bundle JSON and Markdown must include `supportNoteDrafts` section with `mockDevOnly: true`, `notSentToZammad: true`, `requiresHumanReview: true`.
  - CaseTimelinePanel must display session_created, call_linked, ticket_linked, observation_created, draft_generated, and evidence_bundle_exported events.
  - Viewer role must be denied `connector_installation:write/test` and `ticket:write` server-side with 403.
  - Cross-tenant access must return 404 for resources and 403 for permission denied.
- Notes:
  - `internal_note_drafts` table was created manually; a proper Prisma migration should be generated before production.
  - No real Zammad, telephony, AI provider, queue, object storage, SSO, MFA, or password reset implemented.
  - All new behavior is deterministic local/mock-only with visible UI warnings.
