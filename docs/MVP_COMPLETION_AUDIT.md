# SupportPlane MVP Completion Audit

**Backlog ID:** BL-101  
**Date:** 2026-04-29  
**Repo:** `/home/ff/Documents/Projects/SupportPlane`  
**Branch:** `main`  
**Scope:** Final product-readiness audit for the local/mock MVP demo freeze.

---

## 1. Current Product Truth

SupportPlane is a **local-only, mock-data, development-grade** support cockpit demo. It runs as:

- **API:** NestJS on `http://localhost:4110`
- **Web:** Next.js on `http://localhost:3200`
- **Store:** PostgreSQL on `localhost:5434` (via Prisma)
- **Auth:** Local password auth (no SSO/OAuth/MFA)
- **Worker:** Local PostgreSQL-backed process-once mock worker only

No external integrations are active. All "connector" behavior returns deterministic mock fixtures. All "AI" behavior is deterministic mock output. All "telephony" behavior is fake webhook simulation. All "writeback" is mock-only with real network explicitly disabled.

---

## 2. Accepted Backlog Ranges

The following backlog items are closure-grade accepted with evidence, acceptance freezes, and clean screenshot proof:

| Range | Key Deliverable |
|-------|----------------|
| BL-001 → BL-005 | Monorepo scaffold, contracts, mock-first API, Support Cockpit UI shell, mock AI gateway |
| BL-006 → BL-009 | Local topology (Docker Compose/Podman), Zammad connector boundary, evidence bundles, fake incoming call webhook |
| BL-018, BL-020 | Local auth/RBAC/tenant boundary, ticket context and connector safety |
| BL-041 → BL-045 | Auto session creation from calls, greeting suggestions, Call Console UI, telephony adapter boundary, call recording mock |
| BL-046 → BL-050 | Operator companion screen observations (web-based mock), active window metadata, manual screenshot metadata, structured upload/redaction, PostgreSQL persistence |
| BL-091 → BL-094 | Support case workflow, durable action/outbox, background worker retry/dead-letter, delivery policy controls |
| BL-095, BL-097, BL-098 | Connector installation settings, credential references, connector runtime configuration/readiness |
| BL-099, BL-100 | Connector runtime test coverage/docs, real writeback path design document |

---

## 3. Partial / Local-Mock Backlog Items

These items have implemented mock-only UI/API behavior but are **not production features**:

- **BL-022/023:** Zammad connector read/write paths — returns deterministic fixtures only; no real Zammad API calls.
- **BL-025:** Redaction layer — pattern-based, not zero-knowledge or production PII scrubbing.
- **BL-026/027/028/029:** Model gateway, AI chat, ticket summary, draft note generation — all deterministic mock-only.
- **BL-046:** Operator Companion — web-based mock panels only; no Tauri app, no real OS screen capture.
- **BL-051/052/053:** AI screen summary, cockpit screen context panel, privacy/consent workflow — basic disclaimers only.
- **BL-075:** Admin screens — policy panel exists; full user/role/team admin screens not built.
- **BL-078:** Evidence bundle viewer — summary/JSON/Markdown tabs exist; full timeline/approval viewer not built.

---

## 4. Planned / Not Implemented Backlog Items

No code exists for these:

- **MVP 4:** Endpoint Agent (Go agent, device console, diagnostics)
- **MVP 5:** Approval-gated remediation (tool manifests, execution gateway, endpoint agent dispatch)
- **Post-MVP integrations:** GLPI, Asterisk/FreePBX CTI, MeshCentral, Fortinet API, knowledge source ingestion, pgvector RAG
- **Production hardening:** OIDC/OAuth/SAML/MFA, secrets encryption, OpenTelemetry, rate limits, Kubernetes manifests, threat-model review
- **Governance/compliance:** Full policy editor, audit explorer, PDF export, model usage log, GDPR export/delete, tenant retention controls

---

## 5. Demo-Ready Capabilities

A reviewer can demo the following end-to-end flow:

