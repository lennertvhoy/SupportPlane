# EVIDENCE_LOG.md

**Purpose:** Structured ledger of proof artifacts for user-facing claims and external planning references.

## EV-2026-04-27-009: BL-044 Call Console Telephony Bridge panel

- File: output/playwright/session-044-telephony-adapter-boundary/01-call-console-telephony-bridge-panel.png
- Title: Call Console with Telephony Bridge panel
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Opened Call Console after creating fake provider webhook `BL-044-PROOF-1`.
- Shows:
  - Telephony Bridge panel with provider type `mock`, adapter mode `mock`, verification `not_required`, and mock/dev-only flag.
  - Honest labels: Telephony bridge boundary, Mock mode, No real PBX connected, No media or voice connected, Controls update local mock state only.
- Proves:
  - BL-044 boundary visibility is present in the Call Console.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-010: BL-044 mock capabilities and bridge test result

- File: output/playwright/session-044-telephony-adapter-boundary/02-telephony-status-capabilities-and-test-result.png
- Title: Telephony status/capabilities and bridge test result
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Clicked **Test bridge** in the Telephony Bridge panel.
- Shows:
  - Capabilities `inboundCalls`, `answer`, `hold`, `resume`, and `end`.
  - Last test result `healthy / mock / not_required`.
- Proves:
  - The mock adapter status/test flow is visible and deterministic.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-011: BL-044 bridge test result visible

- File: output/playwright/session-044-telephony-adapter-boundary/03-bridge-test-result-visible.png
- Title: Bridge test result visible
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Captured the Call Console after the mock bridge test completed.
- Shows:
  - Last test result remains visible in the Telephony Bridge panel.
- Proves:
  - The UI retains the last mock bridge test result for operator review.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-012: BL-044 fake provider webhook mapped incoming call

- File: output/playwright/session-044-telephony-adapter-boundary/04-fake-provider-webhook-mapped-incoming-call.png
- Title: Fake provider webhook mapped to selected incoming call
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Created a fake provider webhook event for `BL-044-PROOF-1` and selected it in the Call Console.
- Shows:
  - Selected fake incoming call, normalized phone number, matched Acme BVBA caller, and recent ticket hints.
- Proves:
  - The fake provider webhook maps into the existing CallEvent/caller matching flow.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-013: BL-044 mock control intent/result

- File: output/playwright/session-044-telephony-adapter-boundary/05-call-control-intent-result-mock-only.png
- Title: Mock telephony control intent/result
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Clicked **Answer** on the selected call.
- Shows:
  - Call status changed to `answered`.
  - Telephony Bridge panel shows `Call control intent/result: answer -> answered (succeeded) - mock-only`.
- Proves:
  - Call controls are routed through the telephony bridge boundary and remain mock-only.
- Type: docs-render-verification
- as_of: 2026-04-27T10:17:00+02:00

## EV-2026-04-27-014: BL-044 timeline/audit telephony bridge events

- File: output/playwright/session-044-telephony-adapter-boundary/06-timeline-audit-telephony-bridge-events.png
- Title: Timeline with telephony bridge events
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to Call Timeline after webhook and control actions.
- Shows:
  - `telephony_webhook_received`, `telephony_webhook_verified`, `telephony_call_control_requested`, and `telephony_call_control_succeeded` timeline entries.
- Proves:
  - Telephony bridge audit events appear in the user-visible call timeline.
- Type: docs-render-verification
- as_of: 2026-04-27T10:17:00+02:00

## EV-2026-04-27-015: BL-044 evidence bundle telephony events and disclaimers

- File: output/playwright/session-044-telephony-adapter-boundary/07-evidence-bundle-telephony-events-disclaimers.png
- Title: Evidence bundle with telephony bridge events
- Source/System: screenshot
- Route/Page: http://localhost:3200/?session=dc8357ff-a906-4b1c-aa2a-6e5a565c29c7
- Action: Linked the call to a support session, applied a mock hold control intent, and generated an evidence bundle.
- Shows:
  - Evidence Bundle summary with `Telephony Bridge` count.
  - Mock/dev-only and no-real-telephony disclaimer.
  - Audit Trail includes telephony control requested/succeeded events.
- Proves:
  - Evidence bundles include telephony bridge summaries and honest limitations.
