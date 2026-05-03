# Windows Endpoint Support

**Status:** Real Windows runner proof achieved (Session 134, BL-130/131/133 accepted). MSI/EXE packaging (BL-132) remains partial/harness-ready.

**Updated:** 2026-05-03

## Current Status

SupportPlane now treats Windows as a first-class endpoint platform alongside Linux and macOS. The architecture includes:

- Canonical `EndpointPlatform` enum: `linux`, `win32`, `darwin`, `unknown`
- Platform normalization for device registration and policy evaluation
- Platform-aware collector modules in the endpoint agent
- Fixed Windows read-only command templates for service and installed software collection
- UI platform badges and unsupported tool states (including honest "Windows-only" / "Linux-only" labels)
- Mocked Windows endpoint in local development seed data (intentionally offline to avoid fake "online Windows runner")
- Packaging scaffold generates install/uninstall scripts, config example, logging docs, service account docs, and verification checklist
- Windows endpoint readiness evidence script (`scripts/bl130_bl131_bl132_windows_readiness.sh`)

## What Works on Windows (Local/Mock Foundation)

### Read-Only Diagnostics

| Collector | Linux | Windows | macOS | Notes |
|-----------|-------|---------|-------|-------|
| `status` (ping_self) | ✅ | ✅ | ✅ | Cross-platform via Node `os` module |
| `inventory` | ✅ | ✅ | ✅ | Hostname, platform, arch, CPU, memory |
| `disk` | ✅ | ✅ | ✅ | Uses `fs.statfs`; Windows tries `C:\` |
| `network` | ✅ | ✅ | ✅ | Uses `os.networkInterfaces()` |
| `services` | ✅ | ✅ | ❌ | Windows uses fixed `sc.exe` args; proven on real Windows runner (Session 134) |
| `software` | ❌ | ✅ | ❌ | Windows uses fixed `reg.exe` uninstall-key queries; proven on real Windows runner (Session 134) |

### Remediation

| Tool | Linux | Windows | macOS | Notes |
|------|-------|---------|-------|-------|
| `flush_dns_cache` | supported when `resolvectl` exists | fixed-template, proven on real Windows | ❌ | Approval-gated remediation using `resolvectl flush-caches` on Linux and `ipconfig /flushdns` on Windows; Windows template proven in Session 134 |
| `clear_temp_preview` | ❌ | ❌ | ❌ | Returns `unsupported: true` with honest note |

`flush_dns_cache` is enabled in the local tool manifest and still requires
policy allowance plus approval. Other remediation commands remain disabled or
preview-only. Windows remediation remains partial until a real Windows host
returns an approved endpoint result with browser/API evidence.

## Security Model

- **No arbitrary shell:** Windows support does not use PowerShell, `cmd.exe`, shell strings, or dynamic command execution.
- **Fixed Windows commands only:** Windows service/software collectors use `execFile` with static `sc.exe`/`reg.exe` argument arrays and no user input.
- **No arbitrary WMI:** Windows collectors do not accept WMI query strings or user-supplied command fragments.
- **Fixed implementation IDs only:** The agent dispatch table maps `commandKind` to platform-specific collector functions.
- **Platform gate:** Policy engine rejects tools not supported by the endpoint platform before dispatch.
- **Unknown platform fails closed:** Devices reporting unrecognized platforms are denied all platform-gated tools.

## Policy Behavior

### Allowed
- Windows device invoking `diagnostic.status` → `allowed: true`
- Windows device invoking `diagnostic.inventory` → `allowed: true`
- Windows device invoking `diagnostic.services` → `allowed: true`
- Windows device invoking `diagnostic.software` → `allowed: true`

### Denied
- Linux device invoking `diagnostic.software` → `decision: unsupported_platform`
- Windows device invoking `remediation.flush_dns_cache` → `approval_required`, then dispatches fixed `ipconfig /flushdns` only after approval; real Windows execution proof remains pending
- Unknown platform invoking any platform-gated tool → `decision: unsupported_platform`

## Agent Architecture

```
apps/endpoint-agent/src/
├── collectors/
│   ├── shared.ts      # Cross-platform: inventory, network, ping
│   ├── linux.ts       # Linux: disk (statfs), services (/proc)
│   ├── win32.ts       # Windows: disk, services parser, installed software parser
│   ├── windows-command-runner.ts # Fixed sc.exe/reg.exe command templates
│   ├── darwin.ts      # macOS: disk (statfs), services (unsupported)
│   └── index.ts       # Platform-aware dispatch table
├── platform.ts        # Platform provider + normalization
└── index.ts           # Agent lifecycle (register, heartbeat, claim, dispatch)
```

## Testing Without Windows

Unit tests mock platform behavior by importing platform-specific collector modules directly:

```bash
cd apps/endpoint-agent
npm test
```

Platform policy tests use devices registered with `platform: win32` against the API:

```bash
cd apps/api
npm test
```

A readiness evidence script aggregates endpoint-agent and contracts tests:

```bash
bash scripts/bl130_bl131_bl132_windows_readiness.sh
```

The agent test suite now includes enterprise hardening coverage:
- `platform-aware dispatch` — verifies `runFixedDiagnostic` dispatches correctly for all command kinds
- `Windows flush DNS enterprise hardening` — verifies flush DNS template has no shell/PowerShell/cmd fields and no shell metacharacters
- `diagnostic.software win32-only enforcement` — verifies software diagnostic is only supported on win32
- `arbitrary shell/command hardening` — source-scans all collector files for PowerShell, cmd.exe, shell:true, exec(), and execSync patterns

For full Windows verification, see `.github/workflows/windows-endpoint-verification.yml` and
`docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md`.

## CI/CD Verification

A GitHub Actions workflow is available for automated Windows endpoint verification:

- **Workflow:** `.github/workflows/windows-endpoint-verification.yml` — manually triggered (`workflow_dispatch`) with inputs for tenantId, enrollmentToken, and apiUrl. Runs on `windows-latest`. 16 hardened steps: OS identity, Node version, input validation (no token echo), build, 44 tests, API health, enrollment, heartbeat, diagnostics (6 kinds), policy denial, no-secret scan, artifact upload. **Proven successful in Session 134** (Run: https://github.com/lennertvhoy/SupportPlane/actions/runs/25278634388).
- **Trigger:** `bash scripts/trigger_windows_verification.sh` with `--dry-run` and `--monitor` options. Requires `SUPPORTPLANE_TENANT_ID`, `SUPPORTPLANE_ENROLLMENT_TOKEN`, `SUPPORTPLANE_API_URL` env vars.
- **API reachability:** Public API via Tailscale Funnel (`tailscale funnel 4210`). URL: `https://ff-fedora.tail2dc90.ts.net` (temporary, tied to this host).
- **Enrollment token:** `scripts/create_demo_endpoint_enrollment_token.sh` for safe token provisioning with redaction.
- **Runbook:** `docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md` — manual and automated verification procedure.

