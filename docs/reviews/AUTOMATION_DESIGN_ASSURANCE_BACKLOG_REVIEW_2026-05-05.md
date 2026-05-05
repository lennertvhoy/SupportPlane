# SupportPlane — Automation, Design & Assurance Backlog Review

**Date:** 2026-05-05  
**Auditor:** Coding Agent (multi-subagent coordinated slice)  
**Repo:** `/home/ff/Documents/Projects/SupportPlane`  
**Git HEAD:** `403c5e2`  
**Branch:** `main` (ahead 35 of origin)  
**Worktree:** Clean  
**Evidence Folder:** `output/playwright/session-160-automation-design-assurance-backlog/`

---

## Executive Verdict: CONDITIONAL GO

This review is **complete** with explicit caveats:

1. **Session 159 closure-integrity discrepancy is dispositioned** — diff is docs/state-only, explicitly documented.
2. **No new runtime code was deployed** in this slice; it is a backlog/governance review.
3. **Nine new or strengthened backlog items** are proposed, scoped, and ready for implementation.
4. **CI still does not run application tests** — this is documented as a gap, not fixed.
5. **No compliance certification is claimed.**

---

## Phase 0 — Session 159 Closure-Integrity Preflight

### Verification Commands & Results

```
$ git status --short --branch
## main...origin/main [ahead 35]
nothing to commit, working tree clean

$ git rev-parse HEAD
403c5e2cdb0a130e6b33c4631f0c840bd644e4ec

$ git log --oneline -n 12
403c5e2 docs(state): session-160 preflight — disposition session-159 runtime/final-HEAD discrepancy
72e8572 docs(state): session-159 closure — correct stale hash, update evidence refs, reconcile state docs
6b3f4cd fix(state): correct stale session-158 final HEAD hash placeholder to c6cccb8
c6cccb8 docs(state): add Session 158 to PROJECT_STATE.yaml
713f4b9 docs(state): BL-152 compliance dossier + state docs update for BL-148/149/150/151
bf4f44e feat(web): BL-151 root error boundary + minimal a11y fixes
762bf5c fix(api): BL-149 model-usage crash fix + BL-150 tool registry RBAC
a7b9e93 fix(evidence): move BL-143 evidence to session-157 so it is alphabetically last
68d0477 docs(audit): comprehensive project improvement audit 2026-05-04
06020e4 chore(state): record final session-095 commit hash b9cd490
b9cd490 fix(bl143): closure — ticket ID defaults (TICKET-101→2), connectorMode-driven defaults, evidence and state doc reconciliation
951069e BL-143 First-Open UX Control Audit & Enterprise Readiness Pass
```

### Runtime / Final HEAD Analysis

| Field                                        | Value                                                           |
| -------------------------------------------- | --------------------------------------------------------------- |
| Final repo HEAD                              | `403c5e2`                                                       |
| API `/health` HEAD (Session 159 deploy time) | `c6cccb8320957208fd9cb42d6870c91c3975f65c`                      |
| Match                                        | **NO** — but difference is docs-only                            |
| Diff `c6cccb8..72e8572`                      | BACKLOG.md, PROJECT_STATE.yaml, STATUS.md, docs/EVIDENCE_LOG.md |
| Diff `bf4f44e..c6cccb8`                      | docs/compliance/\* (8 precheck docs), state doc updates         |
| Runtime code HEAD                            | `bf4f44e` (actual deployed code for BL-148/149/150/151)         |

### Classification: B → Dispositioned to A-

- The difference between runtime HEAD (`c6cccb8`) and final HEAD (`403c5e2`) consists **only** of documentation and state-file corrections.
- No runtime code changes exist in commits after `bf4f44e`.
- The exception is **explicitly documented** in:
  - `PROJECT_STATE.yaml` `note_session_159`
  - `output/playwright/session-160-automation-design-assurance-backlog/00-EVIDENCE-INDEX.md`
- Under SupportPlane closure rules, this is acceptable when the non-runtime-docs exception is clearly dispositioned.

### 217/220 Test Explanation

- `npm test` reports **404 total tests, 401 pass, 0 fail, 3 skipped, 0 todo**.
- The 3 skipped tests are in `apps/api/test/ai-services.test.ts`:
  1. `creates a chat session and sends a message`
  2. `returns 400 for invalid model selection in chat`
  3. `returns 400 for invalid chat role`
