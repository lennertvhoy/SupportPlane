# SupportPlane Status

**Updated At:** 2026-05-05 17:10 CEST
**Execution Mode:** operating
**Project State:** session_168_bl144_bl147_control_inventory_design_system_e2e_expansion
**Public URL:** not configured

## Snapshot

- **Local-mock items partial/local-mock:** BL-026/027/028/029/075/077/078/079/080/081/082. Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **Recently accepted items:** BL-061/062/063/064/066/067/068 (Tool Execution Safety), BL-086/087/090 (production readiness), BL-104-117/121 (real sandbox acceptance freeze), BL-130/131/133 (Windows endpoint real runner proof), BL-069 (GLPI real sandbox), BL-144/147 (Session 168: control inventory + design-system consistency).
- **Tester readiness [accepted]:** BL-141/142. Session 156: runtime identity exact match, Zammad ticket #2 + GLPI ticket #1 both loaded with real sandbox reads and browser proof, 6 distinct browser screenshots, preflight 15 PASS GO. Ready for first real tester.
- **First-Open UX Control Audit & Enterprise Readiness Pass [accepted]:** BL-143. Session 095: InfoTooltip/BoundaryLabel components, DemoGuidePanel with persistent Show/Hide, SandboxBoundaryPanel, main page reorganized, header Tools dropdown, ConnectorStatusPanel info tooltips, AuthGate sandbox warning. 17 evidence files.
- **Full Application Control Inventory [accepted]:** BL-144. Session 168: ~120+ interactive controls audited across all pages. 2 stubbed pages (Users, Roles) with honest inline notes. 8 safety controls locked. Added `control-inventory.spec.ts` with 7 role-boundary tests. All 26 E2E tests pass.
- **Design-System Consistency [accepted]:** BL-147. Session 168: Replaced arbitrary `text-[10px]`/`text-[11px]` with `text-xs` in admin shell and pages. Fixed disabled sidebar icon colors to use `text-cockpit-500`. Session 167: header typography standardized, IdentityPill simplified, EnvironmentStatus dropdown added.
- **Runtime/security assurance [accepted]:** BL-148/149/150/151/152. Session 158: rebuilt API/Web/Worker images, loaded to Kind cluster, restarted deployments, verified `/health` HEAD matches git HEAD.
- **Blocked/planned items:** BL-127 [blocked] (osTicket), BL-071 [partial/planned-real-sandbox] (MeshCentral), BL-145/146 [planned] (IA simplification, language audit).
- **Automation/design/assurance track:** BL-153 `[accepted]` CI quality gate. BL-154 `[partial]` 13 tests added. BL-155 `[partial/advanced]` secret scan, SAST, SBOM, license check, K8s validation. BL-156 `[accepted]` accessibility/contrast pass. **BL-157 `[accepted]` local browser E2E smoke gate — 26/26 Playwright tests green (8 spec files), control-inventory spec added. Remote CI unproven.** BL-158 `[partial]` runtime identity + evidence hygiene scripts. BL-159 `[partial]` SBOM + license checker.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.
- Remote E2E CI (BL-157 gap): `.github/workflows/e2e.yml` exists locally but never pushed to origin/main.

## Notes

- API HEAD (dev): `59b0501f7b283c536727cc5b0a9c00f5ea59b86d` (Session 168).
- BL-137 accepted (Session 144): User testing demo readiness.
- BL-138 accepted (Session 145): User testing operations.
- BL-139 accepted (Session 147/148): First user testing round.
- BL-140 accepted (Session 150/151): First real tester round ops.
- BL-141/142 accepted (Session 153/156): Tester readiness closure.
- BL-143 accepted (Session 095): First-Open UX Control Audit.
- BL-144/147 accepted (Session 168): Control inventory + design-system consistency.
- Evidence BL-143: `output/playwright/session-157-bl143-first-open-ux-enterprise-readiness/` (17 files).
- Evidence BL-141 + BL-142 (canonical): `output/playwright/session-156-final-tester-readiness-closure/` (20 files).
- Evidence BL-148/149/150/151/152: `output/playwright/session-159-bl148-149-150-151-152-runtime-security-assurance/` (16 files).
- Evidence BL-153: `output/playwright/session-161-ci-quality-gate-foundation/` (7 files).
- Evidence BL-156: `output/playwright/session-166-accessibility-contrast-visual-confidence/` (17 files).
- Evidence BL-144 + BL-147 (Session 168): `output/playwright/session-168-first-tester-control-visual-ci/` (12 files).
- Demo URL: `http://localhost:3300`, API: `http://localhost:4210`.
- Tailscale Funnel: OFF.
