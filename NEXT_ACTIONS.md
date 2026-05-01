# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-01 14:41 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-073/BL-074] **Knowledge retrieval hardening**
  - Owner: future slice
  - Next action: add a reproducible pgvector-enabled PostgreSQL path with vector column/search, or extend ingestion while preserving the current explicit lexical fallback reason.
  - Exit criteria: `POST /knowledge/retrieve` returns semantic/hybrid results with `pgvectorEnabled: true` from a proven pgvector database, or remains explicitly lexical with a current unavailable reason.

- [BL-069/BL-071/BL-072/BL-127] **Connector real-instance enablement**
  - Owner: future connector slice
  - Next action: connect at least one real GLPI, MeshCentral, Fortinet, or osTicket instance through credential references and fail-closed configuration.
  - Exit criteria: at least one connector reads live data from a real instance with no secrets exposed and with honest transport/status labels.

- [BL-065] **Broader low-risk remediation coverage**
  - Owner: future remediation hardening slice
  - Next action: add a second safe low-risk remediation or real Windows flush-DNS proof while keeping fixed templates, policy gating, approval gating, and captured results.
  - Exit criteria: More than one low-risk remediation path is proven end-to-end, or Windows flush DNS is proven on a real Windows runner with browser/API evidence.

- [BL-130/BL-131/BL-132/BL-133] **Windows first-class endpoint completion**
  - Owner: future Windows hardening slice
  - Next action: run the fixed service/software collectors and packaging scaffold on a real Windows host or Windows CI runner; capture registration, heartbeat, diagnostic, and policy-denial proof.
  - Exit criteria: agent runs on actual Windows, registers, heartbeats, diagnostics and policy enforcement are proven, and unsupported remediation remains honestly labeled unless safely implemented.

- [BL-026/027/028/029] **AI cockpit hardening**
  - Owner: Session 125
  - Next action: close acceptance gaps for AI features: add cloud provider stubs (501) to model gateway, add token usage approximation to draft generation, and scope chat/ticket-summary as future schema work.
  - Exit criteria: BL-026 status honestly reflects `mock-default-real-when-configured` with explicit missing cloud slots. BL-029 usage metadata is enriched or documented as approximate. Chat and ticket-summary scoped to future sessions.

- [BL-075/077] **Admin and audit explorer**
  - Owner: Session 125
  - Next action: build standalone `/admin` shell with user/role/tenant pages, and add global `/audit-events` endpoint with filtering API + dedicated audit explorer page.
  - Exit criteria: Admin users/roles/tenants are CRUD-able via UI with RBAC. Audit explorer supports filtering by event type, actor, date range, and session with pagination.

- [BL-078/079] **Evidence bundle viewer and export**
  - Owner: Session 125
  - Next action: add visual timeline tab to `EvidenceBundlePanel`, and evaluate PDF export library for future implementation.
  - Exit criteria: Evidence bundle panel shows a chronological timeline view of audit events, call events, and actions. PDF export is scoped with a chosen library and honest `planned` status.

- [BL-080/081/082] **AI governance and compliance groundwork**
  - Owner: Session 125
  - Next action: add persisted `ModelUsageLog` table and API, add prompt/output retention fields to retention policy, and scope GDPR export/delete request models.
  - Exit criteria: Model usage is queryable per tenant/session. Retention policy includes prompt/output fields (enforcement deferred). GDPR groundwork scoped with schema design and explicit non-compliance claims.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
