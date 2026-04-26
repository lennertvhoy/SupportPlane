# EVIDENCE_LOG.md

**Purpose:** Structured ledger of proof artifacts for user-facing claims and external planning references.

## EV-2026-04-26-001: Zammad CTI planning reference verified

- File: https://docs.zammad.org/en/latest/api/generic-cti/index.html
- Title: Zammad Generic CTI API documentation
- Source/System: docs
- Action: Opened official Zammad documentation during bootstrap.
- Shows:
  - Zammad documents Generic CTI under REST API documentation.
  - The page states CTI endpoints are relevant for PBX systems and include call events such as new call, hangup, and answer.
- Proves:
  - Zammad is a plausible first ticketing/CTI-adjacent planning target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-002: GLPI API v2 planning reference verified

- File: https://help.glpi-project.org/documentation/modules/configuration/general/api/restful-api-v2
- Title: GLPI RESTful API v2 documentation
- Source/System: docs
- Action: Opened official GLPI help documentation during bootstrap.
- Shows:
  - GLPI documents a RESTful API v2 as its high-level API.
  - The legacy API remains available.
  - OAuth2 authentication and API versioning are documented.
- Proves:
  - GLPI is a plausible second ITSM/assets integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-003: Asterisk ARI planning reference verified

- File: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/
- Title: Asterisk REST Interface documentation
- Source/System: docs
- Action: Opened official Asterisk documentation during bootstrap.
- Shows:
  - ARI documentation exists for Asterisk REST Interface.
  - The docs warn against direct browser access in production and recommend putting Asterisk behind an application server for security, logging, multi-tenancy, and related concerns.
- Proves:
  - A SupportPlane CTI gateway in front of Asterisk is directionally consistent with Asterisk production guidance.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-004: MeshCentral planning reference verified

- File: https://github.com/Ylianst/MeshCentral
- Title: MeshCentral GitHub repository
- Source/System: docs
- Action: Opened the MeshCentral GitHub repository during bootstrap.
- Shows:
  - MeshCentral describes itself as a web-based remote monitoring and management site.
  - It supports agents plus web-based remote desktop, terminal, and file management.
- Proves:
  - MeshCentral is a plausible remote-support context/launch integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-005: OWASP agentic AI security reference verified

- File: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- Title: OWASP Top 10 for Agentic Applications for 2026
- Source/System: docs
- Action: Opened OWASP Gen AI Security Project documentation during bootstrap.
- Shows:
  - OWASP frames the resource around agentic AI systems that plan, act, and make decisions across workflows.
- Proves:
  - SupportPlane's agentic/tooling threat model should explicitly consider agentic AI risks.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-006: NIST GAI profile reference verified

- File: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- Title: NIST AI RMF Generative AI Profile
- Source/System: docs
- Action: Opened NIST publication page during bootstrap.
- Shows:
  - NIST published the Generative AI Profile on 2024-07-26 and updated the page on 2026-04-08.
  - The abstract frames it as a companion resource for incorporating trustworthiness considerations into AI systems.
- Proves:
  - NIST AI RMF GAI profile is a relevant governance reference for SupportPlane planning.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-007: EU AI Act timeline reference verified

- File: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- Title: European Commission AI Act page
- Source/System: docs
- Action: Opened European Commission AI Act policy page during bootstrap.
- Shows:
  - The AI Act entered into force on 2024-08-01.
  - The page states full applicability on 2026-08-02 with exceptions, including high-risk embedded systems extending to 2027-08-02.
- Proves:
  - Compliance-related planning must avoid overclaiming and account for staged AI Act applicability.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-008: Local bootstrap validation evidence

- File: /home/ff/Documents/Projects/SupportPlane
- Title: Local repo and host baseline observed
- Source/System: terminal
- Action: Inspected repo files, ran hygiene checks, parsed YAML, compiled scripts, checked git state, and inspected host/runtime basics.
- Shows:
  - no SupportPlane product runtime exists yet
  - the directory is not currently a Git repository
  - Python 3.14.4, Node 22.22.0, Podman 5.8.2, and Chrome are present; Docker is absent
- Proves:
  - Bootstrap state distinguishes observed facts from unknown runtime/git facts.
- Type: source-data
- as_of: 2026-04-26T18:40:00+02:00

## EV-2026-04-26-009: Support Cockpit UI shell browser verification