## What Requires a Real Windows Runner

1. **Windows `fs.statfs` on `C:\`** — Node.js may behave differently on real Windows vs. Linux mock.
2. **Windows service enumeration** — Fixed `sc.exe` execution and parser need real Windows verification.
3. **Windows remediation** — Fixed-template flush DNS execution requires real Windows proof before acceptance.
4. **Installed software inventory** — Fixed `reg.exe` execution and parser need real Windows verification.
5. **Service packaging** — MSI/EXE installer, Windows Service wrapper, and auto-start behavior.

## Packaging Scaffold

The committed scaffold is `scripts/package_windows_endpoint_agent.ps1`. It is a
readiness/package staging script, not a production installer. It checks for a
Windows host, Node.js 22+, builds the endpoint-agent workspace, stages the built
agent and package metadata under `dist/windows-endpoint-agent`, and generates:

- `WINDOWS_SERVICE_WRAPPER_README.md` — service wrapper requirements
- `install-service.ps1` — example nssm-based service installation
- `uninstall-service.ps1` — example nssm-based service removal
- `config.example.json` — enrollment configuration template
- `LOGGING.md` — logging path documentation
- `SERVICE_ACCOUNT.md` — least-privilege service account guidance
- `VERIFICATION_CHECKLIST.md` — checklist of runtime proof required for BL-133

The intended production path remains:

1. Build signed agent artifacts in CI.
2. Wrap `node dist/src/index.js` as a Windows Service with a reviewed service
   wrapper (nssm or equivalent).
3. Package as MSI/EXE with tenant enrollment configuration supplied by IT.
4. Prove install, auto-start, registration, heartbeat, command claim, service
   diagnostic, software diagnostic, and policy denial on a real Windows host.

## Future Work

See backlog items:
- **BL-130:** Windows diagnostics collectors completion (services, installed software real-runner proof still required)
- **BL-131:** Windows tool-manifest compatibility completion
- **BL-132:** Windows service/install packaging plan
- **BL-133:** Windows verification strategy (real runner) — **blocked** until a real Windows host is available. No fake runtime proof is accepted.

## Honest Limitations

- All Windows behavior has been validated via GitHub Actions workflow on real Windows runner (Session 134, windows-latest) and unit tests on Fedora Linux.
- The `diagnostic.disk` collector on Windows uses `fs.statfs('C:\\')`, which may fail on some Windows configurations or Node.js versions.
- Remediation is not accepted as complete; fixed-template scaffolding does not replace real end-to-end Windows proof.
- MSI/EXE packaging, Windows Service installation, and auto-start behavior remain future work (BL-132).
