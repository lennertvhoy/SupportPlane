# Session 125 Subagent A Report — Backlog Item Truth Table

**Date:** 2026-05-01  
**Agent:** Subagent A  
**HEAD:** e2b671d662b2256cd0461b9cb4a84135111ee6a2  
**Scope:** Analyze current codebase truth for 11 target backlog items and define exact acceptance criteria.

---

## Methodology

1. Read AGENTS.md, STATUS.md, PROJECT_STATE.yaml, BACKLOG.md, NEXT_ACTIONS.md.
2. Explored packages/ai, packages/audit, packages/contracts, apps/api, apps/web, prisma/schema.
3. Searched for files, APIs, UI components, DB tables, and contracts related to each backlog item.
4. Mapped what exists vs. what is genuinely missing.
5. Assigned honest status outcomes per the repo honesty rules.

---

## Truth Table

### BL-026 — AI model gateway

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `packages/ai/src/index.ts` — `ModelGateway` class with `generateDraft()` and `generateGreeting()`. `packages/ai/src/registry.ts` — AI provider registry. `apps/api/src/support-sessions/support-sessions.service.ts` — injects gateway via `createDefaultModelGateway()`. | No OpenAI provider implementation. No Azure OpenAI provider implementation. No cloud-provider config schema or credential integration. |
| **UI Components** | `DraftNotePanel.tsx` shows provider badges (mock/ollama/lmstudio). `apps/web/app/page.tsx` uses `generateDraftSuggestion`. | No dedicated model gateway admin UI. No provider health/status panel beyond telemetry. |
| **DB Tables** | No dedicated model gateway table. Provider config is env-driven only. | No persisted provider configuration. No model gateway audit log table. |
| **Contracts** | `AiProviderId` enum = `['mock', 'ollama', 'lmstudio']`. `ModelSelection`, `PromptTemplate`, `ModelUsageMetadata`, `AiSafetyMetadata` in `packages/ai/src/index.ts`. | No OpenAI/Azure enum values. No cloud-specific safety metadata fields. |
| **Providers** | `MockAiProvider` (deterministic fallback). `OllamaAiProvider` with `FetchOllamaClient` — real host calls proven in BL-108/BL-121. `LmStudioAiProvider` with `FetchLmStudioClient` — real host calls proven. | Cloud providers blocked by policy (`cloudCallsAllowed: false` in `AiPolicy`). No OpenAI API key integration. No Azure AD/token integration. |

**Recommended status outcome:** `partial/mock-default-real-when-configured`

**Rationale:** Mock is the safe default. Ollama and LM Studio local providers are real and proven when env vars are configured. Cloud provider slots do not exist.

---

### BL-027 — AI chat

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | No chat-specific API. `generateDraftSuggestion` and `generateGreetingSuggestion` are one-shot request/response, not conversational chat. | No `POST /chat` or `POST /chat/messages` endpoint. No message threading. No conversation history API. |
| **UI Components** | No chat UI component. `DraftNotePanel.tsx` is a draft editor, not a chat interface. `GreetingSuggestionPanel.tsx` is one-shot. | No `<ChatPanel />`, `<ChatMessageList />`, or `<ChatInput />`. No message bubble UI. |
| **DB Tables** | No `AiChatMessage`, `ChatConversation`, or equivalent table in Prisma schema. | Entire chat persistence layer is missing. |
| **Contracts** | No chat message or conversation contracts in `packages/contracts`. | `ChatMessage`, `ChatConversation`, `ChatRole` contracts missing. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** The AI provider infrastructure exists (BL-026), but there is no chat concept — no messages, no history, no chat UI, no chat API. The current "AI interaction" is one-shot draft/greeting generation.

---

