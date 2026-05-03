# Windows Endpoint Verification Runbook

**Version:** 1.0.0
**Updated:** 2026-05-03
**BL-133:** Windows verification strategy — blocked until real Windows host

## Purpose

This runbook describes the exact steps to build, run, and verify the SupportPlane endpoint agent on a real Windows host. It serves as the acceptance procedure for BL-133.

## Prerequisites

| Requirement | Minimum | Verified With |
|---|---|---|
| Windows host | Windows 10 / Server 2019+ | `[System.Environment]::OSVersion` |
| Node.js | 22.0.0+ | `node --version` |
| npm | included with Node 22 | `npm --version` |
| SupportPlane API | running and reachable | `curl $API_URL/health` |
| Enrollment token | issued by SupportPlane | provided by operator |
| Tenant ID | valid SupportPlane tenant | provided by operator |
| Network access | outbound HTTPS to API | `Test-NetConnection $API_URL -Port 443` |

## Method A: Manual Verification on Windows Host

### 1. Clone and Install

```powershell
git clone <repo-url> SupportPlane
cd SupportPlane
npm ci
```

### 2. Build the Endpoint Agent

```powershell
cd apps/endpoint-agent
npx tsc
```

Expected output: `dist/` directory populated with compiled JavaScript. No TypeScript errors.

### 3. Run Unit Tests

```powershell
node --test dist/test/**/*.test.js
```

Expected output:
```
▶ endpoint-agent read-only collectors
  ✔ collects inventory without mutation
  ✔ collects network summary
  ✔ dispatches only fixed diagnostic commands
▶ platform provider
  ✔ returns a recognized platform or unknown
  ✔ normalizes platform strings correctly
  ✔ returns display labels
▶ platform-specific collectors
  ✔ linux disk collector returns volumes
  ✔ linux services collector returns processes array
  ✔ win32 disk collector returns volumes
  ✔ win32 services collector reports unsupported on non-Windows hosts
  ✔ win32 software collector reports unsupported on non-Windows hosts
  ✔ linux and darwin software collectors return honest unsupported responses
  ✔ darwin services collector reports unsupported
  ✔ Windows flush DNS uses only the fixed command template...
  ✔ Linux flush DNS is unsupported when systemd-resolved tooling...
  ✔ macOS remediation remains unsupported...
  ✔ win32 clearTempPreview returns unsupported...
  ✔ linux clearTempPreview returns unsupported...
  ✔ runWindowsReadonlyCommand rejects on non-win32 platforms
▶ win32 parser fixtures and command templates
  ✔ parses sc.exe service query output
  ✔ parses reg.exe uninstall output...
  ✔ uses fixed Windows command templates without shell...
  ✔ Windows readonly command templates contain no interpolation...
  ✔ parses empty sc.exe output
  ✔ parses malformed sc.exe output...
  ✔ parses empty reg.exe output
  ✔ parses malformed reg.exe output...
  ✔ parses reg.exe output with unexpected lines...
▶ platform-aware dispatch
  ✔ runFixedDiagnostic dispatches collect_software...
  ✔ runFixedDiagnostic dispatches collect_services...
  ✔ runFixedDiagnostic dispatches collect_disk...
  ✔ runFixedDiagnostic dispatches flush_dns_cache...
  ✔ runFixedDiagnostic dispatches clear_temp_preview...
  ✔ runFixedDiagnostic rejects unknown command kinds
▶ Windows flush DNS enterprise hardening
  ✔ WINDOWS_FLUSH_DNS_TEMPLATE has no shell, powershell, or cmd fields
  ✔ WINDOWS_FLUSH_DNS_TEMPLATE args are free of shell metacharacters
  ✔ LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE args are free...
  ✔ Windows flushDnsCache denies shell metacharacters...
▶ diagnostic.software win32-only enforcement
  ✔ collect_software via runFixedDiagnostic is unsupported on non-win32
  ✔ win32.collectSoftware reports unsupported on non-Windows hosts...
▶ arbitrary shell/command hardening...
  ✔ no collector source file contains PowerShell, cmd.exe, shell:true...
  ✔ all WINDOWS_READONLY_COMMANDS use only fixed sc.exe or reg.exe...
  ✔ no collector module exports a function named like a shell...
  ✔ WINDOWS_FLUSH_DNS_TEMPLATE commandTemplate uses userInputUsed: false
ℹ tests XX
ℹ suites XX
ℹ pass XX
ℹ fail 0
```

All tests must pass with **0 failures**.

### 4. Register the Endpoint Agent

Set environment variables (replace with real values):

```powershell
$env:SUPPORTPLANE_TENANT_ID = "<your-tenant-id>"
$env:SUPPORTPLANE_ENROLLMENT_TOKEN = "<your-enrollment-token>"
$env:SUPPORTPLANE_API_URL = "https://api.supportplane.example.com"
```

Run registration:

```powershell
node dist/src/index.js --register
```

Expected output:
```
[agent] registering with SupportPlane API...
[agent] platform: win32
[agent] enrollment accepted, agentId: <uuid>
```

