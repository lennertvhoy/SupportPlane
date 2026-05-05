# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-05 17:10 CEST

## Active Work

- [BL-145] **Enterprise Demo IA / Navigation Simplification**
  - Owner: future IA slice
  - Status: planned. Simplify navigation, reduce panel count, group-related surfaces.

- [BL-146] **Production-Readiness Language Audit & Boundary Hardening**
  - Owner: future language audit slice
  - Status: planned. Review all copy for consistency, remove overclaims, harden boundary language.

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

- [BL-157] **Remote E2E CI Proof**
  - Owner: DevOps / CI engineer
  - Status: partial. Local E2E fully proven (26/26 tests, 8 spec files). `.github/workflows/e2e.yml` exists locally but has never been pushed to origin/main. Remote CI is an honest remaining gap.

- [BL-158] **Release Evidence Hygiene & Runtime Identity Gate**
  - Owner: release engineer
  - Status: partial/scripts-created. Scripts created but need documentation in release runbook.

- [BL-159] **Supply Chain / SBOM / License Gate**
  - Owner: security engineer
  - Status: partial. SBOM generation and license checker implemented. Remaining: Dependabot enablement, commit SBOM per release, update SUPPLY_CHAIN_AUDIT.md with automated evidence.

## Recently Accepted (this session)

- [BL-144] `[accepted]` Full Application Control Inventory & Interaction Regression Harness (Session 168)
- [BL-147] `[accepted]` Design-System Consistency Pass & Brand Identity Foundation (Session 168)

## Recently Accepted (prior sessions)

- [BL-156] `[accepted]` Accessibility, Colour Contrast & Visual Confidence Pass (Session 166)
- [BL-153] `[accepted]` CI Quality Gate Foundation (Session 161)
- [BL-148/149/150/151/152] `[accepted]` Runtime/Security Assurance (Session 159)
- [BL-141/142] `[accepted]` Tester Readiness (Session 156)
- [BL-143] `[accepted]` First-Open UX Control Audit & Enterprise Readiness Pass (Session 095)
