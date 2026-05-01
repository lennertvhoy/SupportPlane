param(
  [string]$OutputDir = "dist/windows-endpoint-agent"
)

$ErrorActionPreference = "Stop"

if ($IsWindows -ne $true) {
  throw "Windows endpoint packaging scaffold must run on Windows. This script does not prove BL-133 by itself."
}

$nodeVersion = (& node --version)
if ($LASTEXITCODE -ne 0) {
  throw "Node.js 22+ is required before packaging the endpoint agent."
}

if (-not ($nodeVersion -match '^v(2[2-9]|[3-9][0-9])\.')) {
  throw "Node.js 22+ is required. Found $nodeVersion."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

npm run build --workspace "@supportplane/contracts"
npm run build --workspace "@supportplane/endpoint-agent"

$target = Join-Path $repoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $target | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $target "dist") | Out-Null

Copy-Item -Recurse -Force "apps/endpoint-agent/dist/*" (Join-Path $target "dist")
Copy-Item -Force "apps/endpoint-agent/package.json" (Join-Path $target "package.json")
Copy-Item -Force "apps/endpoint-agent/README.md" (Join-Path $target "README.md")

@"
# Windows Service Wrapper Readiness

This directory is a staged SupportPlane endpoint-agent artifact, not an MSI/EXE.

Reviewed service-wrapper requirements:
- Run `node dist/src/index.js` as a Windows Service under a least-privilege account.
- Store tenant ID, device key, enrollment token, API URL, and device token outside the package artifact.
- Auto-start on boot only after IT enrollment configuration is present.
- Preserve stdout/stderr logs in a local supportable location.
- Do not add PowerShell, cmd.exe, shell strings, or user-supplied command execution.

BL-133 remains open until a real Windows host proves install, service start,
registration, heartbeat, diagnostic command claim, service/software diagnostics,
unsupported remediation behavior, and policy-denial behavior.
"@ | Set-Content -Encoding UTF8 (Join-Path $target "WINDOWS_SERVICE_WRAPPER_README.md")

# --- Service install script (example using nssm) ---
@'
#Requires -RunAsAdministrator
param(
  [string]$ServiceName = "SupportPlaneEndpointAgent",
  [string]$InstallDir = "C:\Program Files\SupportPlane\EndpointAgent",
  [string]$NssmPath = "C:\Tools\nssm.exe",
  [string]$ConfigPath = "C:\ProgramData\SupportPlane\config.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ConfigPath)) {
  throw "Config file not found at $ConfigPath. Copy config.example.json and fill in enrollment values."
}

if (-not (Test-Path $NssmPath)) {
  throw "nssm not found at $NssmPath. Download nssm and update the path before running this script."
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\logs" | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\dist\*" "$InstallDir\dist"
Copy-Item -Force "$PSScriptRoot\package.json" "$InstallDir\package.json"
Copy-Item -Force $ConfigPath "$InstallDir\config.json"

& $NssmPath install $ServiceName "node" "$InstallDir\dist\src\index.js"
& $NssmPath set $ServiceName AppDirectory $InstallDir
& $NssmPath set $ServiceName AppStdout "$InstallDir\logs\agent.log"
& $NssmPath set $ServiceName AppStderr "$InstallDir\logs\agent.log"
& $NssmPath set $ServiceName Start SERVICE_AUTO_START

Write-Host "Service $ServiceName installed. Start with: nssm start $ServiceName"
'@ | Set-Content -Encoding UTF8 (Join-Path $target "install-service.ps1")

# --- Service uninstall script ---
@'
#Requires -RunAsAdministrator
param(
  [string]$ServiceName = "SupportPlaneEndpointAgent",
  [string]$NssmPath = "C:\Tools\nssm.exe"
)

$ErrorActionPreference = "Stop"

& $NssmPath stop $ServiceName
& $NssmPath remove $ServiceName confirm

Write-Host "Service $ServiceName removed."
'@ | Set-Content -Encoding UTF8 (Join-Path $target "uninstall-service.ps1")

# --- Config example ---
@'
{
  "apiUrl": "https://api.supportplane.example",
  "tenantId": "your-tenant-id",
  "deviceKey": "your-device-key",
  "enrollmentToken": "your-enrollment-token",
  "deviceToken": "your-device-token",
  "logLevel": "info"
}
'@ | Set-Content -Encoding UTF8 (Join-Path $target "config.example.json")

# --- Logging path documentation ---
@"
# Logging Paths

The Windows endpoint agent writes logs to the following locations when run as a service:

- **Service stdout/stderr:** `\`$InstallDir\logs\agent.log` (configured via nssm)
- **Node console output:** Redirected to the above file by nssm
- **Log rotation:** Not implemented in this slice; plan for a log rotation policy

When run interactively for testing, logs are emitted to the console.
"@ | Set-Content -Encoding UTF8 (Join-Path $target "LOGGING.md")

# --- Service account assumptions ---
@"
# Service Account Assumptions

The install script defaults to running the service under the built-in service account.

- Use a least-privilege account (e.g., `NT AUTHORITY\\NETWORKSERVICE` or a dedicated gMSA).
- The account does not require interactive logon.
- For operations requiring local admin (e.g., some remediation), create a dedicated managed service account and update the service configuration.

Do not run the endpoint agent as `LOCALSYSTEM` unless required by policy, and never as an interactive user account.
"@ | Set-Content -Encoding UTF8 (Join-Path $target "SERVICE_ACCOUNT.md")

# --- Verification checklist ---
@"
# Windows Endpoint Agent Verification Checklist

Before marking BL-133 complete, verify the following on a real Windows host:

- [ ] Install service using `install-service.ps1` succeeds
- [ ] Service starts automatically after reboot
- [ ] Agent registers with the API and appears in Device Console
- [ ] Heartbeat is received regularly
- [ ] `diagnostic.status` returns online
- [ ] `diagnostic.inventory` returns hostname, platform, arch, memory
- [ ] `diagnostic.disk` returns volumes (C:\)
- [ ] `diagnostic.services` returns service list via sc.exe
- [ ] `diagnostic.software` returns installed software via reg.exe
- [ ] `remediation.flush_dns_cache` executes ipconfig /flushdns after approval
- [ ] `remediation.clear_temp_preview` returns unsupported
- [ ] Policy denial works for unsupported tools
- [ ] Uninstall service using `uninstall-service.ps1` succeeds and removes service
- [ ] No arbitrary shell commands are executed
- [ ] No secrets are logged to agent log file
"@ | Set-Content -Encoding UTF8 (Join-Path $target "VERIFICATION_CHECKLIST.md")

Write-Host "Staged Windows endpoint-agent package at $target"
Write-Host "This is packaging readiness only; BL-133 requires real Windows runtime proof."