- Type: docs-render-verification
- as_of: 2026-04-27T10:18:00+02:00

## EV-2026-04-27-016: BL-044 no-secret evidence export

- File: output/playwright/session-044-telephony-adapter-boundary/08-no-secret-evidence-export-redacted.png
- Title: Evidence export does not show injected secret-like values
- Source/System: screenshot
- Route/Page: http://localhost:3200/?session=dc8357ff-a906-4b1c-aa2a-6e5a565c29c7
- Action: Switched evidence preview to JSON and checked browser text for injected `Authorization`, bearer token, and signature proof values.
- Shows:
  - JSON evidence preview with telephony bridge events.
  - No visible injected token/signature/Authorization values.
- Proves:
  - The BL-044 UI/export proof does not display the injected secret-like test values.
- Type: docs-render-verification
- as_of: 2026-04-27T10:18:00+02:00

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

## EV-2026-04-26-123: BL-041 closure — preferredPriority fix and UI priority selector

- File: output/playwright/session-041-auto-session-from-call-final-closure/01-auto-create-option-visible.png
- Title: Call Simulator panel with auto-create, priority dropdown, and session title input
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the updated Call Simulator panel during BL-041 closure.
- Shows:
  - "Auto-create support session on matched call" checkbox is checked.
  - "Preferred priority" dropdown is visible with "High" selected.
  - "Preferred session title (optional)" input is visible.
  - "No real telephony connected" disclaimer is visible.
- Proves:
  - The UI now exposes preferredPriority and preferredSessionTitle controls for auto-create.
- Type: docs-render-verification
- as_of: 2026-04-26T23:15:00+02:00

## EV-2026-04-26-124: BL-041 closure — auto-created session with high priority

- File: output/playwright/session-041-auto-session-from-call-final-closure/02-matched-fake-incoming-call-creates-session.png
- Title: Matched fake incoming call auto-creates session with Priority: high
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Simulated fake incoming call with auto-create enabled and priority set to "High".
- Shows:
  - Call status is "answered".
  - Auto-create badge shows "auto_created".
  - Auto-created session card shows "ID: 72d03d7b... | Priority: high".
- Proves:
  - The selected preferred priority is reflected in the auto-created SupportSession.
- Type: docs-render-verification
- as_of: 2026-04-26T23:16:00+02:00

## EV-2026-04-26-125: BL-041 closure — auto-created session selected in cockpit with high priority

- File: output/playwright/session-041-auto-session-from-call-final-closure/03-auto-created-session-selected-open.png
- Title: Auto-created session selected in cockpit showing open • high
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Open in cockpit" on the auto-created session card.
- Shows:
  - Session banner shows "Incoming call from Acme BVBA" with "open • high".
  - Tickets: 2 from matched fixtures.
- Proves:
  - The auto-created session is selectable and displays the correct priority in the cockpit.
- Type: docs-render-verification
- as_of: 2026-04-26T23:17:00+02:00

## EV-2026-04-26-126: BL-041 closure — audit trail with auto-create and auto-link events

- File: output/playwright/session-041-auto-session-from-call-final-closure/05-audit-trail-auto-create-events.png
- Title: Audit Trail showing support_session_auto_created and call_auto_linked_to_session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after selecting the auto-created session.
- Shows:
  - support_session_auto_created event with actor, resource, and matched caller metadata.
  - call_auto_linked_to_session event with sessionId and call metadata.
- Proves:
  - Auto-creation and auto-linking append detailed audit events with tenant, actor, and match metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T23:18:00+02:00

## EV-2026-04-26-127: BL-041 closure — evidence bundle markdown with call session relationship

- File: output/playwright/session-041-auto-session-from-call-final-closure/06-evidence-bundle-markdown-call-session.png
- Title: Markdown evidence bundle showing Call Events with Linked Session and mock disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle for the auto-created session and switched to Markdown tab.
- Shows:
  - Session Summary with Priority: high.
  - Call Events section with Linked Session ID.
  - Mock/Dev-Only Disclaimers including auto-created session and mock telephony notes.
- Proves:
  - Evidence bundles include the auto-created call/session relationship, priority, and honest mock disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-26T23:20:00+02:00

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


## EV-2026-04-26-116: BL-041 call simulator panel with auto-create option

