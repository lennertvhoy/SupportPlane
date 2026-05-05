# SupportPlane Status

**Updated At:** 2026-05-05 13:42 CEST
**Execution Mode:** operating
**Project State:** session_167_bl144_bl147_e2e_fixes_control_inventory_visual_ci
**Public URL:** not configured

## Snapshot

- **Local-mock items partial/local-mock:** BL-026/027/028/029/075/077/078/079/080/081/082. Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **Recently accepted items:** BL-061/062/063/064/066/067/068 (Tool Execution Safety), BL-086/087/090 (production readiness), BL-104-117/121 (real sandbox acceptance freeze), BL-130/131/133 (Windows endpoint real runner proof), BL-069 (GLPI real sandbox).
- **Tester readiness [accepted]:** BL-141/142. Session 156: runtime identity exact match, Zammad ticket #2 + GLPI ticket #1 both loaded with real sandbox reads and browser proof, 6 distinct browser screenshots, preflight 15 PASS GO. Ready for first real tester.
- **First-Open UX Control Audit & Enterprise Readiness Pass [accepted]:** BL-143. Session 095: InfoTooltip/BoundaryLabel components, DemoGuidePanel with persistent Show/Hide, SandboxBoundaryPanel, main page reorganized with primary/secondary split, header Tools dropdown, ConnectorStatusPanel info tooltips, AuthGate sandbox warning. Ticket ID defaults fixed (TICKET-101→2). 17 evidence files. Web image rebuilt/deployed. TypeScript/lint/tests pass (0 errors). Deferred to BL-144/145/146/147: full control inventory, IA simplification, language audit, design-system consistency.
- **Runtime/security assurance [accepted]:** BL-148/149/150/151/152. Session 158: BL-148 rebuilt API/Web/Worker images, loaded to Kind cluster, restarted deployments, verified `/health` HEAD matches git HEAD; BL-149 fixed ModelUsageService crash; BL-150 added Tool Registry RBAC; BL-151 added web error boundary & aria-labels; BL-152 created 8 compliance precheck docs.
- **Blocked/planned items:** BL-127 [blocked] (osTicket), BL-071 [partial/planned-real-sandbox] (MeshCentral), BL-145/146 [planned] (IA simplification, language audit). BL-144/147 [partial] (header control inventory and design-system consistency started in Session 167).
- **Automation/design/assurance track:** BL-153 `[accepted]` CI quality gate. BL-154 `[partial]` 13 tests added. BL-155 `[partial/advanced]` secret scan, SAST, SBOM, license check, K8s validation. **BL-156 `[accepted]` accessibility/contrast pass — 8 axe-core tests pass with 0 critical+serious violations, primary button 5.3:1, focus rings on all interactive elements, DESIGN.md created**. **BL-157 `[accepted]` browser E2E smoke gate — 19/19 Playwright tests green (8 spec files), axe-core scans integrated. Local E2E infra proven. Remote CI unproven**. BL-158 `[partial]` runtime identity + evidence hygiene scripts. BL-159 `[partial]` SBOM + license checker.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `c6cccb8320957208fd9cb42d6870c91c3975f65c` (Session 159 rebuilt/deployed).
- BL-137 accepted (Session 144): User testing demo readiness.
- BL-138 accepted (Session 145): User testing operations.
- BL-139 accepted (Session 147/148): First user testing round.
- BL-140 accepted (Session 150/151): First real tester round ops.
- BL-141/142 accepted (Session 153/156): Tester readiness closure.
- Evidence BL-143: `output/playwright/session-157-bl143-first-open-ux-enterprise-readiness/` (17 files).
- Evidence BL-141 + BL-142 (canonical): `output/playwright/session-156-final-tester-readiness-closure/` (20 files).
- Evidence BL-148/149/150/151/152: `output/playwright/session-159-bl148-149-150-151-152-runtime-security-assurance/` (16 files).
- Evidence BL-153: `output/playwright/session-161-ci-quality-gate-foundation/` (7 files).
- Demo URL: `http://localhost:3300`, API: `http://localhost:4210`.
- Tailscale Funnel: OFF.