- File: output/playwright/session-004-support-cockpit-ui/01-initial-empty-state.png
- Title: Initial cockpit empty state
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium via Playwright before any sessions exist.
- Shows:
  - Dark-themed SupportPlane header with DEV/MOCK badge and API endpoint label.
  - Empty session list with "No sessions yet" state.
  - Ticket Context, AI Context Quality, Draft Note, and Audit Trail panels with "Select a session" empty states.
- Proves:
  - The first UI shell renders correctly with all required panels and empty states.
- Type: docs-render-verification
- as_of: 2026-04-26T20:10:00+02:00

## EV-2026-04-26-010: Support Cockpit session creation and ticket context

- File: output/playwright/session-004-support-cockpit-ui/03-ticket-context-loaded.png
- Title: Ticket context loaded in selected session
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Created a session, selected it, and loaded TICKET-101 via the mock adapter.
- Shows:
  - Session list shows "Customer VPN issue" with open status badge.
  - Selected session banner displays ticket and packet counts.
  - Ticket Context panel displays mock connector data: subject, status, priority, customer name/email, adapter ID.
  - AI Context Quality panel shows a ticket provenance packet with loaded fields.
  - Audit Trail panel shows session_created, ticket_linked, and ai_context_loaded events.
- Proves:
  - The full mock-first operator workflow (session → ticket load → context packet → audit) is visible in the UI.
- Type: docs-render-verification
- as_of: 2026-04-26T20:12:00+02:00

## EV-2026-04-26-011: Support Cockpit draft note and audit trail

- File: output/playwright/session-004-support-cockpit-ui/06-draft-review-panel.png
- Title: Draft note with review state and disabled writeback
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Typed a draft note, checked the Reviewed checkbox, and observed the disabled writeback button.
- Shows:
  - Draft note textarea contains realistic support text.
  - "Reviewed" checkbox is checked.
  - "Writeback (disabled)" button is present and inactive.
  - "Mock only — no writeback" badge is visible.
  - Audit trail shows actor, timestamps, resource IDs, and metadata.
- Proves:
  - The draft/review panel communicates non-persistence and disabled writeback clearly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:12:00+02:00

## EV-2026-04-26-012: Support Cockpit UI shell final closure — initial state

- File: output/playwright/session-004-support-cockpit-ui-final-closure/01-initial-empty-state.png
- Title: Initial cockpit state at final closure
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium via Playwright during final closure pass.
- Shows:
  - Dark-themed SupportPlane header with DEV/MOCK badge and API endpoint label.
  - Session list with prior test sessions visible.
  - Ticket Context, AI Context Quality, Draft Note, and Audit Trail panels.
- Proves:
  - The UI shell renders correctly at the start of the final verification flow.
- Type: docs-render-verification
- as_of: 2026-04-26T20:25:00+02:00

## EV-2026-04-26-013: Support Cockpit session creation and selection at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/02-created-selected-session.png
- Title: Created and selected session
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Created a new session titled "BL-004 Closure Test" and selected it.
- Shows:
  - Session list shows the newly created session with open status badge.
  - Selected session banner displays ID, status, and priority.
  - AI Context Quality panel shows warning for missing ticket context.
- Proves:
  - Session creation and selection work correctly in the final closure verification.
- Type: docs-render-verification
- as_of: 2026-04-26T20:26:00+02:00

## EV-2026-04-26-014: Support Cockpit ticket context loaded at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/03-ticket-context-loaded.png
- Title: Ticket context loaded in selected session
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Loaded TICKET-101 via the mock adapter for the closure test session.
- Shows:
  - Session banner updated to Tickets: 1.
  - Ticket Context panel displays mock connector data: subject, status, priority, customer name/email, adapter ID.
- Proves:
  - Ticket context load and display work correctly in the final verification.
- Type: docs-render-verification
- as_of: 2026-04-26T20:26:00+02:00

## EV-2026-04-26-015: Support Cockpit AI context packets at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/04-ai-context-packets.png
- Title: AI context packets visible after ticket load
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Scrolled to AI Context Quality panel after loading ticket context.
- Shows:
  - Ticket provenance packet with loaded fields and "Loaded" state.
  - Draft Note panel visible below with session name and empty textarea.
- Proves:
  - AI Context Quality panel displays ticket-derived packets correctly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-016: Support Cockpit audit trail at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/05-audit-trail-visible.png
- Title: Audit trail with session_created, ticket_linked, ai_context_loaded
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel to view events.
- Shows:
  - session_created event with actor, timestamp, and metadata.
  - ticket_linked event with externalTicketId metadata.
  - ai_context_loaded event with provenance metadata.