- File: output/playwright/session-041-auto-session-from-call/01-call-simulator-with-auto-create-option.png
- Title: Call Simulator panel with auto-create checkbox visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the Call Simulator panel.
- Shows:
  - "Auto-create support session on matched call" checkbox is visible and unchecked.
  - "No real telephony connected" disclaimer is visible.
  - "Fake webhook" badge is present.
- Proves:
  - The Call Simulator panel includes the auto-create toggle and honest mock labels.
- Type: docs-render-verification
- as_of: 2026-04-26T22:51:00+02:00

## EV-2026-04-26-117: BL-041 matched fake incoming call auto-creates session

- File: output/playwright/session-041-auto-session-from-call/02-matched-fake-incoming-call-creates-session.png
- Title: Fake incoming call with auto-create result badge and answered status
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Checked auto-create checkbox, clicked Simulate incoming call with default fixture number.
- Shows:
  - Call status is "answered".
  - Auto-create badge shows "auto_created".
  - Match status: matched, Customer: Acme BVBA, Recent tickets: TICKET-101, TICKET-102.
- Proves:
  - A matched fake incoming call with autoCreateSession=true triggers automatic session creation.
- Type: docs-render-verification
- as_of: 2026-04-26T22:52:00+02:00

## EV-2026-04-26-118: BL-041 auto-created session visible in cockpit

- File: output/playwright/session-041-auto-session-from-call/03b-auto-created-session-in-list.png
- Title: Auto-created session appears in session list after page refresh
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Refreshed the page after auto-creating a session from a fake call.
- Shows:
  - Session list shows "Incoming call from A..." with open badge.
  - Session ID prefix e80c0151, priority normal, timestamp 10:51:47 PM.
- Proves:
  - The auto-created session is tenant-scoped and persists in the in-memory store for the current runtime.
- Type: docs-render-verification
- as_of: 2026-04-26T22:53:00+02:00

## EV-2026-04-26-119: BL-041 call linked to auto-created session

- File: output/playwright/session-041-auto-session-from-call/04-call-linked-to-auto-created-session.png
- Title: Selected auto-created session shows Tickets: 2 and call audit trail
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected the auto-created session from the session list.
- Shows:
  - Session banner shows "Incoming call from Acme BVBA" with Tickets: 2.
  - Call audit trail shows support_session_auto_created event.
- Proves:
  - The auto-created session is selectable and shows the correct linked ticket count from caller matching.
- Type: docs-render-verification
- as_of: 2026-04-26T22:53:00+02:00

## EV-2026-04-26-120: BL-041 audit trail with auto-create and auto-link events

- File: output/playwright/session-041-auto-session-from-call/05e-audit-trail-scrolled.png
- Title: Audit Trail showing support_session_auto_created and call_auto_linked_to_session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after selecting the auto-created session.
- Shows:
  - support_session_auto_created event with actor user/dev-user, resource support_session:e80c0151, metadata including externalCallId, normalizedNumber, customerId, customerName, matchedTicketIds, mockDevOnly.
  - call_auto_linked_to_session event with actor user/dev-user, resource call_event:80ab5058, metadata including externalCallId, sessionId, normalizedNumber, mockDevOnly.
- Proves:
  - Auto-creation and auto-linking append detailed audit events with tenant, actor, and match metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T22:55:00+02:00

## EV-2026-04-26-121: BL-041 evidence bundle markdown with linked call session

- File: output/playwright/session-041-auto-session-from-call/06k-evidence-bundle-markdown-linked-session.png
- Title: Markdown evidence bundle showing Call Events with Linked Session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle for the auto-created session and switched to Markdown tab.
- Shows:
  - Call Events section lists FAKE-1777236707922 with provider fake_webhook, direction inbound, status answered.
  - Matched Customer: Acme BVBA, Matched Tickets: TICKET-101, TICKET-102.
  - Linked Session: e80c0151-a777-4be0-8684-e2aa6b18b602.
  - Mock/Dev-Only: true.
- Proves:
  - Evidence bundles include the auto-created call/session relationship and matched caller context.
- Type: docs-render-verification
- as_of: 2026-04-26T22:59:00+02:00

## EV-2026-04-26-122: BL-041 evidence bundle mock telephony disclaimer