- **Why skipped:** They require `DATABASE_URL` (`{ skip: !dbAvailable }`). When DB is unavailable, a placeholder test runs to keep counts stable.
- **Verdict:** Honest skips. Not a test failure. Should be documented in test file or CI notes.

### BL-148/149/150/151 Closure Status

- **Remains accepted.** Runtime identity was verified at deploy time against `c6cccb8`.
- The subsequent doc-only commits do not invalidate the runtime proof.

---

## Phase 1 — Subagent Split

Five parallel audit workstreams were executed:

| Subagent | Focus                                         | Status   |
| -------- | --------------------------------------------- | -------- |
| A        | Automation / CI/CD / DevSecOps                | Complete |
| B        | Test Trustworthiness / Anti-Fake-Completeness | Complete |
| C        | Security / Compliance-Readiness Backlog       | Complete |
| D        | Accessibility / Contrast / Visual Confidence  | Complete |
| E        | Logo / House Style / Design-System Identity   | Complete |

---

## Phase 2 — Existing Guardrail Inventory

| Category                          | Status                      | Path                                                                 | Command                              | Blocks PR  | Local   | CI      | Trust  | Next Action                                |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------- | ------------------------------------ | ---------- | ------- | ------- | ------ | ------------------------------------------ |
| Formatting                        | Exists but not enforced     | `.prettierrc`                                                        | `npm run format:check`               | No         | Yes     | No      | Medium | Add to PR-blocking CI job                  |
| Linting                           | Exists but not enforced     | `eslint.config.mjs`                                                  | `npm run lint`                       | No         | Yes     | No      | Medium | Add to PR-blocking CI job                  |
| Type checking                     | Exists but not enforced     | `tsconfig.json` (11 files)                                           | `npm run typecheck`                  | No         | Yes     | No      | Medium | Add to PR-blocking CI job                  |
| Unit tests                        | Exists but not enforced     | Workspace `package.json`s                                            | `npm test`                           | No         | Yes     | No\*    | Medium | Add to CI; audit "No tests yet" workspaces |
| Integration tests                 | Exists but not enforced     | `apps/api/test/*.test.ts`                                            | `npm test`                           | No         | Yes     | No      | Medium | Run in CI with ephemeral PostgreSQL        |
| API contract tests                | Exists but not enforced     | `scripts/validate-contracts.js`                                      | `npm run validate`                   | No         | Yes     | No      | Medium | Add to CI                                  |
| RBAC/tenant tests                 | Exists but not enforced     | `apps/api/test/api.test.ts`, `security-hardening.test.ts`            | `npm test`                           | No         | Yes     | No      | Medium | Promote to CI with seeded DB               |
| DB migration validation           | Exists but weak             | `prisma/migrations/` (17 dirs)                                       | `npx prisma migrate status` (manual) | No         | Manual  | No      | Low    | Add dry-run validation in CI               |
| Prisma/schema validation          | Exists but not enforced     | `prisma/schema.prisma`                                               | `npm run validate`                   | No         | Yes     | No      | Medium | Add to CI                                  |
| Worker/outbox/retry tests         | Exists but weak             | `apps/api/test/api.test.ts`                                          | `npm test`                           | No         | Partial | No      | Low    | Write worker-specific tests                |
| Browser/E2E tests                 | **Missing**                 | —                                                                    | —                                    | —          | —       | —       | —      | Create Playwright suite                    |
| Accessibility checks              | **Missing**                 | —                                                                    | —                                    | —          | —       | —       | —      | Add axe-core or Lighthouse                 |
| Visual regression                 | Manual only                 | `scripts/*screenshots*.js`                                           | `node scripts/...`                   | No         | Yes     | No      | Low    | Consolidate into Playwright suite          |
| CI/CD workflows                   | Exists but weak             | `.github/workflows/validate.yml`                                     | N/A                                  | Partial    | N/A     | Yes     | Low    | Expand to build/test/lint/typecheck        |
| Container/image scanning          | **Missing**                 | `apps/*/Containerfile.*`                                             | —                                    | No         | No      | No      | —      | Add Trivy/Grype to CI                      |
| Dependency vulnerability scanning | Manual only                 | —                                                                    | `npm audit` (ad-hoc)                 | No         | Manual  | No      | Low    | Add `npm audit` or `audit-ci` to CI        |
| Secrets detection                 | Exists but weak             | `.github/workflows/windows-endpoint-verification.yml` (custom regex) | —                                    | No         | No      | Partial | Low    | Integrate gitleaks/trufflehog              |
| Static security analysis          | **Missing**                 | —                                                                    | —                                    | —          | —       | —       | —      | Add Semgrep/CodeQL                         |
| Supply-chain hardening            | Exists but weak             | `package-lock.json`                                                  | —                                    | No         | N/A     | No      | Low    | Enable npm provenance, generate SBOM       |
| Kubernetes manifest validation    | Exists but not enforced     | `infra/kubernetes/local-podman/*.yaml`                               | —                                    | No         | No      | No      | Low    | Add kube-linter/checkov                    |
| Runtime identity checks           | Exists and enforced (local) | `scripts/health.js`, `apps/api/src/health/`                          | `npm run health`                     | No         | Yes     | Partial | Medium | Add assertions to standard CI              |
| Evidence hygiene checks           | Exists and enforced         | `scripts/check_state_docs.py`, `scripts/check_docs_hygiene.py`       | `python3 scripts/...`                | Yes (docs) | Yes     | Yes     | Medium | Expand to cover code-quality gates         |

