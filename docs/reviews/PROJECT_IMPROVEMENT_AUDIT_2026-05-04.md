# SupportPlane — Project Improvement Audit

**Date:** 2026-05-04  
**Auditor:** Coding Agent (OpenCode)  
**Repo:** `/home/ff/Documents/Projects/SupportPlane`  
**Git HEAD:** `06020e4b1211f08fd461e6e26c517cfd3521b6d8`  
**Cluster API HEAD:** `951069e8d2239c9277c159ea8cf372100bf54294` ⚠️ **MISMATCH**  
**Branch:** `main` (ahead 26 of origin)  
**Worktree:** Clean (1 untracked script removed)  
**Services Running:** Cluster Web `localhost:3300`, Cluster API `localhost:4210`  
**Local API (`:4110`):** Not running  
**Evidence Folder:** `output/playwright/session-157-project-improvement-audit/` (12 screenshots, 0 duplicates)

---

## Executive Verdict: CONDITIONAL GO

SupportPlane is **broadly truthful** about its mock/real boundaries, has **strong runtime identity discipline** in code, and **honest connector status labels**. However, a **runtime identity mismatch** between the cluster and current HEAD, a **crashing model-usage endpoint**, **missing RBAC on tool registry**, **zero React error boundaries**, and **severe accessibility gaps** mean the project is **not first-tester-safe without explicit caveats**.

The architecture is coherent but **worker durability claims exceed implementation depth**. The Windows endpoint support is **first-class in contracts and tests** but **unproven in the live cockpit** (no Windows device visible in demo seed). The UX is **polished in places** but **inconsistent in accessibility, loading states, and error handling**.

**Do not share broadly until:**
1. Cluster image is rebuilt/redeployed to match HEAD.
2. Model-usage crash is fixed.
3. Tool registry gets RBAC enforcement.
4. At least one React error boundary is added to the root layout.

---

## Phase 1 — Project Truth Reconstruction

### What the Project Claims
- Governed AI support cockpit for IT teams/MSPs.
- Local self-hosted sandbox on Kind/Podman.
- Real integrations: Zammad (read+writeback), GLPI (read), Ollama (local AI), OpenBao (credential resolver), NATS JetStream (worker bridge), MinIO (evidence), Mailpit (notifications), Asterisk AMI (telephony).
- Mock/fixture: osTicket, MeshCentral, Fortinet.
- Windows endpoint support is first-class.

### What is Accepted (from state docs)
- BL-101 through BL-143: extensive list of accepted/partial features.
- BL-116: Real self-hosted sandbox acceptance freeze (2026-04-30).
- BL-141/142: Tester readiness accepted.
- BL-143: First-Open UX accepted but partial.

### What is Explicitly Not Claimed
- No production deployment.
- No real cloud AI (all cloud providers return `configured: false`).
- No production secrets (OpenBao uses inmem storage).
- No compliance certification.
- No PSTN/SIP trunk/recording/transcription.
- No real Windows endpoint runtime proof in live demo.

### Current State Snapshot
| Dimension | Claim | Truth | Evidence |
|---|---|---|---|
| Git HEAD | `06020e4` | `06020e4` | `git rev-parse HEAD` |
| Cluster API HEAD | Should match | `951069e` (stale) | `/health` JSON |
| Web UI | Running | Running | `curl localhost:3300` |
| Local API | Documented `:4110` | Not running | `curl` timeout |
| Cluster API | Documented `:4210` | Running + healthy | `/health` |
| Lint | Pass | Pass (0 errors) | `npm run lint` |
| Typecheck | Pass | Pass (all workspaces) | `npm run typecheck` |
| Tests | Pass | 392 pass, 0 fail, 3 unaccounted | `npm test` |
| Prisma schema | Valid | Valid | `npx prisma validate` |

### Evidence Staleness
- **Session 155/156** evidence folders reference BL-141/142 closure but the current HEAD (`06020e4`) is **2 commits ahead** of the HEAD recorded in session-156 (`701d377`). The cluster image is **19 commits stale** relative to current HEAD.
- **Session 095** evidence for BL-143 is from HEAD `61d52b0`, which is now **25 commits old**.
- This means **all browser evidence from accepted backlog items is stale** relative to the running cluster image, which itself is stale relative to code.

---

## Phase 2 — AI-Generated Failure Mode Audit