- File: output/playwright/session-041-auto-session-from-call/06n-evidence-bundle-markdown-disclaimers-text.png
- Title: Evidence bundle Mock/Dev-Only Disclaimers including auto-created session note
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Mock/Dev-Only Disclaimers section in the Markdown evidence bundle.
- Shows:
  - "Call events are simulated via fake webhook. No real telephony is co..."
  - "Caller matching uses deterministic mock fixtures, not a real custom..."
  - "Support sessions may be auto-created from fake incoming calls. Thes..."
- Proves:
  - Evidence bundles include honest mock telephony and auto-created session disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-26T23:01:00+02:00

## EV-2026-04-26-128: BL-042 cockpit initial state

- File: output/playwright/session-042-greeting-suggestion/01-cockpit-initial-state.png
- Title: Support Cockpit before greeting suggestion workflow
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the initial state with Call Simulator and Greeting Suggestion panels.
- Shows:
  - Call Simulator panel with auto-create checkbox and "No real telephony connected" disclaimer.
  - Greeting Suggestion panel with "Select a session to generate a greeting suggestion" empty state.
- Proves:
  - The UI layout includes the new Greeting Suggestion panel in the correct position.
- Type: docs-render-verification
- as_of: 2026-04-26T23:44:00+02:00

## EV-2026-04-26-129: BL-042 matched fake incoming call with auto-created session

- File: output/playwright/session-042-greeting-suggestion/02-matched-call-auto-created-session.png
- Title: Matched fake incoming call auto-creates support session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Simulated fake incoming call with auto-create enabled and default fixture number.
- Shows:
  - Call status is "answered".
  - Auto-create badge shows "auto_created".
  - Match status: matched, Customer: Acme BVBA, Recent tickets: TICKET-101, TICKET-102.
  - Auto-created session card with "Open in cockpit" button.
- Proves:
  - The call simulation and auto-creation flow works as a prerequisite for greeting suggestion.
- Type: docs-render-verification
- as_of: 2026-04-26T23:44:00+02:00

## EV-2026-04-26-130: BL-042 generated greeting text visible

- File: output/playwright/session-042-greeting-suggestion/04-generated-greeting-text-visible.png
- Title: Generated mock AI greeting visible in Greeting Suggestion panel
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected the auto-created session and clicked "Generate suggested greeting" with Professional tone.
- Shows:
  - Suggested greeting text: "Good day, the caller. Thank you for calling SupportPlane..."
  - "Not spoken or sent automatically" disclaimer below the greeting.
  - Copy button is available.
- Proves:
  - The mock AI greeting generation is visible and reviewable in the UI.
- Type: docs-render-verification
- as_of: 2026-04-26T23:45:00+02:00

## EV-2026-04-26-131: BL-042 model/prompt/context metadata visible

- File: output/playwright/session-042-greeting-suggestion/05-model-prompt-context-metadata-visible.png
- Title: Mock model metadata for greeting suggestion visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the model metadata block after greeting generation.
- Shows:
  - Provider: mock
  - Model: mock-greeting-v1
  - Prompt version: mock-v1
  - Context hash value
  - Tone: professional
  - Auto-send: No
  - Voice: No
  - "Review before use" badge
- Proves:
  - Provider, model, prompt version, context hash, tone, and safety metadata are visible to the operator.
- Type: docs-render-verification
- as_of: 2026-04-26T23:45:00+02:00

## EV-2026-04-26-132: BL-042 audit trail shows greeting_suggestion_generated

- File: output/playwright/session-042-greeting-suggestion/06-audit-trail-greeting-suggestion-generated.png
- Title: Audit trail showing greeting_suggestion_generated event
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after generating a greeting suggestion.
- Shows:
  - greeting_suggestion_generated event with actor dev-user, resource support_session:900851f5.
  - Metadata includes provider, model, promptId, promptVersion, contextHash, tone, greetingText, mockOnly.
- Proves:
  - Greeting suggestion generation appends a detailed audit event with tenant, actor, and model metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T23:45:00+02:00

## EV-2026-04-26-133: BL-042 evidence bundle JSON includes greeting suggestion

- File: output/playwright/session-042-greeting-suggestion/12-evidence-bundle-json-greeting-complete.png
- Title: Evidence bundle JSON showing greetingSuggestions section
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to JSON tab, scrolled to greetingSuggestions.
- Shows:
  - greetingSuggestions array with greetingText, tone, provider, model, promptVersion, contextHash.
  - mockOnly: true, reviewRequired: true, autoSend: false, voiceEnabled: false.