### BL-028 — Ticket summary

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `TicketSummary` Prisma model exists (`ticket_summaries` table). No dedicated ticket summary generation API. | No `POST /tickets/:id/summary` or `POST /support-sessions/:id/ticket-summary` endpoint. No ticket summary service method. |
| **UI Components** | `TicketSummaryPanel.tsx` exists but is a **ticket search/list panel** (searches by email/status, lists `TicketReference` items), not an AI-generated summary viewer. | No AI summary display panel. No "Generate summary" button. No summary review UI. |
| **DB Tables** | `TicketSummary` model with `summaryText`, `keyPoints`, `sentiment`, `source`, `redactionLog`, `mockDevOnly`. | No rows are created by the app — the table is unused. No foreign key from `TicketReference` to generated summaries. |
| **Contracts** | `TicketSummary` is not defined in `packages/contracts/src/index.ts` (only in Prisma). | Contract definition missing. No ticket summary generation request/response schema. |
| **AI Integration** | `generateDraft` in `packages/ai/src/index.ts` uses ticket context, but does not produce a structured ticket summary. | No dedicated ticket summary prompt template. No summary-specific provider call. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** DB table and Prisma model exist but are unused. The `TicketSummaryPanel` is misnamed — it searches tickets, it does not show or generate AI summaries. No API endpoint or service logic exists for AI ticket summary generation.

---

### BL-029 — Draft note generation

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `POST /support-sessions/:id/draft-suggestion` endpoint. `generateDraftSuggestion` in `support-sessions.service.ts`. `POST /support-sessions/:id/support-note-drafts` creates a draft record. `POST /support-sessions/:id/writeback-internal-note` for sandbox writeback. | No production writeback (intentionally blocked by policy). No cloud AI provider integration for drafts. |
| **UI Components** | `DraftNotePanel.tsx` — full draft editor with generate button, operator instructions, review checkbox, AI metadata display, writeback button. `SupportNoteDraftPanel.tsx` — lists drafts for a session. | No cloud provider badge support in draft panel. |
| **DB Tables** | `InternalNoteDraft` Prisma model with `body`, `reviewed`, `reviewerId`, `externalTicketId`. | No `AiDraft` table separate from `InternalNoteDraft` (the draft is ephemeral AI output, not stored separately from the reviewed note draft). |
| **Contracts** | `GenerateDraftRequest`, `GenerateDraftResponse` in `packages/ai/src/index.ts`. `InternalNoteWritebackResult` in contracts. | No dedicated `DraftNote` contract separate from `InternalNoteDraft`. |
| **AI Integration** | Full `ModelGateway.generateDraft()` with mock/ollama/lmstudio. Redaction before provider call. Context hash. Safety metadata. Fallback to mock on Ollama/LM Studio failure. | Token usage not extracted from Ollama response. No cost estimation. |

**Recommended status outcome:** `partial/mock-default-real-when-configured`

**Rationale:** The full draft generation → review → writeback flow exists and is runtime-proven with local AI. Mock is the safe default. Sandbox writeback is proven (BL-111). Production writeback is intentionally blocked. Cloud AI is blocked by policy.

---

### BL-075 — Admin screens

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `AdminPolicyController` (`/admin/policies`) — delivery, connector, AI, retention policy CRUD with RBAC. `DeliveryPolicyController`. `ConnectorInstallationsController`. `CredentialReferencesController`. `EndpointDevicesController`. `AuthController` with OIDC. | No `/admin/users` CRUD. No `/admin/roles` CRUD. No `/admin/tenants` CRUD. No admin-specific route guards beyond RBAC. |
| **UI Components** | `AdminPolicyPanel.tsx` — policy editor with tabs (delivery, connector, AI, retention), toggle rows, audit preview. `DeliveryPolicyPanel.tsx`. `ConnectorPanel.tsx`. | No `AdminUsersPanel.tsx`. No `AdminRolesPanel.tsx`. No `AdminTenantsPanel.tsx`. No admin dashboard or navigation. |
| **DB Tables** | `User`, `Role`, `Tenant`, `TenantPolicy`, `DeliveryPolicy`, `ConnectorInstallation`, `ConnectorCredentialReference`, `ServiceAccount` all exist. | No admin-specific tables needed. |
| **Routes/Pages** | `apps/web/app/` has: `page.tsx` (cockpit), `call-console/page.tsx`, `device-console/page.tsx`, `tool-registry/page.tsx`, `approval-queue/page.tsx`. | No `/admin` route or page. No `/admin/users`, `/admin/roles`, `/admin/tenants` pages. |

**Recommended status outcome:** `partial/local-mock`

**Rationale:** Policy editor (BL-076) is accepted and solid. The broader admin screens for users, roles, tenants, and connector installations are not built. The existing panels are cockpit-embedded, not a standalone admin area.

---