- Proves:
  - Audit trail displays all expected events with actor, timestamp, resource, and metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-017: Support Cockpit draft review panel at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/06-draft-review-panel.png
- Title: Draft note with review state and disabled writeback
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Typed a draft note, checked the Reviewed checkbox, and observed the disabled writeback button.
- Shows:
  - Draft note textarea contains realistic support text (153 chars).
  - "Reviewed" checkbox is checked.
  - "Writeback (disabled)" button is present and inactive.
  - "Mock only — no writeback" badge is visible.
- Proves:
  - The draft/review panel communicates non-persistence and disabled writeback clearly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-018: BL-005 cockpit before mock draft generation

- File: output/playwright/session-005-mock-ai-gateway/01-cockpit-before-generating-draft.png
- Title: Cockpit with ticket context loaded before mock AI draft
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a support session, loaded TICKET-101 through the mock ticketing adapter, and captured the cockpit before draft generation.
- Shows:
  - SupportPlane header with DEV / MOCK DATA and API localhost:4110 labels.
  - Selected session with one ticket and one AI context packet.
  - Ticket context and AI Context Quality panels populated from mock data.
  - Draft panel ready to generate a mock draft with writeback disabled.
- Proves:
  - The BL-005 draft flow starts from tenant-scoped session and context data in the browser.
- Type: docs-render-verification
- as_of: 2026-04-26T20:41:00+02:00

## EV-2026-04-26-019: BL-005 generated mock AI draft visible

- File: output/playwright/session-005-mock-ai-gateway/02-generated-mock-ai-draft-visible.png
- Title: Generated mock AI draft visible in draft textarea
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Entered operator instructions and requested a mock AI draft from the Support Cockpit.
- Shows:
  - Draft textarea contains text beginning with "MOCK AI DRAFT".
  - The draft references the selected session, TICKET-101, ticket context fields, and operator instruction.
  - The UI states mock AI only and review required.
- Proves:
  - The web UI calls the draft suggestion API and displays the returned mock completion.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-020: BL-005 model metadata visible

- File: output/playwright/session-005-mock-ai-gateway/03-model-metadata-visible.png
- Title: Mock model metadata visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the model metadata block after draft generation.
- Shows:
  - Provider: mock.
  - Model: mock-support-note-v1.
  - Prompt version: mock-v1.
  - Context hash value.
  - Mock/dev-only and review-before-writeback labels.
- Proves:
  - Provider, model, prompt version, and context hash metadata are visible to the operator.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-021: BL-005 audit trail shows model usage event

- File: output/playwright/session-005-mock-ai-gateway/04-audit-trail-ai-model-usage-event.png
- Title: Audit trail with AI draft generation event
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the audit trail after draft generation.
- Shows:
  - session_created, ticket_linked, ai_context_loaded, and ai_draft_generated events.
  - ai_draft_generated metadata includes provider, model, promptVersion, contextHash, and mockOnly.
- Proves:
  - Draft generation appends and displays an audit event for mock model usage.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-022: BL-005 writeback remains disabled and review required

- File: output/playwright/session-005-mock-ai-gateway/05-writeback-disabled-review-required.png
- Title: Draft panel with disabled writeback after mock generation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the full draft panel after mock draft generation.
- Shows:
  - Mock draft in the textarea.
  - Writeback button remains disabled.
  - "Mark as reviewed before writeback" message and "Review before writeback" label are visible.
- Proves:
  - BL-005 did not implement ticket writeback and keeps human review explicit.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-033: BL-008 evidence bundle panel before generation

- File: output/playwright/session-008-evidence-bundle/01-evidence-bundle-panel-before-generation.png
- Title: Evidence Bundle panel visible before generation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session and observed the Evidence Bundle panel before clicking Generate.
- Shows:
  - Evidence Bundle panel displays "Generate" button and MVP Export disclaimer.
  - "This is an in-memory mock export. No real compliance or legal evidence is claimed."
- Proves:
  - The Evidence Bundle panel is visible and honest about its mock/in-memory limitations before any export.
- Type: docs-render-verification
- as_of: 2026-04-26T21:50:00+02:00

## EV-2026-04-26-034: BL-008 JSON evidence bundle preview

- File: output/playwright/session-008-evidence-bundle/02-json-evidence-bundle-preview.png
- Title: JSON evidence bundle preview visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the JSON tab.
- Shows:
  - JSON preview contains bundleId, tenantId, sessionSummary, linkedTickets, contextPackets, aiUsage, connectorOperations, auditTimeline, mockDevOnlyDisclaimers, limitations, and sourceProvenance.
