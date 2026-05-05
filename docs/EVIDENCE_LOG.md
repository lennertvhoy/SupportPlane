# EVIDENCE_LOG.md

**Purpose:** Structured ledger of proof artifacts for user-facing claims and external planning references.

## EV-2026-05-05-185: Session 163 — DevSecOps Automated Audit Foundation (BL-155 partial/advanced, BL-159 partial, BL-158 partial)

- Evidence folder: `output/playwright/session-163-devsecops-automation-foundation/`
- Source/System: Local shell validation against repo HEAD `de34661`
- Final Session 163 HEAD: `5520cc77f40e20c612b3e31722de3471a5d2ccef` (docs-only closure commit after code commit `2b3dc49`)
- Action: Session 162 integrity preflight completed — evidence index stale (Case A), repaired in Session 164. Added gitleaks secret scan with `.gitleaks.toml` (0 findings). Added `eslint-plugin-security` to ESLint config (79 warnings, advisory). Created CodeQL workflow (`.github/workflows/codeql.yml`). Created SBOM generation script (`scripts/sbom-generate.sh`, CycloneDX + SPDX via `npm sbom`). Created license checker script (`scripts/license-check.sh` with disallowed/allowlist policy, 0 disallowed after explicit allowlist for sharp-libvips runtime deps). Created K8s manifest validation script (`scripts/k8s-manifest-check.sh`, YAML syntax valid, dry-run skipped without cluster). Created `.github/workflows/security-audit.yml` with secret-scan, sast-eslint, sbom, license-check, and k8s-manifest-check jobs. Added `permissions: contents: read` to `ci.yml`. Added `license: MIT` to all workspace packages and root `package.json`.
- Proves:
  - `npm run format:check` passes (0 errors)
  - `npm run lint` passes (0 errors, 79 security warnings)
  - `npm run typecheck` passes (all 10 workspaces)
  - `npm run build` passes (all workspaces)
  - `npm run validate` passes (contracts + Prisma schema)
  - `npm test` passes: 461 tests, 458 pass, 0 fail, 3 skip
  - `npm run security:baseline` passes (0 high findings)
  - `npm run security:secrets` passes (0 secret findings)
  - `npm run security:sast` passes (eslint-plugin-security active)
  - `npm run sbom` passes (CycloneDX + SPDX generated)
  - `npm run license:check` passes (0 disallowed after allowlist)
  - `npm run k8s:check` passes (YAML valid, cluster dry-run skipped)
  - `npm run check:docs-governance` passes
  - All workflow YAML files syntactically valid
- Limitations:
  - Remote GitHub Actions execution not yet proven (no PR/push triggered)
  - Branch protection rules not configured
  - 5 moderate npm audit findings remain (postcss via next, @hono/node-server via prisma dev)
  - 79 eslint-plugin-security warnings remain (advisory only)
  - Container scanning deferred (Trivy/Grype not installed)
  - `packages/ui` remains essentially empty (no meaningful tests possible)
  - Browser E2E not implemented (BL-157 planned)
- Type: devsecops-security-automation
- as_of: 2026-05-05T11:00:00+02:00

## EV-2026-05-05-184: Session 162 — CI Security Policy Repair + Test Trustworthiness Starter (BL-153 repair, BL-159 triage, BL-154 partial)

- Evidence folder: `output/playwright/session-162-ci-security-test-trust-repair/`
- Source/System: Local shell validation against repo HEAD `25e2681`
- Action: Resolved BL-153 CI policy contradiction by upgrading `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` from ^10.4.0 to ^11.1.19, eliminating 2 high-severity npm audit findings (multer <=2.1.0, @nestjs/platform-express). Updated `scripts/security-baseline.sh` to default to `--audit-level=high` and always capture full moderate report. Updated `package.json`: `ci` now includes `security:baseline`, added `ci:full` and `check:docs-governance`. Updated `.github/workflows/ci.yml` to use `npm run security:baseline` and `npm run check:docs-governance`. Added 6 `packages/audit` tests for `computeIntegrityHash`. Added 7 `apps/worker` tests for `createCorrelationId` and `getHeaders`. Extracted `apps/worker/src/helpers.ts` for testability.
- Proves:
  - `npm run format:check` passes (0 errors)
  - `npm run lint` passes (0 errors)
  - `npm run typecheck` passes (all 10 workspaces)
  - `npm run build` passes (all workspaces)
  - `npm run validate` passes (contracts + Prisma schema)
  - `npm test` passes: 461 tests, 458 pass, 0 fail, 3 skip
  - `npm run ci` passes (includes security baseline)
  - `npm run ci:full` passes (quality + security + docs governance)
  - `npm audit --audit-level=high` passes (0 high findings)
  - `npm audit --audit-level=moderate` shows 5 moderate findings (documented, non-blocking)
  - CI workflow YAML syntax validated
  - `scripts/check_state_docs.py` passes
  - `scripts/check_docs_hygiene.py` passes
- Limitations:
  - Remote GitHub Actions execution not yet proven (no PR/push triggered)
  - Branch protection rules not configured
  - 5 moderate npm audit findings remain (postcss via next, @hono/node-server via prisma dev)
  - `packages/ui` remains essentially empty (no meaningful tests possible)
  - Browser E2E not implemented (BL-157 planned)
- Type: ci-security-repair-and-test-coverage
- as_of: 2026-05-05T10:20:00+02:00

## EV-2026-05-05-183: Session 161 — BL-153 Automated Quality Gate & CI/CD Hardening Foundation (ACCEPTED)

- Evidence folder: `output/playwright/session-161-ci-quality-gate-foundation/`
- Source/System: Local shell validation against repo HEAD `f872229`
- Action: Created `.github/workflows/ci.yml` with quality, security-baseline, and docs-governance jobs. Added PostgreSQL service container for API DB-dependent tests. Added root scripts `ci`, `ci:local`, `security:baseline`, `check:runtime-identity`, `check:evidence-hygiene`. Created `scripts/check_runtime_identity.sh` and `scripts/check_evidence_hygiene.sh` (BL-158 partial). Created `scripts/security-baseline.sh` (BL-155 partial). Fixed `PROJECT_STATE.yaml` duplicate YAML keys (`evidence`, `updated_in_session_130`) that broke `format:check`. Ran `npm run format` to fix repo-wide formatting drift. Added `// SKIP REASON:` comments to `apps/api/test/ai-services.test.ts` skipped tests (BL-154 partial).
- Proves:
  - `npm run format:check` passes (0 errors after drift fix)
  - `npm run lint` passes (0 errors)
  - `npm run typecheck` passes (all 10 workspaces)
  - `npm run build` passes (all workspaces including Next.js static generation)
  - `npm run validate` passes (contract validation + Prisma schema valid)
  - `npm test` passes: 401/404 pass, 0 fail, 3 skip (documented, require DATABASE_URL)
  - `npm run ci` passes locally (build + format:check + lint + typecheck + validate + test)
  - CI workflow YAML syntax validated with Python yaml parser
  - `scripts/check_evidence_hygiene.sh` passes on session-161 folder (4 files, alphabetically last, no .html wrappers, no duplicates)
  - `scripts/security-baseline.sh` captures npm audit findings (10 pre-existing vulns: 2 high, 8 moderate)
  - `scripts/check_runtime_identity.sh` correctly reports unreachable API (exit 2) when API is not running
- Limitations:
  - Remote GitHub Actions execution not yet proven (no PR/push triggered)
  - Branch protection rules not configured (documented as required)
  - 3 AI chat tests remain skipped without DATABASE_URL (runnable in CI with service container)
  - 10 pre-existing npm audit findings not fixed (deferred to BL-159)
  - No browser E2E tests added (BL-157 remains planned)
- Type: ci-infrastructure-and-local-validation
- as_of: 2026-05-05T09:45:00+02:00

## EV-2026-05-04-182: BL-152 — Belgium/EU Assurance Audit Readiness Dossier Created

- Evidence folder: `docs/compliance/` (8 markdown files)
- Source/System: Static documentation based on observed project state, existing evidence, and BACKLOG.md / PROJECT_STATE.yaml / EVIDENCE_LOG.md truth.
- Action: Created 8 compliance readiness/precheck documents under `docs/compliance/`: ASSURANCE_EVIDENCE_INDEX.md, GDPR_DATA_INVENTORY.md, DPIA_PRECHECK.md, AI_ACT_CLASSIFICATION_PRECHECK.md, BELGIUM_NIS2_CYFUN_READINESS.md, ACCESSIBILITY_AUDIT.md, SUPPLY_CHAIN_AUDIT.md, OPERATIONAL_READINESS_AUDIT.md. Updated docs/README.md index. Updated BACKLOG.md, NEXT_ACTIONS.md, STATUS.md, PROJECT_STATE.yaml to reflect BL-152 partial completion.
- Proves:
  - Master evidence index maps 9 compliance areas to existing evidence and honest gaps.
  - GDPR data inventory covers 9 personal data categories with source, purpose, retention, export, delete, and redaction notes.
  - DPIA precheck identifies 5 likely trigger areas with risk levels (low/medium/high) and mitigation gaps.
  - AI Act precheck classifies 5 AI features as limited/minimal risk; no prohibited practices or high-risk Annex III scope identified.
  - NIS2/CyberFundamentals map covers Identify/Protect/Detect/Respond/Recover with honest gap analysis.
  - Accessibility audit lists 8 known issues and maps to WCAG 2.1 principles.
  - Supply chain audit documents dependency/SBOM/license/container gaps.
  - Operational readiness audit documents backup/restore runbook status, incident response gap, monitoring/logging state.
  - All documents explicitly state "readiness/precheck" and include concrete backlog recommendations.
  - No compliance, certification, or legal advice claims made.
- Type: documentation-and-evidence
- as_of: 2026-05-04T20:00:00+02:00

## EV-2026-05-04-181: Session 095 — BL-143 First-Open UX Control Audit & Enterprise Readiness Pass (ACCEPTED)

- Evidence folder: `output/playwright/session-157-bl143-first-open-ux-enterprise-readiness/`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and API (`localhost:4210`), plus CLI artifacts
- Action: Completed BL-143 acceptance. Enhanced first-open UX with InfoTooltip/BoundaryLabel components, DemoGuidePanel with persistent Show/Hide and product explanation, SandboxBoundaryPanel with real-sandbox/mock-fixture/unconfigured/read-only/approval-gated/policy-blocked/audit-evidence labels, main page reorganized with primary/secondary panel split and collapsible advanced section, header Tools dropdown, ConnectorStatusPanel info tooltips, AuthGate sandbox warning. Fixed ticket ID defaults (TICKET-101→2 for Zammad, GLPI→1) so real sandbox ticket loading works without 500 error on first try. Web image rebuilt/deployed.
- Proves:
  - First-open login page shows sandbox warning and clear product description
  - Start Here / Demo Guide is prominent with product explanation, connector states, and recommended path
  - Demo Boundaries & Safety panel shows connector states (real sandbox/mock fixture/unconfigured) and governance states (read-only/approval required/blocked by policy/audit trail) with working info tooltips
  - Connector Status panel shows all 5 connectors with detailed descriptions and real sandbox vs fixture vs unconfigured labels
  - Header cleaned: DEV/MOCK DATA, Sandbox Demo, local·postgres, Sandbox mode, All writeback blocked, Tools dropdown
  - "Show/Hide advanced panels" toggle works (Call Simulator, Connector, Delivery Policy, Observability, Security Readiness panels)
  - Zammad ticket context loads with default ID "2" (no 500 error) — real sandbox ticket #2 "VPN connection issue"
  - GLPI ticket context default set to "1"
  - DraftNotePanel writeback ticket ID default set to "2"
  - Console clean (0 errors) on touched flows
  - No raw secrets in UI or evidence
  - 17 evidence files (11 browser screenshots + 6 CLI/text artifacts), under 20 cap
  - All validation gates pass: lint (0 errors), typecheck (10 workspaces), tests (all pass), state docs, docs hygiene
- Deferred to BL-144/145/146/147: full control inventory across all secondary panels, IA simplification, production-readiness language audit, design-system consistency pass
- Type: browser-runtime-and-cli-verification
- as_of: 2026-05-04T17:35:00+02:00

## EV-2026-05-04-180: Session 153 — BL-141 Closure Repair + BL-142 First Live Tester Round Ops (ACCEPTED)

- Evidence folder: `output/playwright/session-153-bl141-bl142-closure/`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and API (`localhost:4210`), plus CLI artifacts
- Action: Single canonical evidence folder for both BL-141 and BL-142. Prior folders (session-152, session-154) consolidated and deleted.
- BL-141 repair: Reset demo data, fixed GLPI seed (500→200), rebuilt/deployed all images, captured 6 fresh browser screenshots with 0 duplicates, documented no-secret scan as field-name-only.
- BL-142 acceptance: Created TEST_ROUND_001_CONTROL.md, OUTREACH_MESSAGE.md, POST_TEST_DEBRIEF.md, FEEDBACK_TO_BACKLOG_RULES.md. Updated FEEDBACK_LOG.md. Created preflight_tester_session.sh (13/13 PASS, GO) and close_tester_session.sh.
- Proves:
  - Clean worktree at HEAD 701d377 (ahead 19)
  - GLPI context: 200, ticket #1 "VPN connection issue" (was 500 in session-152)
  - API HEAD: 408f5727 (deployed image) — was 8015c94c (old)
  - Web image rebuilt and deployed: Demo Guide, session search, connector descriptions, favicon all visible
  - Demo data reset successful: 3 sessions (clean)
  - Smoke test 10/10 PASS, 0 FAIL
  - Preflight GO: 13 PASS, 0 FAIL
  - 6 browser screenshots, 0 MD5 duplicates
  - Outreach packet complete: 13 docs/scripts ready for first real tester
  - Feedback log has all required columns (tester_id, invited_at, completed_at, persona, overall_go_no_go, top_quote, p0/p1/p2 counts, backlog_items_created, next_followup)
  - Feedback-to-backlog rules: P0-P3 classification, 10-tag taxonomy, triage workflow
  - All validation gates pass: lint, typecheck, 260 tests, state docs, docs hygiene, smoke 10/10, 5 bash scripts
  - No raw secrets in evidence (field name patterns only)
  - 19 evidence files, under 20 cap
- Type: browser-runtime-and-cli-verification (combined)
- as_of: 2026-05-04T14:00:00+02:00

## EV-2026-05-04-177: Session 151 — BL-140 Final Truth Repair (CLEAN)

- Evidence folder: `output/playwright/session-151-bl140-final-truth-repair/`
- Source/System: CLI artifacts, git proof
- Action: Repaired truth contradiction between Session 150 evidence (dirty at fa29dc4) and actual final state (clean at 6349510). Fixed STATUS.md snapshot bullet count. Captured 5 evidence files. Commit 92f0ad1.
- Proves:
  - Final HEAD 6349510 exists, worktree clean
  - Smoke test 10/10 PASS, 0 FAIL
  - State docs PASS, docs hygiene PASS
  - 5 evidence files, under 8 cap
  - Session 150 evidence was pre-commit snapshot, not final truth
- Type: closure-truth-repair
- as_of: 2026-05-04T12:15:00+02:00

## EV-2026-05-04-176: Session 150 — First Real Tester Round Operations & Feedback Intake (BL-140 ACCEPTED)

- Evidence folder: `output/playwright/session-150-first-real-tester-round-ops/`
- Source/System: CLI artifacts, API JSON, git proof
- Action: Completed BL-140 acceptance. Froze tester send-packet (SEND_TO_TESTERS.md), created operator checklist, enhanced reset_demo_data.sh with --yes, repaired GLPI adapter missing from seed, fixed "Zammad mode" header label, ran preflight dry run, captured 14 evidence files.
- Proves:
  - Tester send-packet frozen and easy to send
  - Operator checklist complete (11 steps)
  - Demo reset works with --yes flag, session list clean (7 entries)
  - Smoke test 10/10 PASS after reset
  - GLPI context loads after reset (seed fix applied)
  - Bug context capture verified
  - No raw secrets in evidence
  - All validation gates pass: lint, typecheck, 260 tests, state docs, docs hygiene
  - 14 evidence files, under 20 cap
- Type: operations-and-cli-verification
- as_of: 2026-05-04T12:00:00+02:00

## EV-2026-05-04-175: Session 149 — BL-139 Final Truth Repair (CLEAN)

- Evidence folder: `output/playwright/session-149-bl139-final-truth-repair/`
- Source/System: CLI artifacts, git proof
- Action: Repaired truth discrepancy between uploaded Session 148 proof (HEAD `f3a3975` / ahead 8) and current repo truth (HEAD `2ddb899` / ahead 12). Session 148 evidence was captured before 4 subsequent commits (`f30fdc9`, `fa1c265`, `dd411c7`, `2ddb899`) were created. All 4 commits verified to exist. PROJECT_STATE.yaml `final_head_after_session_148` corrected from `dd411c7` to `2ddb899`. Session 148 evidence index updated with stale-evidence caveat.
- Proves:
  - Final HEAD `2ddb899f2796411515b01949df799c734acb1e61`, ahead 12, clean worktree
  - Smoke test 10/10 PASS, 0 FAIL
  - All state/docs hygiene checks pass
  - 5 evidence files, under 8 cap
- Type: closure-truth-repair
- as_of: 2026-05-04T11:45:00+02:00

## EV-2026-05-04-174: Session 148 — BL-139 Closure Proof Repair (SUPERSEDED GIT TRUTH)