### BL-077 — Audit explorer with filtering

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `GET /support-sessions/:id/audit-events` — returns session-scoped audit events. `AuditEvent` Prisma model. `saveAuditEvent`, `getAuditEvents`, `getAllAuditEvents` in store. `AuditEventType` enum with 80+ event types. | No `GET /audit-events` global endpoint. No filtering by actor, event type, decision, target, date range. No pagination for audit events. |
| **UI Components** | `AuditTrailPanel.tsx` — session-scoped audit event list with event type, actor, resource, metadata. No filters. | No dedicated `/audit-explorer` page. No filter controls (date range, actor, event type, decision). No search. No pagination. |
| **DB Tables** | `AuditEvent` model with indexes on `tenantId`, `sessionId`, `eventType`, `actorType+actorId`, `resourceType+resourceId`, `createdAt`. | No audit event aggregation or materialized views. |
| **Contracts** | `AuditEvent` contract in `packages/contracts/src/audit.ts`. `packages/audit/src/index.ts` — integrity hash placeholder. | No `AuditEventFilter`, `AuditEventQuery`, or `AuditExplorerResult` contracts. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** Audit events are stored, indexed, and displayed per-session. There is no global audit explorer, no filtering API, no filter UI, and no pagination. The `getAllAuditEvents` store method exists but has no API endpoint or UI consumer.

---

### BL-078 — Evidence bundle timeline viewer

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `GET /support-sessions/:id/evidence-bundle` (JSON). `GET /support-sessions/:id/evidence-bundle.md` (Markdown). `buildEvidenceBundle()` in `evidence-bundle.builder.ts`. | No dedicated timeline viewer API. No timeline-specific endpoint. |
| **UI Components** | `EvidenceBundlePanel.tsx` — summary tab (counts), JSON tab, Markdown tab. Copy buttons. | No visual timeline (chronological event stream). No interactive timeline (zoom, filter by event type). No dedicated "timeline viewer" mode. |
| **DB Tables** | Evidence bundle is ephemeral — built on demand from session, tickets, packets, audit events, call events, etc. | No persisted evidence bundle table (by design for MVP). |
| **Contracts** | `EvidenceBundle` contract with `auditTimeline` array. `EvidenceBundleAuditSummary`. | No `EvidenceBundleTimelineView` or `TimelineEvent` contract. |

**Recommended status outcome:** `partial/local-mock`

**Rationale:** The evidence bundle builder is comprehensive and accepted (BL-112). The UI panel shows summary counts and raw JSON/Markdown. A visual, chronological timeline viewer with filtering and zoom is not implemented.

---

### BL-079 — Evidence export to PDF

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | Evidence bundle exports JSON and Markdown. | No PDF generation endpoint. No PDF export service. |
| **UI Components** | `EvidenceBundlePanel.tsx` has JSON and Markdown tabs. | No PDF download button. No PDF preview. |
| **Libraries** | None. | No PDF library (e.g., `pdfmake`, `puppeteer`, `react-pdf`). |
| **DB/Contracts** | `EvidenceBundleFormat` enum = `['json', 'markdown']`. | No `'pdf'` format value. No PDF-specific contracts. |

**Recommended status outcome:** `planned`

**Rationale:** No PDF implementation exists at all. The backlog item description says "JSON and Markdown, then PDF later" — JSON/Markdown are done, PDF is not started.

---

### BL-080 — Model usage log

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `telemetry.service.ts` — in-memory counters/histograms/logs (max 100 recent logs). Not persisted. `ModelUsageMetadata` in `packages/ai/src/index.ts`. Audit events track `ai_draft_generated` with `provider`, `model`, `latencyMs`, `fallbackUsed`, `contextHash`. | No `POST /model-usage` or `GET /model-usage` endpoint. No persisted model usage log. No usage log query API. |
| **UI Components** | `DraftNotePanel.tsx` shows single-request metadata (latency, provider, model, context hash). `ObservabilityPanel.tsx` shows telemetry status. | No model usage log viewer. No usage dashboard. No cost/latency charts. |
| **DB Tables** | No `ModelUsageLog` or `AiRequestLog` table. | Entire persisted usage log layer missing. No token usage tracking table. No cost tracking table. |
| **Contracts** | `ModelUsageMetadata` with `inputTokens`, `outputTokens`, `totalTokens`, `costEstimateUsd`, `latencyMs` (all optional/placeholder). `EvidenceBundleAiUsageSummary`. | No `ModelUsageLogEntry` contract. No `ModelUsageQuery` contract. |
| **Token/Cost Capture** | Token counts are not extracted from Ollama responses (Ollama `/api/generate` does not reliably return token counts in this integration). Cost estimate is always undefined. | No token counting logic. No cost estimation logic. No pricing table. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** Usage metadata is captured per-request in AI responses and stored in audit events, but there is no persisted, queryable model usage log. The telemetry service is in-memory only (non-persistent, capped at 100 entries). Token usage and cost estimation are not implemented.