_Note: `apps/worker`, `packages/audit`, `packages/ui` echo "No tests yet"._

---

## Phase 3 — Test Trustworthiness Review

### Test Inventory (Verified)

| Workspace           | Tests   | Pass    | Fail  | Skip  | Todo  |
| ------------------- | ------- | ------- | ----- | ----- | ----- |
| apps/api            | 220     | 217     | 0     | 3     | 0     |
| apps/web            | 22      | 22      | 0     | 0     | 0     |
| apps/endpoint-agent | 44      | 44      | 0     | 0     | 0     |
| apps/worker         | 0       | 0       | 0     | 0     | 0     |
| packages/ai         | 12      | 12      | 0     | 0     | 0     |
| packages/audit      | 0       | 0       | 0     | 0     | 0     |
| packages/connectors | 50      | 50      | 0     | 0     | 0     |
| packages/contracts  | 49      | 49      | 0     | 0     | 0     |
| packages/policy     | 7       | 7       | 0     | 0     | 0     |
| packages/ui         | 0       | 0       | 0     | 0     | 0     |
| **TOTAL**           | **404** | **401** | **0** | **3** | **0** |

### Strengths

- `api.test.ts` (4,405 lines) covers session CRUD, tenant isolation, action/outbox lifecycle, Zammad connector endpoints, credential references, evidence bundles, call simulation, audit events.
- `security-hardening.test.ts` (381 lines) tests body-size limits, rate limiting, invalid tokens, egress URL blocking, viewer approval denial, cross-tenant access, unsafe field guards.
- `endpoint-agent` tests include source-code invariant scans for unsafe patterns (`powershell`, `cmd.exe`, `shell:true`).
- Post-BL-149/150: Model-usage and tool-registry fixes are tested (empty state, invalid params 400, viewer access, viewer denied 403).

### Critical Gaps

1. **No worker tests** — `apps/worker/package.json`: `echo 'No tests yet'`.
2. **No browser E2E tests** — All user-facing behavior is verified via manual screenshot scripts only.
3. **CI does not run application tests** — `.github/workflows/validate.yml` only validates template/docs scaffolding.
4. **packages/ui and packages/audit are untested placeholders** — Both echo "No tests yet".
5. **AI Chat tests are environment-dependent skips** — 3 skipped tests require `DATABASE_URL`.
6. **Model-usage service is trivially tested** — `model-usage.service.test.ts` is 13 lines, checks method existence only.
7. **Runtime identity is not automatically enforced in tests** — `/health` returns `branch`/`head` but no test fails if these are missing or stale.
8. **Missing negative tests** for: AI chat, evidence bundle export under tenant mismatch, call control invalid actions, worker retry exhaustion.
9. **Mock-heavy reliance** — API tests use `InMemoryStore` instead of PostgreSQL. Real database queries, AI latency/failure modes, and NATS delivery are not exercised.

### Would Tests Catch AI-Agent Regressions?