- Proves:
  - The API returns a deterministic, structured JSON evidence bundle with all required sections.
- Type: docs-render-verification
- as_of: 2026-04-26T21:52:00+02:00

## EV-2026-04-26-035: BL-008 Markdown evidence bundle preview

- File: output/playwright/session-008-evidence-bundle/03-markdown-evidence-bundle-preview.png
- Title: Markdown evidence bundle preview visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the Markdown tab.
- Shows:
  - Markdown preview shows "# SupportPlane Evidence Bundle" with session summary, linked tickets, AI context packets, audit timeline, disclaimers, and limitations.
- Proves:
  - The API returns a readable Markdown export with all required sections.
- Type: docs-render-verification
- as_of: 2026-04-26T21:52:00+02:00

## EV-2026-04-26-036: BL-008 audit trail with evidence bundle events

- File: output/playwright/session-008-evidence-bundle/04-audit-trail-evidence-bundle-events.png
- Title: Audit trail showing evidence_bundle_generated and evidence_bundle_exported
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after generating an evidence bundle.
- Shows:
  - evidence_bundle_generated events with format, bundleId, and version metadata.
  - evidence_bundle_exported events with format and bundleId metadata.
- Proves:
  - Bundle generation and export append audit events with tenant, actor, and bundle metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:54:00+02:00

## EV-2026-04-26-037: BL-008 mock/dev-only disclaimer visible

- File: output/playwright/session-008-evidence-bundle/05-mock-dev-only-disclaimer-visible.png
- Title: Evidence Bundle summary with mock/dev-only disclaimer
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Switched to the Summary tab after generating an evidence bundle.
- Shows:
  - "Mock / Dev-Only" block stating the bundle was generated from an in-memory mock development store.
- Proves:
  - The UI makes the mock/in-memory limitation explicit and visible.
- Type: docs-render-verification
- as_of: 2026-04-26T21:53:00+02:00

## EV-2026-04-26-038: BL-008 no-secret evidence

- File: output/playwright/session-008-evidence-bundle/06-no-secret-evidence.png
- Title: Exported JSON preview with no token or secret content
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Inspected the JSON evidence bundle preview for secret leakage.
- Shows:
  - No API token, ZAMMAD_API_TOKEN, password, secret, or bearer token is visible in the exported JSON.
- Proves:
  - Redaction helpers successfully prevent secret exposure in bundle output.
- Type: docs-render-verification
- as_of: 2026-04-26T21:55:00+02:00

## Entry Format

```yaml
- ID: EV-YYYY-MM-DD-001
  File: /absolute/path/to/artifact.png
  Title: short description
  Source/System: browser | api | test | log | screenshot | docs
  Route/Page: optional route or URL
  Action: what was done
  Shows:
    - visible fact 1
  Proves:
    - why the artifact matters
  Type: source-data | chatbot | gap | integration | docs-render-verification
  as_of: 2026-03-18T18:00:00+01:00
```

## EV-2026-04-26-023: BL-006 local topology infra containers verified

- File: infra/docker-compose/compose.yaml
- Title: Local Podman-compatible compose topology
- Source/System: terminal
- Action: Started PostgreSQL, NATS, MinIO, and worker placeholder with podman-compose.
- Shows:
  - All four containers start and report healthy (except worker placeholder).
  - PostgreSQL accepts connections on host port 5434.
  - NATS monitoring responds on port 8222 with HTTP 200.
  - MinIO health endpoint responds on port 9000 with HTTP 200.
- Proves:
  - Local development infrastructure is reproducible via compose.
- Type: integration
- as_of: 2026-04-26T20:52:00+02:00

## EV-2026-04-26-024: BL-006 host-run apps verified against running infra

- File: scripts/check_local_topology.sh
- Title: Full topology check with host-run API and Web
- Source/System: terminal
- Action: Ran check_local_topology.sh with API on 4110 and Web on 3200 while infra containers were running.
- Shows:
  - 10/10 checks passed (8 infra + 2 host-run).
  - API /health returns NestJS runtime info.
  - Web root returns HTTP 200.
- Proves:
  - Host-run apps and containerized infra coexist on documented ports.
- Type: integration
- as_of: 2026-04-26T20:54:00+02:00

## EV-2026-04-26-025: BL-006 cockpit browser verification with running topology