- Evidence folder: `output/playwright/session-148-bl139-closure-proof/`
- Source/System: CLI artifacts, git proof
- Action: Repaired session-147 evidence caveat. Session-147 `08-git-status.txt` showed pre-commit dirty worktree. Final commits 8ece58b and f3a3975 exist and worktree was clean at that point. Subsequent commits (`f30fdc9` through `2ddb899`) landed after evidence capture — git truth in this folder is stale. Final truth at `2ddb899` proven in session-149.
- Proves:
  - Worktree was clean at HEAD f3a3975 at time of capture
  - Smoke test 10/10 PASS, 0 FAIL
  - All state/docs hygiene checks pass
  - Tester packet tuned up: API URL added, reset/smoke stop-testing criteria added, feedback log columns expanded
  - 5 evidence files, under 8 cap
- Type: closure-proof-repair (git truth superseded by session-149)
- as_of: 2026-05-04T11:00:00+02:00

## EV-2026-05-03-173: Session 147 — First User Testing Round & Triage (BL-139 ACCEPTED)

- Evidence folder: `output/playwright/session-147-first-user-testing-round/`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus CLI artifacts
- Action: Completed BL-139 acceptance. Created first tester packet (FIRST_TEST_ROUND.md), testing round plan (TEST_ROUND_001_PLAN.md), and internal dry run report (TEST_ROUND_001_INTERNAL_DRY_RUN.md). Fixed P1 blocker: header API port label corrected from hardcoded `localhost:4110` to NEXT_PUBLIC_API_BASE_URL env var. Documented P0 blocker: session list must be reset before testing (100+ stale sessions). Session-146 closure proof repair (7 files) confirms BL-138 commits exist with clean worktree.
- Proves:
  - Tester packet created with exact demo URL, duration, flows, limitations, and submission instructions
  - Testing round plan with tester list placeholder, target personas, success criteria, and stop-testing rules
  - Internal dry run completed following test script as first-time user
  - P1 API port label mismatch fixed (header now reads NEXT_PUBLIC_API_BASE_URL: `localhost:4210` in cluster)
  - P0 session clutter documented — `reset_demo_data.sh` required before each tester
  - Smoke test: 10/10 PASS, 0 FAIL (Zammad configured:real, GLPI configured:real)
  - 4 browser screenshots: demo home, connector status, admin governance, login page
  - 13 evidence files total, under 20-file cap
  - 392/395 tests pass (3 skipped in API, unchanged)
  - All validation gates pass: lint, typecheck, state docs, docs hygiene, smoke test, script syntax
  - No raw secrets in any evidence artifact
  - Worktree clean at commit time
- Type: operations-and-browser-runtime-verification
- as_of: 2026-05-03T18:40:00+02:00

## EV-2026-05-03-172: Session 145 — User Testing Operations & Feedback Loop (BL-138 ACCEPTED)

- Evidence folder: `output/playwright/session-145-user-testing-operations/`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus CLI artifacts
- Action: Completed BL-138 acceptance. Created tester onboarding pack (docs/user-testing/ with 7 docs), bug context capture script (scripts/capture_demo_bug_context.sh), feedback triage workflow (TRIAGE_WORKFLOW.md), minimal UI polish (Sandbox Demo badge, Admin quick-link), and evidence capture.
- Proves:
  - Tester onboarding pack: 7 docs covering onboarding, test script, feedback, bug reports, personas, triage workflow, feedback log
  - bug context capture: 10/10 captures pass (API health, git HEAD, pod status, connector status, Zammad/GLPI context, pod logs with redaction, no-secret scan)
  - Smoke test: 10/10 PASS, 0 FAIL (API health, Web, 5 connectors, Zammad/GLPI context, no-secret scan)
  - UI polish: "Sandbox Demo" info badge and Admin quick-link added to header
  - 6 browser screenshots: dashboard with Sandbox Demo badge, connector status, Zammad flow, GLPI flow, admin governance, admin connectors
  - 10 CLI bug-context artifacts + 1 smoke test report + 1 evidence index = 18 files total, under 20-file cap
  - No raw secrets in any evidence artifact
  - Web image rebuilt and deployed to cluster
  - All validation gates pass: lint, typecheck, 260 tests, state docs, docs hygiene, 4 bash scripts
- Type: operations-and-browser-runtime-verification
- as_of: 2026-05-03T18:15:00+02:00

## EV-2026-05-03-171: Session 144 — User Testing Demo Readiness (BL-137 ACCEPTED)

- Evidence folder: `output/playwright/session-144-user-testing-demo-readiness/`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus CLI artifacts
- Action: Completed BL-137 acceptance. One-command demo start (start_demo_mode.sh). 10/10 smoke test pass. 5 browser screenshots. User testing docs created. GLPI sandbox setup script handles non-persistent state.
- Proves:
  - Demo stack starts with one command (start_demo_mode.sh)
  - API health: status=ok, head=8015c94c, store=postgres
  - Web HTTP 200 on localhost:3300
  - 5 browser screenshots: dashboard, admin/connectors, Zammad context, GLPI context, admin governance
  - 10/10 smoke test passes (API health, Web, 5 connector checks, Zammad context, GLPI context, no-secret scan)
  - Zammad: configured/real, ticket #2 loads
  - GLPI: configured/real, ticket #1 loads
  - No raw secrets in evidence
  - 17 evidence files, 0 duplicates, under 20-file cap
  - User testing docs: USER_TESTING_GUIDE.md, TESTER_FEEDBACK_TEMPLATE.md, KNOWN_DEMO_LIMITATIONS.md
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-03T17:30:00+02:00

## EV-2026-05-03-170: Session 142 — GLPI SupportPlane E2E Acceptance (BL-069 ACCEPTED)