**Partially.** The suite would catch breaking API response shapes, tenant isolation breaches, secret exposure, and policy-based AI blocks. It would **miss** UI regressions, worker delivery failures, PostgreSQL-specific query bugs, real AI provider issues, and cross-tenant knowledge base isolation.

---

## Phase 4 — Automated Audit / DevSecOps Backlog

### P0/P1 Gaps

1. **No incident response runbook** — `docs/RUNBOOK_INCIDENT_RESPONSE.md` does not exist. NIS2 Art. 21(4) gap.
2. **No SAST / dependency vulnerability scanning in CI** — No Dependabot, `npm audit`, Semgrep, or CodeQL.
3. **No SBOM or license inventory** — `SUPPLY_CHAIN_AUDIT.md` admits "No SBOM exists."
4. **No actual GDPR deletion execution** — `POST /gdpr/delete-preview` is dry-run only. No purge worker.
5. **No container hardening proven** — No non-root user, pinned digest, or image scans.
6. **No tested restore from backup on clean environment** — `OPERATIONAL_READINESS_AUDIT.md` documents this gap.
7. **No encryption in transit proven** — Cluster services communicate over plain HTTP.
8. **No MFA, password policy, or account lockout** — Documented in `AUTHORIZATION.md` as missing.

### Positive Controls

- Security headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Rate limiting guard with per-route limits and audit logging.
- Tenant isolation tested in API integration tests.
- RBAC tested (viewer denied approval, admin allowed).
- Egress policy evaluation exists and is tested.
- Secret redaction in API responses is tested.
- Body size limits enforced via guard and middleware.
- `.containerignore` properly excludes `.env`, `.git`, docs.
- `package-lock.json` committed for reproducible installs.

---

## Phase 5 — Accessibility, Colour, Contrast, Visual Confidence

### Contrast Ratios (WCAG 2.1 AA)

