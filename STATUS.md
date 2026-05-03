# SupportPlane Status

**Updated At:** 2026-05-03 15:10 CEST
**Execution Mode:** operating
**Project State:** session_135_bl132_windows_service_packaging
**Public URL:** not configured

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze.
- **BL-130/131/133 `[accepted]` — Windows endpoint real runner proof.** Session 134: GitHub Actions workflow passed on windows-latest (44/44 tests, 0 fail). Registration, heartbeat, diagnostics (services/software via real sc.exe/reg.exe), policy denial, no-secret scan all proven via Tailscale Funnel API.
- **BL-132 `[partial/service-scripts-ready]` — Windows service/packaging scripts.** Service install/uninstall/run-once PowerShell scripts created (sc.exe-based, no external deps). Syntactically validated on windows-latest. GitHub-hosted runner lacks admin privileges for service creation. Real Windows host with admin required for service lifecycle proof.
- **BL-073/074 partial/hybrid-ready; BL-129 partial/local-mock.** Knowledge retrieval with lexical fallback. Windows endpoint superseded by BL-130/131/133.
- **BL-134 accepted.** Documentation governance infrastructure plus high-leverage drift fixes (9 docs). Per-doc audit deferred to BL-135.
- **BL-136 accepted.** E2E demo readiness. Scenarios A (Zammad sandbox), B (Ollama AI), C (Governance/Audit/RBAC) proven. Scenario D (Windows) now proven in BL-130/131/133.

## Active Blockers

- No real cloud AI provider configured; all cloud slots return honest `configured: false`.
- OpenBao inmem storage (secrets lost on pod restart; reseed script available).
- osTicket integration blocked by upstream limitations.
- Windows MSI/EXE packaging (BL-132) not proven — auto-start, installer remain future work.

## Notes

- API HEAD (cluster): `94c961874070178442f819067d58d3665fcf3da3`.
- Workflow-proven HEAD (BL-130/131/133): `c1d125227da85f05885631754b21d116860df8f8`.
- BL-132 packaging/workflow HEAD: `475c5102193424262873cf08d0f4c02201c1c501`.
- Final docs/state HEAD: `2a03d1d395db3749d973f007f6b018f1a7ee914d`.
- Evidence: `output/playwright/session-134-windows-runner-ci-reachability/` (9 files, BL-130/131/133 proof), `output/playwright/session-135-session134-closure-safety-repair/` (6 files, repair), `output/playwright/session-136-windows-service-packaging-proof/` (5 files, BL-132 proof).
- Token note: `local-endpoint-enrollment-token` is the source code default (visible in `apps/api/src/endpoint-devices/endpoint-devices.service.ts:37`). Not a production secret. Workflow now masks the token value via `::add-mask::` (Session 137 repair).
- Tailscale Funnel: OFF. Shut down at closure. Re-establish temporarily only if CI verification is needed again.
