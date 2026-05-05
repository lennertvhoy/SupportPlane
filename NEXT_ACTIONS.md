# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-05 09:45 CEST

## Active Work

- [BL-144] **Full Application Control Inventory & Interaction Regression Harness**
  - Owner: future UX quality slice
  - Status: planned. Full inventory of all controls on secondary panels (Call Simulator, Connector, Delivery Policy, etc.), verify each is functional/disabled/explanatory/removed.

- [BL-145] **Enterprise Demo IA / Navigation Simplification**
  - Owner: future IA slice
  - Status: planned. Simplify navigation, reduce panel count, group-related surfaces.

- [BL-146] **Production-Readiness Language Audit & Boundary Hardening**
  - Owner: future language audit slice
  - Status: planned. Review all copy for consistency, remove overclaims, harden boundary language.

- [BL-147] **Design-System Consistency Pass & Brand Identity Foundation**
  - Owner: future design slice
  - Status: planned. Unify spacing, typography, badge styles, card layouts, loading/error states. Add logo, wordmark, favicon set, shared UI primitives in `packages/ui`, typography system, empty-state illustrations.

- [BL-071/BL-072] **Connector real-instance enablement**
  - Owner: future connector slice
  - Progress: BL-069 (GLPI) accepted. BL-127 (osTicket) blocked. BL-071 (MeshCentral) next target.

- [BL-065] **Broader low-risk remediation coverage**
  - Owner: future remediation hardening slice

- [BL-132] **Windows service/install packaging**
  - Owner: future Windows packaging slice

- [BL-135] **Per-doc content audit and full rewrite**
  - Owner: future slice

- [BL-152] **Belgium/EU Assurance Audit — Hardening Remaining**
  - Owner: compliance/security auditor delegate
  - Status: partial/readiness-dossier-created. 8 precheck docs created. Remaining: incident response runbook, TLS/mTLS design, SBOM, container hardening, backup restore E2E test, GDPR purge worker, CI security scanning, production auth hardening design.

- [BL-154] **Test Trustworthiness & Anti-Fake-Completeness Strategy**
  - Owner: QA / test architect
  - Status: partial. Worker helper tests (7) and audit integrity-hash tests (6) added in Session 162. Remaining: UI render tests (blocked by ghost package), worker integration tests, negative tests for security boundaries, mock/real boundary documentation.

- [BL-155] **DevSecOps Automated Audit Foundation**
  - Owner: security engineer
  - Status: partial/advanced. Secret scan (gitleaks), SAST (eslint-plugin-security + CodeQL workflow), SBOM (CycloneDX + SPDX), license check (license-checker with policy), K8s YAML validation added. Remaining: container scanning (Trivy/Grype), promote SAST warnings to errors after triage, kube-linter/checkov optional enhancements.

- [BL-156] **Accessibility, Colour Contrast & Visual Confidence Pass**
  - Owner: accessibility / frontend engineer
  - Status: planned. Fix primary button contrast, expand ARIA coverage, add focus rings, standardize disabled states, add skeleton loading, support reduced-motion, add `@axe-core/playwright` tests.

## Recently Completed

- [BL-157] `[accepted]` Browser E2E Smoke Gate (Session 164). 11 Playwright tests green. Local E2E infra proven. CI workflow created. Remote CI unproven.

- [BL-148] `[accepted]` Runtime Identity Truth Repair & Cluster Redeploy (Session 158).
- [BL-149] `[accepted]` Model-Usage Crash Fix & Admin Dashboard Repair (Session 158).
- [BL-150] `[accepted]` Tool Registry RBAC & Tenant Scoping Hardening (Session 158).
- [BL-151] `[accepted]` Web Resilience & Accessibility Foundation — minimal root error boundary + aria-labels (Session 158).
- [BL-152] `[partial/readiness-dossier-created]` Belgium/EU Assurance Audit — 8 compliance precheck docs created (Session 158).
- [BL-153] `[accepted]` Automated Quality Gate & CI/CD Hardening Foundation — CI workflow created, local validation passes, security baseline scaffolded, formatting drift fixed (Session 161).

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