---

### BL-081 — Tenant-level prompt/output retention

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | `RetentionPolicy` contract and `TenantPolicy` Prisma model with retention fields: `sessionRetentionDays`, `auditLogRetentionDays`, `callRecordingRetentionDays`, `screenObservationRetentionDays`, `evidenceBundleRetentionDays`, `actionOutboxRetentionDays`. `GET/PUT /admin/policies/retention` endpoints. | No `promptRetentionDays` or `outputRetentionDays` fields. No retention enforcement cron/job. No actual data purge logic. |
| **UI Components** | `AdminPolicyPanel.tsx` — Retention tab shows session, audit, call recording, screen observation, evidence bundle, action outbox retention days. | No prompt/output-specific retention fields in UI. No purge history or scheduled purge UI. |
| **DB Tables** | `TenantPolicy` stores retention config as JSON. | No `PromptRetentionPolicy` or `AiOutputRetention` model. No retention execution log. |
| **Enforcement** | `autoPurgeEnabled` is locked OFF in UI. `purgeRequiresApproval` defaults to true. | No retention enforcement worker. No data purge implementation. No GDPR-style deletion worker. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** General retention policy configuration exists and is editable, but there are no prompt/output-specific retention controls. Retention is not enforced — there is no purge worker, no scheduled deletion, and `autoPurgeEnabled` is locked off.

---

### BL-082 — GDPR export/delete groundwork

| Dimension | What Exists | What Is Missing |
|-----------|-------------|-----------------|
| **Files/APIs** | Evidence bundle export (`GET /support-sessions/:id/evidence-bundle`) exports all session data as JSON/Markdown with redaction. `RetentionPolicy` has retention days. Redaction logic in `packages/ai/src/index.ts` and `apps/api/src/evidence-bundle/redaction.ts`. | No `POST /gdpr/export-request` or `POST /gdpr/delete-request` endpoints. No data-subject request workflow. No right-to-erasure API. |
| **UI Components** | `EvidenceBundlePanel.tsx` allows generating/exporting bundle for a session. | No GDPR request portal. No data subject access request (DSAR) UI. No deletion confirmation UI. |
| **DB Tables** | No `DataSubjectRequest`, `GdprExport`, or `PrivacyRequest` table. | Entire GDPR request persistence layer missing. |
| **Contracts** | No GDPR-specific contracts. | `DataSubjectRequest`, `GdprExportResult`, `DeletionRequest` contracts missing. |
| **Documentation** | Evidence bundle has disclaimers: "No GDPR or legal compliance claims are made for this export format." `docs/EVIDENCE_BUNDLES.md` exists. | No GDPR-specific documentation. No data processing agreement (DPA) groundwork. |

**Recommended status outcome:** `partial/scaffold`

**Rationale:** Session-level data export exists via evidence bundles, which is a foundational capability for GDPR subject access requests. However, there is no dedicated GDPR workflow, no delete-request handling, no DSAR tracking, and no legal-compliance framework.

---

## Summary of Recommended Status Changes

| Backlog ID | Current Status | Recommended Status | Change? |
|------------|---------------|--------------------|---------|
| BL-026 | `partial/local-mock` | `partial/mock-default-real-when-configured` | ✅ Yes |
| BL-027 | `partial/local-mock` | `partial/scaffold` | ✅ Yes |
| BL-028 | `partial/local-mock` | `partial/scaffold` | ✅ Yes |
| BL-029 | `partial/local-mock` | `partial/mock-default-real-when-configured` | ✅ Yes |
| BL-075 | `partial/local-mock` | `partial/local-mock` | — No change |
| BL-077 | `planned` | `partial/scaffold` | ✅ Yes |
| BL-078 | `partial/local-mock` | `partial/local-mock` | — No change |
| BL-079 | `planned` | `planned` | — No change |
| BL-080 | `planned` | `partial/scaffold` | ✅ Yes |
| BL-081 | `planned` | `partial/scaffold` | ✅ Yes |
| BL-082 | `planned` | `partial/scaffold` | ✅ Yes |