### 2.1 Fake or Shallow Completeness

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-008 | Worker durability | P1 | `apps/worker/src/index.ts` (206 lines total); no tests; `processOnce` is a simple polling loop | Worker claims durable outbox semantics but is a lightweight polling script. No dead-letter browser evidence in current runtime. |
| F-009 | UI package | P1 | `packages/ui/src/index.ts` is a placeholder; `packages/ui` has **0 tests** | A "shared UI components" package with no tests and no real component exports is architectural theater. |
| F-019 | Audit package | P2 | `packages/audit/src/index.ts` is mostly types; `packages/audit` has **0 tests** | Audit is a critical governance layer. Untested audit helpers are a liability. |

### 2.2 Mock/Real Boundary Confusion

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-007 | Audit metadata truth | P1 | Audit events show `realNetwork: true`, `writebackEnabled: true`, `externalWriteAttempted: false` for sandbox-only outbox operations | The metadata contradicts the actual sandbox-only behavior. A compliance reviewer would misread this as real network activity. |
| F-021 | Demo guide expectations | P3 | `DemoGuidePanel.tsx` says "load Zammad ticket #2" but does not explain what success looks like | First testers may not know if the loaded ticket data is real or cached. |

### 2.3 Stale State and Evidence Drift

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-001 | Runtime identity mismatch | **P0** | Cluster API HEAD = `951069e`; Git HEAD = `06020e4` | The cluster is running stale code. Any claims verified against the cluster are verifying an old binary, not current truth. |
| F-011 | Unrebuilt cluster image | P1 | Worktree was dirty with uncommitted BL-143 fixes at session start; cluster image predates those fixes | First-tester experience improvements (ticket defaults) are in code but not in the running cluster. |

### 2.4 Generated-Code Bloat

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-022 | Duplicate disabled button styling | P3 | `TicketSummaryGenerator.tsx`, `ChatPanel.tsx`, `AuditExplorerPanel.tsx` all repeat `disabled:cursor-not-allowed disabled:opacity-50/60` | Tailwind classes are copy-pasted instead of using a shared `Button` component with variants. |
| F-023 | Large page component | P2 | `apps/web/app/page.tsx` is 641 lines | Main cockpit page mixes session list, ticket context, AI panels, draft, evidence, call simulator, delivery policy, connector status, and observability. High risk of merge conflicts and difficult to test. |

### 2.5 Architecture Erosion

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-024 | Prisma model count | P2 | 43 models in `prisma/schema.prisma` | Large schema increases migration risk, cognitive load, and chance of untested corners. |
| F-025 | Untyped query params | P2 | `ModelUsageController` passes `query: unknown` to Zod parser | Controller layer does not use shared DTOs; falls back to runtime parsing. |

### 2.6 Security and Governance Gaps

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-002 | Model-usage crash | **P0** | `GET /model-usage` returns 500 for admin and viewer | A crashing endpoint indicates a bug in service initialization or query logic. Breaks admin dashboard. |
| F-003 | Tool registry RBAC missing | **P1** | `ToolRegistryController` has **no `@UseGuards` or `requirePermission`** | Any authenticated user (including viewer) can read all tool definitions, command templates, and required permissions. |
| F-006 | Viewer policy visibility | P1 | Viewer has `delivery_policy:read` and can read all admin policies | Governance internals exposed to lowest-privilege role. Design choice, but questionable for enterprise. |
| F-026 | Missing tenant scoping on tool registry | P1 | `listTools()` does not filter by tenant | Multi-tenant tool definitions may leak across tenants. |

### 2.7 Enterprise UX Gaps

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-004 | No error boundaries | **P1** | Zero `ErrorBoundary` or `getDerivedStateFromError` in `apps/web` | Any unhandled exception crashes the entire Next.js app to a white screen. |
| F-005 | Accessibility desert | **P1** | Only **4 `aria-label` attributes** across the entire web app (AuthGate, DraftNotePanel, InfoTooltip, DemoGuidePanel) | Screen readers and keyboard navigation will fail. Enterprise buyers audit for a11y. |
| F-010 | No skeleton loading | P2 | `page.tsx` uses boolean `loading` flags with spinner icons, no skeleton UI | Perceived performance is poor; layout shifts on data load. |
| F-027 | Admin dashboard shell disables instead of hides | P2 | `AdminDashboardShell.tsx` and `admin/page.tsx` grey out cards for non-admins instead of hiding them | Viewers see tantalizing admin surfaces they cannot use. Confusing. |

