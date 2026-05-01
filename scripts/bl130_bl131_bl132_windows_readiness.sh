#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== SupportPlane Windows Endpoint Readiness (BL-130/131/132) ==="
echo ""

echo "1) Running endpoint-agent tests..."
cd apps/endpoint-agent
npm test
echo ""

echo "2) Running contracts/policy tests for Windows..."
cd "$REPO_ROOT/packages/contracts"
npm test
echo ""

echo "=== Summary ==="
echo "Tested (fixture-level, no real Windows host):"
echo "  - Windows disk collector template (statfs C:\\)"
echo "  - Windows services parser (sc.exe fixture output)"
echo "  - Windows software parser (reg.exe fixture output)"
echo "  - Windows flush_dns_cache fixed template (ipconfig /flushdns)"
echo "  - Unsupported platform behavior (clear_temp_preview, etc.)"
echo "  - Policy manifest platform filtering and forbidden-field rejection"
echo ""
echo "Requires real Windows host (BL-133 blocked):"
echo "  - sc.exe execution and real output parsing"
echo "  - reg.exe execution and real output parsing"
echo "  - fs.statfs('C:\\') behavior on Windows"
echo "  - Service packaging (install/uninstall scripts are scaffold only)"
echo "  - End-to-end heartbeat, registration, and policy denial"
echo ""
echo "BL-133 remains blocked: no real Windows runner available."
