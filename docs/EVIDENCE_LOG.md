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
- Source/System: browser
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
- Source/System: browser
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
  - Ticket Context panel displays mock connector data: subject, subset, priority, customer name/email, adapter ID.
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
- as_of: 2026-04-26T20: 55:00+02:00

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


## EV-2026-04-27-033: BL-046 canonical closure — Call Console with Operator Companion panel

- File: output/playwright/session-046-operator-companion-closure-canonical/01-call-console-operator-companion-panel.png
- Title: Call Console with Operator Companion panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected fake incoming call BL046-CANON-3 and captured full page showing Operator Companion panel.
- Shows:
  - Call Console with selected call "BL046-CANON-3".
  - Telephony Bridge panel and Mock Recording panel visible.
  - Operator Companion panel with capture form and safety disclaimers.
- Proves:
  - BL-046 Operator Companion panel is present in the Call Console.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-034: BL-046 canonical closure — mock screen observation safety disclaimers

- File: output/playwright/session-046-operator-companion-closure-canonical/02-operator-companion-safety-disclaimers.png
- Title: Operator Companion safety disclaimers visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to Operator Companion panel to show safety banner.
- Shows:
  - "Mock screen observation — no real screen capture" warning.
  - "No raw pixels, clipboard access, or OCR. Review before AI context. Pattern redaction only."
- Proves:
  - Safety boundaries and limitations are visible before any capture.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-035: BL-046 canonical closure — mock observation captured with redacted summary

- File: output/playwright/session-046-operator-companion-closure-canonical/03-mock-observation-captured-redacted.png
- Title: Mock observation captured with review_required status
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled capture form and clicked "Capture mock observation".
- Shows:
  - Observation item with kind "active_window", status "review_required".
  - "Mock/dev-only • No real screen capture • No raw pixels • No clipboard access" footer.
- Proves:
  - Capture creates deterministic mock metadata with required safety flags.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-036: BL-046 canonical closure — observation approved state

- File: output/playwright/session-046-operator-companion-closure-canonical/04-observation-approved.png
- Title: Observation approved with Approve/Discard buttons visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Approve" on the captured observation.
- Shows:
  - Observation status updated to "approved".
  - "Reviewed at" timestamp visible.
  - "Create context packet" button available.
- Proves:
  - Review gate works and status transitions are visible.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-037: BL-046 canonical closure — AI context packet created from approved observation

- File: output/playwright/session-046-operator-companion-closure-canonical/05-context-packet-created.png
- Title: Context packet created from approved observation
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Create context packet" on the approved observation.
- Shows:
  - Observation shows "Packet" badge and "approved" status.
  - "Reviewed at" timestamp and safety disclaimers remain visible.
- Proves:
  - Approved observation can be converted to an AI context packet.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-038: BL-046 canonical closure — Support Cockpit AI Context Quality panel

- File: output/playwright/session-046-operator-companion-closure-canonical/06-cockpit-ai-context-quality-observation-packet.png
- Title: AI Context Quality panel showing observation-derived packet
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Navigated to Support Cockpit and selected the session with the observation-derived packet.
- Shows:
  - AI Context Quality panel shows "screen_observation" provenance packet.
  - kind: active_window, observationId visible.
- Proves:
  - Observation-derived context packet appears in the Support Cockpit.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-039: BL-046 canonical closure — audit trail with observation events

- File: output/playwright/session-046-operator-companion-closure-canonical/07-audit-trail-observation-events.png
- Title: Audit trail showing observation capture/review/context-packet events
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Scrolled to Audit Trail panel to show observation-related events.
- Shows:
  - screen_observation_captured, screen_observation_reviewed, screen_observation_context_packet_created, and ai_context_loaded events.
- Proves:
  - All observation lifecycle events are auditable and visible.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-040: BL-046 canonical closure — evidence bundle JSON with screen observations

- File: output/playwright/session-046-operator-companion-closure-canonical/08-evidence-bundle-json-screen-observations.png
- Title: Evidence bundle JSON showing screen observation summary and disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Generated evidence bundle and switched to JSON tab.
- Shows:
  - Bundle JSON with session summary and screenObservations section.
  - Mock/dev-only disclaimers visible in bundle output.
- Proves:
  - Evidence bundles include screen observation summaries and honest disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-041: BL-046 canonical closure — no-secret evidence bundle proof

- File: output/playwright/session-046-operator-companion-closure-canonical/09-no-secret-evidence-bundle.png
- Title: Evidence bundle export with no secret/token leakage
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Verified JSON evidence bundle does not contain injected apiToken or Bearer token values.
- Shows:
  - JSON preview without apiToken=abc123 or Bearer tok123.
  - Redaction is active in exported bundle content.
- Proves:
  - Secret redaction prevents raw token/password exposure in evidence exports.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-042: BL-047/048/049 final closure — Operator Companion with sharing indicator inactive

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/01-operator-companion-inactive.png
- Title: Call Console with Operator Companion panel, sharing indicator inactive
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected fake incoming call and captured full page showing Operator Companion panel with Sharing: inactive badge.
- Shows:
  - Operator Companion panel with mock screen observation safety disclaimers.
  - Sharing indicator badge shows "Sharing: inactive".
  - Start mock sharing button is visible.
- Proves:
  - BL-047 sharing indicator is visible in inactive state.
- Type: docs-render-verification
- as_of: 2026-04-27T14:22:00+02:00