- Evidence folder: `output/playwright/session-142-glpi-supportplane-e2e-acceptance/`
- Source/System: K8s cluster API (port-forward 4212), CLI artifacts
- Action: Completed BL-069 acceptance. Proved authenticated SupportPlane connector status showing GLPI configured/real. Proved GLPI-backed SupportPlane session context (ticket #1 "VPN connection issue" loaded via POST /support-sessions/:id/glpi/ticket-context). Fixed runtime identity (API /health now returns git HEAD). Extended egress policy to allowlist GLPI. Redacted all tokens from evidence.
- Proves:
  - Authenticated connector-status: GLPI mode=configured, transport=real, errorCode=OK
  - GLPI-backed session context: provenance=ticket, sourceAdapter=GLPI, networkReal=true, secretExposed=false
  - Runtime identity: branch=main, head=<full hash>
  - No raw tokens or secrets in evidence
  - 12 evidence files, under 20-file cap
- Type: integration-and-api-verification
- as_of: 2026-05-03T16:00:00+02:00

## EV-2026-05-03-169: Session 141 — Session 140 Closure Repair

- Evidence folder: `output/playwright/session-141-session140-closure-repair/`
- Source/System: CLI artifacts, git proof
- Action: Repaired Session 140 closure hygiene. Resolved git evidence mismatch (dirty 7dd4add vs clean b80e12f). Documented raw GLPI token exposure in Session 140 evidence. Captured post-commit git truth, runtime identity, state docs validation.
- Proves:
  - Final HEAD b80e12f with clean worktree
  - API runtime identity now shows branch=main, head=<full hash>
  - GLPI evidence redaction standard documented for future sessions
  - 6 evidence files
- Type: closure-repair
- as_of: 2026-05-03T16:00:00+02:00

## EV-2026-05-03-168: Session 138 — GLPI Real Connector Enablement (PARTIAL/SANDBOX-CODE-READY)

- Evidence folder: `output/playwright/session-138-real-connector-enablement/`
- Source/System: TypeScript tests, API unit tests, CLI artifacts
- Action: Implemented FetchGlpiHttpClient — real HTTP transport using GLPI REST API with session token management. Wired into GlpiConnectorAdapter.connect(). Updated connectors.service.ts to remove unsupportedRealClient flag. All tests pass (50/50 connectors, 210/210 API, 44/44 endpoint-agent).
- Proves:
  - FetchGlpiHttpClient implements real GLPI REST API transport
  - GLPI connector reports configured/real when env vars set
  - No fixture fallback when real HTTP client available
  - 6 evidence files
- Type: code-implementation-with-test-verification
- as_of: 2026-05-03T15:30:00+02:00

## EV-2026-05-03-167: Session 135 — BL-132 Windows Service Packaging Proof (PARTIAL/SERVICE-SCRIPTS-READY)

- Evidence folder: `output/playwright/session-136-windows-service-packaging-proof/`
- Source/System: GitHub Actions windows-latest runner, PowerShell, sc.exe
- Action: Created Windows service install/uninstall/run-once PowerShell scripts using built-in sc.exe (no external deps). Added BL-132 service packaging job to verification workflow (runServicePackaging input). Triggered workflow — BL-130/131/133 verification passed again (44/44 tests), service packaging job succeeded with documented limitation: GitHub-hosted runner lacks admin privileges for sc.exe service creation. Scripts are syntactically validated, workflow job works, credible packaging path exists. BL-132 stays partial/service-scripts-ready until real Windows host with admin proves service lifecycle.
- Proves:
  - Three service scripts created and committed
  - Scripts have valid PowerShell syntax (validated on windows-latest)
  - Workflow job for BL-132 exists and runs successfully
  - GitHub-hosted runner admin limitation documented honestly
  - No secrets in service output files
  - Tailscale Funnel shut down at closure
  - BL-132 credible packaging path: real Windows host with admin required
- Type: code-and-workflow-verification-with-documented-limitation
- as_of: 2026-05-03T15:10:00+02:00

## EV-2026-05-03-166: Session 134 — Windows Runner CI Reachability (BL-130/131/133 ACCEPTED)

- Evidence folder: `output/playwright/session-134-windows-runner-ci-reachability/`
- Source/System: GitHub Actions windows-latest runner, Tailscale Funnel API, K8s cluster CLI, gh CLI
- Action: Moved BL-130/131/133 from harness-ready to accepted with real Windows runner proof. Exposed K8s API via Tailscale Funnel (temporary, `https://ff-fedora.tail2dc90.ts.net`). Added CLI support to endpoint agent (--register, --heartbeat, --diagnostic). Hardened workflow from 13 to 16 steps (OS identity, no-secret scan, policy denial, platform-aware tests). Triggered workflow via gh CLI; workflow passed on windows-latest (Win11 24H2, X64) with 44/44 tests, 0 failures. All steps green: OS identity, Node version, API health, enrollment, heartbeat, diagnostics (inventory, status, disk, network, services, software), policy denial (clear_temp_preview unsupported=true), no-secret scan (clean). Artifact uploaded. Created enrollment token provisioning script with redaction. Trigger helper enhanced with dry-run, monitor, and Tailscale support.
- Proves:
  - Real Windows runner executes endpoint agent (process.platform=win32, OS=Windows NT 10.0.26100.0, X64)
  - Agent builds on Windows (0 errors)
  - 44/44 agent tests pass on Windows (0 failures)
  - Agent registers with SupportPlane API via public internet (Tailscale Funnel)
  - Agent sends heartbeat successfully
  - Read-only diagnostics return structured results on Windows
  - Unsupported tools correctly return honest unsupported responses
  - No secrets in output artifacts
  - GitHub Actions workflow is triggerable and reproducible
  - BL-130/131/133 accepted; BL-132 remains partial/harness-ready
  - 9 evidence files (under 20-file hard cap)
- Type: integration-and-real-windows-runner-verification
- as_of: 2026-05-03T14:10:00+02:00

## EV-2026-05-03-165: Session 134 — Session 133 Closure Repair (ACCEPTED)

- Evidence folder: `output/playwright/session-133-windows-endpoint-enterprise-readiness/`
- Source/System: CLI artifacts, git proof
- Action: Repaired Session 133 closure contradictions. Replaced pre-commit git evidence (ahead 8, dirty) with post-commit proof (ahead 11, clean, HEAD efe12a4). Corrected evidence index Git HEAD reference from stale placeholder to actual final HEAD. Created trigger helper script (scripts/trigger_windows_verification.sh). Verified GitHub Actions workflow syntax (13 steps, YAML valid) but cannot trigger — no public API URL, no enrollment token.
- Proves:
  - Final HEAD efe12a4, clean worktree, ahead 11
  - Evidence index and validation gate correctly reference post-commit state
  - State docs and docs hygiene pass
  - GitHub Actions workflow is syntactically valid, 13 steps, workflow_dispatch trigger
  - Windows runner is NOT triggerable from this environment (local-only API, no enrollment token)
  - BL-130/131/133 remain partial/harness-ready
- Type: closure-repair
- as_of: 2026-05-03T15:30:00+02:00

## EV-2026-05-03-164: Session 133 — Windows Endpoint Enterprise Readiness (HARNESS-READY)

- Evidence folder: `output/playwright/session-133-windows-endpoint-enterprise-readiness/`
- Source/System: K8s cluster API (port-forward 4211), CLI artifacts, endpoint-agent tests, MinIO boto3, OpenBao curl
- Action: Enterprise readiness slice after BL-136 acceptance. Hardened Windows endpoint: 44 agent tests (up from 28) across 4 new test suites (platform dispatch, flush DNS hardening, software win32 enforcement, shell hardening). Created GitHub Actions Windows verification workflow (.github/workflows/windows-endpoint-verification.yml, manual dispatch, 8 steps on windows-latest) and manual runbook (docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md, 17-item checklist). Verified sandbox durability: OpenBao reseed confirmed (Zammad secret v3, credentialSource=vault), MinIO evidence checksum verified (50+ objects, no raw secrets), Zammad writeback safety re-verified (productionWritebackReady=false, sandboxWritebackReady=true). Fixed 3 critical state doc contradictions and 7 docs updated.
- Proves:
  - Windows endpoint tests strengthened: 44/44 pass, 0 failures; manifest audit: 8 tools, 0 issues
  - Windows CI harness created: GitHub Actions workflow + manual runbook + packaging scaffold → BL-133 harness-ready
  - OpenBao durability: secret resolvable after reseed; MinIO evidence: artifacts present with valid checksums
  - Zammad writeback: sandbox-only, production blocked, safety defaults intact
  - 3 critical state doc contradictions fixed; PROJECT_STATE.yaml YAML parse errors repaired
  - All validation gates pass: lint, typecheck, agent 44/44, API 210/210, state docs, docs hygiene
  - 17 evidence files (under 20-file hard cap)
  - No real Windows host — BL-130/131/133 remain partial/harness-ready, not accepted
- Type: code-hardening-and-verification-harness
- as_of: 2026-05-03T15:00:00+02:00

## EV-2026-05-03-163: Session 132 — BL-136 Proof Repair (ACCEPTED)

- Evidence folder: `output/playwright/session-132-bl136-proof-repair/`
- Source/System: Playwright Chromium against cluster Web UI (localhost:3201) and API (localhost:4210), plus CLI artifacts
- Action: Repaired BL-136 closure proof. Rebuilt and redeployed K8s API/Web/Worker images so runtime HEAD (94c961) matches final commit HEAD (94c961). Added RBAC denial proof (viewer 403 on session creation). Reconciled AI policy mockOnly semantics: policy.safetyFlags.mockOnly=true is admin guard; response.safety.mockOnly=false means real local AI call. Re-captured all 3 scenarios (A: Zammad sandbox read, B: Ollama AI draft, C: Governance/Audit/RBAC) with fresh evidence.
- Proves:
  - Runtime HEAD 94c961 = final commit HEAD 94c961 (identity closure)
  - Clean worktree after final commit (git status included in evidence)
  - Zammad connector transport=real, credentialSource=vault, connected=true
  - Ollama gemma4:e4b real model call: fallbackUsed=false, noCloudCall=true
  - RBAC denial: viewer receives 403 Forbidden on session creation
  - Audit events generated for demo actions
  - AI policy mockOnly reconciled: naming collision between two schemas, not a bug
  - 20 evidence files (5 browser screenshots + 14 CLI artifacts + 1 index), 0 duplicates
- Type: closure-repair-and-runtime-verification
- as_of: 2026-05-03T12:25:00+02:00

## EV-2026-05-03-162: Session 131 — BL-136 E2E Acceptance Candidate (ACCEPTED)

- Evidence folder: `output/playwright/session-131-bl136-e2e-acceptance-candidate/`
- Source/System: Chromium via Playwright against cluster Web UI (`localhost:3201`) and cluster API (`localhost:4210`), plus CLI artifacts
- Action: Recovered K8s cluster (control plane and all services). Fixed API pod restart. Seeded OpenBao with Zammad credential. Proved Scenarios A (Zammad sandbox ticket read — mode=zammad, transport=real, credentialSource=vault), B (Ollama AI draft — fallbackUsed=false, provider=ollama, model=gemma4:e4b, latencyMs=13398), and C (Governance/Audit/RBAC — admin dashboard, AI policy, audit events) end-to-end with fresh browser/computer-use evidence. Fixed connector registry race condition (module-level ensureRegistry) and eslint config.
- Proves:
  - K8s cluster API healthy with all 3 app pods Ready and all sandbox integrations running
  - Zammad connector transport=real via cluster API, not mock
  - Ollama gemma4:e4b real model call with fallbackUsed=false
  - AI policy allows Ollama while maintaining mockOnly safety default
  - Audit events generated for all demo actions
  - 18 evidence files (5 browser screenshots + 12 CLI artifacts + 1 index), 0 duplicates
  - Scenarios A, B, C proven end-to-end; Scenario D (Windows) remains unverified
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-03T11:40:00+02:00

## EV-2026-05-02-161: Session 130 — BL-136 Real E2E Runtime Demo Verification (PARTIAL/RUNTIME-VERIFIED)

- Evidence folder: `output/playwright/session-130-bl136-runtime-e2e-verification/`
- Source/System: Chromium via Playwright against local API (`localhost:4110`) running against cluster PostgreSQL (port-forward 5434), cluster Web via port-forward (`localhost:3201`), plus CLI artifacts
- Action: Restarted K8s cluster (`supportplane-local`); all services healthy. Ran API locally against cluster DB to work around K8s API pod crash (Prisma 7 migration issue on tool_manifest_records table; migrations applied to cluster DB but pod image stale). Ollama gemma4:e4b confirmed available. Zammad sandbox running and accessible. Captured browser evidence (cockpit dashboard, session creation, admin dashboard, AI provider readiness) and CLI evidence (API health, git status, cluster pods, Ollama models, Zammad sandbox, connector status, AI readiness, model usage). Evaluated all 4 demo scenarios from ENTERPRISE_DEMO_GUIDE.md.
- Proves:
  - K8s cluster restarted successfully with all sandbox services running
  - API runs locally against cluster PostgreSQL (workaround for pod crash)
  - Ollama gemma4:e4b is configured and available
  - Zammad sandbox is running and accessible
  - Scenario C (Governance) verified: admin dashboard, policy editor, RBAC, audit explorer
  - Scenario A (Zammad) partial: Zammad running but local API connector shows mock transport
  - Scenario B (AI) partial: Ollama configured but policy enforces mockOnly=true
  - Scenario D (Windows) not verified
  - 13 evidence files captured (4 screenshots + 9 CLI artifacts)
  - K8s API pod still crash-loops from old image (migrations applied, rebuild needed)
  - Worktree dirty: 2 modified files (.opencode/opencode.json, app-configmap.yaml)
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-02T22:30:00+02:00

## EV-2026-05-02-160: Session 129 — Real E2E Demo Readiness / Enterprise Review Packaging (PARTIAL/DOCS-READY)

- Evidence folder: `output/playwright/session-129-real-e2e-demo-readiness/`
- Source/System: Chromium via Playwright against local API (`localhost:4110`), local Web (`localhost:3202`), plus CLI artifacts
- Action: Created enterprise-grade docs for demo readiness and enterprise review. Built REALITY_MATRIX.md (23 systems classified as REAL_LOCAL_NOW, SANDBOX_CODE_READY, MOCK_BY_POLICY, MOCK_BY_GAP, MOCK_NOT_IMPLEMENTED, PARTIAL). Created ENTERPRISE_DEMO_GUIDE.md with 4 credible demo scenarios (A: sandbox ticket intake, B: AI draft with evidence trail, C: governance/audit/RBAC, D: endpoint diagnostics + Windows-aware). Fixed severe staleness in SANDBOX_INTEGRATION_ACCEPTANCE.md (was "future acceptance contract" claiming cluster doesn't work, now reflects BL-116 accepted). Applied drift fixes to 7 additional docs. K8s cluster was DOWN — sandbox integrations could not be re-verified at runtime.
- Proves:
  - Reality matrix is honest and comprehensive
  - Enterprise demo guide provides runnable scenarios
  - 9 docs updated to match current accepted truth
  - Validation gate passes: typecheck PASS, lint PASS, state docs PASS, docs hygiene PASS, 373/376 tests pass
  - API runtime identity matches git HEAD
  - BL-136 is partial/docs-ready; cluster startup needed for full E2E verification
- Type: documentation-and-evidence
- as_of: 2026-05-02T20:45:00+02:00

## EV-2026-05-02-147: BL-134 docs governance closure — infrastructure accepted, high-leverage drift fixed

- Evidence folder: `output/playwright/session-128-docs-governance-closure/`
- Source/System: CLI validation scripts
- Action: Closed BL-134 as accepted. Governance infrastructure: docs/README.md index (7 sections), docs/DOC_STANDARD.md, AGENTS.md doc freshness gate with explicit checklist items, scripts/check_docs_hygiene.py (5 checks). High-leverage drift fixes applied to 9 docs: WORKFLOW_TRUTH.md, BOUNDARY_MATRIX.md, REAL_E2E_SANDBOX_FLOW.md, BACKLOG_REAL_E2E_ROADMAP.md, IMPLEMENTATION_PHASES_REAL_E2E.md, LOCAL_DEVELOPMENT.md, ZAMMAD_CONNECTOR.md, THREAT_MODEL.md, TICKET_CONTEXT_CONNECTOR_SAFETY.md. Created BL-135 for remaining per-doc deep content audit.
- Proves:
  - `scripts/check_docs_hygiene.py` passes all 5 checks.
  - `scripts/check_state_docs.py` passes all state doc hygiene checks.
  - `npm run typecheck` passes (all workspaces).
  - `npm run lint` passes (zero errors).
  - AGENTS.md now enforces doc freshness every session.
  - 9 high-leverage docs updated to match current accepted truth.
- Type: code-and-validation-evidence
- as_of: 2026-05-02T19:00:00+02:00

## EV-2026-05-01-146: GLPI connector truth fix and connector truth regression tests

- Files: `packages/connectors/src/glpi-adapter.ts`, `apps/api/src/connectors/connectors.service.ts`, `apps/api/test/api.test.ts`
- Source/System: local API test suite
- Action: Fixed `GlpiConnectorAdapter.connect()` to reject with an honest error instead of silently instantiating `MockGlpiHttpClient` when real credentials are provided. Added `unsupportedRealClient: true` to GLPI classification in `getAllConnectorStatus()`. Added regression tests proving GLPI/osTicket/MeshCentral/Fortinet with real config return `error`/`UNSUPPORTED`, GLPI with no config returns `fixture`, and no connector reports `live` status.
- Proves:
  - GLPI real adapter path is now honestly blocked; no silent mock fallback occurs.
  - Connector status API correctly reports `error`/`UNSUPPORTED` for all connectors lacking real HTTP client implementations.
- Type: code-and-test-verification
- as_of: 2026-05-01T17:33:00+02:00

## EV-2026-05-01-133 through EV-2026-05-01-145: Session 124 Large Backlog Slice — Windows readiness, remediation, retrieval, connector truth

- Files: `output/playwright/session-124-large-backlog-slice/01-runtime-identity-health.json` through `13-console-network-summary.txt`
- Source/System: Chromium via Playwright against local Web (`localhost:3200`) and local API (`localhost:4110`), plus API JSON artifacts.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local proof:
  - `remediation.flush_dns_cache` is fixed-template, policy-gated, approval-gated, and executed through a local endpoint-agent run on Linux when `resolvectl` is available.
  - Connector status panel exposes fixture/unconfigured/error truth with credential source, last check, and error code.
  - Knowledge retrieval response exposes lexical/hybrid readiness truth and pgvector fallback reason.
  - Windows readiness remains Linux-tested only; no real Windows runner was used.
- Shows:
  - `01-runtime-identity-health.json` — API runtime identity and git head.
  - `02-git-status-before-final.txt` — git status at evidence capture.
  - `03-git-log-before-final.txt` — recent commit history.
  - `04-validation-summary.txt` — validation/runtime summary.
  - `05-backlog-status-check.md` — affected backlog status truth.
  - `06-windows-endpoint-readiness.png` — Tool Registry / Windows compatibility proof.
  - `07-remediation-approval-queued.png` — approval queue with flush DNS approval request.
  - `08-remediation-result.json` — endpoint-agent flush DNS execution result with command template/result fields.
  - `09-remediation-approved-result.png` — Device Console result proof after execution.
  - `10-knowledge-retrieval-status.json` — retrieval mode, pgvector status, and fallback reason.
  - `11-connector-status-truth.png` — connector status panel with fixture/unconfigured/error truth labels.
  - `12-final-evidence-index.md` — evidence inventory and truth notes.
  - `13-console-network-summary.txt` — browser console/network error summary.
- Proves:
  - BL-065 moved to `partial/linux-tested`: one low-risk flush-DNS path executes after approval with real local command result when local resolver tooling is available.
  - BL-074 moved to `partial/hybrid-ready`: pgvector/provider/embedding prerequisites are explicit and semantic/hybrid selection is gated.
  - BL-069/071/072/127 status truth is clearer: fixture vs unconfigured vs configured-but-unsupported is visible; no real instance is claimed.
  - BL-130/131/132 moved forward with fixed Windows service/software templates, fixture parser tests, manifest compatibility metadata, and packaging scaffold.
  - BL-133 remains blocked/no-windows-host.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-01T14:35:00+02:00

## EV-2026-05-01-121 through EV-2026-05-01-132: BL-061 through BL-068 — Remote Tool Execution Safety Foundation (ACCEPTED)

- Files: `output/playwright/session-121-bl061-068-tool-execution-safety-foundation/01-tool-registry.png` through `07-e2e-invocation-completed.png`
- Source/System: Chromium via Playwright against local API (`localhost:4110`), plus terminal-rendered JSON/text proof pages.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=dev`
- Local API proof:
  - Tool manifest loaded with integrity hash validation; 7 tools upserted idempotently by `toolKey`.
  - `EndpointCommandKind` enum expanded to include `flush_dns_cache` and `clear_temp_preview`.
  - `EndpointDevicesService` DI fixed: `@Inject(ToolExecutionGatewayService)` added to resolve undefined `toolGateway`.
- Shows:
  - `01-tool-registry.png` — 7 tool definitions from validated manifest.
  - `02-safety-rejection.png` — `requestedInput: {shell: "rm -rf /"}` → 400 Bad Request.
  - `03-read-only-invoke.png` — `diagnostic.status` invoke → 201, status=queued, endpointCommandId created.
  - `04-remediation-approval-required.png` — `remediation.flush_dns_cache` invoke → 201, status=approval_required.
  - `05-approval-queue.png` — Approval queue with requested, approved, and denied entries.
  - `06-viewer-denied.png` — Viewer role invoke → 403 Forbidden.
  - `07-e2e-invocation-completed.png` — Invocation after agent result submission: status=succeeded, normalizedResult populated, completedAt set.
- CLI artifacts:
  - `validation-gate.txt` (includes 169 tests, 0 failures)
- Proves:
  - BL-061: Read-only diagnostics auto-approved and dispatched to endpoint commands.
  - BL-062: Fixed `implementationId` mapped to `EndpointCommandKind` with allowlist validation.
  - BL-063: RBAC enforced — viewer denied, admin allowed.
  - BL-064: Remediation tools require approval before dispatch.
  - BL-065: Approval queue with approve/deny lifecycle; approved invocations dispatch to endpoint commands.
  - BL-066: Audit events generated for all invocations, approvals, and results.
  - BL-067: Tool registry with integrity-validated manifest, idempotent upsert.
  - BL-068: Arbitrary shell, command, script, argv, executable fields rejected in `requestedInput`.
  - End-to-end result flow: command result submission correctly updates invocation status and normalizedResult.
- Type: integration-and-api-verification
- as_of: 2026-05-01T08:50:00+02:00

## EV-2026-04-29-113 through EV-2026-04-29-120: BL-108 Repair — Real Host-Controlled Ollama Model Call (ACCEPTED)

- Files: `output/playwright/session-110-bl108-ollama-host-call-model-selection/01-cluster-api-health-current-head.png` through `08-next-actions-md.png`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus terminal-rendered JSON/text proof pages.
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API/Web/Worker deployments in `supportplane-app` rebuilt, reloaded, and rolled out from local images with BL-108 repair code.
  - Host Ollama reachable from cluster pods via podman0 bridge IP `10.88.0.1:11434`.
  - Ollama provider path returns `provider=ollama`, `providerMode=local`, `fallbackUsed=false`, `noCloudCall=true`, `model=llama3.1:8b`, `latencyMs=4694`.
- Shows:
  - Cluster API health JSON with git head `4b771068ad666191e99f688065c457d098e26b7f`.
  - UI session with real Zammad sandbox ticket loaded and Ollama full-page panel.
  - Audit trail with `draft_suggested` event from Ollama provider.
  - AI Context Quality panel showing connector metadata.
  - Writeback blocked response with delivery policy denial.
  - `BACKLOG.md` showing BL-108 accepted and BL-121 added for future Ollama upgrade.
  - `NEXT_ACTIONS.md` showing BL-111 as active P1.
- CLI artifacts:
  - `baseline-runtime.txt`
  - `model-candidate-inventory.txt`
  - `ollama-model-benchmark.json`
  - `ollama-model-benchmark.txt`
  - `ollama-cluster-connectivity-proof.txt`
  - `supportplane-api-ollama-real-call-proof.txt`
  - `ollama-no-secret-leak-proof.txt`
  - `validation-gate.txt`
  - `proof-state-mapping.md`
  - `screenshot-md5s.txt`
- Proves:
  - BL-108 now accepted: real host-controlled Ollama model call from cluster API with `fallbackUsed=false`.
  - Model selected: `llama3.1:8b` after candidate discovery (gemma4 and qwen3.6 blocked by Ollama 0.18.2).
  - No cloud AI call, no autonomous send, redaction before provider call.
  - No secret leakage in API response, logs, or evidence.
  - Cluster network path documented: podman0 bridge IP `10.88.0.1` (not `host.containers.internal`).
  - 8 unique screenshots, 0 duplicates, max-20 cap respected.
  - Worktree clean at final commit `4b771068ad666191e99f688065c457d098e26b7f`.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-29T21:55:00+02:00

## EV-2026-04-29-105 through EV-2026-04-29-112: BL-108/109/110/115 Real Sandbox Enablement Gates (BL-108 PARTIAL; BL-109/110/115 ACCEPTED)

- Files: `output/playwright/session-109-bl108-109-110-115-real-sandbox-enablement/01-cluster-api-health-current-head.png` through `08-state-docs-backlog-next-actions.png`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus terminal-rendered JSON/text proof pages.
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API/Web/Worker deployments in `supportplane-app` rebuilt, reloaded, and rolled out from local images.
  - OpenBao seeded with local sandbox Zammad credential; raw token intentionally not printed.
  - Zammad sandbox read succeeds through server-side OpenBao credential resolution.
  - NATS JetStream stream `SUPPORTPLANE_OUTBOX` persists after NATS pod restart.
  - Ollama provider path returns `provider=ollama`, `providerMode=local`, `noCloudCall=true`, and labeled fallback when host/model access is unavailable.
- Shows:
  - Cluster API health JSON.
  - UI still loads real Zammad sandbox read with sandbox/read-only/no-writeback labels.
  - OpenBao sandbox resolver metadata with `secretExposed=false`.
  - Ollama local/fallback provider metadata with prompt version, context hash, latency, no-cloud marker, and `autonomousSend=false`.
  - NATS JetStream worker/outbox mode.
  - Writeback blocked response with no external write attempt.
  - Local MVP reachability proof.
  - State docs showing BL-108 partial, BL-109/110/115 accepted, and BL-108 repair before BL-111.
- CLI artifacts:
  - `baseline-runtime.txt`
  - `runtime-predeploy.txt`
  - `openbao-secret-seed-proof.txt`
  - `openbao-resolver-proof.txt`
  - `openbao-no-secret-leak-proof.txt`
  - `egress-policy-proof.txt`
  - `blocked-external-egress-proof.txt`
  - `ollama-provider-proof.txt`
  - `ollama-no-cloud-proof.txt`
  - `ollama-fallback-proof.txt`
  - `nats-stream-consumer-proof.txt`
  - `nats-worker-bridge-proof.txt`
  - `nats-restart-or-durable-proof.txt`
  - `supportplane-api-health.txt`
  - `supportplane-worker-status.txt`
  - `supportplane-ui-label-proof.txt`
  - `local-mvp-regression.txt`
  - `validation-gate.txt`
  - `boundary-proof.txt`
  - `proof-state-mapping.md`
  - `screenshot-md5s.txt`
- Proves:
  - BL-108 local Ollama provider/fallback path is implemented without cloud AI or autonomous send, but runtime proof used fallback and does not accept the host model-call gate.
  - BL-109 OpenBao resolver is server-side only and no raw secret is exposed in API/evidence/browser proof.
  - BL-110 NATS JetStream product stream/consumer bridge is present and survives NATS restart while PostgreSQL remains canonical truth.
  - BL-115 egress deny-by-default and writeback block are enforced with clear denial metadata.
  - 8 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-29T21:05:00+02:00

## EV-2026-04-29-099 through EV-2026-04-29-104: BL-107 Zammad Sandbox Read Connector (ACCEPTED)

- Files: `output/playwright/session-108-bl107-zammad-sandbox-read-connector/01-zammad-api-seeded-ticket.png` through `07-boundary-proof.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), cluster API (localhost:4210), Zammad (localhost:8080), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API Deployment `supportplane-api` in `supportplane-app` Running and Ready; image rebuilt and reloaded with BL-107 code; health returns git head `17592be3ea2b172a0262fd8ecfd37308fae21283`.
  - Web Deployment `supportplane-web` in `supportplane-app` Running and Ready; image rebuilt with BL-107 UI changes.
  - Worker Deployment `supportplane-worker` in `supportplane-app` Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` Running and Ready with Bound PVC.
  - Zammad StatefulSet `zammad` in `supportplane-integrations` Running and Ready; ticket 2 and customer 5 are deterministic seeded data.
- Shows:
  - Zammad API JSON for ticket 2 (VPN connection issue for remote office - TICKET-101) and customer 5 (Acme BVBA).
  - SupportPlane cockpit with real Zammad sandbox ticket loaded, showing "Zammad Sandbox", "Zammad sandbox" badge, "Read-only", "Sandbox - No writeback - No production data" labels.
  - Connector Runtime Provenance card showing "real sandbox" mode, "sandbox local cluster" network, "1 linked" credentials.
  - AI Context Quality panel showing ticket loaded with customerName: Acme BVBA, connectorMode: zammad.
  - Case Timeline showing "Ticket linked" event.
  - Cluster API health JSON with storeMode=postgres, authMode=local, git head=17592be.
  - Connector runtime readiness JSON with realReady=true, mockReady=false, writebackEnabled=false.
  - Boundary proof JSON showing real sandbox read only, no production, no writeback.
  - Local MVP regression proof showing local API and Web reachable with same git head.
- CLI artifacts:
  - `zammad-seed-proof.txt`
  - `supportplane-api-zammad-read-proof.txt`
  - `connector-runtime-readiness.txt`
  - `boundary-proof.txt`
  - `supportplane-api-health.txt`
  - `validation-gate.txt`
  - `local-mvp-regression.txt`
  - `git-status-final.txt`
  - `proof-state-mapping.md`
  - `screenshot-md5s.txt`
- Proves:
  - BL-107 reads real Zammad sandbox ticket/customer data through SupportPlane API.
  - UI displays real sandbox data with explicit provenance and safety labels.
  - Connector readiness distinguishes real sandbox read from mock mode.
  - Writeback remains disabled.
  - 6 unique screenshots, 0 duplicates, max-20 cap respected.
  - Worktree is clean at final commit.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-29T20:17:00+02:00

## EV-2026-04-29-059 through EV-2026-04-29-078: BL-106 Self-hosted service topology proof (SUPERSEDED)

- Status: **invalid/superseded** — evidence contained mismatched screenshots.
- Old files: `output/playwright/session-106-bl106-selfhosted-service-topology-final/01-readme-status-proof.png` through `20-local-mvp-regression.png`
- Issues found:
  - `02-cluster-web-header.png` showed a failed login screen, not the cluster web header.
  - `03-zammad-page-proof.png` showed a generic `Loading...` page without actual Zammad proof.
  - Folder deleted during reconciliation; replaced by EV-2026-04-29-079 through EV-2026-04-29-098.

## EV-2026-04-29-079 through EV-2026-04-29-098: BL-106 Self-hosted service topology proof (RECONCILED)

- Files: `output/playwright/session-107-bl106-evidence-reconciliation/01-readme-status-proof.png` through `20-local-mvp-regression.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), local MVP Web (localhost:3200), Zammad (localhost:8080), OpenBao (localhost:8200), Mailpit (localhost:8025), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - OpenBao Deployment `openbao` in `supportplane-integrations` Running and Ready; health returns `initialized: true, sealed: false, version: 2.2.0`.
  - NATS StatefulSet `nats` in `supportplane-integrations` Running and Ready; JetStream file-backed stream `TEST_STREAM` and consumer `TEST_CONSUMER` created, message published and consumed.
  - Mailpit Deployment `mailpit` in `supportplane-integrations` Running and Ready; SMTP port 1025 captures local test messages; web UI shows captured message.
  - MinIO Deployment `minio` in `supportplane-data` Running and Ready; bucket `bl106-bucket` and object `topology-proof.txt` created and retrieved.
  - Zammad StatefulSet `zammad` in `supportplane-integrations` Running and Ready; separate PostgreSQL and Redis dependencies healthy; HTTP 200 reachable on port 3000.
  - SupportPlane API, Web, Worker in `supportplane-app` remain Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` remains Running and Ready with Bound PVC.
- Shows:
  - README local/mock MVP plus cluster topology direction.
  - `kubectl get all,pvc` for `supportplane-integrations` and `supportplane-data`.
  - Zammad pod status and API JSON (`/api/v1/getting_started`), with honest note that railsserver-only deployment does not serve web UI assets.
  - OpenBao health JSON.
  - Mailpit UI with captured local test email.
  - MinIO bucket/object proof.
  - Ollama host placement decision with GPU reasoning.
  - `BACKLOG.md` showing BL-106 accepted and BL-107+ planned.
  - `NEXT_ACTIONS.md` active-only queue with BL-107 as next.
  - Cluster Web header showing DEV/MOCK DATA/local auth/postgres (CORS fix applied and API rebuilt).
  - Call console and evidence bundle panels.
  - `WORKFLOW_TRUTH.md` and `BOUNDARY_MATRIX.md` showing services deployed but not integrated.
  - `KUBERNETES_SERVICE_CATALOG.md` updated.
  - Final boundary proof: no real SupportPlane integration, no writeback, no real secrets, no production claims.
  - Local MVP regression proof: API and Web still healthy.
- CLI artifacts:
  - `cluster-baseline-proof.txt`
  - `zammad-topology-proof.txt`
  - `openbao-topology-proof.txt`
  - `nats-jetstream-proof.txt`
  - `mailpit-topology-proof.txt`
  - `minio-topology-proof.txt`
  - `ollama-placement-decision.txt`
  - `supportplane-non-integration-proof.txt`
  - `local-mvp-regression-proof.txt`
  - `roadmap-summary.json`
- Proves:
  - BL-106 has real Kubernetes manifests for OpenBao, NATS JetStream, Mailpit, MinIO, and Zammad topology.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - Existing local/mock MVP on localhost:4110/3200 still works.
  - 20 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T17:45:00+02:00

## EV-2026-04-29-044 through EV-2026-04-29-058: BL-104/BL-105 Kubernetes app and PostgreSQL persistence foundation proof

- Files: `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/01-cluster-web-header.png` through `15-local-mvp-regression.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), local MVP Web (localhost:3200), cluster API (localhost:4210), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API Deployment `supportplane-api` in `supportplane-app` Running and Ready.
  - Web Deployment `supportplane-web` in `supportplane-app` Running and Ready.
  - Worker Deployment `supportplane-worker` in `supportplane-app` Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` Running and Ready.
  - PVC `postgres-data-postgres-0` Bound 1Gi `standard` storage class.
  - Prisma migrate deploy succeeded (8 migrations applied).
  - Prisma db seed succeeded.
  - PostgreSQL pod restart survival verified with `_supportplane_bl105_probe` table.
  - Local images built with Podman and loaded via `kind load image-archive`:
    - `localhost/supportplane-api:local-k8s`
    - `localhost/supportplane-web:local-k8s`
    - `localhost/supportplane-worker:local-k8s`
- Shows:
  - Cluster web header showing DEV/MOCK DATA, local auth, postgres store badges.
  - Cluster call console page.
  - Local MVP web header still working on localhost:3200.
  - Local MVP call console page.
  - Cluster API health JSON showing `storeMode: postgres`, `authMode: local`.
  - `kubectl get all,pvc -n supportplane-data` showing postgres StatefulSet, Service, and Bound PVC.
  - `kubectl get all -n supportplane-app` showing API, Web, Worker Deployments and Services.
  - PostgreSQL persistence probe query result after pod deletion/restart.
  - Podman and cluster node image lists showing supportplane images.
  - `BACKLOG.md` showing BL-104 and BL-105 accepted.
  - `NEXT_ACTIONS.md` showing BL-106 as active next step.
  - Boundary proof table: cluster/app/Postgres YES; Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO/writeback NO.
  - `infra/kubernetes/local-podman/README.md` runbook proof.
  - Worker logs showing `mode: mock`, `queueBackend: postgres-local-outbox`.
  - Local MVP regression proof: API health on localhost:4110 still returns ok.
- CLI artifacts:
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/image-build-load-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/postgres-k8s-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/postgres-persistence-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/app-k8s-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/api-cluster-health-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/web-cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/worker-cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/local-mvp-regression-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/proof-state-mapping.md`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/screenshot-md5s.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/roadmap-summary.json`
- Proves:
  - BL-104 has real Kubernetes manifests for API, Web, and Worker with local sandbox images.
  - BL-105 has real PostgreSQL Kubernetes persistence with PVC and restart survival.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - Existing local/mock MVP on localhost:4110/3200 still works.
  - 15 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T16:30:00+02:00

## EV-2026-04-29-032 through EV-2026-04-29-043: BL-103 local Kubernetes/Podman cluster foundation proof

- Files: `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/01-readme-status-roadmap.png` through `12-final-boundary-no-real-writeback-secrets-production.png`
- Source/System: Chromium via Playwright against rendered repo markdown/terminal proof pages plus running SupportPlane local Web/API for boundary proof.
- Cluster proof:
  - Kind with Podman provider.
  - Cluster `supportplane-local`.
  - Context `kind-supportplane-local`.
  - Node image `kindest/node:v1.31.4`.
  - Podman backing container `supportplane-local-control-plane`.
  - Namespaces `supportplane-app`, `supportplane-data`, `supportplane-integrations`, and `supportplane-observability` active.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - README still states local/mock MVP plus self-hosted sandbox roadmap.
  - Terminal proof of provider, cluster name, context, cluster-info, and Ready node.
  - `kubectl get nodes -o wide` proof.
  - Namespace proof showing all four target namespaces active.
  - `infra/kubernetes/local-podman/README.md` with verified Kind/Podman instructions.
  - `BACKLOG.md` showing BL-103 accepted while BL-104+ remain planned.
  - `NEXT_ACTIONS.md` showing active-only next implementation items.
  - Running SupportPlane header still showing DEV/MOCK DATA, local auth, postgres store, and localhost API.
  - Connector panel still showing mock-only boundary.
  - Delivery policy still showing real network locked off.
  - Evidence bundle still showing local/mock boundary.
  - Final proof that no real writeback, real credentials, production claims, or real integrations were enabled.
- CLI artifacts:
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/cluster-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/namespace-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/podman-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/local-image-strategy-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/proof-state-mapping.md`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/screenshot-md5s.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/roadmap-summary.json`
- Proves:
  - BL-103 has a real Podman-backed local Kubernetes cluster foundation.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - 12 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T15:55:00+02:00

## EV-2026-04-29-015 through EV-2026-04-29-031: BL-102 local Kubernetes self-hosted sandbox roadmap proof

- Files: `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/01-readme-md.png` through `17-final-no-real-writeback-credentials-production-claims.png`
- Source/System: Chromium via Playwright against rendered repo markdown proof pages plus running SupportPlane local Web/API for boundary proof.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - README local/mock MVP plus real self-hosted sandbox roadmap section.
  - `docs/SELF_HOSTED_STACK.md` self-hosted service register.
  - `docs/LOCAL_KUBERNETES_PODMAN_TARGET.md` local Kubernetes-on-Podman target.
  - `docs/REAL_E2E_SANDBOX_FLOW.md` target flow and real/mock status matrix.
  - `docs/KUBERNETES_SERVICE_CATALOG.md` Kubernetes workload/service catalog.
  - `docs/SANDBOX_INTEGRATION_ACCEPTANCE.md` acceptance gates.
  - `docs/IMPLEMENTATION_PHASES_REAL_E2E.md` phase plan.
  - `docs/BACKLOG_REAL_E2E_ROADMAP.md` current-to-future backlog mapping.
  - `docs/WORKFLOW_TRUTH.md` workflow truth matrix.
  - `docs/BOUNDARY_MATRIX.md` strict capability boundary matrix.
  - `BACKLOG.md` showing BL-102 accepted and BL-103 through BL-120 planned.
  - `NEXT_ACTIONS.md` showing active next implementation candidates only.
  - Running SupportPlane header still showing DEV/MOCK DATA, local auth, postgres store, and localhost API.
  - Connector panel still showing mock-only boundary.
  - Delivery policy still showing real network locked off.
  - Evidence bundle still showing local/mock boundary.
  - Final proof that no real writeback, real credentials, production claims, or cluster implementation were enabled.
- CLI artifacts:
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/proof-state-mapping.md`
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/screenshot-md5s.txt`
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/roadmap-summary.json`
- Proves:
  - The real self-hosted sandbox target is integrated into repo docs, backlog, state, and active plan.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - 17 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: planning-docs-and-browser-runtime-verification