- Proves:
  - Evidence bundles include greeting suggestion summaries and honest mock/disabled flags.
- Type: docs-render-verification
- as_of: 2026-04-26T23:46:00+02:00

## EV-2026-04-27-001: BL-043 final closure Call Console route

- File: output/playwright/session-043-call-console-ui-final-closure/01-call-console-route-mock-labels.png
- Title: Call Console route with mock labels
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Opened `/call-console` during the final BL-043 closure flow.
- Shows:
  - Mock Call Console header.
  - "No real telephony connected" label.
  - Recent fake incoming calls list.
- Proves:
  - The dedicated Call Console route renders with honest mock telephony labels.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-002: BL-043 selected fake call with match and ticket hints

- File: output/playwright/session-043-call-console-ui-final-closure/02-selected-fake-call-caller-match-ticket-hints.png
- Title: Selected fake incoming call with caller match data
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected the final closure fake incoming call.
- Shows:
  - Caller Identity panel.
  - Matched customer Acme BVBA.
  - Recent tickets TICKET-101 and TICKET-102.
  - Mock matching disclaimer.
- Proves:
  - The Call Console displays caller identity, customer match, and ticket hints.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-003: BL-043 linked support session visible

- File: output/playwright/session-043-call-console-ui-final-closure/03-linked-support-session-visible.png
- Title: Linked SupportSession panel visible from Call Console
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Answered the fake call, linked it to the closure SupportSession, and reloaded the Call Console.
- Shows:
  - Linked Support Session panel.
  - Session title, status, priority, ticket count, and Open in cockpit button.
- Proves:
  - A selected fake call can display its linked SupportSession in the Call Console.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-004: BL-043 mock lifecycle controls and timeline

- File: output/playwright/session-043-call-console-ui-final-closure/04-mock-call-controls-answer-hold-resume-end-lifecycle.png
- Title: Mock answer, hold, resume, end lifecycle
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Used mock lifecycle controls for answer, hold, resume, and end.
- Shows:
  - Ended fake call state.
  - Call Timeline entries for call answered, call placed on hold, call resumed, and call ended.
  - Mock controls disclaimer.
- Proves:
  - BL-043 lifecycle controls update local call state and timeline without real telephony.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-005: BL-043 greeting suggestion visible in Call Console

- File: output/playwright/session-043-call-console-ui-final-closure/05-suggested-greeting-model-prompt-context-metadata.png
- Title: Suggested greeting and model metadata in Call Console
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Generated a professional mock greeting for the linked call/session.
- Shows:
  - Greeting text.
  - Provider/model/prompt/context metadata.
  - Auto-send and voice disabled state.
  - Mock AI and review-before-use labels.
- Proves:
  - The Call Console integrates the BL-042 greeting suggestion workflow.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-006: BL-043 timeline includes call, link, status, and greeting events

- File: output/playwright/session-043-call-console-ui-final-closure/06-timeline-received-matched-linked-status-greeting.png
- Title: Call timeline with received, matched, linked, status, and greeting events
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to the timeline after lifecycle changes and greeting generation.
- Shows:
  - Call received.
  - Caller matched.
  - Call linked to session.
  - Call status lifecycle entries.
  - Greeting suggested.
- Proves:
  - `GET /calls/:id/timeline` feeds the Call Console audit/timeline panel.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-007: BL-043 navigation between Call Console and Support Cockpit

- File: output/playwright/session-043-call-console-ui-final-closure/07-navigation-between-call-console-and-support-cockpit.png
- Title: Support Cockpit opened from Call Console linked session
- Source/System: browser
- Route/Page: http://localhost:3200/?session=777c478a-0042-44cf-b6ce-1ea85924b101
- Action: Clicked Open in cockpit from the Call Console.
- Shows:
  - Support Cockpit route with the linked session selected.
  - Call Console navigation button in the cockpit header.
- Proves:
  - Operators can navigate between Call Console and Support Cockpit for the linked session.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-008: BL-043 evidence bundle lifecycle, greeting, and mock disclaimers