## EV-2026-04-27-043: BL-047/048/049 final closure — sharing indicator active

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/02-sharing-active.png
- Title: Call Console with sharing indicator active
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked Start mock sharing and captured full page.
- Shows:
  - Sharing badge updated to "Sharing: active".
  - Pause and Stop controls visible.
  - Mock/dev-only and no-real-screen-capture labels present.
- Proves:
  - BL-047 sharing state transitions from inactive to active and updates UI immediately.
- Type: docs-render-verification
- as_of: 2026-04-27T14:23:00+02:00

## EV-2026-04-27-044: BL-047/048/049 final closure — active window metadata captured

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/03-active-window-captured.png
- Title: Active Window Metadata captured with redacted summary
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled Active Window Metadata form and clicked Capture active window metadata.
- Shows:
  - Observation card with kind "active_window", status "review_required".
  - Redacted summary visible: "Operator sees ticket detail view with apiToken=[REDACTED]".
- Proves:
  - BL-048 active-window metadata capture works and redaction is applied before display.
- Type: docs-render-verification
- as_of: 2026-04-27T14:24:00+02:00

## EV-2026-04-27-045: BL-047/048/049 final closure — manual screenshot metadata attached

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/04-manual-screenshot-metadata.png
- Title: Manual Screenshot Metadata form with raw image retention disabled
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled Manual Screenshot Metadata form and clicked Attach screenshot metadata.
- Shows:
  - "Raw image retention disabled" badge is visible.
  - Observation card with kind "screenshot_metadata".
- Proves:
  - BL-048 manual screenshot metadata capture works and raw image retention is explicitly disabled.
- Type: docs-render-verification
- as_of: 2026-04-27T14:24:00+02:00

## EV-2026-04-27-046: BL-047/048/049 final closure — structured upload with redaction status

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/05-structured-upload-redaction.png
- Title: Structured Upload observation with pattern_redacted status
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected kind "redacted_context", filled note with token and path, clicked Upload structured observation.
- Shows:
  - Observation card with kind "redacted_context", redactionStatus "pattern_redacted".
  - Note shows "Token: [REDACTED] and path [REDACTED_PATH]".
- Proves:
  - BL-049 structured upload works and pattern/placeholder redaction is visible in the UI.
- Type: docs-render-verification
- as_of: 2026-04-27T14:25:00+02:00

## EV-2026-04-27-047: BL-047/048/049 final closure — approved observation with context packet

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/06-approved-context-packet.png
- Title: Approved observation with Packet badge and context packet created
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked Approve on the structured upload observation, then clicked Create context packet.
- Shows:
  - Observation status updated to "approved".
  - "Packet" badge is visible.
  - Reviewed timestamp visible.
- Proves:
  - Review gate works and approved observation can be converted to an AI context packet.
- Type: docs-render-verification
- as_of: 2026-04-27T14:26:00+02:00

## EV-2026-04-27-048: BL-047/048/049 final closure — AI Context Quality panel with observation-derived packet

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/07-ai-context-quality-panel.png
- Title: Support Cockpit AI Context Quality panel showing screen observation packet
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Navigated to Support Cockpit with the linked session.
- Shows:
  - SCREEN OBSERVATION packet with provenance "screen_observation".
  - Warning badge, kind "redacted_context", "2 redacted" label.
- Proves:
  - BL-049 observation-derived context packet is visible in the Support Cockpit AI Context Quality panel.
- Type: docs-render-verification
- as_of: 2026-04-27T14:27:00+02:00

## EV-2026-04-27-049: BL-047/048/049 final closure — audit trail with sharing/capture/redaction/context-packet events

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/08-audit-trail-events.png
- Title: Audit Trail showing all BL-047/048/049 event types
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Scrolled to Audit Trail panel.
- Shows:
  - screen_observation_sharing_started
  - active_window_metadata_captured
  - manual_screenshot_metadata_attached
  - structured_screen_observation_uploaded
  - screen_observation_reviewed
  - screen_observation_context_packet_created
  - ai_context_loaded
- Proves:
  - All required audit events are appended and visible.
- Type: docs-render-verification
- as_of: 2026-04-27T14:28:00+02:00

## EV-2026-04-27-050: BL-047/048/049 final closure — evidence bundle JSON with screen observations and redaction

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/09-evidence-bundle-json.png
- Title: Evidence Bundle JSON preview with screen observation summaries
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Generated evidence bundle and switched to JSON tab.
- Shows:
  - screenObservations array with sharingState, rawImageRetention, redactionStatus, safetyFlags.
  - Redacted summaries: "Token: [REDACTED] and path [REDACTED_PATH]".
  - Mock screen observation disclaimers.
- Proves:
  - Evidence bundle includes all new structured fields and redaction markers.
- Type: docs-render-verification
- as_of: 2026-04-27T14:29:00+02:00

## EV-2026-04-27-051: BL-047/048/049 final closure — no-secret/no-raw-image proof

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/10-no-secret-proof.png
- Title: UI and exported JSON do not contain raw secrets, tokens, paths, or image content
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Injected secret-like strings into structured upload and manual screenshot metadata, then verified the visible UI/export text.
- Shows:
  - No apiToken=abc123, password=secret, Bearer tok123, ZAMMAD_API_TOKEN, /etc/passwd, or long token string is visible.
  - [REDACTED] and [REDACTED_PATH] markers are present.
- Proves:
  - Redaction layer successfully prevents secret and path exposure in bundle output and UI.
- Type: docs-render-verification
- as_of: 2026-04-27T14:29:00+02:00