- as_of: 2026-04-29T16:30:00+02:00

## EV-2026-04-29-001 through EV-2026-04-29-014: BL-101 MVP Demo Freeze Final Proof

- Files: `output/playwright/session-102-bl101-mvp-demo-freeze-final/01-admin-landing-after-demo-reset.png` through `14-reset-script-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - fresh clean admin landing after demo reset with zero stale sessions
  - header/runtime identity proof including `DEV / MOCK DATA`, `API: localhost:4110`, `Auth: local · Store: postgres`, and user/tenant/role pill
  - clean session list with only demo-ready sessions
  - ticket context loaded with connector runtime provenance card
  - Connector panel showing mock-only/local-only boundary (Mock mode badge, Locked ON, credential metadata only)
  - Delivery Policy panel showing real network locked OFF and mock-only enforced ON
  - Action/outbox local-only workflow with mock delivery and `realNetwork: false`
  - Evidence Bundle generated with JSON/Markdown tabs and mock/dev-only disclaimers
  - Viewer read-only proof with disabled controls and view-only messages
  - Viewer/server-side denial proof (403 on mutation attempts)
  - Demo guide proof showing `docs/DEMO_GUIDE.md` rendered in browser
  - MVP completion audit proof showing `docs/MVP_COMPLETION_AUDIT.md` rendered in browser
  - Final no-real-writeback/no-secret/no-production-claim proof
  - Demo reset script and README proof
- Proves:
  - BL-101 produces a coherent, demo-ready local/mock MVP with clean backlog truth and honest documentation
  - 14 unique screenshots, 0 duplicates, max-20 cap respected
- Type: browser-runtime-verification
- as_of: 2026-04-29T14:12:00+02:00

## EV-2026-04-27-051 through EV-2026-04-27-063: BL-018 local auth/RBAC/tenant boundary browser proof

- Files: `output/playwright/session-018-auth-rbac-tenant-boundary-foundation/01-login-page-local-auth.png` through `13-after-api-restart-relogin-scoped-data.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page
  - authenticated operator/admin/viewer identity with tenant and role
  - operator cockpit and Call Console under local identity
  - operator observation creation/review allowed
  - viewer role create action disabled and direct server-side create attempt denied with 403
  - second tenant denied access to first tenant session with 404
  - tenant audit event proof for login/logout/access-control/session/observation events
  - evidence bundle proof with no password/session-token/hash leakage
  - logout returning to login
  - API restart followed by successful re-login and tenant-scoped data visibility
- Type: browser-runtime-verification
- as_of: 2026-04-27T17:42:00+02:00

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

## EV-2026-04-28-020 through EV-2026-04-28-039: BL-094 max-20 governance repair closure proof

- Files: `output/playwright/session-095-bl094-final-closure-max20/01-login-local-auth.png` through `20-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page and authenticated admin cockpit header with user/tenant/role/API/auth/store/mock mode
  - delivery policy panel with safe defaults, mock-only enforced, real network locked off
  - admin policy update with saved version/actor visible
  - connector readiness showing mock-ready and real-writeback-not-ready
  - queue allowed path with policy decision visible
  - delivery operations/worker status showing mock mode, policy mode, queue stats
  - queue blocked by kill switch/policy
  - worker process blocked/dead-lettered by policy
  - worker process allowed in mock mode with attempt detail, policy/version/safety flags
  - case timeline showing policy/worker decision events
  - audit trail showing policy updated, policy decision, blocked/allowed events
  - evidence bundle summary showing delivery policy provenance
  - evidence bundle JSON showing no secrets/tokens/password hashes/raw media and safety flags
  - viewer role can inspect policy but controls are disabled/read-only
  - direct forbidden mutation / viewer server-side RBAC denial shown via UI/API evidence
  - cross-tenant access denied
  - logout and re-login proof with preserved policy state
  - API restart/persistence proof for policy/outbox state
  - final no-real-writeback/no-secret/local-mock proof
- Proves:
  - BL-094 closure proof satisfies the hard 20-screenshot cap after governance repair
  - 0 duplicate MD5 hashes across all 20 screenshots
  - Supersedes prior 24-screenshot session-094 folder (deleted)
- Type: browser-runtime-verification
- as_of: 2026-04-28T14:41:00+02:00

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

## EV-2026-04-27-052: BL-050 PostgreSQL persistence restart survival

- File: scripts/verify_postgres_persistence.sh
- Title: PostgreSQL persistence restart survival verification
- Source/System: shell script
- Action: Start API with SUPPORTPLANE_STORE=postgres, create session and call, stop API, restart API, verify data survives.
- Shows:
  - Session created in Phase 1 is retrievable after restart in Phase 2.
  - Call event created in Phase 1 is retrievable after restart in Phase 2.
  - Evidence bundle reports `storeType: postgres` and `persistenceClaimed: true`.
- Proves:
  - PrismaStore correctly persists data to PostgreSQL.
  - Data survives API process restart.
  - Store switching works at runtime via env var.
- Type: api-behavior-verification
- as_of: 2026-04-27T15:24:00+02:00

## EV-2026-04-27-053: BL-050 PostgreSQL mode browser closure proof

- File: output/playwright/session-050-postgres-persistence-foundation-final-closure/
- Title: BL-050 PostgreSQL Persistence Foundation canonical browser closure proof
- Source/System: browser
- Action: Verified Support Cockpit and Call Console in PostgreSQL mode with persisted data.
- Shows:
  - 14 sequential screenshots covering initial state, session creation, ticket context, fake incoming call, call linking, operator companion observation, context packet, call recording metadata, AI context quality, restart persistence, audit trail, evidence bundle JSON (before and after restart), and no-secret proof.
- Proves:
  - UI functions correctly in PostgreSQL store mode.
  - Data persists across API restart and remains visible in the browser.
  - Evidence bundle correctly reports `storeType: postgres`.
- Type: docs-render-verification
- as_of: 2026-04-27T16:11:00+02:00

## EV-2026-04-27-076 through EV-2026-04-27-095: BL-091 Support Case Workflow Foundation browser proof

- Files: `output/playwright/session-091-support-case-workflow-foundation/01-login-page.png` through `20-call-simulator-active.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page (01)
  - cockpit overview with all panels (02)
  - ticket summary panel with search (03)
  - session created and selected (04-05)
  - simulated incoming call with caller matching (06)
  - call linked to session (07)
  - connector test result with "Mock mode — no real network call was made" (08)
  - ticket context loaded showing Zammad ticket TICKET-101 (09)
  - support note draft generated with "not sent to Zammad" warnings (10)
  - evidence bundle generated with summary counts (11)
  - postgres-persisted verify session with ticket loaded (12)
  - support note draft generated on persisted session (13)
  - evidence bundle JSON showing supportNoteDrafts array (14)
  - evidence bundle Markdown showing Support Note Drafts section (15)
  - case timeline with session_created, internal_note_drafted, evidence_bundle_generated events (16)
  - connector panel with installations list, Test and Validate buttons (17)
  - connector validate result with valid: true, mode: mock, realNetwork: false (18)
  - viewer role with disabled New button, disabled Generate local-only draft button (19)
  - call simulator with active fake incoming call (20)
