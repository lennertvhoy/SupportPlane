# SupportPlane Status

**Updated At:** 2026-05-03 16:30 CEST
**Execution Mode:** operating
**Project State:** session_143_bl069_closure_hygiene
**Public URL:** not configured

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze.
- **BL-130/131/133 `[accepted]` — Windows endpoint real runner proof.** Session 134: GitHub Actions workflow passed on windows-latest (44/44 tests, 0 fail). Registration, heartbeat, diagnostics (services/software via real sc.exe/reg.exe), policy denial, no-secret scan all proven via Tailscale Funnel API.
- **BL-132 `[partial/service-scripts-ready]` — Windows service/packaging scripts.** Service install/uninstall/run-once PowerShell scripts created (sc.exe-based, no external deps). Syntactically validated on windows-latest. GitHub-hosted runner lacks admin privileges for service creation. Real Windows host with admin required for service lifecycle proof.
- **BL-069 `[accepted]` — GLPI real sandbox.** Egress decision label fixed (generic `allowed_local_sandbox_read`). Authenticated connector-status proves GLPI configured/real. GLPI-backed SupportPlane session context proven.
- **BL-127 `[blocked]` — osTicket.** 3 hard blockers: no read API, no PostgreSQL, no official container image. Fixture stub retained.
- **BL-071 `[partial/planned-real-sandbox]` — MeshCentral.** Selected as next real connector target after BL-069. Scaffolding exists.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `6dac67fbf367b10a857f55050d45e17f530a4a45`.
- Workflow-proven HEAD (BL-130/131/133): `c1d125227da85f05885631754b21d116860df8f8`.
- BL-132 packaging/workflow HEAD: `475c5102193424262873cf08d0f4c02201c1c501`.
- Final docs/state HEAD: `6dac67fbf367b10a857f55050d45e17f530a4a45`.
- Evidence BL-069: `output/playwright/session-141-session140-closure-repair/` (6 files), `output/playwright/session-142-glpi-supportplane-e2e-acceptance/` (12 files), `output/playwright/session-143-bl069-closure-hygiene/` (7 files).
- Token note: `local-endpoint-enrollment-token` is the source code default (visible in `apps/api/src/endpoint-devices/endpoint-devices.service.ts:37`). Not a production secret. Workflow now masks the token value via `::add-mask::` (Session 137 repair).
- Tailscale Funnel: OFF. Shut down at closure. Re-establish temporarily only if CI verification is needed again.
