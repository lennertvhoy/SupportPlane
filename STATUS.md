# SupportPlane Status

**Updated At:** 2026-05-04 12:30 CEST
**Execution Mode:** operating
**Project State:** session_152_bl141_demo_ux_polish_observation_readiness
**Public URL:** not configured

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze.
- **BL-130/131/133 `[accepted]` — Windows endpoint real runner proof.** Session 134: GitHub Actions workflow passed on windows-latest (44/44 tests, 0 fail). Registration, heartbeat, diagnostics (services/software via real sc.exe/reg.exe), policy denial, no-secret scan all proven via Tailscale Funnel API.
- **BL-069 `[accepted]` — GLPI real sandbox.** Egress decision label fixed (generic `allowed_local_sandbox_read`). Authenticated connector-status proves GLPI configured/real.
- **BL-137/138/139/140/141 `[accepted]` — User testing pipeline + demo UX polish.** Sessions 144-152. One-command demo, 10/10 smoke, tester onboarding pack, bug capture, UI polish, session search/filter, demo guide panel, connector descriptions, favicon. Ready for real testers.
- **BL-127 `[blocked]` — osTicket.** 3 hard blockers: no read API, no PostgreSQL, no official container image. Fixture stub retained.
- **BL-071 `[partial/planned-real-sandbox]` — MeshCentral.** Selected as next real connector target after BL-069.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `8015c94c996621ae3d5498ae88f2f41e2fcd2bcb`.
- BL-137 accepted (Session 144): User testing demo readiness — one-command demo start, 10/10 smoke test pass, 5 browser screenshots, user testing docs created.
- BL-138 accepted (Session 145): User testing operations — tester onboarding pack (7 docs), bug context capture script, feedback triage workflow, UI polish, 6 browser screenshots, 10 CLI artifacts, 10/10 smoke test.
- BL-139 accepted (Session 147/148): First user testing round — tester packet, round plan, internal dry run, P1 API port fix, 4 browser screenshots, 13 evidence files, 10/10 smoke test. Session-148 closure proof repair (5 files, clean worktree proof).
- Evidence BL-139: `output/playwright/session-147-first-user-testing-round/` (13 files) + `output/playwright/session-148-bl139-closure-proof/` (5 files) + `output/playwright/session-149-bl139-final-truth-repair/` (5 files).
- Evidence BL-140: `output/playwright/session-150-first-real-tester-round-ops/` (14 files) + `output/playwright/session-151-bl140-final-truth-repair/` (5 files).
- Evidence BL-141: `output/playwright/session-152-demo-ux-polish-observation-readiness/` (14 files).
- Evidence BL-138: `output/playwright/session-145-user-testing-operations/` (18 files).
- Evidence BL-137: `output/playwright/session-144-user-testing-demo-readiness/` (17 files).
- Demo URL: `http://localhost:3300`, API: `http://localhost:4210`.
- Token note: `local-endpoint-enrollment-token` is the source code default (visible in `apps/api/src/endpoint-devices/endpoint-devices.service.ts:37`). Not a production secret. Workflow now masks the token value via `::add-mask::` (Session 137 repair).
- Tailscale Funnel: OFF. Shut down at closure. Re-establish temporarily only if CI verification is needed again.