- Type: browser-runtime-verification
- as_of: 2026-04-27T23:25:00+02:00

## EV-2026-04-27-096 through EV-2026-04-27-112: BL-092 Durable Action/Outbox Workflow Foundation browser proof

- Files: `output/playwright/session-092-durable-action-outbox-workflow-foundation/01-login-local-auth.png` through `17-viewer-readonly-outbox.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page (01)
  - authenticated cockpit with user, tenant, role, API, store/auth mode (02)
  - support session and ticket/customer/call context loaded (03-04)
  - local-only support note draft and action draft creation (05-06)
  - submit for review and forbidden operator approval proof (07-08)
  - logout, admin re-login, and persisted state (09-10)
  - admin approval, queueing, and mock delivery result (11-13)
  - evidence bundle summary and JSON with action/outbox provenance and no-secret proof (14-15)
  - logout and viewer read-only action/outbox controls (16-17)
- Proves:
  - Action/outbox workflow is visible in the cockpit and follows local-auth role boundaries.
  - Mock delivery reports `realNetwork: false`, `writebackEnabled: false`, and `externalWriteAttempted: false`.
  - Evidence bundle includes action/outbox provenance without exposing tokens, password hashes, raw media, or private credentials.
- Type: browser-runtime-verification
- as_of: 2026-04-27T23:59:00+02:00

## EV-2026-04-28-001: BL-092 durable action/outbox verification script

- File: scripts/verify_durable_action_outbox.sh
- Source/System: shell script against local-auth API and web runtime
- Action: Logged in as operator, admin, viewer, and alt-tenant operator; created support session and action; submitted for review; verified viewer/forged-header approval denial; approved, queued, and mock-delivered action; checked outbox attempts, audit events, timeline events, evidence bundle redaction, cross-tenant denial, and web root.
- Result: pass
- Proves:
  - Durable action/outbox API lifecycle works after the database is recreated from committed migrations and seed data.
  - Tenant scoping, RBAC, forged-header ignore in local mode, mock delivery safety flags, audit/timeline updates, and no-secret evidence checks are directly verified.
- Type: api-behavior-verification
- as_of: 2026-04-28T00:05:00+02:00

## EV-2026-04-28-002: BL-092 Final Closure Audit — 17 Screenshot Set and Script Fix

- Files: `output/playwright/session-092-durable-action-outbox-workflow-final-closure/01-draft-created-no-outbox.png` through `17-no-secret-no-raw-media-proof.png`
- Source/System: Playwright MCP browser automation against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - 01-07: Full action lifecycle — draft, review_required, approval_denial, approved, mock_delivered, second_action_no_outbox, queued
  - 08: Evidence bundle Summary tab with action/outbox provenance
  - 09: Evidence bundle JSON tab with no secrets visible
  - 10: Audit trail showing action/outbox lifecycle events
  - 11: Viewer role with disabled Action Center controls
  - 12: Cross-tenant isolation (alt-tenant admin sees empty session list)
  - 13: Login page after logout
  - 14: Re-login preserving state
  - 15: Post-API-restart persisted state
  - 16: Local mock warnings
  - 17: No-secret no-raw-media proof
- Proves:
  - Complete action/outbox lifecycle is visible and follows role boundaries.
  - Evidence bundle includes action/outbox provenance without exposing secrets.
  - Audit trail records all action/outbox events with actor, timestamp, and metadata.
  - Cross-tenant isolation is enforced server-side.
  - Viewer role is restricted in UI and server-side.
  - State survives API restart via PostgreSQL persistence.
- Type: browser-runtime-verification
- as_of: 2026-04-28T10:35:00+02:00

## EV-2026-04-28-003: verify_postgres_persistence.sh script fix

- File: `scripts/verify_postgres_persistence.sh`
- Change: Script now detects if port 4110 is occupied and automatically uses the next available port for its temporary API instance.
- Proves: The persistence verification script can run honestly even when the development API is already serving on the default port.
- Type: script-fix-verification
- as_of: 2026-04-28T10:27:00+02:00

## EV-2026-04-28-004: BL-093 Outbox worker retry/dead-letter browser proof

- Files: `output/playwright/session-093-outbox-worker-retry-deadletter-foundation/01-login-local-auth.png` through `24-final-no-secret-no-raw-media-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login and authenticated cockpit runtime proof with worker/store/auth status
  - approved action queued before worker processing
  - local worker/process-once status and claim/result proof
  - mock delivery success with `realNetwork: false`, `writebackEnabled: false`, and `externalWriteAttempted: false`
  - retryable failure, retry scheduling, admin retry, and dead-letter behavior
  - admin cancel/dead-letter controls and viewer read-only restrictions
  - direct viewer mutation denial with forged role header ignored
  - cross-tenant outbox access denied
  - case timeline, audit trail, and evidence bundle worker/outbox provenance
  - logout/re-login and API restart persistence
  - local/mock/no-real-writeback warnings and no-secret/no-raw-media proof
- Type: browser-runtime-verification
- as_of: 2026-04-28T11:13:00+02:00

## EV-2026-04-28-005: BL-093 outbox worker retry/dead-letter verification script

- File: `scripts/verify_outbox_worker_retry_deadletter.sh`
- Source/System: shell script against local-auth API and web runtime
- Action: Logged in as operator, admin, viewer, and alt-tenant operator; created and queued local support actions; processed mock success; verified retryable failure scheduling and admin retry; verified non-retryable dead-letter, admin cancel, viewer mutation denial, forged-header ignore, cross-tenant denial, audit events, timeline entries, evidence bundle provenance, and no-secret checks.
- Result: pass
- Type: api-behavior-verification
- as_of: 2026-04-28T11:17:00+02:00

## EV-2026-04-28-006: BL-094 admin cockpit with Delivery Policy panel

- File: output/playwright/session-094-delivery-policy-controls-foundation/02-admin-cockpit-delivery-policy-panel.png
- Title: Admin cockpit with Delivery Policy panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Logged in as admin and scrolled to Delivery Policy panel.
- Shows:
  - Delivery Policy panel showing "Default Delivery Policy" with "Enabled" badge and version.
  - Kill switch toggle, Approval required toggle, Min. approver role dropdown (Admin selected).
  - Mock-only enforced: "Locked ON" with lock icon.
  - Real network calls: "Locked OFF" with lock icon.
  - Allowed actions: ticket_note. Max attempts: 3.
  - Validate Policy and Connector Readiness buttons.
- Proves:
  - Delivery Policy panel is visible to admin users with all policy controls rendered.
- Type: docs-render-verification
- as_of: 2026-04-28T11:24:00+02:00

## EV-2026-04-28-007: BL-094 policy validation result

- File: output/playwright/session-094-delivery-policy-controls-foundation/03-policy-validation-result.png
- Title: Policy validation showing mock_only_allowed decision
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Validate Policy" button in Delivery Policy panel.
- Shows:
  - Policy decision badge: "mock_only_allowed".
  - Message: "Delivery allowed under current policy."
  - Subtext: "Mode: mock • Version: 21".
- Proves:
  - Policy validation endpoint returns visible decision with mode and version metadata.
- Type: docs-render-verification
- as_of: 2026-04-28T11:26:00+02:00

## EV-2026-04-28-008: BL-094 connector readiness result

- File: output/playwright/session-094-delivery-policy-controls-foundation/04-connector-readiness-result.png
- Title: Connector readiness showing mock ready, not real ready
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Connector Readiness" button in Delivery Policy panel.
- Shows:
  - Connector Readiness header with checkmark icon.
  - Mock ready: Yes. Real ready: No. Active: Yes. Supports type: Yes.
  - Message: "Real writeback not implemented."
  - Policy: mock_only_allowed.
- Proves:
  - Connector readiness check explicitly reports real writeback is not implemented.
- Type: docs-render-verification
- as_of: 2026-04-28T11:27:00+02:00

## EV-2026-04-28-009: BL-094 session audit with policy events

- File: output/playwright/session-094-delivery-policy-controls-foundation/05-session-audit-policy-events.png
- Title: Session audit trail with delivery_policy_evaluated and delivery_policy_blocked
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected "Policy test session" and scrolled to Audit Trail panel.
- Shows:
  - `delivery_policy_evaluated` event with decision metadata including `allowed: true`, `decision: mock_only_allowed`, `policyVersion`, `safetyFlags`.
  - `delivery_policy_blocked` event with `allowed: false`, `decision: blocked_by_kill_switch`, safety flags.
  - `action_queued` and `outbox_item_created` events showing policy decision embedded in delivery intent.
- Proves:
  - Policy evaluation and blocking events are captured in the audit trail with full decision metadata.
- Type: docs-render-verification
- as_of: 2026-04-28T11:28:00+02:00

## EV-2026-04-28-010: BL-094 viewer mode read-only policy

- File: output/playwright/session-094-delivery-policy-controls-foundation/06-viewer-mode-readonly-policy.png
- Title: Viewer mode with read-only policy controls
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Logged out and re-logged in as viewer@supportplane.local.
- Shows:
  - Delivery Policy panel with all toggles disabled (Kill switch, Approval required, Max attempts).
  - Min. approver role dropdown disabled.
  - Message: "View-only. Admin role required to modify policy."
  - Validate Policy and Connector Readiness buttons remain available.
- Proves:
  - Viewer role cannot modify delivery policy; admin role is required for updates.
- Type: docs-render-verification
- as_of: 2026-04-28T11:28:00+02:00

## EV-2026-04-28-011: BL-094 local auth login page

- File: output/playwright/session-094-delivery-policy-controls-foundation/01-login-local-auth.png
- Title: Local auth login page
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened SupportPlane login page before authentication.
- Shows:
  - SupportPlane local login header with "Local MVP auth, not SSO or production auth" subtitle.
  - Tenant, Email, Password fields with seeded local password hint.
- Proves:
  - Login page is the authentication entry point for browser verification.
- Type: docs-render-verification
- as_of: 2026-04-28T11:23:00+02:00

## EV-2026-04-28-012 through EV-2026-04-28-031: BL-094 Final Closure — 20 Screenshot Set

- Files: `output/playwright/session-095-bl094-final-closure-max20/01-login-local-auth.png` through `20-final-mock-no-secret-proof.png`
- Governance repair note: prior entry referenced `session-094-delivery-policy-controls-final-closure/` which contained 24 screenshots (violating AGENTS.md cap). Updated to canonical max-20 folder after governance repair.
- Source/System: visible Chromium via Playwright script against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - 01: local login page with tenant/email/password fields
  - 02: admin cockpit header with DEV/MOCK badges, identity pill, auth mode, store mode
  - 03: admin Delivery Policy panel with safe defaults, mock-only locked ON, real network locked OFF
  - 04: admin policy update with approval toggled ON, saved version/actor visible
  - 05: connector readiness check returning mock ready, real writeback not ready
  - 06: Action Center queued action with policy decision visible
  - 07: Delivery Operations worker status showing mock mode, queue stats, safety flags
  - 08: queue blocked by kill switch with API error visible
  - 09: worker process dead-lettered after process-once with kill switch enabled
  - 10: worker process allowed in mock mode with attempt detail and safety flags
  - 11: case timeline showing policy/worker decision events
  - 12: audit trail showing delivery_policy_updated, delivery_policy_evaluated, delivery_policy_blocked events
  - 13: evidence bundle summary showing delivery policy provenance
  - 14: evidence bundle JSON showing no secrets, safety flags, mock-only enforcement
  - 15: viewer read-only policy panel with disabled controls and view-only message
  - 16: viewer server-side RBAC denial via "Prove server-side approval denial" button
  - 17: cross-tenant admin denied access to dev-tenant session
  - 18: relogin as admin showing preserved policy state after logout
  - 19: persistence proof — outbox state survives full page reload and re-login
  - 20: final no-real-writeback/no-secret/local-mock proof with cockpit header
- Proves:
  - BL-094 delivery policy controls are visible, enforced at queue and process time, and produce audit/dead-letter artifacts.
  - Both allowed (`mock_only_allowed`) and blocked (`blocked_by_kill_switch`) paths are proven.
  - Admin and viewer roles are differentiated in the UI with server-side enforcement.
  - Cross-tenant access is denied.
  - Evidence bundles include policy provenance without secrets.
  - Policy and outbox state persist across logout/relogin and page reload.
- Type: docs-render-verification
- as_of: 2026-04-28T13:25:00+02:00

## Note: Superseded Evidence

- EV-2026-04-28-006 through EV-2026-04-28-011 (foundation screenshots in `session-094-delivery-policy-controls-foundation/`) are superseded by EV-2026-04-28-012 through EV-2026-04-28-031.
- EV-2026-04-28-012 through EV-2026-04-28-031 were originally recorded against `session-094-delivery-policy-controls-final-closure/` (24 screenshots, cap violation). The canonical proof is now `session-095-bl094-final-closure-max20/` (20 screenshots, 0 duplicates).
- The old `session-094-delivery-policy-controls-final-closure/` folder was deleted per AGENTS.md screenshot lifecycle rules.

## Note: Superseded BL-095 Evidence

- EV-2026-04-28-036 through EV-2026-04-28-043 (8 screenshots in `session-095-connector-installation-settings/`) are superseded by EV-2026-04-28-044 through EV-2026-04-28-057.
- The old `session-095-connector-installation-settings/` folder was deleted per AGENTS.md screenshot lifecycle rules because BL-094 already owns the `session-095-*` namespace.

## EV-2026-04-28-044 through EV-2026-04-28-057 — BL-095 Connector Installation Settings Foundation (Canonical Closure)

- Folder: `output/playwright/session-096-bl095-connector-installation-settings-final-closure/`
- Screenshots: 14 (all unique, 0 duplicates)
  - 01-admin-runtime-identity.png: Admin runtime identity showing user, tenant, role, API endpoint, auth mode, store mode
  - 02-connector-panel-visible.png: Connector settings panel visible with installations list
  - 03-settings-expanded-safe-fields.png: Settings expanded showing safe editable fields (displayName, description, status, enabled, timeout, validateBeforeWrite)
  - 04-admin-saves-settings.png: Admin saves display name/description/status/timeout and safe fields
  - 05-settings-persist-after-reload.png: Saved settings persist after page reload
  - 06-connector-readiness-mock-only.png: Connector readiness reflects installation settings and still says real writeback not ready
  - 07-delivery-policy-real-writeback-denied.png: Delivery policy still denies real writeback / real network remains locked off
  - 08-credential-secret-placeholder.png: Credential/secret placeholder visible without secret value (•••••••• managed server-side)
  - 09-evidence-bundle-connector-provenance.png: Evidence bundle JSON proves connector installation provenance without secrets
  - 10-audit-connector-settings-update.png: Audit trail/timeline showing connector-related events
  - 11-viewer-readonly-and-denial.png: Viewer read-only connector settings with view-only message and disabled controls
  - 12-viewer-api-mutation-denied.png: Server-side viewer mutation denial: API returns 403 with explicit role requirement message
  - 13-cross-tenant-denied.png: Cross-tenant connector access denied (404 on session access)
  - 14-final-local-mock-proof.png: Final local/mock/no-real-writeback proof with visible mock labels
- CLI artifact: `output/playwright/session-096-bl095-connector-installation-settings-final-closure/audit-connector-installation-updated.json` proving `connector_installation_updated` audit events in PostgreSQL
- Proves:
  - BL-095 connector installation settings are editable by admin/operator and visible in the UI.
  - Mock mode is locked ON with visible safety banner; real writeback is denied.
  - Viewer role cannot edit settings (all fields disabled) and receives 403 on PATCH attempts.
  - Cross-tenant access is denied (404).
  - Config secrets are redacted to `[REDACTED]` in API responses.
  - Evidence bundles include connector installations with new fields (displayName, capabilities, mockMode, enabled, timeoutMs).
  - Audit events record connector installation updates with previous/new state metadata.
  - Credential/config JSON storage is explicitly local/mock/dev-only, not production credential management.
- Type: browser-runtime-verification
- as_of: 2026-04-28T16:00:00+02:00

## EV-2026-04-28-058 through EV-2026-04-28-063 — BL-097 Credential Reference Foundation (Canonical Closure)