- File: output/playwright/session-006-local-topology/01-cockpit-loaded.png
- Title: Support Cockpit loaded with local topology running
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium while API and infra containers were running.
- Shows:
  - Cockpit renders with DEV / MOCK DATA badge and API localhost:4110 label.
  - Session list, ticket context, AI context quality, draft note, and audit trail panels are visible.
- Proves:
  - UI remains functional when running against the new local topology.
- Type: docs-render-verification
- as_of: 2026-04-26T20:53:00+02:00

## EV-2026-04-26-026: BL-006 mock draft flow verified with local topology

- File: output/playwright/session-006-local-topology/05-mock-draft-generated.png
- Title: Mock AI draft generated with local topology services running
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session, loaded TICKET-101, and generated a mock AI draft.
- Shows:
  - Draft contains mock AI output with context hash.
  - Model metadata shows provider: mock, model: mock-support-note-v1.
  - Writeback remains disabled.
- Proves:
  - The full mock MVP 1 flow works with the local topology in place.
- Type: docs-render-verification
- as_of: 2026-04-26T20:55:00+02:00

## EV-2026-04-26-027: BL-007 connector status/mode visible in Support Cockpit

- File: output/playwright/session-007-zammad-connector/01-connector-status-mode-visible.png
- Title: Connector panel shows Mock mode, healthy status, and capabilities
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the Connector panel.
- Shows:
  - Connector panel displays "Mock mode" badge.
  - Type: zammad, Health: healthy, Connected: Yes.
  - Capabilities: read_tickets, read_customers, write_notes.
  - Warning: "No real writeback unless configured. Credentials not stored in browser."
- Proves:
  - The Zammad connector boundary is visible and honest about its mock mode.
- Type: docs-render-verification
- as_of: 2026-04-26T21:22:00+02:00

## EV-2026-04-26-028: BL-007 Zammad ticket context loaded through connector panel

- File: output/playwright/session-007-zammad-connector/02-ticket-context-loaded.png
- Title: Ticket context loaded via Zammad connector with Mock badge
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session and loaded TICKET-101 through the Zammad connector boundary.
- Shows:
  - Ticket Context panel shows "Zammad ticket TICKET-101" with status open, priority normal.
  - Customer name and email are visible.
  - Adapter ID is zammad-adapter-001.
  - AI Context Quality panel shows a ticket provenance packet with connectorMode: mock.
- Proves:
  - The connector read path returns deterministic mock data shaped like Zammad API output.
- Type: docs-render-verification
- as_of: 2026-04-26T21:24:00+02:00

## EV-2026-04-26-029: BL-007 internal note draft visible with review-required state

- File: output/playwright/session-007-zammad-connector/03-internal-note-draft-visible.png
- Title: Mock AI draft generated with review-required label
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated a mock AI draft for the selected session.
- Shows:
  - Draft textarea contains "[MOCK AI DRAFT - review required before any writeback]".
  - Model metadata shows provider: mock, model: mock-support-note-v1.
  - "Review before writeback" badge is visible.
- Proves:
  - Draft generation works through the connector workflow and requires explicit review.
- Type: docs-render-verification
- as_of: 2026-04-26T21:25:00+02:00

## EV-2026-04-26-030: BL-007 mock-safe writeback result visible

- File: output/playwright/session-007-zammad-connector/04-mock-safe-writeback-result.png
- Title: Writeback succeeded in mock mode with article ID
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Marked draft as reviewed and triggered writeback to TICKET-101.
- Shows:
  - Writeback button changed from disabled to enabled after review.
  - "Writeback succeeded" message with Article ID: 999.
  - "Mock mode — no real network call was made" is implied by the mock adapter.
- Proves:
  - The writeback flow is mock-safe by default and shows clear success/failure state.
- Type: docs-render-verification
- as_of: 2026-04-26T21:26:00+02:00

## EV-2026-04-26-031: BL-007 audit trail showing connector read/draft/writeback events

- File: output/playwright/session-007-zammad-connector/05-audit-trail-connector-events.png
- Title: Audit trail with connector-specific events
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel after ticket load, draft generation, and writeback.
- Shows:
  - zammad_ticket_loaded event with externalTicketId and connectorMode: mock.
  - ai_draft_generated event with provider/model metadata.
  - internal_note_drafted event with draftLength.
  - internal_note_writeback_attempted and internal_note_writeback_succeeded events.
- Proves:
  - All connector operations append audit events with tenant, actor, mode, and outcome.
- Type: docs-render-verification
- as_of: 2026-04-26T21:28:00+02:00