- File: output/playwright/session-043-call-console-ui-final-closure/08-evidence-bundle-call-lifecycle-greeting-mock-disclaimers.png
- Title: Evidence bundle preview with call lifecycle and greeting information
- Source/System: browser
- Route/Page: http://localhost:3200/?session=777c478a-0042-44cf-b6ce-1ea85924b101
- Action: Generated an evidence bundle from the Support Cockpit and opened the Markdown preview.
- Shows:
  - Evidence bundle preview for the same linked support session.
  - Call lifecycle audit and greeting suggestion information.
  - Mock/dev-only disclaimers.
- Proves:
  - Evidence bundles include call lifecycle, greeting information, mock telephony disclaimers, and mock AI/disabled voice flags.
- Type: docs-render-verification
- as_of: 2026-04-27T09:46:00+02:00

## EV-2026-04-27-017: BL-045 Call Console with Mock Recording panel

- File: output/playwright/session-045-call-recording-mock-final-closure/01-call-console-with-mock-recording-panel.png
- Title: Call Console with Mock Recording panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected the answered fake incoming call BL045-PROOF-1 in the Call Console.
- Shows:
  - Mock Recording panel with "No real audio" badge.
  - Recording metadata: mock-ref-5f9429a2, available, source mock_generated, storage mock_inline.
  - Buttons: Attach mock recording, Playback placeholder, Mark reviewed.
  - Disclaimer: "This is a mock recording. No real audio was captured. Not compliance-grade."
- Proves:
  - BL-045 Mock Recording panel is visible and contains honest mock labels.
- Type: docs-render-verification
- as_of: 2026-04-27T11:41:00+02:00

## EV-2026-04-27-018: BL-045 mock recording disclaimers

- File: output/playwright/session-045-call-recording-mock-final-closure/02-mock-recording-disclaimers.png
- Title: Mock Recording panel disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Captured the Mock Recording panel in isolation.
- Shows:
  - "Mock recording — no real audio captured" warning.
  - "Playback placeholder only. Not compliance-grade. No object storage connected."
  - Recording metadata with mock_inline storage.
- Proves:
  - The UI explicitly states no real audio, no compliance grade, and no object storage.
- Type: docs-render-verification
- as_of: 2026-04-27T11:41:00+02:00

## EV-2026-04-27-019: BL-045 playback placeholder active

- File: output/playwright/session-045-call-recording-mock-final-closure/03-playback-placeholder-active.png
- Title: Playback placeholder button active state
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Playback placeholder" in the Mock Recording panel.
- Shows:
  - Playback placeholder button in active state.
  - No audio element or real playback UI is present.
- Proves:
  - Playback action is a placeholder only; no real audio is played.
- Type: docs-render-verification
- as_of: 2026-04-27T11:41:00+02:00

## EV-2026-04-27-020: BL-045 recording reviewed state

- File: output/playwright/session-045-call-recording-mock-final-closure/04-recording-reviewed-state.png
- Title: Recording marked as reviewed
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Mark reviewed" in the Mock Recording panel.
- Shows:
  - Status changed to "mock_only".
  - Button changed to "Reviewed" [disabled].
  - "Reviewed at 11:42:04 AM" timestamp visible.
- Proves:
  - Review workflow updates recording status and disables further review.
- Type: docs-render-verification
- as_of: 2026-04-27T11:42:00+02:00

## EV-2026-04-27-021: BL-045 audit trail with recording events

- File: output/playwright/session-045-call-recording-mock-final-closure/05-audit-trail-recording-events.png
- Title: Audit trail showing recording attachment, playback, and review events
- Source/System: browser
- Route/Page: http://localhost:3200/?session=5bab99c6-f80a-4cc6-b37b-140ae864863f
- Action: Opened Support Cockpit for the linked session and scrolled to Audit Trail.
- Shows:
  - call_recording_attached event with mock_generated source and noRealAudio flag.
  - call_recording_playback_opened events with placeholderOnly flag.
  - call_recording_reviewed event with previousStatus available and newStatus mock_only.
- Proves:
  - All recording lifecycle events are audited with tenant, actor, and mock-only metadata.
- Type: docs-render-verification
- as_of: 2026-04-27T11:44:00+02:00

## EV-2026-04-27-022: BL-045 evidence bundle JSON with callRecordings