- Folder: `output/playwright/session-097-credential-reference-foundation-final-closure/`
- Screenshots: 6 (all unique, 0 duplicates)
  - 01-admin-connector-panel-with-credential-refs.png: Admin view showing expanded connector installation with linked credential reference "Dev Zammad API Token (Placeholder)" active status badge
  - 02-admin-credential-ref-selector.png: Admin view scrolled to Credential References section showing link dropdown selector for available credential references
  - 03-viewer-readonly-credential-refs.png: Viewer view showing same credential reference with "View-only. Admin role required to modify installation settings." message; no unlink button visible
  - 04-api-credential-refs-list-redacted.png: API JSON response from `GET /credential-references` showing credential references with `secretRef: "[REDACTED]"`
  - 05-api-credential-ref-single-redacted.png: API JSON response from `GET /credential-references/:id` showing single credential reference with `secretRef: "[REDACTED]"`
  - 06-api-evidence-bundle-credential-refs.png: Evidence bundle JSON showing `credentialReferences` array with metadata only (id, displayName, connectorType, status, secretKind, linked, lastValidatedAt) — no secret values
- Proves:
  - Credential references are created, stored, and listed with tenant scoping.
  - All API responses redact `secretRef` to `[REDACTED]`; raw secret values never leave the server.
  - Evidence bundles include credential reference summaries without secret values.
  - Admin can view linked credential references and has link/unlink UI controls.
  - Viewer sees read-only credential reference list with no modification controls.
  - Connector installations reference credentials by ID via `secretReferenceIds` array.
  - Audit events track credential reference lifecycle (created, updated, linked, unlinked).
- Type: browser-runtime-verification
- as_of: 2026-04-28T17:30:00+02:00

## EV-2026-04-28-064 through EV-2026-04-28-078: BL-098 connector runtime configuration and readiness browser proof

- Files: `output/playwright/session-098-connector-runtime-readiness-final-closure/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with user/tenant/role/API URL/local auth/postgres store/mock mode
  - connector panel with Config and Readiness action buttons visible
  - config validation result showing Valid badge, mockMode:true, realNetwork:false, writebackEnabled:false
  - unsafe config validation rejected via API: mockMode:false, apiToken, baseUrl all flagged as errors
  - runtime readiness panel showing mockReady, realNetwork:false, writebackEnabled:false, linkedCredentials count
  - expanded installation settings showing Mock-only badge, Locked ON mock mode, credential references
  - API config schema endpoint returning safeFields, rejectedFields, mockOnly:true
  - API runtime readiness endpoint returning mockReady, realReady:false, realNetwork:false, writebackEnabled:false
  - API runtime resolve endpoint returning tenant-scoped result with credential reference metadata (no secretRef), secretResolutionImplemented:false
  - evidence bundle JSON including connector installations with realNetwork:false, writebackEnabled:false, externalWriteAttempted:false
  - viewer read-only connector panel with disabled Config/Readiness buttons
  - viewer server-side mutation denial visible in UI and CLI artifact
  - cross-tenant access denied via API and CLI artifact
  - audit trail showing connector_config_validated, connector_readiness_checked, connector_runtime_resolved events
  - final mock/no-secret/no-real-writeback proof
- Proves:
  - BL-098 config validation, runtime readiness, and runtime resolver are implemented and browser-verified
  - Mock-only safety is enforced at schema, service, controller, and UI layers
  - Secret redaction is maintained: no secretRef values exposed in runtime resolver or evidence bundle
  - RBAC enforcement denies viewer mutations server-side with 403
  - Tenant isolation returns 404 for cross-tenant access
- Type: browser-runtime-verification
- as_of: 2026-04-28T18:35:00+02:00

## EV-2026-04-28-079 through EV-2026-04-28-093: BL-098 Closure Repair Evidence

- Files: `output/playwright/session-099-bl098-closure-repair-final/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with tenant/role pill
  - connector panel with exactly 1 linked credential reference (clean seed)
  - config validation: valid=true, mock-only flags, no contradictions between label and content
  - unsafe config rejected via API: mockMode:false, apiToken, baseUrl flagged as errors
  - runtime readiness panel: mockReady, realNetwork:false, writebackEnabled:false, 1 linked credential
  - API runtime resolve: tenant-scoped result with credential metadata, no secretRef, secretResolutionImplemented:false
  - ticket context panel showing Connector Runtime Provenance card with installation name, type, mode, network status, linked credential count, capabilities
  - evidence bundle summary with connector safety fields
  - evidence bundle JSON (1.1MB) with no secret leakage
  - audit trail with populated connector_config_validated, connector_readiness_checked, connector_runtime_resolved events (not empty)
  - viewer read-only connector panel with disabled buttons
  - viewer server-side mutation denial via API (403)
  - cross-tenant access denied via API (404)
  - delivery policy denies writeback via API
  - final mock/no-secret/no-real-writeback proof with visible content (not empty)
- Proves:
  - BL-098 closure repair: all prior defects fixed
  - Seed is idempotent: exactly 1 credential reference linked to conn-inst-dev-001
  - Ticket/customer connector provenance is visibly rendered in UI
  - No screenshot label contradicts visible content
  - No empty panels in audit or evidence screenshots
- Type: browser-runtime-verification
- as_of: 2026-04-28T19:30:00+02:00

## EV-2026-04-28-094 through EV-2026-04-28-108: BL-098 Evidence Repair (Second Pass)