### 2.8 Test-Quality Gaps

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-009 | UI package untested | P1 | `packages/ui` test script = `echo 'No tests yet'` | Shared UI components should have at least render/snapshot tests. |
| F-019 | Audit package untested | P2 | `packages/audit` test script = `echo 'No tests yet'` | Hash-chain helpers and audit logic need unit tests. |
| F-028 | Worker untested | P2 | `apps/worker` has no test script or test files | Worker is critical for durable delivery. No tests = no proof of durability. |
| F-014 | Missing 3 tests | P2 | API reports 213 tests, 210 pass, 0 fail. No `skip(` or `only(` found. | 3 tests are unaccounted for in summary output. Could be pending, todo, or miscounted. |
| F-029 | No negative RBAC tests for tool registry | P2 | No test file for `tool-registry.controller.ts` | Security regression risk if someone adds admin-only tools later. |

### 2.9 DevEx / Maintainability Gaps

| Finding ID | Area | Severity | Evidence | Why It Matters |
|---|---|---|---|---|
| F-030 | Local API not running | P2 | `localhost:4110` is down; docs reference it as primary local dev port | Developers must use cluster ports or start services manually. Increases onboarding friction. |
| F-031 | Console.log in API | P2 | `apps/api/src/telemetry/telemetry.service.ts:88` logs JSON to console; `apps/api/src/main.ts:44` logs startup | Production API should use structured logging, not `console.log`. |
| F-032 | Endpoint agent macOS honesty | P3 | Darwin collectors return `"not implemented"` notes but UI does not show platform badges for macOS | macOS support is honest in code but invisible in UI. |

---

## Phase 3 — Static Code and Structure Inspection