1. Start PostgreSQL via Podman Compose and run API + Web dev servers.
2. Log in as `admin@supportplane.local` (local auth).
3. Observe the header: DEV / MOCK DATA, API URL, auth/store mode, user/tenant/role.
4. Create/select a support session.
5. Load ticket context (TICKET-101 fixture) and see connector runtime provenance.
6. Generate a mock AI support-note draft with visible model metadata.
7. Create an action, submit for review, approve, queue, and mock-deliver via the outbox.
8. View delivery policy gates showing real network locked OFF.
9. Generate an evidence bundle (JSON/Markdown) with audit timeline and mock disclaimers.
10. Switch to `viewer@supportplane.local` and observe read-only panels + server-side 403 denial.
11. Read `docs/REAL_WRITEBACK_PATH_DESIGN.md` to understand the boundary between mock and real writeback.

---

## 6. Known Limitations

- **Auth:** Local password only. No SSO, OAuth, SAML, OIDC, MFA, password reset, or rate limiting.
- **Data:** All connector and AI data is deterministic mock fixtures.
- **Network:** No real external network calls from the connector runtime.
- **Secrets:** `secretRef` values are opaque placeholders. No credential broker, Vault, or encrypted storage.
- **Telephony:** Fake webhook simulation only. No real PBX, voice, TTS, STT, or recording.
- **Screen context:** Web-based mock metadata only. No real screen capture, raw pixels, clipboard access, OCR, or desktop monitoring.
- **Persistence:** PostgreSQL is local dev only. No backup/restore runbook, no object storage, no cryptographic signing of evidence bundles.
- **Worker:** Local API-driven process-once mock. No external broker-backed queue (NATS container exists but is not used by the worker).
- **Audit:** Append-only PostgreSQL records. Not production-immutable or compliance-certified.

---

## 7. What Must Not Be Claimed

- This is **not** a production product.
- This is **not** SOC 2, ISO 27001, or GDPR compliant.
- This does **not** perform real AI inference (no OpenAI/Azure/OpenAI-compatible provider connected).
- This does **not** write back to real ticketing systems.
- This does **not** integrate with real telephony or PBX systems.
- This does **not** store or transmit real secrets, credentials, or tokens securely.
- This does **not** provide endpoint agent diagnostics or remote support.
- This does **not** support SSO, MFA, or production identity federation.

---

## 8. Final Recommended Product Positioning

> **SupportPlane Local Mock MVP** — A governed AI support cockpit **prototype** demonstrating session-based workflows, tenant isolation, RBAC, mock AI drafting, action/outbox review gates, delivery policy controls, and evidence bundle generation. Built to validate architecture and UI/UX before external integrations and production hardening.

Use this repo to:
- Evaluate the cockpit layout and panel design.
- Review the action/outbox approval workflow.
- Inspect the connector runtime safety model.
- Read the real-writeback design document for future implementation planning.

Do **not** use this repo in production or with real customer data.

---

## 9. "Done Enough" Decision

This MVP is **done enough** for its stated purpose: a coherent, honest, demo-ready local/mock prototype.

What it proves:
- The architecture can support tenant-scoped sessions, RBAC, and audit trails.
- The UI can guide an operator through ticket context → AI draft → review → action → evidence.
- The safety model (mock-only by default, policy gates, kill switch, no secret exposure) is structurally sound.
- The team can articulate exactly what is implemented, what is mock-only, and what is required for real writeback.

What it does **not** prove:
- Production scalability, security, or compliance.
- Real integration behavior against Zammad, AI providers, or PBX systems.
- End-user acceptance in a real support environment.

---

## 10. "Next Only If Continuing" Backlog Options

If development continues, the next coherent slices are:

1. **Credential broker scaffold (Phase 1)** — Implement `CredentialBrokerService` interface with in-memory mock resolver; keep all mock-only safety gates.
2. **Sandbox Zammad integration tests (Phase 2)** — Docker Compose fixture with real Zammad sandbox; integration tests for ticket read/write.
3. **Admin-enabled dry-run (Phase 3)** — Tenant admin UI for "enable real connector mode" opt-in; dry-run validation against sandbox.
4. **Production hardening slice** — OIDC-ready auth hooks, rate limits, secret encryption at rest, OpenTelemetry baseline.
5. **Endpoint agent scaffold (MVP 4)** — Go agent with build targets, registration, heartbeat, read-only diagnostics.

None of these are started. The repo is frozen as a demo baseline until a new backlog slice is explicitly accepted.