- File: output/playwright/session-045-call-recording-mock-final-closure/06-evidence-bundle-json-call-recordings.png
- Title: JSON evidence bundle showing callRecordings array
- Source/System: browser
- Route/Page: http://localhost:3200/?session=5bab99c6-f80a-4cc6-b37b-140ae864863f
- Action: Generated evidence bundle and switched to JSON tab, scrolled to callRecordings.
- Shows:
  - callRecordings array with recordingId, callEventId, supportSessionId.
  - status: mock_only, source: mock_generated, storageType: mock_inline.
  - noRealAudio: true, complianceDisclaimer visible.
- Proves:
  - Evidence bundles include structured call recording summaries with mock disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-27T11:53:00+02:00

## EV-2026-04-27-023: BL-045 no-secret redacted proof

- File: output/playwright/session-045-call-recording-mock-final-closure/07-no-secret-redacted-proof.png
- Title: Evidence export with redacted sensitive values
- Source/System: browser
- Route/Page: http://localhost:3200/?session=5bab99c6-f80a-4cc6-b37b-140ae864863f
- Action: Scrolled JSON preview to audit timeline metadata.
- Shows:
  - sessionId: [REDACTED] in audit metadata.
  - No tokens, passwords, Authorization headers, or secret values visible.
- Proves:
  - Redaction helpers prevent secret exposure in evidence bundle output.
- Type: docs-render-verification
- as_of: 2026-04-27T11:54:00+02:00

## EV-2026-04-27-024: BL-045 Markdown evidence bundle recording disclaimers

- File: output/playwright/session-045-call-recording-mock-final-closure/08-evidence-bundle-markdown-recording-disclaimers.png
- Title: Markdown evidence bundle with recording disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/?session=5bab99c6-f80a-4cc6-b37b-140ae864863f
- Action: Switched to Markdown tab and scrolled to Mock / Dev-Only Disclaimers.
- Shows:
  - "Call recordings are mock metadata only. No real audio was captured, stored, or played back. Not compliance-grade."
- Proves:
  - Markdown export includes explicit mock recording disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-27T11:55:00+02:00

## EV-2026-04-27-025: BL-046 Call Console Operator Companion panel

- File: output/playwright/session-046-operator-companion-final-closure/04-operator-companion-panel-in-view.png
- Title: Call Console with Operator Companion panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected a linked call and scrolled to Operator Companion panel.
- Shows:
  - "Operator Companion" panel with "Mock screen observation" badge.
  - Disclaimers: "Mock screen observation — no real screen capture", "No raw pixels, clipboard access, or OCR. Review before AI context. Pattern redaction only."
  - Capture form with Kind, App label, Window label, URL label, Note/placeholder fields.
  - "Capture mock observation" button.
- Proves:
  - BL-046 UI panel is present with required safety labels and capture controls.
- Type: ui-verification
- as_of: 2026-04-27T12:24:00+02:00

## EV-2026-04-27-026: BL-046 Approved observation with Packet badge

- File: output/playwright/session-046-operator-companion-final-closure/05-operator-companion-observation-item.png
- Title: Approved screen observation with Packet badge
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to show observation list item.
- Shows:
  - `manual_note` observation with `approved` badge and `Packet` badge.
  - App: SupportPlane, Window: Call Console.
  - Note: "Customer unable to access billing portal. Suggested password reset."
  - "Reviewed at 12:22:58 PM".
  - Footer: "Mock/dev-only • No real screen capture • No raw pixels • No clipboard access".
- Proves:
  - Observation lifecycle (capture → review → context packet) is visible in UI.
- Type: ui-verification
- as_of: 2026-04-27T12:24:00+02:00

## EV-2026-04-27-027: BL-046 Support Cockpit AI Context Quality panel

- File: output/playwright/session-046-operator-companion-final-closure/08-ai-context-quality-with-packet.png
- Title: AI Context Quality panel showing screen_observation packet
- Source/System: browser
- Route/Page: http://localhost:3200/?session=ed25d3d7-4db0-4d54-b735-5175aef06765
- Action: Navigated to Support Cockpit and scrolled to AI Context Quality panel.
- Shows:
  - "AI Context Quality" panel with `screen_observation` entry under "Other".
  - `source: screen_observation`, `observationId`, `kind: manual_note`.
  - `Warning` badge and `2 redacted` indicator.
- Proves:
  - Approved observation-derived context packets appear in Support Cockpit with source label.
- Type: ui-verification
- as_of: 2026-04-27T12:25:00+02:00