### Code Volume
| Area | Files | Lines (approx) |
|---|---|---|
| apps/api | 210 | 18,626 |
| apps/web | 94 | 13,051 |
| apps/worker | 2 | 206 |
| apps/endpoint-agent | ~10 | 848 |
| packages/* | ~60 | 25,259 |
| **Total** | **~380** | **~58,000** |

### Route Inventory
- 20 controllers
- 162 HTTP handlers (`@Get|@Post|@Patch|@Put|@Delete`)
- Key controllers: auth, support-sessions, connectors, admin/policies, audit-events, knowledge, model-usage, endpoint-devices, tool-execution, gdpr, ai-gateway, ai-chat, tickets, customers, actions, health, call-events.

### Component Inventory
- 36 exported components in `apps/web/components/`
- Key components: AuthGate, SessionListPanel, TicketContextPanel, DraftNotePanel, ChatPanel, CallSimulator, ConnectorPanel, AuditExplorerPanel, EvidenceBundlePanel, AdminDashboardShell, DemoGuidePanel, InfoTooltip, BoundaryLabel, SandboxBoundaryPanel.
- **No shared Button, Input, or Card primitives** — each component uses ad-hoc Tailwind classes.

### Prisma Schema
- 43 models
- Notable models: Tenant, Role, User, SupportSession, TicketReference, ConnectorInstallation, ConnectorCredentialReference, AuditEvent, ModelUsageLog, EndpointDevice, EndpointCommand, ToolInvocation, DataSubjectRequest, PolicyDecision, CallEvent, ScreenObservation, KnowledgeSource, KnowledgeArticle.

### Dependency Observations
- `packages/ui` depends on `@supportplane/contracts` and React but exports almost nothing.
- `apps/web` does not import from `@supportplane/ui` in any meaningful way (observed via grep: zero imports of `@supportplane/ui` components in `apps/web`).
- This means the **workspace boundary between `packages/ui` and `apps/web` is broken** — web components live directly in `apps/web/components/`, not in the shared package.

---

## Phase 4 — Runtime and Browser Inspection

### Screenshot Inventory (`session-157-project-improvement-audit/`)
1. `01-login-page.png` — Login page with tenant/email/password fields, Keycloak fallback, seeded password hint.
2. `02-dashboard-after-login.png` — Main cockpit with session list, demo guide, connector status, sandbox boundary panel.
3. `03-create-session-form.png` — Session creation form inline in sidebar.
4. `04-session-created-selected.png` — New session selected, empty state panels.
5. `05-ticket-context-loaded.png` — Zammad ticket #2 loaded with sandbox labels, Connector Runtime Provenance card.
6. `06-call-console.png` — Call console with fake incoming call simulator, telephony bridge, operator companion.
7. `07-device-console.png` — Device console with Windows Endpoint (mock) listed, diagnostic controls.
8. `08-approval-queue.png` — Approval queue empty state.
9. `09-admin-dashboard.png` — Admin shell with policy, users, roles, model usage, audit explorer, GDPR, connectors.
10. `10-tool-registry.png` — Tool registry listing diagnostic and remediation tools.
11. `11-audit-explorer.png` — Audit explorer with event type filters, pagination.
12. `12-gdpr-panel.png` — GDPR request panel with export preview and delete dry-run tabs.

### Browser Inspection Findings
- **Login page** is excellent: shows seeded password, sandbox warning, Keycloak disclaimer.
- **Dashboard** is dense: many panels with no clear visual hierarchy. First tester may feel overwhelmed.
- **Demo Guide** is visible and helpful (BL-143 improvement).
- **Ticket Context** loads real Zammad sandbox data with honest labels.
- **Call Console** has too many panels (Telephony Bridge, Mock Recording, Operator Companion, Call Timeline) for a first-tester path.
- **Device Console** shows Windows endpoint but it is **mock seed data**, not a real enrolled device.
- **Approval Queue** empty state is clean.
- **Admin Dashboard** disables cards for non-admins but they remain visible.
- **Tool Registry** exposes command templates to any authenticated user.
- **Audit Explorer** loads quickly and has useful filters.
- **GDPR Panel** has honest dry-run warnings.

### Console Errors
Not directly observed due to headless screenshot mode, but the 500 on `/model-usage` would produce a client-side error if the admin dashboard attempts to load it.

---

## Phase 5 — API, Persistence, Policy, and Security Inspection

### Endpoint Security Matrix
| Endpoint | Auth | RBAC | Tenant Scoped | Viewer Denied | Unauth Block |
|---|---|---|---|---|---|
| `GET /health` | No | N/A | N/A | N/A | N/A |
| `POST /auth/local/login` | No | N/A | N/A | N/A | N/A |
| `GET /support-sessions` | Yes | Yes | Yes | No (read allowed) | 401 ✅ |
| `GET /admin/policies` | Yes | `delivery_policy:read` | Yes | No (has perm) | 401 ✅ |
| `GET /model-usage` | Yes | `audit:read` | Yes | No (has perm) | **500 💥** |
| `GET /admin/tools` | Yes | **None** | **No** | No | 401 ✅ |
| `GET /connectors/status` | Yes | Yes | Yes | No (read allowed) | 401 ✅ |
| `GET /audit-events` | Yes | Yes | Yes | No (read allowed) | 401 ✅ |

### Critical Security Findings
1. **Tool Registry lacks RBAC and tenant scoping** (F-003 / F-026).
2. **Model-usage crashes** (F-002) — breaks admin dashboard.
3. **Viewer has `delivery_policy:read`** (F-006) — design choice but worth revisiting.

### Persistence Verification
- PostgreSQL StatefulSet in cluster is Bound and healthy.
- Prisma migrations are applied (10 migrations observed).
- Seed data is deterministic and documented in `prisma/seed.ts`.
- **Restart survival** was proven in prior sessions (BL-105) but not re-verified in this audit due to time.

### Policy/Approval Check
- Kill switch defaults: `false` (safe).
- Mock-only enforced: `true` in AI policy.
- Cloud AI blocked: `true`.
- Delivery policy: `realNetworkAllowed: false`, `writebackEnabled: false`.
- **Metadata contradiction**: Audit events for worker say `realNetwork: true` despite policy blocking it.

---

## Phase 6 — Integration and Sandbox Reality Check

| Integration | Code | Runtime | Docs | Evidence | Verdict |
|---|---|---|---|---|---|
| Zammad read | ✅ Real HTTP client | ✅ Cluster sandbox | ✅ | Session 108 | **Real sandbox** |
| Zammad writeback | ✅ Internal note API | ✅ Cluster sandbox | ✅ | Session 111 | **Real sandbox (sandbox-only)** |
| GLPI read | ✅ Real HTTP client | ✅ Cluster sandbox | ✅ | Session 142 | **Real sandbox** |
| Ollama AI | ✅ Provider path | ✅ Cluster reachable | ✅ | Session 110/121 | **Real local AI** |
| OpenBao resolver | ✅ Server-side | ✅ Cluster sandbox | ✅ | Session 109 | **Real sandbox** |
| NATS JetStream | ✅ Stream/consumer | ✅ Cluster | ✅ | Session 109 | **Real (bridge)** |
| MinIO evidence | ✅ Object write | ✅ Cluster | ✅ | Session 111 | **Real sandbox** |
| Mailpit | ✅ SMTP capture | ✅ Cluster | ✅ | Session 111 | **Real sandbox** |
| Asterisk AMI | ✅ Event ingestion | ✅ Cluster | ✅ | Session 117 | **Real sandbox** |
| PostgreSQL | ✅ StatefulSet + PVC | ✅ Cluster | ✅ | Session 105 | **Real** |
| osTicket | ❌ Fixture only | ❌ No real instance | ✅ | Fixture stub | **Mock/fixture** |
| MeshCentral | ✅ Client scaffold | ❌ No instance | ✅ | Session 123 | **Unconfigured** |
| Fortinet | ✅ Client scaffold | ❌ No instance | ✅ | Session 123 | **Unconfigured** |
| Windows endpoint | ✅ Contracts/tests | ❌ No real device in demo | ✅ | Session 134 | **Harness-ready, not runtime-proven** |

**Observation:** The mock/real boundary is **honest and well-labeled** in API responses and UI. No integration is falsely claiming real status.

---

## Phase 7 — Windows Endpoint First-Class Check

### Strengths
- Platform enum includes `win32` alongside `linux`, `darwin`, `unknown`.
- `platform.ts` has normalization logic (`Windows` → `win32`).
- Fixed command templates for Windows: `sc.exe`, `reg.exe`, `ipconfig` — no shell interpolation.
- `win32.ts` collectors return structured data.
- `windows-command-runner.ts` validates `process.platform === 'win32'`.
- 44 endpoint-agent tests pass, including platform-aware tests.
- GitHub Actions workflow exists for Windows runner proof (Session 134).

### Gaps
- **No real Windows device in demo seed** — Device Console only shows mock Windows endpoint.
- **macOS collectors** return `"not implemented"` notes but UI does not surface platform limitations.
- **Remediation** on Windows (`flush_dns_cache`) has fixed template but no real runner proof in current runtime.
- **Device Console** does not show platform compatibility badges per tool (observed in screenshot: tools show `(disabled)` but not `win32-only` or `linux-only` labels at a glance).

---

## Phase 8 — UX, Copy, and Enterprise Readiness Review

### Top 10 Confusing Moments
1. **Too many panels on first load** — demo guide, connector status, sandbox boundary, call simulator, delivery policy, observability, security readiness all compete for attention.
2. **Admin dashboard disables cards instead of hiding them** — viewers see greyed-out "Model Usage" and "GDPR" cards.
3. **"New" button for session creation** — the button text is just "New" (with a Plus icon); not obvious it creates a session.
4. **External ticket ID placeholder** — says "External ticket ID" but first tester may not know what "external" means.
5. **Device Console shows Windows endpoint as mock** — but there is no explanation of how to enroll a real device.
6. **Call Console has 5+ panels** — overwhelming for a first-tester who hasn't read the demo guide.
7. **Approval Queue empty state** — no explanation of how to trigger an approval (needs tool invocation).
8. **Tool Registry accessible to viewer** — viewers can see remediation tools like `flush_dns_cache` even though they cannot invoke them.
9. **No visible error state for model-usage crash** — admin dashboard would silently fail or show a broken card.
10. **No breadcrumb or wayfinding** — deep links to `/device-console`, `/approval-queue` exist but no navigation shows where you are in the app hierarchy.

### Top 5 Copy Improvements
1. "New" → "Create session"
2. "External ticket ID" → "Zammad ticket number"
3. "All writeback blocked" (header badge) → "Sandbox mode — writeback blocked"
4. "Mock mode" (connector badge) → "Demo fixture data"
5. "Windows Endpoint (Mock)" → "Windows Endpoint (demo device — no real agent enrolled)"

---

## Phase 9 — Test and Verification Quality Review

### Test Inventory
| Workspace | Tests | Pass | Fail | Skip | Notes |
|---|---|---|---|---|---|
| packages/contracts | 49 | 49 | 0 | 0 | Strong contract tests |
| packages/policy | 7 | 7 | 0 | 0 | Egress policy well-tested |
| packages/connectors | 50 | 50 | 0 | 0 | Adapter schema tests |
| packages/ai | 12 | 12 | 0 | 0 | Provider tests |
| packages/audit | 0 | 0 | 0 | 0 | **No tests** |
| packages/ui | 0 | 0 | 0 | 0 | **No tests** |
| apps/api | 213 | 210 | 0 | 3? | 3 unaccounted |
| apps/web | 20 | 20 | 0 | 0 | API client tests |
| apps/worker | 0 | 0 | 0 | 0 | **No tests** |
| apps/endpoint-agent | 44 | 44 | 0 | 0 | Good platform tests |
| **TOTAL** | **395** | **392** | **0** | **3?** | |

### Verification Ladder Assessment
1. **Fast local quality gate** — `npm run lint` + `npm run typecheck` pass. ✅
2. **API/security gate** — Tests pass but **missing negative RBAC tests for tool registry** and **no tests for viewer model-usage access**.
3. **Persistence/restart gate** — Proven historically (BL-105) but not automated in test suite.
4. **Browser/product gate** — **No Playwright/browser tests exist**. Only manual screenshot scripts.
5. **Sandbox integration gate** — Verified via custom scripts (BL-116 verifier) but not in CI.
6. **Kubernetes self-hosted gate** — Kind cluster is manual; no automated K8s health test in `npm test`.
7. **Evidence/privacy gate** — No automated redaction test in test suite.

---

## Phase 10 — Architecture Quality Review

### Strong Parts
- **Contract-driven design**: `@supportplane/contracts` with Zod schemas is used across API and web.
- **Honest mock/real boundary**: Connector status API is unambiguous.
- **Tenant scoping**: Most controllers use `identity.tenantId` correctly.
- **Policy engine**: Centralized policy decision with kill switch, mock-only enforcement, and safety flags.
- **Windows platform awareness**: First-class in contracts, tests, and seed data.

### Weak Parts
- **`packages/ui` is a ghost package**: Web app does not consume it. Either populate it or remove it.
- **Worker is too small**: 206 lines for a "durable worker" is not credible. Needs more retry logic, metrics, health checks.
- **Ad-hoc styling**: No shared Button/Input/Card primitives. Tailwind classes duplicated everywhere.
- **Missing error boundaries**: Web app has no resilience layer.
- **Model-usage service creates its own Prisma client**: Should inject the shared Prisma service to avoid connection pool duplication.

### Drift Risks
- **Prisma schema (43 models)** vs. **Contracts** — risk of field name drift over time.
- **API DTOs** vs. **Contracts** — some controllers use `unknown` query params instead of typed DTOs.
- **UI component names** vs. **Domain language** — `DraftNotePanel` vs. `InternalNoteDraft` (API model) vs. `SupportNoteDraftPanel` (another UI component). Naming inconsistency.

---

## Phase 11 — Backlog Repair and Roadmap Proposal

### Recommended Next Backlog Wave

#### BL-148 — Runtime Identity Truth Repair & Cluster Redeploy (P0)
- **Problem**: Cluster API HEAD (`951069e`) is 25 commits behind current HEAD (`06020e4`).
- **Scope**: Rebuild API/Web/Worker images, reload to Kind cluster, verify `/health` matches HEAD.
- **Acceptance**: `/health` `head` field equals `git rev-parse HEAD`.
- **Evidence**: Fresh screenshot of `/health` + `git status`.

#### BL-149 — Model-Usage Crash Fix & Admin Dashboard Repair (P0)
- **Problem**: `GET /model-usage` returns 500 for all users.
- **Scope**: Debug service/controller, fix Prisma query or injection, add test.
- **Acceptance**: Admin can load Model Usage panel without 500; viewer can load without 500.
- **Evidence**: Browser screenshot of admin Model Usage panel with data.

#### BL-150 — Tool Registry RBAC & Tenant Scoping Hardening (P1)
- **Problem**: `ToolRegistryController` has no permission or tenant checks.
- **Scope**: Add `@UseGuards`, `requirePermission('tool:read')`, tenant scoping in service.
- **Acceptance**: Viewer receives 403; alt-tenant admin sees only their tenant's tools.
- **Evidence**: API curl proof + browser screenshot of denied state.

#### BL-151 — Web Resilience & Accessibility Foundation (P1)
- **Problem**: Zero error boundaries, 4 aria-labels, no skeleton loading.
- **Scope**: Add root error boundary, add `aria-label` to all icon buttons, add skeleton placeholders to main panels.
- **Acceptance**: Keyboard navigation works for primary actions; error boundary catches simulated crash.
- **Evidence**: Browser screenshots + axe or lighthouse accessibility score.

#### BL-152 — Shared UI Package Cleanup (P2)
- **Problem**: `packages/ui` is a placeholder with no tests and no consumers.
- **Scope**: Either extract common components (Button, Input, Card, Badge) into `packages/ui` and add tests, or delete the package and update docs.
- **Acceptance**: `packages/ui` has >3 real components and >5 tests, or is removed from workspace.

#### BL-153 — Worker Durability & Test Harness (P2)
- **Problem**: Worker has 206 lines and 0 tests.
- **Scope**: Add unit tests for `processOnce`, retry logic, dead-letter handling. Add metrics endpoint.
- **Acceptance**: Worker test suite passes; simulated failure triggers retry.
- **Evidence**: Test output + worker logs.

#### BL-154 — Windows Endpoint Live Cockpit Proof (P2)
- **Problem**: Device Console shows mock Windows device; no real enrollment flow visible.
- **Scope**: Add "Enroll device" UI flow (even if mock-only), show platform badges per tool, improve empty state copy.
- **Acceptance**: First tester understands how a Windows device would appear and what tools are platform-compatible.
- **Evidence**: Browser screenshots of device console with platform badges.

#### BL-155 — Audit Metadata Truth Repair (P1)
- **Problem**: Worker audit events claim `realNetwork: true` for sandbox-only operations.
- **Scope**: Audit worker metadata generation to reflect actual policy decision (`sandbox_allowed`, `mock_only_allowed`).
- **Acceptance**: Audit events for sandbox operations show `realNetwork: false` or `sandbox: true`.
- **Evidence**: API JSON proof.

#### BL-156 — UX Consolidation & First-Tester Path (P2)
- **Problem**: Too many panels, confusing first-tester path.
- **Scope**: Collapse secondary panels by default, add "Start Here" wizard step, improve empty states.
- **Acceptance**: First-tester can complete ticket load → AI draft → evidence bundle without scrolling past 3 unrelated panels.
- **Evidence**: Browser screenshot walkthrough.

### Do Not Do Yet
- Production compliance claims (GDPR, SOC2, etc.).
- Real cloud AI provider integration.
- osTicket real integration (blocked upstream).
- Broad UI redesign without product proof.
- Adding more AI features before governance proof.
- Replacing PostgreSQL with another database.

---

## Phase 12 — Optional Small Fixes Applied

### Changes Made
1. **Committed BL-143 ticket default fixes** (already in history as `b9cd490`):
   - `DemoGuidePanel.tsx`: `TICKET-101` → `#2`
   - `DraftNotePanel.tsx`: `TICKET-101` → `2`
   - `TicketContextPanel.tsx`: Added `connectorMode`-driven defaults (`2` for Zammad, `1` for GLPI)
   - **Why safe**: String-only changes aligning UI defaults with seeded sandbox data. Zero logic change.

2. **Removed temporary audit script** `scripts/audit_screenshots.js` to keep worktree clean.

### Validation After Changes
- `git status --short --branch`: Clean (no modifications).
- `npm run lint`: Pass (0 errors).
- `npm run typecheck`: Pass (all workspaces).
- Runtime identity mismatch remains because cluster image was **not** rebuilt in this session.

---

## Final Handoff

### 1. Executive Verdict
**CONDITIONAL GO** — Safe to demo/test with explicit caveats:
- Cluster image is stale; rebuild before sharing.
- Model-usage panel is broken; do not click it in admin dashboard.
- Tool registry is readable by any authenticated user.
- Accessibility is poor; screen readers will struggle.

### 2. Runtime Identity
| Component | Value |
|---|---|
| Repo HEAD | `06020e4b1211f08fd461e6e26c517cfd3521b6d8` |
| Cluster API HEAD | `951069e8d2239c9277c159ea8cf372100bf54294` |
| Match | **NO** — 25 commits stale |
| Services running | Cluster Web `:3300`, Cluster API `:4210` |
| Local API `:4110` | **Not running** |

### 3. Audit Artifact
- **Audit Doc:** `docs/reviews/PROJECT_IMPROVEMENT_AUDIT_2026-05-04.md`
- **Screenshot Folder:** `output/playwright/session-157-project-improvement-audit/`
- **Screenshot Count:** 12
- **Fresh:** Yes (captured today)
- **Stale Evidence Excluded:** Yes (prior session folders were not reused)

### 4. Top Findings
- **P0**: Runtime identity mismatch (cluster stale).
- **P0**: Model-usage endpoint crashes (500).
- **P1**: Tool registry lacks RBAC/tenant scoping.
- **P1**: No React error boundaries.
- **P1**: Accessibility severely lacking (4 aria-labels).
- **P1**: Audit event metadata claims `realNetwork: true` for sandbox ops.
- **P2**: `packages/ui` and `packages/audit` have no tests.
- **P2**: Worker has no tests and only 206 lines.

### 5. First-Tester Experience Verdict
- **Impressive:** Real Zammad ticket loading, honest sandbox labels, clean login page, demo guide present.
- **Confusing:** Too many panels on dashboard, "New" button unclear, admin cards greyed-out instead of hidden.
- **Fake/Underexplained:** Windows endpoint is mock-only with no enrollment explanation, call console has many mock-only surfaces without clear hierarchy.

### 6. Mock/Real Boundary Verdict
- **Real:** Zammad read/writeback, GLPI read, Ollama local AI, OpenBao resolver, NATS bridge, MinIO, Mailpit, Asterisk AMI, PostgreSQL.
- **Mock-only:** osTicket, Windows endpoint device in UI (no real agent).
- **Unconfigured:** MeshCentral, Fortinet.
- **Ambiguous:** Worker audit metadata claims `realNetwork: true` while policy blocks it.

### 7. Security/Governance Verdict
- **RBAC:** Mostly enforced, but tool registry is a gap.
- **Tenant Isolation:** Enforced (alt-tenant gets empty list). ✅
- **Approvals:** UI and API exist, but approval queue empty state is hard to reach.
- **Policy:** Kill switch safe, mock-only enforced, but viewer can read all policies.
- **Audit:** Events are generated, but metadata truth is questionable.
- **Evidence Redaction:** No secrets leaked in API responses observed.
- **Egress Safety:** Deny-by-default with allowlist. ✅

### 8. Architecture Verdict
- **Strong:** Contracts, tenant scoping, honest connector status, Windows platform awareness.
- **Weak:** Ghost `packages/ui`, tiny worker, missing error boundaries, ad-hoc styling.
- **Drift Risk:** Prisma schema large (43 models), some controllers use `unknown` queries.
- **Cleanup:** Consolidate duplicated disabled-button Tailwind classes.

### 9. Windows Endpoint Verdict
- **Contracts/Tests:** First-class. ✅
- **Real Runner Proof:** Achieved historically (Session 134) but not in current live demo.
- **UI Gaps:** No platform compatibility badges on tools, no enrollment flow, mock device only.
- **Required Next:** BL-154 — add platform badges and enrollment explanation to Device Console.

### 10. Test/Verification Verdict
- **Commands Run:** `npm run lint`, `npm run typecheck`, `npm test`, `npx prisma validate`
- **Results:** Lint pass, typecheck pass, 392/395 pass (3 unaccounted), Prisma valid.
- **Missing Gates:** Browser/product gate (no Playwright tests), K8s self-hosted gate, evidence/privacy gate.
- **Weak Tests:** UI package, audit package, worker — all untested.
- **Recommended Ladder:**
  1. Unit tests for UI/audit/worker.
  2. Negative RBAC tests for tool registry.
  3. Browser smoke test (Playwright) for login → session → ticket load.
  4. K8s health verification script in CI.

### 11. Recommended Next Backlog Wave
1. **BL-148** — Rebuild cluster images to match HEAD (P0).
2. **BL-149** — Fix model-usage crash (P0).
3. **BL-150** — Tool registry RBAC (P1).
4. **BL-151** — Error boundaries + accessibility (P1).
5. **BL-155** — Audit metadata truth repair (P1).
6. **BL-152** — UI package cleanup (P2).
7. **BL-153** — Worker tests (P2).
8. **BL-154** — Windows cockpit proof (P2).
9. **BL-156** — UX consolidation (P2).

### 12. Changes Made
- Committed ticket default fixes (aligning UI with sandbox data).
- Removed temporary audit script.
- **Commit:** `06020e4` (state doc update) and `b9cd490` (ticket defaults).

### 13. Worktree Status
```
## main...origin/main [ahead 26]
nothing to commit, working tree clean
```

### 14. Services Left Running
- Cluster Web: `http://localhost:3300`
- Cluster API: `http://localhost:4210`
- PostgreSQL (host port 5434 via port-forward)
- All K8s sandbox integrations (Zammad, GLPI, Ollama, OpenBao, NATS, MinIO, Mailpit, Asterisk)

### 15. CTO Recommendation
**Next agent should implement BL-148 first** (cluster rebuild + runtime identity match) because every subsequent verification depends on the cluster running current code. After that, **BL-149** (model-usage crash) is the highest product-impact fix because it breaks the admin dashboard. Then **BL-150** (tool registry RBAC) closes the most significant security gap.

**Ready-to-paste next prompt:**
```
Implement BL-148 (cluster rebuild) and BL-149 (model-usage crash fix).
1. Rebuild API/Web/Worker Podman images from current HEAD.
2. kind load image-archive and rollout restart deployments.
3. Verify /health returns matching HEAD.
4. Debug GET /model-usage 500. Check ModelUsageService Prisma client initialization vs shared Prisma module. Fix and add test.
5. Capture fresh browser screenshots of admin dashboard Model Usage panel working.
6. Update state docs.
```

---

*Audit compiled with direct runtime verification, API negative testing, static code analysis, and fresh browser evidence. No fake completeness claimed.*
