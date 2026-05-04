# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-04 18:00 CEST

## Active Work

- [BL-148] **Runtime Identity Truth Repair & Cluster Redeploy (P0)**
  - Owner: runtime/platform engineer
  - Status: planned. Rebuild API/Web/Worker images from current HEAD, reload to Kind cluster, verify `/health` matches `git rev-parse HEAD`.
  - Exit criteria: cluster HEAD equals repo HEAD; no stale images serving tested routes.

- [BL-149] **Model-Usage Crash Fix & Admin Dashboard Repair (P0)**
  - Owner: backend/API engineer
  - Status: planned. Fix `GET /model-usage` returning 500. Debug ModelUsageService Prisma client initialization vs shared Prisma module. Add regression tests.
  - Exit criteria: admin Model Usage panel loads without crash; viewer gets controlled response; tests cover regression.

- [BL-150] **Tool Registry RBAC & Tenant Scoping Hardening (P1)**
  - Owner: security engineer
  - Status: planned. Add server-side auth guard, permission check, tenant scoping to `ToolRegistryController`. Prevent command template leakage.
  - Exit criteria: viewer gets 403; alt-tenant isolation enforced; negative tests prove denial; UI handles denied state cleanly.

- [BL-144] **Full Application Control Inventory & Interaction Regression Harness**
  - Owner: future UX quality slice
  - Status: planned. Full inventory of all controls on secondary panels (Call Simulator, Connector, Delivery Policy, etc.), verify each is functional/disabled/explanatory/removed.

- [BL-145] **Enterprise Demo IA / Navigation Simplification**
  - Owner: future IA slice
  - Status: planned. Simplify navigation, reduce panel count, group-related surfaces.

- [BL-146] **Production-Readiness Language Audit & Boundary Hardening**
  - Owner: future language audit slice
  - Status: planned. Review all copy for consistency, remove overclaims, harden boundary language.

- [BL-147] **Design-System Consistency Pass**
  - Owner: future design slice
  - Status: planned. Unify spacing, typography, badge styles, card layouts, loading/error states.

- [BL-071/BL-072] **Connector real-instance enablement**
  - Owner: future connector slice
  - Progress: BL-069 (GLPI) accepted. BL-127 (osTicket) blocked. BL-071 (MeshCentral) next target.

- [BL-065] **Broader low-risk remediation coverage**
  - Owner: future remediation hardening slice

- [BL-132] **Windows service/install packaging**
  - Owner: future Windows packaging slice

- [BL-135] **Per-doc content audit and full rewrite**
  - Owner: future slice

- [BL-151] **Web Resilience & Accessibility Foundation (minimal)**
  - Owner: future frontend engineer
  - Status: planned. Add root Next.js error boundary only. Full accessibility pass deferred.

- [BL-152] **Belgium/EU Assurance Audit**
  - Owner: compliance/security auditor delegate
  - Status: planned. Code quality, AppSec, GDPR, AI Act, NIS2/CyberFundamentals, accessibility, supply chain, operational readiness audit.

## Recently Completed

- [BL-143] `[accepted]` First-Open UX Control Audit & Enterprise Readiness Pass (Session 095).
- [BL-142] `[accepted]` First Live Tester Round Execution & Feedback-to-Backlog Triage (Session 153).
- [BL-141] `[accepted]` Tester-facing demo UX polish & observation readiness (Session 152/153).

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
