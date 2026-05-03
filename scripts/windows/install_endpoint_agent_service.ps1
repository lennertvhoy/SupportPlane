#Requires -Version 5.1
<#
.SYNOPSIS
  Install the SupportPlane endpoint agent as a Windows Service using sc.exe.
.DESCRIPTION
  Dev/sandbox only. Creates a Windows Service that runs the endpoint agent
  in daemon mode. Uses built-in sc.exe (no external tooling required).
  Service name: SupportPlaneEndpointAgentDev
.PARAMETER ServiceName
  Windows Service name (default: SupportPlaneEndpointAgentDev).
.PARAMETER AgentDir
  Directory containing the built endpoint agent (dist/src/index.js).
  Default: apps/endpoint-agent relative to repo root.
.PARAMETER LogDir
  Directory for agent logs (default: $AgentDir\logs).
.NOTES
  BL-132: Windows service/install packaging proof.
  Do not commit enrollment tokens.
  Run on a real Windows host with admin privileges.
#>

param(
  [string]$ServiceName = "SupportPlaneEndpointAgentDev",
  [string]$AgentDir = "",
  [string]$LogDir = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

if ([string]::IsNullOrEmpty($AgentDir)) {
  $AgentDir = Join-Path $RepoRoot "apps\endpoint-agent"
}

if ([string]::IsNullOrEmpty($LogDir)) {
  $LogDir = Join-Path $AgentDir "logs"
}

Write-Host "=== SupportPlane Endpoint Agent — Windows Service Install ==="
Write-Host "Service Name : $ServiceName"
Write-Host "Agent Dir    : $AgentDir"
Write-Host "Log Dir      : $LogDir"
Write-Host ""

# Verify Node.js
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
  throw "Node.js not found. Install Node.js 22+ before running this script."
}
$NodeVersion = & node --version
Write-Host "Node.js      : $NodeVersion ($NodePath)"

# Verify agent is built
$AgentEntry = Join-Path $AgentDir "dist\src\index.js"
if (-not (Test-Path $AgentEntry)) {
  throw "Endpoint agent not built at $AgentEntry. Run: npm run build --workspace=apps/endpoint-agent"
}
Write-Host "Agent entry  : $AgentEntry"

# Verify config exists
$ConfigPath = Join-Path $AgentDir ".supportplane-endpoint-agent.json"
if (-not (Test-Path $ConfigPath)) {
  Write-Warning "Config file not found at $ConfigPath."
  Write-Warning "Register the agent first: node dist/src/index.js --register"
  Write-Warning "Or set SUPPORTPLANE_ENDPOINT_* env vars before starting the service."
}

# Create log directory
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Write-Host "Log dir      : $LogDir"

# Stop and remove existing service if present
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Stopping existing service '$ServiceName'..."
  Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Write-Host "Removing existing service '$ServiceName'..."
  & sc.exe delete $ServiceName 2>&1 | Out-Null
  Start-Sleep -Seconds 2
}

# Create the service using sc.exe
# binPath: node.exe with the agent entry point as argument
$BinPath = "`"$NodePath`" `"$AgentEntry`""
Write-Host "Creating service with binPath: $BinPath"

$createArgs = @(
  "create", $ServiceName,
  "binPath=", $BinPath,
  "start=", "auto",
  "DisplayName=", "SupportPlane Endpoint Agent (Dev)",
  "type=", "own"
)
$createResult = & sc.exe $createArgs 2>&1
Write-Host $createResult

if ($LASTEXITCODE -ne 0) {
  throw "sc.exe create failed with exit code $LASTEXITCODE"
}

# Set service description
& sc.exe description $ServiceName "SupportPlane endpoint agent — outbound-only read-only diagnostics (dev/sandbox)" 2>&1 | Out-Null

# Set failure recovery: restart on failure
& sc.exe failure $ServiceName reset=86400 actions=restart/30000/restart/60000/restart/120000 2>&1 | Out-Null

Write-Host "Service '$ServiceName' created."

# Start the service
Write-Host "Starting service '$ServiceName'..."
Start-Service -Name $ServiceName -ErrorAction Stop
Start-Sleep -Seconds 3

# Verify service is running
$svc = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "=== Service Status ==="
Write-Host "Name         : $($svc.Name)"
Write-Host "DisplayName  : $($svc.DisplayName)"
Write-Host "Status       : $($svc.Status)"
Write-Host "StartType    : $($svc.StartType)"
Write-Host ""

if ($svc.Status -ne 'Running') {
  Write-Warning "Service is not running. Check Windows Event Log for details."
  Write-Warning "Try starting manually: Start-Service -Name $ServiceName"
  exit 1
}

Write-Host "[SUCCESS] Service '$ServiceName' installed and running."
Write-Host ""
Write-Host "=== Next Steps ==="
Write-Host "1. Check agent logs: $LogDir\agent.log"
Write-Host "2. Verify registration on Device Console"
Write-Host "3. Send heartbeat: node dist/src/index.js --heartbeat"
Write-Host "4. Run diagnostics: node dist/src/index.js --diagnostic status"
Write-Host ""
Write-Host "To uninstall:"
Write-Host "  powershell -File scripts/windows/uninstall_endpoint_agent_service.ps1"