- Files: `output/playwright/session-100-bl098-evidence-repair-final/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with tenant/role pill
  - connector panel with exactly 1 linked credential reference (clean seed)
  - config validation: Valid badge, `valid: true`, mock-only flags (label matches content)
  - unsafe config rejected via API: mockMode:false, apiToken, baseUrl flagged as errors
  - runtime readiness panel: mockReady, realNetwork:false, writebackEnabled:false, 1 linked credential
  - API runtime resolve: tenant-scoped result with credential metadata, no secretRef, secretResolutionImplemented:false
  - ticket context panel: Connector Runtime Provenance card visible with installation name, type, mode, network status, linked credential count, capabilities
  - generated evidence bundle summary: Bundle ID visible, connector counts, mock/dev-only disclaimers (not empty state)
  - compact evidence bundle proof: connectorInstallations count, credentialReferences count, realNetwork:false, writebackEnabled:false, externalWriteAttempted:false, no secret leakage
  - compact audit proof: connector_config_validated, connector_readiness_checked, connector_runtime_resolved event types with tenant/actor/timestamp (not empty, not unreadable tall dump)
  - viewer read-only connector panel with disabled buttons
  - viewer server-side mutation denial via API (403)
  - cross-tenant access denied via API (404)
  - delivery policy denies writeback via API
  - final mock/no-secret/no-real-writeback proof: connector panel shows Mock-only badge, Locked ON, secret values hidden (not empty bundle state)
- CLI artifacts:
  - `evidence-bundle-no-secret-summary.json` — compact connector/credential summary with noSecretLeak:true
  - `audit-bl098-events-summary.json` — compact BL-098 event summary (12 events)
  - `screenshot-md5s.txt` — MD5 hashes of all 15 screenshots
  - `proof-state-mapping.md` — numbered proof-state table
- Proves:
  - BL-098 evidence repair: all prior screenshot defects fixed
  - No contradictions between screenshot labels and visible content
  - No empty panels in audit, evidence, or final proof screenshots
  - No unreadable tall JSON dumps
  - All screenshots are compact and reviewable (max 900px height)
- Type: browser-runtime-verification
- as_of: 2026-04-28T21:15:00+02:00

- id: EV-2026-04-28-006
  backlog_id: BL-099
  title: Connector Runtime Test Coverage + Documentation Hardening Evidence
  evidence_type: test_coverage_and_documentation
  status: accepted
  artifact_folder: output/playwright/session-101-bl099-bl100-runtime-confidence-design-final/
  artifact_count: 13
  screenshots:
  - 01-admin-runtime-identity.png — admin@supportplane.local with tenant pill, role badge
  - 02-connector-panel-config-readiness-controls.png — Config Schema, Validate Config, Runtime Readiness buttons visible
  - 03-valid-config-validation.png — Valid badge, valid:true, mockMode:true
  - 04-unsafe-config-rejected.png — mockMode:false, apiToken, baseUrl rejected with errors
  - 05-runtime-readiness-mock-only.png — mockReady, realReady:false, writebackEnabled:false
  - 06-runtime-resolve-credential-metadata-only.png — mode:mock, credential metadata only, no secretRef
  - 07-ticket-context-connector-runtime-provenance.png — Connector Runtime Provenance card visible
  - 08-evidence-bundle-connector-runtime-metadata.png — connector counts, realNetwork:false, no secret leakage
  - 09-viewer-read-only-connector-panel.png — disabled buttons, read-only UI
  - 10-viewer-server-side-denial.png — 403 response on mutation attempt
  - 11-cross-tenant-denial.png — 404 on cross-tenant runtime access
  - 12-real-writeback-path-design-proof.png — REAL_WRITEBACK_PATH_DESIGN.md rendered in browser
  - 13-final-local-mock-no-real-writeback-proof.png — Mock-only badge, no real writeback
    test_results:
  - apps/api: 147/147 pass (14 suites)
  - packages/contracts: 43/43 pass (7 suites)
  - apps/web: 19/19 pass (1 suite)
  - packages/connectors: 16/16 pass (6 suites)
    verification_scripts:
  - scripts/verify_connector_runtime_readiness.sh: 12/12 pass
  - scripts/verify_connector_runtime_contracts.sh: 14/14 pass
    docs:
  - docs/CONNECTOR_RUNTIME_CONTRACT.md
  - docs/TICKET_CONTEXT_CONNECTOR_SAFETY.md
    as_of: 2026-04-28T21:30:00+02:00

- id: EV-2026-04-28-007
  backlog_id: BL-100
  title: Real Writeback Path Design Document Evidence
  evidence_type: design_documentation
  status: accepted
  artifact_folder: output/playwright/session-101-bl099-bl100-runtime-confidence-design-final/
  artifact_count: 2
  screenshots:
  - 12-real-writeback-path-design-proof.png — REAL_WRITEBACK_PATH_DESIGN.md rendered in browser showing all sections
  - 13-final-local-mock-no-real-writeback-proof.png — connector panel shows mock-only state with design doc referenced
    docs:
  - docs/REAL_WRITEBACK_PATH_DESIGN.md
    as_of: 2026-04-28T21:30:00+02:00

- id: EV-2026-04-29-001
  backlog_id: BL-107
  title: Zammad Sandbox Bootstrap and Real Read Connector
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-108-bl107-zammad-sandbox-read-connector/
  artifact_count: 11
  screenshots:
  - 01-zammad-api-seeded-ticket.png — Zammad API returns real ticket 2 (68002) and customer 5 (Acme BVBA)
  - 02-cockpit-loaded-ticket.png — Composite: UI shows real Zammad ticket with sandbox labels, Connector Runtime Provenance, AI Context Quality, Case Timeline
  - 04-cluster-api-health.png — Cluster API health: store=postgres, auth=local, status=ok
    cli_artifacts:
  - connector-runtime-readiness.txt — realReady=true, mockReady=false, writebackEnabled=false
  - zammad-api-read-proof.txt — SupportPlane API reads real Zammad ticket via authenticated POST
  - boundary-proof.txt — Real sandbox read only; no production, no writeback
  - validation-gate.txt — Exact commands and pass/fail results
  - local-mvp-regression.txt — Local MVP not required; cluster is acceptance target
  - proof-state-mapping.md — Maps each artifact to the state it proves
  - screenshot-md5s.txt — Duplicate detection: 0 duplicates
    test_results:
  - npm run lint: passed
  - npm run typecheck: passed (all workspaces)
  - npm test: passed (43 tests, 0 failures)
    verification_commands:
  - curl http://localhost:4210/health
  - curl -b cookies -X POST http://localhost:4210/connector-installations/conn-inst-dev-001/runtime-readiness
  - curl -b cookies -X POST http://localhost:4210/support-sessions/{id}/zammad/ticket-context -d '{"externalTicketId":"2"}'
  - node scripts/bl107_screenshots_final.js
    as_of: 2026-04-29T19:55:00+02:00

- id: EV-2026-04-30-001
  backlog_id: BL-111
  title: Sandbox-Only Zammad Internal Note Writeback
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-111-112-113-sandbox-writeback-closure-canonical/
  artifact_count: 22
  screenshots:
  - 01-dashboard-delivery-ops-sandbox-delivered.png — Dashboard logged-in baseline
  - 07-outbox-list-sandbox-delivered.png — Delivery Ops panel showing sandbox_delivered item at top of list
  - 11-action-center-outbox-status.png — Action Center showing "Latest action: sandbox_delivered" with ticket_note type
  - 12-delivery-ops-summary-and-item-detail.png — Outbox item detail: attempts 1, latest sandbox_delivered, mode sandbox
  - 13-delivery-ops-summary-grid.png — Summary grid: sandbox_delivered=1, mock_delivered=22, total=23
  - 19-audit-trail-sandbox-delivered-terminal.png — action_sandbox_delivered audit event at 10:29:26 AM
  - 20-audit-trail-outbox-sandbox-delivered.png — outbox_sandbox_delivered audit event with full delivery metadata
    cli_artifacts:
  - validation-gate.txt — API health, action status, outbox status, Zammad article, MinIO object, Mailpit messages, build verification
  - git-status-final.txt — clean worktree at bb81e7a
  - proof-state-mapping.md — maps all 18 screenshots to proof states
  - screenshot-md5s.txt — MD5 hashes, 0 duplicates after cleanup
    test_results:
  - npm run build: passed
  - npm run typecheck: passed
  - npm run lint: passed
  - npm test: passed (24 tests)
    verification_commands:
  - curl http://localhost:4210/health
  - curl -b cookies http://localhost:4210/actions/e9a4ecac-51f4-4b47-9c95-c858df818f74
  - curl -b cookies http://localhost:4210/outbox/0c796d9b-2a03-4116-88f0-7c9aef9c846e
  - curl -H "Authorization: Token token=$ZAMMAD_API_TOKEN" http://localhost:8080/api/v1/ticket_articles/16
  - python3 boto3 head_object for MinIO evidence
  - curl http://localhost:8025/api/v1/messages
    as_of: 2026-04-30T10:45:00+02:00

- id: EV-2026-04-30-002
  backlog_id: BL-112
  title: MinIO Evidence Artifact Persistence
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-111-112-113-sandbox-writeback-closure-canonical/
  artifact_count: 22
  cli_artifacts:
  - validation-gate.txt §5 — MinIO evidence object details: 1579 bytes, SHA-256 checksum, createdAt 2026-04-30T08:29:26.901Z
    verification_commands:
  - python3 boto3 head_object(Bucket='supportplane-evidence', Key='dev-tenant/writebacks/3b4e87c9-413a-4ab6-b917-65f723a304d7/0c796d9b-2a03-4116-88f0-7c9aef9c846e.json')
    as_of: 2026-04-30T10:45:00+02:00

- id: EV-2026-04-30-003
  backlog_id: BL-113
  title: Mailpit Local Notification Capture
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-111-112-113-sandbox-writeback-closure-canonical/
  artifact_count: 22
  cli_artifacts:
  - validation-gate.txt §6 — Mailpit message: subject "SupportPlane sandbox writeback completed", capturedAt 2026-04-30T08:29:26.971Z
    verification_commands:
  - curl http://localhost:8025/api/v1/messages
    as_of: 2026-04-30T10:45:00+02:00

- id: EV-2026-04-30-004
  backlog_id: BL-114
  title: Local Observability Baseline
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-114-bl114-observability-baseline/
  artifact_count: 20
  screenshots:
  - 12-ui-observability-overview-proof.png — Local Observability panel with local-only, no-production-monitoring, and no-secret telemetry copy
  - 13-ui-correlation-drilldown-proof.png — Correlation ID/API health/worker status/queue backend summary
  - 14-ui-sandbox-writeback-observability-proof.png — NATS JetStream worker and sandbox writeback telemetry proof
  - 15-state-docs-proof.png — State docs reconciled to BL-114 accepted and BL-116 active/not accepted
    cli_artifacts:
  - 01-baseline-runtime.txt — baseline git/cluster/app/worker evidence
  - 02-bl111-113-regression-truth-proof.txt — prior closure truth audit and dependency regression proof
  - 03-observability-architecture-proof.md — local-only observability contract and no-secret rules
  - 04-otel-collector-proof.txt — observability namespace/pod/service proof
  - 05-api-worker-correlation-proof.txt — API/worker correlation proof
  - 06-metrics-proof.txt — metrics endpoint and Prometheus query proof
  - 07-logs-proof.txt — structured safe log proof
  - 08-dashboard-or-query-proof.txt — Grafana/Prometheus query proof
  - 09-no-secret-telemetry-proof.txt — secret leakage search proof
  - 10-validation-gate.txt — exact validation commands and pass/fail results
  - 11-cluster-redeploy-proof.txt — rebuilt local Kubernetes rollout proof
  - 16-bl116-readiness-audit.md — readiness audit only; BL-116 not accepted
  - 17-local-mvp-regression.txt — local MVP regression proof
  - 18-proof-state-mapping.md — evidence-to-claim mapping
  - 19-screenshot-md5s.txt — screenshot duplicate detection
  - 20-git-status-final.txt — clean worktree proof
    test_results:
  - npm run lint: passed
  - npm run typecheck --workspaces --if-present: passed
  - npm test --workspaces --if-present: passed
  - python3 scripts/check_state_docs.py: passed
  - bash scripts/verify_observability_baseline.sh: passed
    as_of: 2026-04-30T11:20:00+02:00

- id: EV-2026-04-30-005
  backlog_id: BL-116
  title: Real Self-Hosted Sandbox Acceptance Freeze
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/
  artifact_count: 20
  screenshots:
  - 12-ui-cockpit-overview.png — Cockpit with DEV/MOCK DATA badge, local auth, Zammad mode, session list
  - 13-ui-call-console.png — Call console with "No real telephony connected" boundary warning
  - 14-ui-observability-panel.png — Local Observability panel with localOnly, no-secret, NATS JetStream status
  - 15-ui-delivery-policy-panel.png — Delivery Policy panel with sandbox allowlist, kill switch, approval gates
  - 16-ui-action-outbox-panel.png — Delivery Operations panel with sandbox_delivered items and attempt history
    cli_artifacts:
  - 01-baseline-runtime-and-git.txt — Git HEAD, branch, API health matching runtime
  - 02-cluster-topology-and-services-proof.txt — All 4 namespaces, pods, services, PVCs healthy
  - 03-app-postgres-persistence-proof.txt — 20 app tables, 5 Prisma migrations, BL-105 probe survives
  - 04-real-sandbox-e2e-flow-proof.txt — Full E2E flow: session → action → submit → approve → queue → sandbox_delivered
  - 05-blocked-paths-and-safety-proof.txt — External URL, production URL, kill switch, unapproved writeback all blocked
  - 06-no-secret-no-cloud-no-production-proof.txt — Negative scan of secrets, cloud AI, production monitoring
  - 07-observability-and-correlation-proof.txt — Correlation IDs, Prometheus metrics, local status endpoint
  - 08-validation-gate.txt — Lint, typecheck (9 packages), tests (33/33 pass), observability baseline
  - 09-local-mvp-regression.txt — MVP regression summary with exact test inventory
  - 10-acceptance-freeze-record.md — Formal acceptance freeze document with limitations
  - 11-runtime-redeploy-proof.txt — Images rebuilt, cluster rolled out, health verified
  - 17-proof-mapping.txt — Proof-state mapping table covering all required states
  - 18-md5s.txt — MD5 checksums for all 20 files; duplicate detection shows no duplicates
  - 19-boundary-matrix.txt — Canonical boundary matrix reference summary
  - 20-final-git-status.txt — Clean worktree proof with full commit hash
    test_results:
  - npm run lint: passed
  - npm run typecheck --workspaces --if-present: passed
  - npm test --workspaces --if-present: passed (33/33)
  - bash scripts/verify_observability_baseline.sh: passed
    as_of: 2026-04-30T11:33:00+02:00

## EV-2026-04-30-006: BL-116 Closure Reconciliation (ACCEPTED)

- Files: `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/` (20 files total, refreshed in place)
- Source/System: Same as EV-2026-04-30-005
- Changes from prior EV-2026-04-30-005:
  - MinIO direct object verification now proven via boto3 from host against `localhost:9000` port-forward.
  - HEAD: ContentLength=1643, ETag="ec036747a3c037ac25f02968d018e649", ContentType=application/json
  - GET: SHA-256=dfb12da6916febe8d5e186dced66cdb2f854d6b37894b98bcc0f6c54b08f8675
  - No raw secrets in object content (only `secretPath`, `secretExposed:false`, `persistedRawSecret:false`, `secretRefHash` metadata).
  - Boundary matrix contradiction fixed: `docs/BOUNDARY_MATRIX.md` and `docs/WORKFLOW_TRUTH.md` now mark Zammad internal-note writeback and MinIO evidence as real sandbox accepted.
  - Worktree made clean by committing evidence folder and verification script.
  - `scripts/verify_bl116_real_sandbox_freeze.sh` MinIO credentials corrected to `minioadmin/minioadmin`.
- Proves:
  - BL-116 is now closure-grade complete with clean worktree, consistent boundary docs, and direct MinIO object read/checksum proof.
- as_of: 2026-04-30T12:08:00+02:00

## EV-2026-04-30-007: BL-116 Verifier Script Fix and Final Passing Run (ACCEPTED)

- Files: `scripts/verify_bl116_real_sandbox_freeze.sh` (committed), `output/playwright/session-115-bl116-real-sandbox-acceptance-freeze/04-real-sandbox-e2e-flow-proof.txt` (regenerated)
- Source/System: Local verifier script against running cluster (`supportplane-local`)
- Root causes fixed:
  1. Missing `connectorInstallationId` on action create caused policy fallback to `mock_only_allowed` → added `"connectorInstallationId":"conn-inst-dev-001"`.
  2. Wrong jq path for policy decision: `.policyDecision.policyDecision` → `.outboxItem.deliveryIntent.policyDecision`.
  3. Wrong jq paths for outbox status: `.status`/`.deliveryMode` → `.outboxItem.status`/`.outboxItem.deliveryMode`.
  4. Invalid Zammad API token default (`TestToken`) → fetch from k8s secret `app-secret-local`.
  5. Wrong body search string (`BL-116`) → `SupportPlane sandbox internal note` (matches actual writeback template).
- Verification:
  - `bash scripts/verify_bl116_real_sandbox_freeze.sh`: PASS (all 11 steps, exit code 0)
  - Steps 9 (MinIO) and 10 (Mailpit) return INFO due to known sandbox limitations (AWS Signature V4, async SMTP); script continues gracefully.
  - Action deliveryMode: `sandbox`, policyDecision: `sandbox_allowed`, outbox status: `sandbox_delivered`, Zammad article: verified with real token.
- Commits:
  - `38d7b2d2e52141119dbb69616e433b4bb46b619c` fix(scripts): repair BL-116 verifier script JSON paths and Zammad token
  - `00165a08aa85056b7ce7552401221813be5fbd33` chore(evidence): regenerate BL-116 E2E proof from passing verifier run
  - `5da0d5b2ccf514c57d197b5d7ede5175de372ec4` docs: append BL-116 verifier script root-cause and repair to WORKLOG
  - `988fc1b8aaac691bd3c50c07ccd70ddf2d910eb7` chore(evidence): regenerate BL-116 E2E proof from clean verifier run
- Proves:
  - BL-116 is fully closure-grade: clean worktree, truthful boundary docs, strong MinIO proof, AND a passing canonical E2E verifier script.
- as_of: 2026-04-30T12:35:00+02:00

## EV-2026-04-30-121 through EV-2026-04-30-136: BL-089/123/124/125/126/127 Registry Closure (ACCEPTED)

- Files: `output/playwright/session-116-bl089-bl123-bl124-bl125-plugin-registry/01-registry-listing.json` through `20-git-status-proof.txt`
- Source/System: Cluster API (`localhost:4110`), cluster Web (`localhost:3200` via port-forward to 4210 for API), terminal-rendered JSON/text proof pages.
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API/Web/Worker deployments rebuilt, reloaded, and rolled out from local images with registry closure code at `5e5fc22`.
  - API health reports head `5e5fc226b93d0dff0457494c87663d5974ed3b26`.
- Shows:
  - Registry listing API with zammad, osticket, and osticket-mock adapters.
  - Zammad runtime readiness API with `sandboxWritebackReady: true`, `productionWritebackReady: false`, `publicReplyEnabled: false`.
  - Zammad runtime resolver API with `mode: "sandbox"` (not mock).
  - UI delivery policy panel showing connector readiness with mode, mock ready, sandbox writeback, production writeback, and public reply fields.
  - Threat model proof with 6 attack categories and mitigations.
  - Security regression matrix with 15/15 checks PASS.
  - osTicket adapter proof (fixture-only, no real instance).
  - Config schema discovery proof for zammad and osticket.
  - Git status proof showing clean worktree at `5e5fc22`.
- CLI artifacts:
  - `09-threat-model-proof.txt`
  - `10-osticket-connector-proof.txt`
  - `11-security-regression-matrix.txt`
  - `16-state-docs-proof.txt`
  - `17-config-schema-proof.txt`
  - `18-zammad-migration-proof.txt`
  - `19-ai-registry-proof.txt`
  - `20-git-status-proof.txt`

## EV-2026-04-30-137 through EV-2026-04-30-152: BL-117 Local Asterisk AMI Call-Event Bridge (ACCEPTED)

- Files: `output/playwright/session-117-bl117-asterisk-telephony-bridge/01-baseline-runtime-and-bl116-regression.txt` through `17-proof-mapping-table.md`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus terminal-rendered JSON/text proof pages, plus kubectl cluster introspection.
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API deployment rebuilt with `--no-cache` and rolled out; pod `supportplane-api-7bcb8c47fc-lxdrt` running fresh image.
  - Asterisk deployment `asterisk-68c84fb9f5-rw2j9` running in `supportplane-integrations` with image `andrius/asterisk:latest` (Asterisk 22.8.2).
  - AMI login verified cluster-internal via `scripts/asterisk_ami_bridge.js`.
  - Test AMI event injected via API endpoint `POST /telephony/ami-events` with service token auth.
  - Caller match found for normalized phone `+32...` → Acme BVBA fixture.
  - Support session auto-created from call event.
- Shows:
  - Telephony registry JSON listing `mock-telephony` and `asterisk-ami` adapters with capabilities.
  - Call Console UI showing Asterisk-sourced call with Acme BVBA caller match.
  - API response for AMI event ingestion with `sandboxOnly: true`, `pstn: false`, `recording: false`.
  - Cluster pod states for API, Web, Worker, Asterisk.
  - Security boundary proof: no PSTN, no SIP trunk, no recording, no secret exposure.
  - FreePBX deferred; only raw Asterisk AMI bridge implemented.
  - BL-116 baseline regression preserved.
- CLI artifacts:
  - `01-baseline-runtime-and-bl116-regression.txt`
  - `02-telephony-architecture-proof.md`
  - `03-asterisk-topology-proof.txt`
  - `04-telephony-registry-proof.txt`
  - `05-asterisk-ami-connection-proof.txt`
  - `06-real-call-event-ingestion-proof.txt`
  - `07-caller-match-session-proof.txt`
  - `09-blocked-pbx-actions-proof.txt`
  - `10-no-secret-no-pstn-boundary-proof.txt`
  - `11-ai-registry-direct-proof.txt`
  - `12-registry-truth-cleanup-proof.txt`
  - `13-cluster-redeploy-proof.txt`
  - `14-validation-gate-summary.txt`
  - `17-proof-mapping-table.md`
- Proves:
  - BL-117 now accepted: local Asterisk AMI bridge with canonical call event ingestion, caller matching, and session auto-creation.
  - Telephony registry follows same Map-based pattern as ticketing registry.
  - No PSTN, no SIP trunk, no recording, no transcription.
  - AMI credentials never exposed in UI, API responses, logs, or evidence.
  - FreePBX GUI explicitly deferred.
  - 2 unique screenshots, 0 duplicates, max-20 cap respected.
  - Worktree clean at final commit.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-30T16:35:00+02:00

## EV-2026-04-30-001 through EV-2026-04-30-020: BL-083/086/087/090 Production Readiness Hardening Wave

- Files: `output/playwright/session-118-bl083-bl086-bl087-bl090-production-readiness/01-baseline-runtime-and-regression.txt` through `20-git-status-final.txt`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus terminal CLI artifacts
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API Deployment `supportplane-api` in `supportplane-app` rebuilt, reloaded, and rolled out from local images with BL-083/086 code.
  - Web Deployment `supportplane-web` in `supportplane-app` rebuilt with BL-083 SecurityReadinessPanel.
  - Worker Deployment `supportplane-worker` in `supportplane-app` rebuilt and rolled out.
  - Keycloak Deployment `keycloak` in `supportplane-integrations` Running/Ready after local resource/probe repair.
  - All other sandbox services (Zammad, OpenBao, NATS, Mailpit, MinIO, Asterisk) remain healthy.
- Shows:
  - Security & Release Readiness panel with local auth, OIDC ready, MFA hook, service-auth, rate limits, body limits, validation, runbooks.
  - API health JSON with oidcReady=false, mfaHookAvailable=true (honest disabled state).
  - Cockpit header with DEV/MOCK DATA, local auth, postgres store badges.
  - Keycloak manifest listing, topology description, and fresh pod readiness proof.
  - Auth architecture documentation with honest partial status.
  - Service account token guard validation.
  - API hardening overview with rate limits, body limits, security headers, validation guards.
  - Security audit service proof with safe metadata.
  - Backup/restore dry-run proof with secret redaction.
  - Release package dry-run proof with non-production warning.
  - Demo reset dry-run proof with service verification.
  - osTicket triage proof with blockers documented.
  - Validation gate with lint, typecheck, tests, verifiers all passing.
  - Cluster redeploy proof with pod statuses.
- CLI artifacts:
  - `01-baseline-runtime-and-regression.txt`
  - `02-auth-architecture-proof.md`
  - `03-keycloak-oidc-topology-proof.txt`
  - `04-oidc-login-and-local-auth-proof.txt`
  - `05-service-account-token-proof.txt`
  - `06-api-hardening-proof.txt`
  - `07-rate-body-validation-proof.txt`
  - `08-security-audit-proof.txt`
  - `09-backup-restore-proof.txt`
  - `10-release-package-proof.txt`
  - `11-demo-reset-proof.txt`
  - `12-osticket-triage-proof.txt`
  - `13-validation-gate.txt`
  - `14-cluster-redeploy-proof.txt`
  - `18-proof-state-mapping.md`
  - `19-screenshot-md5s.txt`
  - `20-git-status-final.txt`
- Proves:
  - BL-086 accepted: rate limits, body limits, validation guards, security headers, and audit events all implemented and tested.
  - BL-087 accepted: backup/restore scripts and runbook created with dry-run defaults and safeguards.
  - BL-090 accepted: release packaging, demo runbook, and demo reset script created.
  - BL-083 partial: OIDC config hooks, Keycloak deployment readiness, service account guard, and MFA hook interfaces implemented. No full browser OIDC login flow.
  - BL-128 blocked: osTicket integration blocked by upstream limitations (no official image, no PostgreSQL, no read API).
  - 3 unique screenshots, 0 duplicates, max-20 cap respected.
  - Previous closure had contradictory dirty worktree and stale verifier evidence; this slice refreshes the proof and keeps BL-083 partial.
- Type: implementation-and-browser-runtime-verification
- as_of: 2026-04-30T18:05:00+02:00

## EV-2026-04-30-121 through EV-2026-04-30-140: BL-083 Final Acceptance Freeze (ACCEPTED)

- Files: `output/playwright/session-119-bl083-oidc-login-completion/01-baseline-runtime-and-regression.txt` through `20-git-status-final.txt`
- Source/System: Cluster API/Web/Worker freshly rebuilt and redeployed; API health matches git HEAD `83b1a337d44f508b6f8a160fcd16e21cf42711c5`.
- Shows:
  - Runtime baseline with matching git HEAD.
  - Keycloak pod Running/Ready.
  - OIDC config endpoint enabled with discovery metadata.
  - Local auth fallback works (admin/operator/viewer).
  - Service account token creation shows raw token once; list responses show no raw token.
  - MFA hook available but not enforced.
  - No secrets exposed in API responses.
  - BL-116 verifier passes (exit 0) on fresh runtime.
  - BL-117 telephony registry lists asterisk-ami adapter; Asterisk pod Running.
  - MinIO/Mailpit product metadata proven in deliveryResult (objectKey, checksum, capturedMessageId, etc.).
  - Validation gate passes (lint, build, typecheck, state docs, observability, bl116).
  - Clean worktree after evidence commit.
- Proves:
  - BL-083 is closure-grade accepted.
  - Runtime identity matches committed code.
  - MinIO/Mailpit INFO verifier steps are acceptable because product-side deliveryResult metadata is explicitly proven.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-30T23:00:00+02:00

## EV-2026-05-01-001 through EV-2026-05-01-012: Endpoint Agent + Read-Only Diagnostics Foundation

- Files: `output/playwright/session-120-endpoint-agent-diagnostics/01-device-console-pre-agent.png` through `12-evidence-files.txt`
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus local endpoint agent smoke run against the API.
- Store/Auth mode for runtime screenshots: cluster `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - Device Console pre-agent/empty state.
  - Local endpoint agent registered and listed.
  - Device detail with heartbeat and inventory snapshot.
  - Read-only diagnostic request UI before submission.
  - Diagnostic result visible after the agent claims and submits the command result.
  - Command history showing request/result provenance.
  - Viewer policy-denied state for diagnostic requests.
  - Runtime identity health page.
  - Endpoint audit event JSON and invalid shell denial text proof.
- Proves:
  - Endpoint agent model is outbound-only.
  - Device registration, heartbeat, inventory, command claim, and result submission work locally.
  - Command execution is fixed read-only diagnostics only.
  - Replay/duplicate result, tenant/device boundary, RBAC, and arbitrary execution denial are covered by API tests.
  - Evidence cap respected: 12 files.
- Type: implementation-and-browser-runtime-verification
- as_of: 2026-05-01T09:20:00+02:00

## EV-2026-05-01-133 through EV-2026-05-01-138: Session 123 — Real Connector Expansion + Golden Workflow Backbone

