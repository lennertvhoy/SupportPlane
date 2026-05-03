#Requires -Version 5.1
<#
.SYNOPSIS
  Uninstall the SupportPlane endpoint agent Windows Service.
.DESCRIPTION
  Stops and removes the SupportPlaneEndpointAgentDev Windows Service.
  Uses built-in sc.exe (no external tooling required).
.PARAMETER ServiceName
  Windows Service name (default: SupportPlaneEndpointAgentDev).
.NOTES
  BL-132: Windows service/install packaging proof.
  Run on a real Windows host with admin privileges.
#>

param(
  [string]$ServiceName = "SupportPlaneEndpointAgentDev"
)

$ErrorActionPreference = "Stop"

Write-Host "=== SupportPlane Endpoint Agent — Windows Service Uninstall ==="
Write-Host "Service Name : $ServiceName"
Write-Host ""

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "Service '$ServiceName' is not installed. Nothing to uninstall."
  exit 0
}

Write-Host "Service status: $($existing.Status)"

if ($existing.Status -eq 'Running') {
  Write-Host "Stopping service '$ServiceName'..."
  Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 3
  
  $retries = 0
  while ((Get-Service -Name $ServiceName).Status -ne 'Stopped' -and $retries -lt 5) {
    Write-Host "Waiting for service to stop... (attempt $($retries + 1))"
    Start-Sleep -Seconds 2
    $retries++
  }
  
  if ((Get-Service -Name $ServiceName).Status -ne 'Stopped') {
    Write-Warning "Service did not stop cleanly. Forcing removal."
  }
}

Write-Host "Removing service '$ServiceName'..."
$deleteResult = & sc.exe delete $ServiceName 2>&1
Write-Host $deleteResult

if ($LASTEXITCODE -ne 0) {
  Write-Warning "sc.exe delete returned exit code $LASTEXITCODE"
  Write-Warning "This may be OK if the service was already pending deletion."
}

# Verify removal
$remaining = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($remaining) {
  Write-Warning "Service may still exist. Check with: Get-Service -Name $ServiceName"
  Write-Warning "Manual removal: sc.exe delete $ServiceName"
  exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Service '$ServiceName' uninstalled."
