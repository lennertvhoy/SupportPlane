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
