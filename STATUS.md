# SupportPlane Status

**Updated At:** 2026-05-04 16:50 CEST
**Execution Mode:** operating
**Project State:** session_095_bl143_first_open_ux_enterprise_readiness_partial
**Public URL:** not configured

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze.
- **BL-130/131/133 `[accepted]` — Windows endpoint real runner proof.** Session 134: GitHub Actions workflow passed on windows-latest (44/44 tests, 0 fail). Registration, heartbeat, diagnostics (services/software via real sc.exe/reg.exe), policy denial, no-secret scan all proven via Tailscale Funnel API.
- **BL-069 `[accepted]` — GLPI real sandbox.** Egress decision label fixed (generic `allowed_local_sandbox_read`). Authenticated connector-status proves GLPI configured/real.
- **BL-141/142 `[accepted]` — Tester readiness closure-grade.** Session 156: runtime identity exact match, Zammad ticket #2 + GLPI ticket #1 both loaded with real sandbox reads and browser proof, 6 distinct browser screenshots, preflight 15 PASS GO, GLPI ticket loader added to Web UI, 20 evidence files. Sessions 153/155 superseded. Ready for first real tester.
- **BL-143 `[partial]` — First-Open UX Control Audit & Enterprise Readiness Pass.** Session 095: InfoTooltip/BoundaryLabel components, improved DemoGuidePanel with persistent Show/Hide, SandboxBoundaryPanel, main page reorganized with primary/secondary split, header Tools dropdown, ConnectorStatusPanel info tooltips, AuthGate sandbox warning. 8 browser screenshots + 3 CLI artifacts. Web image rebuilt/deployed. TypeScript/lint/tests pass.
- **BL-127 `[blocked]` — osTicket.** 3 hard blockers: no read API, no PostgreSQL, no official container image. Fixture stub retained.
- **BL-071 `[partial/planned-real-sandbox]` — MeshCentral.** Selected as next real connector target after BL-069.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `61d52b018188c8fd0ef20c032a9adb7384f70622` (Session 095 web image rebuilt/deployed).
- BL-137 accepted (Session 144): User testing demo readiness.
- BL-138 accepted (Session 145): User testing operations.
- BL-139 accepted (Session 147/148): First user testing round.
- BL-140 accepted (Session 150/151): First real tester round ops.
- BL-141/142 accepted (Session 153/156): Tester readiness closure.
- Evidence BL-143: `output/playwright/session-095-bl143-first-open-ux-enterprise-readiness/` (11 files).
- Evidence BL-141 + BL-142 (canonical): `output/playwright/session-156-final-tester-readiness-closure/` (20 files).
- Demo URL: `http://localhost:3300`, API: `http://localhost:4210`.
- Tailscale Funnel: OFF.
