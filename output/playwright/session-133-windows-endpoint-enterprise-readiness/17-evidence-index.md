# Session 133 — Windows Endpoint Enterprise Readiness — Evidence Index

**Date:** 2026-05-03
**Session:** 133
**Git HEAD:** ec71fca5d75f40ff14942c5608557c34cc6c6106 (final Session 133 commit, ahead 10)

## Evidence Artifacts

| # | File | Type | Proves | BL Item | Scenario | Limitations |
|---|------|------|--------|---------|----------|-------------|
| 01 | `01-api-health.json` | CLI/API | API runtime healthy, HEAD matches, storeMode=postgres, authMode=local | BL-136 | Runtime identity | Cluster API port-forward 4211 |
| 02 | `02-connector-status.json` | CLI/API | Zammad transport=real, credentialSource=vault; GLPI/osTicket/MeshCentral/Fortinet honest status | BL-107 | Sandbox readiness | Requires cluster running |
| 03 | `03-tool-registry.json` | CLI/API | Tool manifest registry listing with platform support flags | BL-131 | Windows manifest audit | Admin endpoint only |
| 04 | `04-openbao-reseed-proof.txt` | CLI | OpenBao secret seeded at v3, Zammad credential resolved via vault, API confirms credentialSource=vault | BL-109 | OpenBao durability | Inmem storage; reseed still needed after restart |
| 05 | `05-minio-evidence-checksum-proof.txt` | CLI | MinIO bucket supportplane-evidence with 50+ artifacts, SHA-256 checksum verified, no raw secrets | BL-112 | MinIO evidence | AWS S3 Signature V4; boto3 direct proof |
| 06 | `06-zammad-writeback-safety-proof.txt` | CLI | productionWritebackReady=false, publicReplyEnabled=false, sandboxWritebackReady=true, kill switch active | BL-111 | Zammad writeback safety | Sandbox-only; no production |
| 07 | `07-sandbox-readiness-summary.txt` | CLI | Combined summary: OpenBao (PASS), MinIO (PASS), Zammad (PASS) | BL-109/111/112 | Sandbox readiness | Cluster-dependent |
| 08 | `08-contradiction-review.txt` | Audit | 10-file contradiction hunt: 3 critical, 7 moderate, 23 total findings | — | Truth audit | Findings fixed in same session |
| 09 | `09-windows-manifest-audit.txt` | Audit | 8 tools audited, 0 issues: all flags honest, no unsafe shell/cmd/powershell fields | BL-131 | Windows manifest audit | Linux-only audit |
| 10 | `10-windows-agent-test-results.txt` | Test | 44/44 endpoint-agent tests pass: platform dispatch, flush DNS hardening, software enforcement, shell hardening | BL-130/131 | Test coverage | Linux-tested; Windows real-runner pending |
| 11 | `11-windows-harness-summary.txt` | Artifact | GitHub Actions workflow (windows-latest, 8 steps), runbook (17-item checklist), packaging scaffold | BL-133 | Harness creation | Requires real Windows execution |
| 12 | `12-admin-policies.json` | CLI/API | Admin policy list showing delivery, connector, AI, retention policies | BL-136 | Governance/RBAC | Local auth |
| 13 | `13-ai-policy.json` | CLI/API | AI policy: allowedProviders includes ollama, safetyFlags.mockOnly=true, autonomousSend locked OFF | BL-136 | AI governance | mockOnly is safety net, not runtime signal |
| 14 | `14-audit-events.json` | CLI/API | Last 5 audit events with actor, tenant, event type, timestamp | BL-136 | Audit proof | — |
| 15 | `15-git-status-postcommit.txt` | CLI | Final post-commit git status: branch main, ahead 10, clean worktree, HEAD ec71fca | — | Worktree | Post-commit proof |
| 16 | `16-validation-gate.txt` | CLI | Full validation: lint PASS, typecheck PASS, agent 44/44, API 210/210, state docs PASS, docs hygiene PASS | — | Validation | — |
| 17 | `17-evidence-index.md` | Index | This file | — | — | — |

## Proof Summary

### Windows Endpoint (BL-130/131/132/133)
- **Status: HARBESS-READY (not accepted)**
- No real Windows host available for execution
- GitHub Actions workflow created (.github/workflows/windows-endpoint-verification.yml)
- Manual verification runbook created (docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md)
- Endpoint agent tests strengthened: 44/44 pass (up from 28)
- Tool manifest audit: 8 tools, 0 issues, all flags honest
- Requires real Windows runner (windows-latest or manual host) for BL-133 acceptance

### Sandbox Durability
- **OpenBao:** Secret re-seeded successfully (v3). API confirms credentialSource=vault, transport=real. Reseed script reliable.
- **MinIO:** 50+ evidence objects in bucket, SHA-256 checksum verified. No raw secrets in content.
- **Zammad writeback:** Safety gates verified: productionWritebackReady=false, publicReplyEnabled=false, sandboxWritebackReady=true. All defaults safe.

### Endpoint Enterprise Hardening
- 44 agent tests: platform-aware dispatch, Windows flush DNS hardening, software win32-only enforcement, arbitrary shell/command hardening
- Tool manifest audit: 8 tools, all platform flags honest, no unsafe fields
- Windows-specific collectors: fixed sc.exe/reg.exe templates, non-Windows fallback with honest unsupported label
- API tests: 210/210 pass (3 skipped)

### Documentation
- 3 critical contradictions fixed (STATUS.md, SANDBOX_INTEGRATION_ACCEPTANCE.md, ENTERPRISE_DEMO_GUIDE.md)
- 7 docs updated for accuracy
- REALITY_MATRIX reconciled: Zammad→REAL_SANDBOX_NOW, Ollama port fixed, summary counts corrected
- PROJECT_STATE.yaml YAML parse errors fixed
- New docs: WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md

## Source Provenance
- **Linux host (Fedora 43):** All code, tests, CLI artifacts
- **K8s cluster (Kind/Podman):** API evidence via port-forward 4211
- **Browser/computer-use:** Not available (no visible browser). API CLI artifacts used as browser equivalent.
- **Windows host:** NOT available. All Windows claims are fixture-level/test-only.

## Total Files: 17 (under 20-file hard cap)