---

## Files That Need to Change (High-Level)

### BL-026 (AI model gateway hardening)
- `packages/ai/src/index.ts` — add OpenAI/Azure provider stubs or honest `501 Not Implemented` responses.
- `packages/contracts/src/ai.ts` (or create) — add cloud provider enum values.
- `apps/api/src/admin-policies/admin-policy.service.ts` — update AI policy allowed providers if adding stubs.

### BL-027 (AI chat)
- **New:** `prisma/schema.prisma` — add `AiChatMessage`, `AiChatConversation` models.
- **New:** `packages/contracts/src/ai-chat.ts` — chat message/conversation contracts.
- **New:** `apps/api/src/ai-chat/ai-chat.controller.ts` — chat API endpoints.
- **New:** `apps/api/src/ai-chat/ai-chat.service.ts` — chat persistence and gateway integration.
- **New:** `apps/web/components/ChatPanel.tsx` — chat UI.
- **New:** Prisma migration for chat tables.

### BL-028 (Ticket summary)
- **New:** `packages/contracts/src/ticket-summary.ts` — ticket summary request/response contracts.
- `apps/api/src/support-sessions/support-sessions.controller.ts` — add `POST :id/ticket-summary` endpoint.
- `apps/api/src/support-sessions/support-sessions.service.ts` — add `generateTicketSummary()` method.
- **New:** `apps/web/components/TicketSummaryGenerator.tsx` — AI summary generator UI (distinct from current search panel).
- `packages/ai/src/index.ts` — add ticket summary prompt template and provider method.

### BL-029 (Draft note generation)
- `packages/ai/src/index.ts` — add token counting (approximate) and cost estimation.
- `apps/api/src/telemetry/telemetry.service.ts` — persist AI usage metadata.
- Status is largely acceptable; mostly needs usage logging and cloud provider stubs.

### BL-075 (Admin screens)
- **New:** `apps/web/app/admin/page.tsx` — admin dashboard shell.
- **New:** `apps/web/app/admin/users/page.tsx` — user management.
- **New:** `apps/web/app/admin/roles/page.tsx` — role management.
- **New:** `apps/web/app/admin/tenants/page.tsx` — tenant management.
- **New:** `apps/web/components/AdminUsersPanel.tsx`, `AdminRolesPanel.tsx`, `AdminTenantsPanel.tsx`.
- `apps/api/src/auth/auth.controller.ts` — add admin CRUD endpoints for users/roles/tenants.

### BL-077 (Audit explorer with filtering)
- **New:** `apps/api/src/audit/audit.controller.ts` — `GET /audit-events` with query params (tenant, session, actor, eventType, dateFrom, dateTo, pagination).
- `apps/api/src/store/store.interface.ts` — add `searchAuditEvents()` method.
- `apps/api/src/store/prisma.store.ts` — implement filtered audit query.
- **New:** `apps/web/app/audit-explorer/page.tsx` — dedicated audit explorer page.
- **New:** `apps/web/components/AuditExplorerPanel.tsx` — filter controls + paginated event list.

### BL-078 (Evidence bundle timeline viewer)
- **New:** `apps/web/components/EvidenceBundleTimeline.tsx` — chronological timeline visualization.
- `apps/web/components/EvidenceBundlePanel.tsx` — add "Timeline" tab.
- `apps/api/src/evidence-bundle/evidence-bundle.builder.ts` — ensure events are sorted chronologically.

### BL-079 (Evidence export to PDF)
- **New:** PDF generation library (e.g., `pdfmake` or server-side Puppeteer).
- `packages/contracts/src/evidence-bundle.ts` — add `'pdf'` to `EvidenceBundleFormat`.
- `apps/api/src/evidence-bundle/evidence-bundle.controller.ts` or service — add PDF generation endpoint.
- `apps/web/components/EvidenceBundlePanel.tsx` — add PDF download button.