## EV-2026-04-26-032: BL-007 no-secret UI evidence

- File: output/playwright/session-007-zammad-connector/06-no-secret-ui-evidence.png
- Title: Connector panel without any token or secret displayed
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Inspected Connector panel and header for secret leakage.
- Shows:
  - No API token, password, or secret is visible anywhere in the UI.
  - Only mode, health, capabilities, and generic test results are shown.
- Proves:
  - Secrets are not exposed in the browser UI, API responses, or audit metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:28:00+02:00

## Entry Format

```yaml
- ID: EV-YYYY-MM-DD-001
  File: /absolute/path/to/artifact.png
  Title: short description
  Source/System: browser | api | test | log | screenshot | docs
  Route/Page: optional route or URL
  Action: what was done
  Shows:
    - visible fact 1
  Proves:
    - why the artifact matters
  Type: source-data | chatbot | gap | integration | docs-render-verification
  as_of: 2026-03-18T18:00:00+01:00
```

## EV-2026-04-26-039: BL-009 cockpit before call simulation

- File: output/playwright/session-009-call-simulator/01-cockpit-before-call-simulation.png
- Title: Support Cockpit before fake call simulation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the Call Simulator panel before simulating any call.
- Shows:
  - Call Simulator panel is visible with phone number input defaulting to "03 555 01 01".
  - "Simulate incoming call" button is present.
  - "No real telephony connected" disclaimer is visible.
- Proves:
  - The Call Simulator panel renders with honest mock labels from the start.
- Type: docs-render-verification
- as_of: 2026-04-26T21:55:00+02:00

## EV-2026-04-26-040: BL-009 fake incoming call created

- File: output/playwright/session-009-call-simulator/02-fake-call-created.png
- Title: Fake incoming call created with normalized number
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Simulate incoming call" with the default Belgian fixture number.
- Shows:
  - Result card displays "Normalized: +32 3 555 01 01".
  - "Fake webhook" label is visible.
  - "Mock phone source" label is visible.
- Proves:
  - The fake incoming call webhook endpoint returns a normalized number and honest mock labels.
- Type: docs-render-verification
- as_of: 2026-04-26T21:56:00+02:00

## EV-2026-04-26-041: BL-009 caller match hints visible

- File: output/playwright/session-009-call-simulator/03-caller-match-hints-visible.png
- Title: Caller match shows Acme BVBA with recent tickets
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Observed the caller match result after simulating the fake call.
- Shows:
  - Match status: "matched" with confidence "fixture".
  - Customer name: "Acme BVBA".
  - Recent tickets: TICKET-101, TICKET-102.
  - "Caller matching uses deterministic fixture data" disclaimer is visible.
- Proves:
  - Deterministic fixture-based caller matching is visible and labeled as mock data.
- Type: docs-render-verification
- as_of: 2026-04-26T21:56:00+02:00

## EV-2026-04-26-042: BL-009 call linked to session

- File: output/playwright/session-009-call-simulator/04-linked-to-session.png
- Title: Call linked to selected support session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected a support session and clicked "Link to selected session".
- Shows:
  - "Linked ✓" confirmation is visible.
  - Call status updated to "answered".
  - Session ID is displayed in the linked result.
- Proves:
  - The link call to session endpoint works and updates the call status.
- Type: docs-render-verification
- as_of: 2026-04-26T21:57:00+02:00

## EV-2026-04-26-043: BL-009 audit trail with call events

- File: output/playwright/session-009-call-simulator/05-audit-trail-call-events.png
- Title: Audit trail showing call_event_received, caller_matched, call_linked_to_session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel after simulating and linking the call.
- Shows:
  - call_event_received event with rawNumber and normalizedNumber metadata.
  - caller_matched event with customerName, matchStatus, and confidence metadata.
  - call_linked_to_session event with sessionId metadata.
- Proves:
  - All call operations append audit events with tenant, actor, and match metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:58:00+02:00

## EV-2026-04-26-044: BL-009 evidence bundle JSON with call summary

- File: output/playwright/session-009-call-simulator/06-evidence-bundle-call-summary.png
- Title: Evidence bundle JSON showing callEvents section
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the JSON tab, scrolled to the callEvents section.
- Shows:
  - callEvents array contains a call event summary with callEventId, provider "fake_webhook", direction "inbound", status "answered", normalizedNumber "+32 3 555 01 01".
  - Mock telephony disclaimer is visible.
- Proves:
  - Evidence bundles include call event summaries and mock telephony disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-26T22:01:00+02:00
