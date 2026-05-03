# SupportPlane Status

**Updated At:** 2026-05-03 14:10 CEST
**Execution Mode:** operating
**Project State:** session_134_windows_runner_ci_reachability
**Public URL:** https://ff-fedora.tail2dc90.ts.net (Tailscale Funnel, temporary)

## Snapshot

- **BL-026/027/028/029/075/077/078/079/080/081/082 partial/local-mock.** Draft generation 500 fixed. Admin shell, audit explorer, evidence timeline, PDF export, model usage, retention, GDPR remain local-mock with honest labels.
- **BL-061/062/063/064/066/067/068 and BL-086/087/090 and BL-104-117/121 accepted.** Tool Execution Safety, production readiness, real sandbox acceptance freeze.
- **BL-130/131/133 `[accepted]` — Windows endpoint real runner proof.** Session 134: GitHub Actions workflow passed on windows-latest (44/44 tests, 0 fail). Registration, heartbeat, diagnostics (services/software via real sc.exe/reg.exe), policy denial, no-secret scan all proven via Tailscale Funnel API.
- **BL-132 `[partial/harness-ready]` — Windows MSI/EXE packaging.** Installer and auto-start remain future work.
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
- Session 134 commit: `c1d125227da85f05885631754b21d116860df8f8` (provisional, may be updated after doc commits).
- Evidence: `output/playwright/session-134-windows-runner-ci-reachability/` (9 files).
- Public API: `https://ff-fedora.tail2dc90.ts.net` via Tailscale Funnel (temporary for CI verification).
- Windows workflow run: https://github.com/lennertvhoy/SupportPlane/actions/runs/25278634388 (SUCCESS).
- Enrollment token: `local-endpoint-enrollment-token` (hardcoded default; dev/demo only).
- Tailscale Funnel running: `tailscale funnel 4210` (API port-forward). Shut down with `tailscale funnel --https=443 off` if no longer needed.