### BL-080 (Model usage log)
- **New:** `prisma/schema.prisma` — add `ModelUsageLog` table.
- **New:** `packages/contracts/src/model-usage.ts` — usage log contracts.
- **New:** `apps/api/src/model-usage/model-usage.controller.ts` — usage log API.
- **New:** `apps/api/src/model-usage/model-usage.service.ts` — usage log persistence.
- **New:** `apps/web/components/ModelUsagePanel.tsx` — usage log viewer/dashboard.
- `packages/ai/src/index.ts` — capture token usage (approximate if provider doesn't return it).
- New Prisma migration.

### BL-081 (Tenant-level prompt/output retention)
- `packages/contracts/src/tenant-policy.ts` — add `promptRetentionDays`, `outputRetentionDays` to `RetentionPolicy`.
- `prisma/schema.prisma` — add retention fields to `TenantPolicy` or create new model.
- `apps/api/src/admin-policies/admin-policy.service.ts` — update retention policy service.
- `apps/web/components/AdminPolicyPanel.tsx` — add prompt/output retention fields.
- **New:** `apps/worker/src/retention/retention.worker.ts` — retention enforcement worker (or schedule via cron).
- New Prisma migration.

### BL-082 (GDPR export/delete groundwork)
- **New:** `prisma/schema.prisma` — add `DataSubjectRequest` table.
- **New:** `packages/contracts/src/gdpr.ts` — GDPR request contracts.
- **New:** `apps/api/src/gdpr/gdpr.controller.ts` — export/delete request endpoints.
- **New:** `apps/api/src/gdpr/gdpr.service.ts` — request processing service.
- **New:** `apps/web/app/gdpr/page.tsx` or admin panel section — GDPR request UI.
- New Prisma migration.

---

## Blockers and Risks

1. **BL-026/029 Cloud AI:** No cloud AI provider is configured or tested. Adding OpenAI/Azure requires credential broker integration (OpenBao is local sandbox only). Risk: cloud provider stubs may be fake-completing if not returning `501 Not Implemented`.
2. **BL-027 Chat scope creep:** Building a full chat system touches schema, API, UI, and potentially real-time updates. Risk: this could expand beyond one session.
3. **BL-077 Audit filtering at scale:** `AuditEvent` table may grow large. The current Prisma store does simple `findMany`. Risk: unfiltered `getAllAuditEvents` could be slow without pagination and indexes.
4. **BL-079 PDF:** Requires choosing a PDF library. Server-side generation adds dependencies (Puppeteer/Chrome headless is heavy; `pdfmake` is lighter but less flexible).
5. **BL-080 Token usage:** Ollama does not reliably return token counts in `/api/generate`. Risk: token usage may need to be estimated or left as placeholder.
6. **BL-081 Retention enforcement:** Actual data deletion is irreversible. Risk: must have robust tenant scoping, approval gates, and audit logging before implementing purge.
7. **BL-082 GDPR overclaim:** The repo contract explicitly forbids compliance certification claims. Risk: any GDPR implementation must be labeled "groundwork only" with explicit non-claims.
8. **Schema drift risk:** Multiple new tables (chat, model usage, GDPR) require Prisma migrations. The current migration baseline is at `20260501130000_tool_execution_safety_foundation`. All new schema changes need new migrations.

---

## Recommended Session 125 Scope

Given the breadth (11 items), Session 125 should **not** attempt to implement all of them. Recommended prioritization:

1. **P0 — BL-077 (Audit explorer with filtering):** High-value, scoped. Builds on existing audit infrastructure. Needs one new API endpoint, store method, and UI page.
2. **P1 — BL-080 (Model usage log):** High-value for AI governance. Needs one new table, API, and UI panel. Can reuse existing AI response metadata.
3. **P2 — BL-075 (Admin screens):** Add `/admin` shell + users/roles/tenants pages. Reuses existing auth API; mostly UI work.
4. **P3 — BL-078 (Evidence bundle timeline viewer):** UI-only enhancement to existing evidence bundle panel.
5. **Deferred:** BL-027 (chat), BL-028 (ticket summary), BL-079 (PDF), BL-081 (retention enforcement), BL-082 (GDPR) — these require schema migrations and are larger scope.

---

## Handoff

This report is ready for the CTO lane to scope Session 125 implementation. The truth table provides exact acceptance criteria for each item. Recommended next step: CTO selects 2–3 items from the P0–P3 list above and writes a focused implementation prompt for Subagent B.