### 5. Send Heartbeat

```powershell
node dist/src/index.js --heartbeat
```

Expected output:
```
[agent] heartbeat sent
[agent] commands pending: 0
```

### 6. Run Diagnostic Commands

```powershell
node dist/src/index.js --diagnostic inventory
node dist/src/index.js --diagnostic disk
node dist/src/index.js --diagnostic network
node dist/src/index.js --diagnostic services
node dist/src/index.js --diagnostic software
node dist/src/index.js --diagnostic status
```

Expected `inventory` output (example):
```json
{
  "hostname": "WIN-DESKTOP-01",
  "platform": "win32",
  "arch": "x64",
  "cpu": { "model": "...", "cores": 8 },
  "memory": { "totalBytes": 17179869184, "freeBytes": 8589934592 },
  "agentVersion": "0.1.0-readonly",
  "readOnly": true
}
```

Expected `services` output (real Windows only):
```json
{
  "services": [
    { "serviceName": "EventLog", "displayName": "Windows Event Log", "type": "30  WIN32", "state": "RUNNING" },
    ...
  ],
  "readOnly": true,
  "source": "sc.exe query type= service state= all"
}
```

Expected `software` output (real Windows only):
```json
{
  "software": [
    { "name": "Node.js", "version": "22.0.0", "publisher": "Node.js Foundation", ... },
    ...
  ],
  "readOnly": true
}
```

### 7. Verify Policy Denial

Attempt a tool not supported on Windows:

```powershell
# clear_temp_preview should be denied (enabled: false, linux only)
# flush_dns_cache should require approval (approvalRequired: true)
```

Expected behavior:
- `clear_temp_preview` → API returns `decision: unsupported_platform` or agent returns `unsupported: true`
- `flush_dns_cache` → API returns `approval_required` before executing `ipconfig /flushdns`

## Method B: GitHub Actions Workflow (Automated)

Trigger the workflow manually from the Actions tab:

1. Navigate to **Actions > Windows Endpoint Verification**
2. Click **Run workflow**
3. Fill in:
   - `tenantId`: your tenant ID
   - `enrollmentToken`: your enrollment token
   - `apiUrl`: your SupportPlane API URL
4. Click **Run workflow**

The workflow file: `.github/workflows/windows-endpoint-verification.yml`

The workflow:
- Checks out the repo
- Sets up Node.js 22
- Runs `npm ci`
- Builds the endpoint-agent workspace
- Runs all unit tests
- Registers the agent against the API
- Sends a heartbeat
- Runs all diagnostic commands
- Uploads output as build artifacts

## Verification Checklist (BL-133)

- [ ] Endpoint agent builds without errors on Windows (`npx tsc`)
- [ ] All unit tests pass (0 failures) on a real Windows host
- [ ] `process.platform === 'win32'` confirmed at runtime
- [ ] Agent registers with API (`--register`) and receives an agentId
- [ ] Agent sends heartbeat successfully (`--heartbeat`)
- [ ] `diagnostic.inventory` returns platform: win32
- [ ] `diagnostic.disk` returns C:\ volume stats
- [ ] `diagnostic.network` returns network interfaces
- [ ] `diagnostic.services` returns Windows service list from `sc.exe`
- [ ] `diagnostic.software` returns installed software from `reg.exe`
- [ ] `diagnostic.status` returns ok: true
- [ ] `remediation.flush_dns_cache` uses fixed `ipconfig /flushdns` template
- [ ] `remediation.clear_temp_preview` returns unsupported: true
- [ ] No PowerShell, cmd.exe, or arbitrary shell execution in any collector path
- [ ] Fixed Windows commands use `execFile` with `shell: false`
- [ ] No user input reaches command argument arrays
- [ ] Manifest tool `diagnostic.software` is `supportedPlatforms: ["win32"]` only
- [ ] Manifest tool `remediation.clear_temp_preview` is `enabled: false` on Windows

## Honest Limitations

- **Real Windows runtime proof is pending.** All tests in this slice pass on Linux; full Windows end-to-end verification requires a real Windows host (physical, VM, or GitHub Actions `windows-latest` runner).
- **API connectivity** requires the SupportPlane API to be reachable from the Windows host. If the API is not publicly accessible, configure VPN or network routing.
- **Enrollment token** must be provisioned by a SupportPlane operator before registration.
- **Service wrapper** (nssm, Windows Service) is not verified in this runbook. See `scripts/package_windows_endpoint_agent.ps1` for packaging scaffold.
- **MSI/EXE packaging** is out of scope for this verification slice.

## Related Documents

- `.github/workflows/windows-endpoint-verification.yml` — Automated verification workflow
- `docs/WINDOWS_ENDPOINT_SUPPORT.md` — Windows endpoint support overview
- `scripts/package_windows_endpoint_agent.ps1` — Windows packaging scaffold
- `scripts/bl130_bl131_bl132_windows_readiness.sh` — Linux-based readiness evidence script
