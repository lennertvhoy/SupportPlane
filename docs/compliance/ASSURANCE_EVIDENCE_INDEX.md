# Belgium/EU Assurance Audit — Evidence Index

> **Status:** Readiness / Precheck — NOT a compliance certification or legal opinion.  
> **Scope:** BL-152 — Belgium/EU Assurance Audit (code quality, AppSec, GDPR, AI Act, NIS2/CyberFundamentals, accessibility, supply chain, operational readiness).  
> **As of:** 2026-05-04  
> **Next review:** When BL-152 implementation slice is assigned.

## 1. Purpose

This index maps each compliance area to:
- Existing evidence already captured in the project
- Honest gaps that remain
- Concrete backlog items to close gaps

It does **not** assert compliance, certification, or legal adequacy.

## 2. Evidence Inventory by Area

| Area | Existing Evidence | Honest Gap | Backlog Target |
|------|-------------------|------------|----------------|
| **Code Quality** | Lint (0 errors), typecheck (strict TS 5.7+), 260+ tests, ESLint 9, Prettier | No SonarQube/code coverage gate; no mutation testing | BL-152 slice or future QA slice |
| **AppSec / OWASP** | Threat model (6 categories, mitigations), security regression matrix (15/15 checks), rate limits, body limits, validation guards, no-secret scan scripts | No pen test; no SAST/DAST tooling; no dependency vulnerability gate | BL-152 |
| **GDPR Data Inventory** | `DataSubjectRequest` model, export-preview/delete-preview dry-run endpoints, redaction layer, retention policy controls | No DPO review; no lawful-basis mapping signed off; no cross-border transfer assessment | BL-152 |
| **DPIA** | Privacy disclaimers in UI, mock-only screen observation, consent indicators, redaction before storage | No formal DPIA document; no DPO sign-off | BL-152 |
| **AI Act** | Policy gating (tenant AI policy, kill switch, mock-only default), human review required, audit trail for all AI calls, no autonomous execution | No formal AI Act risk classification dossier; no notified-body interaction | BL-152 |
| **NIS2 / CyberFundamentals** | RBAC, tenant isolation, audit logging, backup/restore runbook, kill switch, policy controls | No CSIRT integration; no formal incident response plan; no security certification | BL-152 |
| **Accessibility** | Basic HTML semantics, some aria-labels | Only ~4 aria-labels; no skeleton loading; keyboard nav gaps; no WCAG audit | BL-151 + BL-152 |
| **Supply Chain** | npm workspaces, committed lockfiles, Containerfile.local images | No SBOM generation; no license scan gate; no container image signing | BL-152 |
| **Operational Readiness** | Backup/restore scripts, health endpoints, demo reset runbook, cluster deploy scripts | No incident response runbook; no paging/alerting; no rollback test evidence | BL-152 |

## 3. Key Existing Evidence Locations

| Artifact | Path / Folder | Proves |
|----------|---------------|--------|
| Security regression matrix | `output/playwright/session-116-bl089-bl123-bl124-bl125-plugin-registry/11-security-regression-matrix.txt` | 15 security checks pass |
| Threat model | `docs/THREAT_MODEL.md` | 6 threat categories + mitigations |
| Real sandbox acceptance freeze | `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/` | E2E sandbox workflow with no-secret proof |
| Audit explorer | `output/playwright/session-126-governed-ai-vertical-closure/11-admin-audit-explorer.png` | 126+ auditable events |
| GDPR dry-run panel | `output/playwright/session-126-governed-ai-vertical-closure/12-admin-gdpr-dry-run.png` | Export/delete preview UI exists |
| Backup/restore runbook | `docs/RUNBOOK_BACKUP_RESTORE.md` | Dry-run backup/restore documented |
| Windows endpoint verification | `output/playwright/session-134-windows-runner-ci-reachability/` | Real Windows runner proof, no secrets |
| Connector runtime contract | `docs/CONNECTOR_RUNTIME_CONTRACT.md` | Safe config validation, secret redaction |

## 4. Known Limitations (Non-Claims)

- No legal counsel or DPO has reviewed these documents.
- No third-party penetration test has been performed.
- No formal ISO 27001, SOC 2, or CyberFundamentals certification is claimed.
- The product is a local/demo MVP; production hardening is incomplete.

## 5. Recommended Next Actions

1. **BL-152 slice assignment** — Select owner and scope (readiness dossier vs. hardening actions).
2. **SBOM generation** — Run `npm sbom` or `cyclonedx-npm` and commit baseline.
3. **Accessibility quick-fixes** — Add skeleton loaders, fix keyboard traps, add aria-live regions (BL-151).
4. **Incident response runbook** — Draft `docs/RUNBOOK_INCIDENT_RESPONSE.md`.
5. **Code coverage gate** — Add `c8` or `nyc` coverage threshold to CI-equivalent validation.

---
*This document is a readiness inventory, not a compliance certificate.*