## EV-2026-04-27-028: BL-046 Audit trail screen observation events

- File: output/playwright/session-046-operator-companion-final-closure/11-audit-trail-screen-obs-events.png
- Title: Audit trail with screen observation captured/reviewed/context events
- Source/System: browser
- Route/Page: http://localhost:3200/?session=ed25d3d7-4db0-4d54-b735-5175aef06765
- Action: Scrolled to Audit Trail panel.
- Shows:
  - `screen_observation_captured` event with kind and mockDevOnly metadata.
  - `screen_observation_reviewed` event with previousStatus/newStatus.
  - `screen_observation_context_packet_created` event with contextPacketId.
  - `ai_context_loaded` event with provenance: screen_observation.
- Proves:
  - All 4 BL-046 audit event types are emitted and visible in the audit trail.
- Type: ui-verification
- as_of: 2026-04-27T12:26:00+02:00

## EV-2026-04-27-029: BL-046 Evidence bundle JSON screenObservations array

- File: output/playwright/session-046-operator-companion-final-closure/13-evidence-bundle-screen-obs-section.png
- Title: Evidence bundle JSON with screenObservations array
- Source/System: browser
- Route/Page: http://localhost:8765/bl046-evidence-bundle.html
- Action: Navigated to rendered evidence bundle JSON and scrolled to screenObservations.
- Shows:
  - `"screenObservations"` array containing one observation.
  - `observationId`, `kind: manual_note`, `status: approved`, `reviewedBy: dev-user`.
  - `mockDevOnly: true`, `noRealScreenCapture: true`, `noRawPixels: true`, `noClipboardAccess: true`.
- Proves:
  - Evidence bundle includes screen observation summaries with all safety flags.
- Type: api-response-verification
- as_of: 2026-04-27T12:28:00+02:00

## EV-2026-04-27-030: BL-046 Evidence bundle compliance disclaimer

- File: output/playwright/session-046-operator-companion-final-closure/14-evidence-bundle-disclaimers.png
- Title: Evidence bundle observation with compliance disclaimer
- Source/System: browser
- Route/Page: http://localhost:8765/bl046-evidence-bundle.html
- Action: Scrolled to show full observation entry.
- Shows:
  - `complianceDisclaimer`: "Mock screen observation only. No real screen capture, raw pixels, clipboard access, or OCR was performed."
  - Audit timeline starts immediately after screenObservations.
- Proves:
  - Each observation summary carries an explicit compliance disclaimer.
- Type: api-response-verification
- as_of: 2026-04-27T12:28:00+02:00

## EV-2026-04-27-031: BL-046 Redaction proof in evidence bundle audit

- File: output/playwright/session-046-operator-companion-final-closure/15-evidence-bundle-limitations.png
- Title: Redaction proof — [REDACTED] values in audit metadata
- Source/System: browser
- Route/Page: http://localhost:8765/bl046-evidence-bundle.html
- Action: Scrolled to audit timeline section.
- Shows:
  - `screen_observation_captured` event where `source` is `[REDACTED]`.
  - `ai_context_loaded` event where `observationId` is `[REDACTED]`.
  - `evidence_bundle_generated` event where `bundleId` is `[REDACTED]`.
- Proves:
  - Deterministic redaction is active on observation IDs, source values, and bundle IDs in evidence bundle output.
- Type: api-response-verification
- as_of: 2026-04-27T12:28:00+02:00

## EV-2026-04-27-032: BL-046 Evidence bundle mock disclaimers

- File: output/playwright/session-046-operator-companion-final-closure/17-evidence-bundle-mock-disclaimers.png
- Title: Evidence bundle mock/dev-only disclaimers
- Source/System: browser
- Route/Page: http://localhost:8765/bl046-evidence-bundle.html
- Action: Scrolled to mockDevOnlyDisclaimers and limitations sections.
- Shows:
  - "Screen observations are mock metadata only. No real screen capture, raw pixels, clipboard access, or OCR was performed. Not surveillance or compliance-grade."
  - "Mock screen observations have no real desktop, browser, or application content and do not constitute surveillance, monitoring, or compliance-grade evidence."
- Proves:
  - Evidence bundle includes explicit screen observation disclaimers and limitations.
- Type: api-response-verification
- as_of: 2026-04-27T12:28:00+02:00
