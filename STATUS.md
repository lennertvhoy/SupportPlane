# SupportPlane Status

**Updated At:** 2026-05-04 20:15 CEST
**Execution Mode:** operating
**Project State:** session_158_bl148_149_150_151_runtime_security_assurance_accepted
**Public URL:** not configured

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 and BL-130/131/133 and BL-069 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze, Windows endpoint real runner proof, GLPI real sandbox.
- **BL-141/142 `[accepted]` — Tester readiness closure-grade.** Session 156: runtime identity exact match, Zammad ticket #2 + GLPI ticket #1 both loaded with real sandbox reads and browser proof, 6 distinct browser screenshots, preflight 15 PASS GO. Ready for first real tester.
- **BL-143 `[accepted]` — First-Open UX Control Audit & Enterprise Readiness Pass.** Session 095: InfoTooltip/BoundaryLabel components, DemoGuidePanel with persistent Show/Hide, SandboxBoundaryPanel, main page reorganized with primary/secondary split, header Tools dropdown, ConnectorStatusPanel info tooltips, AuthGate sandbox warning. Ticket ID defaults fixed (TICKET-101→2). 17 evidence files. Web image rebuilt/deployed. TypeScript/lint/tests pass (0 errors). Deferred to BL-144/145/146/147: full control inventory, IA simplification, language audit, design-system consistency.
- **BL-148 `[accepted]` — Runtime Identity Truth Repair & Cluster Redeploy.** Session 158: Rebuilt API/Web/Worker images from HEAD bf4f44e, loaded to Kind cluster, restarted deployments, verified `/health` HEAD matches `git rev-parse HEAD`.
- **BL-149 `[accepted]` — Model-Usage Crash Fix & Admin Dashboard Repair.** Session 158: Fixed ModelUsageService Prisma client initialization crash by wrapping createPrismaClient in try/catch. Controller Zod error handling and ModelUsageQuery z.coerce.number() from prior dirty files preserved. Added API tests for empty state, invalid params (400), viewer access. Admin Model Usage panel loads without crash.
- **BL-150 `[accepted]` — Tool Registry RBAC & Tenant Scoping Hardening.** Session 158: Added requirePermission(tool:read) guards to ToolRegistryController. Added 'tool:read' to operator/admin roles. Added negative tests proving viewer denied (403) and admin allowed (200). UI shows clean denied state: "Forbidden: tool:read requires a higher role".
- **BL-151 `[accepted]` — Web Resilience & Accessibility Foundation (minimal).** Session 158: Added root Next.js error boundary (app/error.tsx) with recovery action and dark-theme consistent UI. Added aria-label to icon-only buttons in AdminDashboardShell. No full accessibility pass claimed.
- **BL-152 `[partial/readiness-dossier-created]` — Belgium/EU Assurance Audit.** Session 158: 8 compliance precheck docs created in `docs/compliance/`. Remaining: formal DPO review, pen test, SBOM generation, incident response runbook, accessibility hardening, container image scanning.
- **BL-127 `[blocked]` — osTicket.** 3 hard blockers: no read API, no PostgreSQL, no official container image. Fixture stub retained.
- **BL-071 `[partial/planned-real-sandbox]` — MeshCentral.** Selected as next real connector target after BL-069.
- **BL-144/145/146/147 `[planned]`.** Full control inventory, enterprise IA simplification, production-readiness language audit, design-system consistency pass.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `bf4f44ec07eb6c7fba6762cba352dfbf06858a36` (Session 158 rebuilt/deployed).
- BL-137 accepted (Session 144): User testing demo readiness.
- BL-138 accepted (Session 145): User testing operations.
- BL-139 accepted (Session 147/148): First user testing round.
- BL-140 accepted (Session 150/151): First real tester round ops.
- BL-141/142 accepted (Session 153/156): Tester readiness closure.
- Evidence BL-143: `output/playwright/session-157-bl143-first-open-ux-enterprise-readiness/` (17 files).
- Evidence BL-141 + BL-142 (canonical): `output/playwright/session-156-final-tester-readiness-closure/` (20 files).
- Evidence BL-148/149/150/151/152: `output/playwright/session-158-bl148-149-150-151-152-large-runtime-security-assurance-slice/` (12 files).
- Demo URL: `http://localhost:3300`, API: `http://localhost:4210`.
- Tailscale Funnel: OFF.