| Combination                            | Ratio      | AA Normal | Where Used                 |
| -------------------------------------- | ---------- | --------- | -------------------------- |
| `text-white` on `bg-accent` (#3b82f6)  | **3.68:1** | **FAIL**  | Primary buttons everywhere |
| `text-cockpit-500` on `bg-cockpit-900` | **2.53:1** | **FAIL**  | Metadata, helper text      |
| `text-cockpit-400` on `bg-cockpit-900` | 7.54:1     | Pass      | Body text                  |
| `text-amber-300` on `bg-amber-900/30`  | 11.54:1    | Pass      | Warning badges             |
| `text-green-300` on `bg-green-900/40`  | 10.90:1    | Pass      | Success badges             |
| `text-red-300` on `bg-red-900/40`      | 8.58:1     | Pass      | Danger badges              |

**Critical:** Primary CTA buttons fail WCAG AA normal text contrast (need 4.5:1).
**Secondary:** `text-cockpit-500` helper text fails AA on dark backgrounds.

### ARIA & Keyboard

- **Only ~7 `aria-label` attributes** across entire web app.
- No `aria-describedby` linking form errors to inputs.
- No `aria-live` regions for dynamic content.
- No `aria-expanded`, `aria-haspopup`, or `aria-controls` on dropdowns.
- Focus styles inconsistent: `focus:outline-none` is common without adequate replacement ring.
- No skip-to-content link.
- `ToolsDropdown` has no `Escape` handler or focus trap.

### Disabled States

- **Opacity-only pattern dominant** (`disabled:opacity-50/60`) in ~30+ places. Insufficient for low-vision users.
- Rare better pattern: `disabled:bg-cockpit-700 disabled:text-cockpit-400`.

### Motion & Preference

- No `prefers-reduced-motion` queries.
- No `prefers-contrast` or `forced-colors` support.

### Automated Accessibility Checks

**None exist.** No `axe-core`, `pa11y`, Lighthouse, or `@testing-library/react`.

---

## Phase 6 — Logo and House-Style Findings

### Brand Asset Inventory

| Asset               | Path                       | Status                                                          |
| ------------------- | -------------------------- | --------------------------------------------------------------- |
| Logo (SVG)          | `apps/web/app/icon.svg`    | Placeholder-quality geometric cyan square                       |
| Favicon             | `apps/web/app/icon.svg`    | Minimal; no `.ico`, `.png`, `apple-touch-icon`, `manifest.json` |
| Wordmark / Logotype | _Not found_                | Missing                                                         |
| Icons               | `lucide-react`             | Consistent library, generic                                     |
| Fonts               | System default             | Missing custom typography                                       |
| Shared UI package   | `packages/ui/src/index.ts` | Ghost — exports only `UI_VERSION`                               |

### Consistency Findings

- **Login page** uses `ShieldCheck` icon as pseudo-logo.
- **Main cockpit header** uses `Activity` icon inside blue square.
- **No shared brand mark** — two different icons serve as logo on different surfaces.
- **No design-system docs** — No dedicated design-system or brand guidelines document found in the repository.
- **Evidence exports** (Markdown + PDF) have no logo, no brand color, no page header/footer.
- **Typography is ad-hoc** — `text-[10px]`, `text-[11px]` arbitrary classes appear 692 times.
- **No empty-state illustrations** — all empty states are text-only.

### Enterprise vs "AI Toy" Assessment

- **Avoids AI-toy aesthetic** — no sparkles, gradients, chat-bubble UIs, or "magic" language.
- **Looks like an advanced prototype/internal tool** — utilitarian, dense, honest.
- **Lacks visual identity, typographic refinement, and component-system maturity** expected by enterprise buyers.

---

## Phase 7 — Backlog Updates

### Strengthened Existing Items

#### [BL-147] Design-System Consistency Pass

**Strengthened scope:**

- Unify spacing, typography, badge styles, card layouts, loading/error states.
- **Add:** Logo, wordmark, favicon set, and brand identity consistency.
- **Add:** Shared UI primitives migration (`Button`, `Input`, `Card`, `Badge`, `EmptyState`, `Skeleton`) into `packages/ui`.
- **Add:** Typography system via `next/font` (suggestion: Inter or Geist), strict type scale.
- **Add:** Replace all `text-[10px]` / `text-[11px]` with standardized tokens.
- **Add:** Evidence export branding (logo in PDF, brand-colored headers).
- **Add:** Empty-state illustration pattern.

**Acceptance:**

- `packages/ui` exports ≥5 real components with tests.
- Zero arbitrary font-size classes remain.
- Login page, header, and PDF exports share the same logo/wordmark.
- Favicon passes RealFaviconGenerator validation.
- `npm run typecheck` and `npm run lint` pass after migration.

#### [BL-152] Belgium/EU Assurance Audit

**Strengthened scope:**

- 8 compliance precheck docs already created (honest, no certification claimed).
- **Add concrete next gates:**
  1. Incident response runbook (`docs/RUNBOOK_INCIDENT_RESPONSE.md`)
  2. TLS/mTLS design doc and evidence
  3. SBOM generation and license audit
  4. Container hardening spec and scan evidence
  5. Backup restore end-to-end test on clean cluster
  6. GDPR deletion/purge worker (behind admin RBAC)
  7. CI security scanning pipeline (Dependabot, npm audit, secret scanning, SAST)
  8. Production auth hardening design (MFA, password policy, account lockout)

### New Backlog Items

#### [BL-153] Automated Quality Gate & CI/CD Hardening Foundation

**Problem:** CI only validates template/docs scaffolding. No build, lint, typecheck, test, or security gates run in CI.

**Why it matters:** Broken builds, type errors, lint failures, and failing tests can be merged undetected. This undermines every other quality effort.

**Scope:**

- Expand `.github/workflows/validate.yml` (or create `ci.yml`) to run on every PR/push:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run format:check`
  - `npm test`
  - `npm run validate`
  - `npm audit --audit-level=moderate` (or `audit-ci`)
- Use ephemeral PostgreSQL service container for API tests.
- Make the workflow a required status check for merge.

**Non-goals:**

- Do not add container builds to PR CI yet (too slow).
- Do not add K8s deployment tests in this slice.

**Acceptance:**

- PR with intentional lint error is blocked.
- PR with intentional test failure is blocked.
- `npm audit` findings are surfaced (even if not all fixed immediately).
- CI runtime < 10 minutes.

**Evidence:**

- Screenshot of PR checks panel showing all green.
- Screenshot of intentional-failure PR being blocked.

**Risk notes:**

- 3 skipped AI chat tests may cause CI to report skip counts; acceptable if documented.
- Worker/UI/audit "No tests yet" will show 0 tests; acceptable if backlog exists.

#### [BL-154] Test Trustworthiness & Anti-Fake-Completeness Strategy

**Problem:** Worker, UI, and audit packages have zero tests. Browser E2E does not exist. Mock-heavy testing means real database/AI/NATS paths are unexercised. Negative tests are missing for several security boundaries.

**Why it matters:** Untested worker delivery, untested UI components, and missing negative tests create silent regression risks. Fake completeness (passing tests that bless broken behavior) is worse than no tests.

**Scope:**

1. Worker tests: `processOnce`, retry logic, dead-letter handling, NATS consume/ack.
2. UI tests: At least render/snapshot tests for shared primitives in `packages/ui`.
3. Audit tests: `computeIntegrityHash` placeholder behavior, redaction helpers.
4. Negative tests: AI chat invalid roles/model, evidence bundle tenant mismatch, call control invalid actions, worker retry exhaustion.
5. Mock/real boundary: Document which tests use mocks and why. Add `mockDevOnly` assertions where applicable.
6. Characterization tests: Name explicitly if they exist.
7. Skipped tests: Document reason and owner for all skips.

**Non-goals:**

- Do not replace all mocks with real integrations in this slice.
- Do not add full Playwright E2E suite (that is BL-159).

**Acceptance:**

- `apps/worker` has ≥5 meaningful tests.
- `packages/ui` has ≥3 render tests.
- `packages/audit` has ≥3 unit tests.
- All skipped tests have `// SKIP REASON: ...` comments.
- No new test merely blesses broken behavior.

**Evidence:**

- `npm test` output showing new pass counts.
- Test file listings per workspace.

#### [BL-155] DevSecOps Automated Audit Foundation

**Problem:** No SAST, DAST, dependency scanning, secrets detection, container scanning, or SBOM generation in CI. Kubernetes manifests lack validation. Supply chain is unmonitored.

**Why it matters:** Security regressions and supply-chain attacks will not be caught until manual review. NIS2 and EU Cyber Resilience Act readiness require evidence of these controls.

**Scope:**

1. **Dependency vulnerability scanning:** `npm audit --audit-level=moderate` in CI; triage 10 pre-existing vulns.
2. **Secrets detection:** Integrate `gitleaks` or `trufflehog` in CI, or enable GitHub secret scanning.
3. **SAST:** Add Semgrep or CodeQL with findings tracked (not hidden).
4. **Container scanning:** Add Trivy or Grype scan step after `podman build`.
5. **SBOM:** Generate CycloneDX or SPDX SBOM via `npm sbom` or `cyclonedx-npm`; commit per release.
6. **License scan:** Run `license-checker --json` or FOSSA; identify copyleft/incompatible licenses.
7. **K8s manifest validation:** Add `kube-linter`, `checkov`, or `kubectl apply --dry-run=server` in CI.
8. **Security headers / runtime identity:** Automated assertions in CI or nightly.

**Non-goals:**

- Do not claim all findings will be fixed immediately.
- Do not add production-grade DAST (out of scope for local sandbox).

**Acceptance:**

- CI runs at least 3 new security checks (dependency audit, secrets scan, SAST).
- First scan results are committed even if findings exist (honesty rule).
- SBOM generation script exists and runs successfully.
- K8s manifest validation script exists and reports issues.

**Evidence:**

- CI workflow YAML showing security steps.
- Scan result artifacts (JSON/txt).
- SBOM file committed.

**Risk notes:**

- False positives from SAST must be triaged, not ignored.
- Container scanning requires image build; may be slow for PR CI — consider nightly.

#### [BL-156] Accessibility, Colour Contrast & Visual Confidence Pass

**Problem:** Primary button contrast fails WCAG AA (3.68:1). ~7 aria labels total. No automated accessibility testing. Focus visibility inconsistent. Disabled states rely on opacity only. No reduced-motion support.

**Why it matters:** Enterprise buyers audit for accessibility. Screen reader and keyboard users cannot effectively use the application. WCAG non-compliance is a legal risk in EU public-sector sales.

**Scope:**

1. **Color / Contrast**
   - Darken `accent` or lighten button text to achieve ≥ 4.5:1 on primary buttons.
   - Audit all `text-cockpit-500` usages; replace with `text-cockpit-400` where AA normal text is required.
2. **ARIA & Screen Readers**
   - Add `aria-describedby` + `aria-invalid` to form inputs with errors.
   - Add `aria-live="polite"` containers for async loading/errors.
   - Add `aria-expanded`, `aria-haspopup`, `role="menu"` to `ToolsDropdown`; implement focus trap and Escape handling.
   - Add `aria-pressed` to toggle switches.
   - Add `aria-hidden="true"` to decorative icons.
   - Ensure all icon-only buttons have accessible names.
3. **Keyboard & Focus**
   - Replace bare `focus:outline-none` with visible focus rings (`focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-cockpit-900`).
   - Add skip-to-content link.
4. **Disabled States**
   - Standardize disabled buttons to use both opacity reduction AND background/text color shift.
5. **Loading & Empty States**
   - Create `SkeletonPanel` / `SkeletonRow` components.
   - Ensure all panels have explicit empty-state copy.
6. **Motion & Preference**
   - Add `@media (prefers-reduced-motion: reduce)`.
   - Add `@media (prefers-contrast: more)` overrides.
7. **Testing**
   - Install `@axe-core/playwright` and add accessibility scan to at least one test per primary route.
   - Add keyboard navigation test for `ToolsDropdown` and `InfoTooltip`.

**Non-goals:**

- Do not redesign the entire UI.
- Do not add light mode in this slice.
- Do not claim full WCAG 2.1 AA certification.

**Acceptance:**

- Primary buttons pass 4.5:1 contrast.
- `aria-label` count ≥ 20 across the web app.
- Focus rings visible on all interactive elements.
- `@axe-core/playwright` test runs with 0 critical violations.
- `docs/compliance/ACCESSIBILITY_AUDIT.md` updated with resolved issues and new baseline.

**Evidence:**

- Browser screenshots before/after of login page, dashboard, admin panel.
- axe-core report artifact.
- Contrast calculation screenshots or tool output.

**Risk notes:**

- Some contrast fixes may require broader color token changes.
- Focus rings may clash with existing design; adjust offset colors as needed.

#### [BL-157] Browser E2E Smoke Gate

**Problem:** No automated browser tests exist. All user-facing behavior is verified via manual screenshot scripts. UI regressions are not caught automatically.

**Why it matters:** Manual screenshots are slow, inconsistent, and skip accessibility/keyboard/interaction validation. A first-tester-facing bug (e.g., broken login form, missing session list) will not be caught by unit tests.

**Scope:**

1. Create formal Playwright E2E suite with `playwright.config.ts`.
2. Smoke tests for critical paths:
   - Login → Dashboard load
   - Create session → Load ticket context (Zammad)
   - Admin dashboard navigation
   - Tool registry denied/allowed (viewer vs admin)
   - Device console load
3. Include accessibility scan (`@axe-core/playwright`) in each smoke test.
4. Run E2E in CI (against local dev server or ephemeral cluster).

**Non-goals:**

- Do not cover every panel and edge case in the first slice.
- Do not replace manual screenshot scripts entirely (they still serve evidence purposes).

**Acceptance:**

- `npx playwright test` runs locally and passes.
- ≥5 smoke tests covering the 5 paths above.
- CI runs E2E on PR or nightly.
- axe-core scans report 0 critical violations.

**Evidence:**

- Playwright report artifact.
- Screenshot of passing CI E2E step.

#### [BL-158] Release Evidence Hygiene & Runtime Identity Gate

**Problem:** Runtime identity checks are manual. Evidence folders can become stale. Screenshot budgets (max 20) are not automatically enforced. No automated evidence hygiene scan exists beyond state-doc checks.

**Why it matters:** Every closure session requires runtime identity proof, clean worktree, and evidence folder compliance. Automating these checks reduces human error and closure-repair cycles.

**Scope:**

1. **Runtime identity gate script:** `scripts/check_runtime_identity.sh`
   - Compares API `/health` HEAD to `git rev-parse HEAD`.
   - Fails with explicit message if mismatch > acceptable threshold.
   - Accepts docs-only exception flag with explicit commit list.
2. **Evidence hygiene gate script:** `scripts/check_evidence_hygiene.sh`
   - Verifies evidence folder is alphabetically last.
   - Counts files ≤ 20 per folder.
   - Detects duplicate screenshots (md5sum).
   - Checks for `.html` wrappers on JSON artifacts.
3. **Integrate into CI or pre-commit:** Optional fast check.

**Non-goals:**

- Do not enforce runtime identity in CI if cluster is not running in CI.
- Do not auto-delete stale evidence.

**Acceptance:**

- `scripts/check_runtime_identity.sh` runs and reports match/mismatch.
- `scripts/check_evidence_hygiene.sh` runs and reports violations.
- Both scripts documented in `docs/RELEASE_RUNBOOK.md`.

**Evidence:**

- CLI output of both scripts.

#### [BL-159] Supply Chain / SBOM / License Gate

**Problem:** No SBOM exists. No license inventory. Dependency vulnerabilities are not continuously monitored. Supply-chain audit doc is honest but has no automated evidence.

**Why it matters:** NIS2 and EU Cyber Resilience Act require supply-chain transparency. Customers and auditors will ask for SBOMs and license attestations.

**Scope:**

1. Generate SBOM (`npm sbom --format=cyclonedx` or `cyclonedx-npm`).
2. Commit SBOM to `docs/compliance/sbom/` per release.
3. Run license scan (`license-checker --json` or `fossa`).
4. Identify copyleft/incompatible licenses and document exceptions.
5. Add `npm audit --audit-level=moderate` to CI.
6. Enable Dependabot for automated security update PRs.

**Non-goals:**

- Do not fix all vulnerabilities in this slice (triage and document).
- Do not sign artifacts with Sigstore/cosign yet (future hardening).

**Acceptance:**

- SBOM generation script runs successfully.
- License scan output committed.
- `npm audit` runs in CI and surfaces findings.
- Dependabot enabled (or documented why not).
- `docs/compliance/SUPPLY_CHAIN_AUDIT.md` updated with automated evidence.

**Evidence:**

- SBOM JSON artifact.
- License scan output.
- CI screenshot showing audit step.

---

## Phase 8 — Verification

### Commands Run

```bash
# Session 159 preflight
git status --short --branch
git rev-parse HEAD
git log --oneline -n 12
git diff --stat c6cccb8..72e8572
npm test

# Governance checks
npm run validate   # PASS — all contract validations + Prisma schema valid
npm run lint       # PASS — 0 errors
npm run typecheck  # PASS — all workspaces

# State doc checks
python3 scripts/check_state_docs.py  # PASS
python3 scripts/check_docs_hygiene.py  # PASS
```

### Results

| Check               | Command                                 | Result                          |
| ------------------- | --------------------------------------- | ------------------------------- |
| Git worktree        | `git status --short --branch`           | Clean, ahead 35                 |
| Git HEAD            | `git rev-parse HEAD`                    | `403c5e2`                       |
| Contract validation | `npm run validate`                      | Pass                            |
| Prisma schema       | `npx prisma validate`                   | Valid                           |
| Lint                | `npm run lint`                          | Pass (0 errors)                 |
| Typecheck           | `npm run typecheck`                     | Pass (all workspaces)           |
| Tests               | `npm test`                              | 401/404 pass, 0 fail, 3 skipped |
| State doc check     | `python3 scripts/check_state_docs.py`   | Pass                            |
| Doc hygiene check   | `python3 scripts/check_docs_hygiene.py` | Pass                            |

---

## Changes Made

### Files Modified

1. `STATUS.md` — Reformatted to concise bullet style (uncommitted change from prior session, now committed).
2. `PROJECT_STATE.yaml` — Updated `final_head_after_session_159` to `72e8572`, added explicit docs-only discrepancy note.
3. `docs/reviews/AUTOMATION_DESIGN_ASSURANCE_BACKLOG_REVIEW_2026-05-05.md` — Created (this document).
4. `BACKLOG.md` — Strengthened BL-147 and BL-152; added BL-153 through BL-159.
5. `NEXT_ACTIONS.md` — Added active queue entries for BL-153, BL-154, BL-155, BL-156.
6. `docs/EVIDENCE_LOG.md` — Added EV entry for Session 160.

### Commit Hash

`403c5e2` — session-160 preflight commit (Session 159 disposition).

Subsequent commits in this session will append to the above.