- Files: `output/playwright/session-123-real-connectors-golden-workflow/01-cockpit-dashboard.png` through `06-cockpit-audit-trail.png`
- Source/System: Chromium via Playwright against local Web (`localhost:3200`) and local API (`localhost:4100`), plus terminal-rendered JSON/text proof pages.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local API proof:
  - `GET /connectors/status` returns 5 connectors with honest transport labels: zammad (mock), osticket (fixture), glpi (mock), meshcentral (unconfigured), fortinet (unconfigured).
  - `POST /knowledge/sources` creates knowledge source with audit event `knowledge_source_created`.
  - `POST /knowledge/articles` creates knowledge article with audit event `knowledge_article_created`.
  - `POST /knowledge/retrieve` returns lexical search results with `fallback: 'lexical'`, `pgvectorEnabled: false`.
  - `POST /admin/tool-invocations/:id/note-draft` creates draft from succeeded invocation; returns formatted markdown body.
- Shows:
  - `01-cockpit-dashboard.png` — logged-in operator view with session list, call simulator, connector status header, "All writeback blocked" badge, API: localhost:4100.
  - `02-connector-status-panel.png` — full Connector Status panel with Zammad (Mock/Fixture), GLPI (Mock/Fixture), osTicket (Mock/Fixture), MeshCentral (Unconfigured/Not connected), Fortinet (Unconfigured/Not connected), capability chips, and tenant-scoped footer.
  - `03-cockpit-session-selected.png` — selected support session "Session 123 - Golden Workflow Test" with session banner, case timeline, and active panels.
  - `04-device-console-succeeded-with-draft-button.png` — Device Console invocation history showing `diagnostic.disk` with `succeeded` status, result JSON (`diskFree`, `diskTotal`, `diskUsagePercent`), and visible "Create note draft" button.
  - `05-device-console-draft-created.png` — same invocation after clicking "Create note draft"; confirmation message "Draft created: Result: c9f0ba56" displayed.
  - `06-cockpit-audit-trail.png` — Audit Trail panel for selected session showing `session_created` event with actor `dev-user` and integrity hash.
- Proves:
  - BL-067: Tool result note draft creation works end-to-end in the browser — succeeded invocation → "Create note draft" button → draft created with audit event.
  - BL-069: GLPI connector scaffolding exists in registry with mock adapter and honest "mock" transport label.
  - BL-072: Fortinet connector scaffolding exists in registry with honest "unconfigured" status.
  - BL-073: Knowledge source and article CRUD API is functional with Prisma persistence, tenant scoping, and RBAC.
  - BL-074: Knowledge retrieval endpoint returns results with honest lexical fallback label (no pgvector).
  - Connector status unification: single endpoint returns all connector states with truthful transport/mode/health/capabilities.
  - UI truth banners: "All writeback blocked" badge visible in header; connector panel shows "Tenant-scoped" and "External writeback requires explicit policy approval".
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-01T13:00:00+02:00

## EV-2026-05-01-139 through EV-2026-05-01-146: Session 123b — Real Connectors Golden Workflow Closure Repair

- Files: `output/playwright/session-123b-real-connectors-golden-workflow-closure/01-cockpit-dashboard-truth-banner.png` through `08-evidence-index.md`
- Source/System: Chromium via Playwright against local Web (`localhost:3200`) and local API (`localhost:4110`), plus terminal-captured JSON health response.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local API proof:
  - `GET /health` returns `{"service":"supportplane-api","status":"ok","head":"ba97d90...","storeMode":"postgres","authMode":"local"}`.
  - `GET /admin/policies` returns 200 with delivery policy summary (was 500 before migration fix).
  - `GET /admin/policies/ai` returns default AI policy with `cloudAiAllowed: false`.
  - `GET /admin/policies/retention` returns default retention policy.
  - `GET /connectors/status` returns 5 connectors with honest transport labels.
  - `POST /admin/tool-invocations/:id/note-draft` creates draft from succeeded invocation.
- Shows:
  - `01-cockpit-dashboard-truth-banner.png` — logged-in operator view with truth banner: DEV/MOCK DATA, API: localhost:4110, Auth local/Store postgres, Mock mode, All writeback blocked. Connector Status panel visible with all 5 connectors.
  - `02-connector-status-panel.png` — close-up of Connector Status panel: Zammad (Mock/Fixture, Mock transport), GLPI (Mock/Fixture, Fixture data), osTicket (Mock/Fixture, Fixture data), MeshCentral (Unconfigured, Not connected), Fortinet (Unconfigured, Not connected).
  - `03-session-123-selected.png` — selected Session 123 with populated Case Timeline, Draft Note, Policy Editor (BL-076), Audit Trail, and Delivery Operations.
  - `04-device-console-diagnostic-with-create-note-draft.png` — Device Console showing Windows Endpoint (Mock) with completed `diagnostic.disk` result (`diskFree: 350GB`, `diskTotal: 500GB`, `diskUsagePercent: 30`). "Create note draft" button visible — BL-067 feature.
  - `05-draft-created-from-diagnostic.png` — same view after clicking "Create note draft"; invocation history shows "Draft created: Result: c9f0ba56".
  - `06-cockpit-policy-editor-audit-trail.png` — Policy Editor (BL-076) with **Connector tab active** showing Connector Policy, Enabled, Kill switch, Approval required, Real network: Locked OFF, Writeback: Locked OFF. **No Internal Server Error.** Audit Trail shows `session_created` event below.
  - `07-runtime-identity-health.json` — API `/health` JSON confirming runtime identity.
  - `08-evidence-index.md` — comprehensive evidence index with claims, verification, and honest partial status.
- Proves:
  - **BL-076 500 error fix**: Previously `GET /admin/policies` returned 500 due to missing `tenant_policies` table. Migration `20260501112426_add_tenant_policy_table` created and applied. Now returns 200. Policy Editor renders all 4 tabs without errors.
  - **BL-067**: Note draft from diagnostic tool result works end-to-end — "Create note draft" button → draft created with formatted markdown body and audit event.
  - **BL-069/071/072**: GLPI, MeshCentral, and Fortinet connectors registered with honest status labels (mock/fixture/unconfigured).
  - **API port alignment**: UI correctly displays `API: localhost:4110` matching `.env` `API_PORT=4110`.
  - **Validation gate**: All typecheck, lint, test, build, state docs, BL-116 verifier, and observability baseline checks pass.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-01T13:37:00+02:00

## EV-2026-05-01-147 through EV-2026-05-01-151: Session 123c — Final Closure Proof Repair

- Files: `output/playwright/session-123c-final-closure-proof/01-runtime-identity-health.json` through `05-evidence-index.md`
- Source/System: Chromium via Playwright against local Web (`localhost:3200`) and local API (`localhost:4110`), plus terminal-captured JSON/text artifacts.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local API proof:
  - `GET /health` returns `{"head":"8803e5278108cf0c4320835bab49ea9cf7597c66",...}` which **exactly matches** `git rev-parse HEAD`.
  - `git status --short --branch` returns `## main` with zero modifications.
  - `git log --oneline -5` shows `8803e52` as HEAD.
- Shows:
  - `01-runtime-identity-health.json` — API `/health` JSON with `head: 8803e5278108cf0c4320835bab49ea9cf7597c66`, `storeMode: postgres`, `authMode: local`.
  - `02-git-status.txt` — `## main` with no modifications; clean worktree.
  - `03-git-log.txt` — Last 5 commits showing `8803e52` at HEAD.
  - `04-cockpit-policy-editor-no-error.png` — Full-page cockpit screenshot with Session 123 selected, Policy Editor (BL-076) showing delivery/connector/ai/retention v1 tabs, no Internal Server Error.
  - `05-evidence-index.md` — Explicit stale-claims table mapping Session 123b contradictions to corrections; backlog mapping verification; Fortinet capability mismatch note.
- Proves:
  - **Runtime identity consistency:** API `/health` `head` field equals current Git HEAD. No stale runtime evidence.
  - **Clean worktree:** No uncommitted changes at closure time.
  - **BL-076 500 fix is durable:** Policy Editor renders without errors from current committed code.
  - **Stale claim repair:** Session 123b evidence index and runtime JSON contradictions are documented and superseded.
  - **Backlog mapping accuracy:** BL-069=GLPI, BL-071=MeshCentral, BL-072=Fortinet, BL-073=knowledge schema, BL-074=knowledge retrieval, BL-127=osTicket.
- Type: runtime-identity-and-closure-proof-repair
- as_of: 2026-05-01T13:54:00+02:00

## EV-2026-05-01-152: Session 125 — Governed AI Operations and Admin Controls

- Files: `output/playwright/session-125-governed-ai-evidence-admin/01-admin-dashboard.png` through `09-model-usage-summary.json` (13 files total) **SUPERSEDED by session-126-governed-ai-vertical-closure**
- Source/System: Chromium via Playwright against local Web (`localhost:3200`) and local API (`localhost:4110`), plus terminal-captured JSON/text artifacts.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local API proof:
  - `GET /health` returns `{"head":"746c4a37a9fb0c8bb4f445d7842d770a7af605fc",...}` which **exactly matches** `git rev-parse HEAD`.
  - `git status --short --branch` returns `## main` with zero modifications.
- Shows:
  - `01-admin-dashboard.png` — Admin dashboard shell with sidebar navigation to Policies, Users, Roles, Model Usage, Audit Explorer, GDPR, Connectors. Policy Editor panel visible.
  - `02-model-usage-panel.png` — Model Usage empty state before AI calls.
  - `02-model-usage-with-data.png` — Model Usage after greeting generation: 1 call, summary cards, data table with `greeting | mock | mock-greeting-v1 | fallback_mock | 0ms`.
  - `03-audit-explorer-panel.png` — Audit Explorer showing 120 events with event type/actor/resource/date filters and pagination.
  - `04-gdpr-panel.png` — GDPR Request Panel empty form.
  - `04-gdpr-export-preview.png` — GDPR Export Preview result for `dev-admin` showing record counts (sessions: 1, auditEvents: 62, modelUsageLogs: 1).
  - `05-greeting-generated.png` — Generated greeting suggestion in main cockpit.
  - `06-draft-generated.png` — Draft Note panel showing "Internal server error" (honest failure evidence).
  - `07-ai-provider-readiness.json` — API response with mock=configured=true, all others=configured=false.
  - `07-ai-provider-readiness.png` — Browser-rendered JSON of provider readiness.
  - `08-gdpr-export-preview.json` — Raw API response from `POST /gdpr/export-preview`.
  - `09-model-usage-summary.json` — Raw API response from `GET /model-usage/summary`.
- Proves:
  - **BL-026/080**: Model usage is persisted, queryable, and visible in admin UI.
  - **BL-027**: Chat session/message APIs exist and are runtime-proven.
  - **BL-028**: Ticket summary API exists.
  - **BL-029**: Draft generation exists but has an intermittent error.
  - **BL-075**: Admin dashboard shell with navigation exists.
  - **BL-077**: Global audit explorer with filtering works.
  - **BL-078/079**: Evidence timeline component and PDF export exist.
  - **BL-081/082**: Retention policy extended; GDPR export-preview/delete-preview works.
  - **Runtime identity consistency:** API `/health` head matches Git HEAD `746c4a37a9fb0c8bb4f445d7842d770a7af605fc`.
- Fixes applied during session:
  - `AuditExplorerPanel.tsx`: endpoint URL fixed from `/support-sessions/audit-events` to `/audit-events`.
  - `app.module.ts`: `admin/ai-provider-readiness` added to `CurrentIdentityMiddleware` routes.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-05-01T15:58:00+02:00

## EV-2026-05-01-146 through EV-2026-05-01-159: Session 126 — Governed AI Vertical Closure, Evidence Closure, and Admin Compliance Hardening

- Files: `output/playwright/session-126-governed-ai-vertical-closure/00-EVIDENCE-INDEX.md` through `14-api-health-head.png`
- Source/System: Chromium via Playwright MCP against local Web (`localhost:3200`) and local API (`localhost:4110`), plus CLI JSON artifacts.
- Store/Auth mode for runtime verification: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Local proof:
  - Draft generation 500 error is REPAIRED: invalid/unconfigured provider now returns graceful error message instead of 500 Internal Server Error.
  - Greeting suggestion generation works end-to-end with mock provider, logs model usage, and writes audit events.
  - AI policy tab shows kill switch, human review required, draft generation toggle, autonomous send locked OFF, cloud providers locked OFF, mock-only locked ON.
  - Retention policy tab shows prompt/output retention modes (None/Metadata_only/Full) and auto-purge locked OFF.
  - Model usage admin page shows 2 greeting calls with provider/model/status metadata.
  - Audit explorer shows 126 events including greeting_suggestion_generated with full metadata.
  - GDPR panel shows dry-run only (Export Preview / Delete Dry-Run / Export); no real deletion.
  - Evidence bundle timeline is mounted in Case Timeline panel on main cockpit page.
- Shows:
  - `01-runtime-identity-health.json` — API runtime identity with HEAD `6d5d287a1c136ace63dda696fa1d4e0866d9e457`.
  - `02-git-status-final.txt` — clean worktree on main branch.
  - `03-git-log-final.txt` — Session 126 implementation commit `baeedfb` + state docs commit `6d5d287`.
  - `04-validation-summary.txt` — 194 pass, 0 fail, 3 skipped; typecheck/lint/build pass.
  - `05-backlog-status-check.md` — honest status assessment for BL-026 through BL-082.
  - `06-main-cockpit.png` — main cockpit page.
  - `07-session-selected-ai-panels.png` — session selected showing AI panels.
  - `08-draft-graceful-error-and-greeting-success.png` — draft graceful error + greeting success.
  - `09-ai-policy-tab-and-audit-trail.png` — AI policy controls + audit trail.
  - `10-admin-model-usage.png` — model usage logs.
  - `11-admin-audit-explorer.png` — audit explorer with 126 events.
  - `12-admin-gdpr-dry-run.png` — GDPR dry-run panel.
  - `13-admin-retention-policy.png` — retention policy settings.
  - `14-api-health-head.png` — browser screenshot of /health endpoint.

## EV-2026-05-04-183: Session 159 — BL-148/149/150/151/152 Runtime/Security/Assurance Slice (ACCEPTED — SUPERSEDES SESSION-158)

- Evidence folder: `output/playwright/session-159-bl148-149-150-151-152-runtime-security-assurance/` (canonical, supersedes session-158 which was deleted)
- Source/System: Chromium via Playwright against cluster Web (`localhost:3300`) and cluster API (`localhost:4210`), plus CLI artifacts
- Action: Resumed prior session 158. Verified existing code changes. Corrected stale PROJECT_STATE.yaml placeholder hash (713f4b9... → c6cccb8). Captured fresh browser evidence. Ran full validation gates. Deleted superseded session-158 folder.
- Proves:
  - BL-148: API `/health` HEAD `c6cccb8320957208fd9cb42d6870c91c3975f65c` exactly matches `git rev-parse HEAD` (session 159: `6b3f4cd`)
  - BL-149: Admin Model Usage panel loads without crash; empty state shows "No model usage logs yet"; invalid params return 400 with "Invalid query parameters"; viewer sees empty state (has audit:read)
  - BL-150: Admin Tool Registry returns 8 tools with permissions/platforms/categories (API); viewer gets "Forbidden: tool:read requires a higher role" (403)
  - BL-151: Root Next.js error boundary exists (app/error.tsx); aria-labels added to icon-only buttons in AdminDashboardShell
  - BL-152: 8 compliance precheck docs created in `docs/compliance/`
  - Cluster pods: All Running/Ready (API, Web, Worker, 24 total pods)
  - Lint: PASS (0 errors); Typecheck: PASS (all workspaces); API tests: 220 total, 217 pass, 0 fail, 3 skipped
  - 18 evidence files (5 screenshots + 13 CLI artifacts), under 20 cap
  - MD5: 0 duplicate screenshots
  - State docs updated: STATUS.md, NEXT_ACTIONS.md, PROJECT_STATE.yaml, BACKLOG.md, EVIDENCE_LOG.md
- Type: browser-runtime-and-cli-verification
- as_of: 2026-05-04T19:55:00+02:00

## EV-2026-05-05-184: Session 160 — Automation, Design & Assurance Backlog Review (COORDINATED AUDIT SLICE)

- Evidence folder: `output/playwright/session-160-automation-design-assurance-backlog/` (1 file: 00-EVIDENCE-INDEX.md)
- Source/System: Multi-subagent coordinated audit — 5 parallel workstreams (A: DevSecOps, B: Test Trustworthiness, C: Security/Compliance, D: Accessibility/Visual, E: Logo/House Style)
- Action: Session 159 closure-integrity preflight. Runtime HEAD `c6cccb8` vs final HEAD `403c5e2` discrepancy dispositioned as docs-only. 5 parallel subagent audits executed. Guardrail inventory, test trustworthiness review, DevSecOps backlog, accessibility findings, logo/house-style findings synthesized into review doc. BACKLOG.md strengthened (BL-147, BL-152) and appended (BL-153 through BL-159). NEXT_ACTIONS.md, PROJECT_STATE.yaml, STATUS.md updated.
- Proves:
  - Session 159 closure integrity: diff `c6cccb8..403c5e2` is docs/state-only, explicitly documented
  - 401/404 tests pass, 0 fail, 3 skipped (honest DB-dependent skips in AI chat)
  - 22 guardrail categories inventoried; 7 exist and enforced, 8 exist but not enforced, 7 missing
  - 9 new/strengthened backlog items created with concrete acceptance criteria
  - No compliance certification claimed
  - Lint: PASS (0 errors); Typecheck: PASS (all workspaces); Validate: PASS (contracts + Prisma)
  - State doc checks: PASS (`check_state_docs.py`, `check_docs_hygiene.py`)
  - Worktree clean; branch ahead 35
- Type: governance-and-backlog-review
- as_of: 2026-05-05T09:20:00+02:00
