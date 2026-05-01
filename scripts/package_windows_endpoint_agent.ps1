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

Write-Host "Staged Windows endpoint-agent package at $target"
Write-Host "This is packaging readiness only; BL-133 requires real Windows runtime proof."
