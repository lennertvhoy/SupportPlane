#Requires -Version 5.1
<#
.SYNOPSIS
  Run the SupportPlane endpoint agent once for verification.
.DESCRIPTION
  Runs the endpoint agent in once mode: register, heartbeat, claim-and-run.
  Captures output to a log file. Uses env vars for configuration.
  Does NOT install as a Windows Service — for service install, see
  install_endpoint_agent_service.ps1.
.PARAMETER AgentDir
  Directory containing the built endpoint agent (dist/src/index.js).
.PARAMETER LogFile
  Path to write agent output (default: agent-once-output.txt in AgentDir).
.NOTES
  BL-132: Windows packaging proof.
  Set SUPPORTPLANE_API_URL, SUPPORTPLANE_ENDPOINT_TENANT_ID,
  SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN before running or
  ensure config file exists.
#>

param(
  [string]$AgentDir = "",
  [string]$LogFile = ""
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

if ([string]::IsNullOrEmpty($AgentDir)) {
  $AgentDir = Join-Path $RepoRoot "apps\endpoint-agent"
}

if ([string]::IsNullOrEmpty($LogFile)) {
  $LogFile = Join-Path $AgentDir "agent-once-output.txt"
}

$AgentEntry = Join-Path $AgentDir "dist\src\index.js"
if (-not (Test-Path $AgentEntry)) {
  throw "Endpoint agent not built at $AgentEntry. Run: npm run build --workspace=apps/endpoint-agent"
}

Write-Host "=== SupportPlane Endpoint Agent — Run Once ==="
Write-Host "Agent entry  : $AgentEntry"
Write-Host "Log file     : $LogFile"
Write-Host "API URL      : $env:SUPPORTPLANE_API_URL"
Write-Host "Tenant ID    : $env:SUPPORTPLANE_ENDPOINT_TENANT_ID"
Write-Host "Platform     : $(node -e "console.log(process.platform)")"
Write-Host "Node version : $(node --version)"
Write-Host ""

$env:SUPPORTPLANE_ENDPOINT_CONFIG = Join-Path $AgentDir ".supportplane-endpoint-agent-service.json"

Write-Host "Starting agent run (timeout 120s)..."
$startTime = Get-Date

$output = & node $AgentEntry 2>&1
$exitCode = $LASTEXITCODE
$duration = ((Get-Date) - $startTime).TotalSeconds

Write-Host ""
Write-Host "=== Agent Run Complete ==="
Write-Host "Exit code    : $exitCode"
Write-Host "Duration     : ${duration}s"
Write-Host ""

# Save output
$output | Out-File -FilePath $LogFile -Encoding UTF8
Write-Host "Full output saved to: $LogFile"

# Print output summary
Write-Host "--- Output (first 20 lines) ---"
$output | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
if ($output.Count -gt 20) {
  Write-Host "... (truncated, see $LogFile for full output)"
}

if ($exitCode -ne 0) {
  Write-Warning "Agent exited with non-zero code: $exitCode"
  exit $exitCode
}

Write-Host "[SUCCESS] Agent run completed."
