#!/usr/bin/env bash
#
# SupportPlane local topology verification script.
# Verifies infra containers and, when present, host-run API/Web services.
#
# Usage:
#   bash scripts/check_local_topology.sh
#
# Exit codes:
#   0 = all checked services healthy
#   1 = one or more services unhealthy

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

check_port() {
  local label="$1"
  local host="${2:-127.0.0.1}"
  local port="$3"
  if ss -ltn 2>/dev/null | grep -q "${host}:${port}"; then
    echo -e "${GREEN}✓${NC} ${label} port ${port} is listening"
    ((PASS+=1))
  else
    echo -e "${RED}✗${NC} ${label} port ${port} is NOT listening"
    ((FAIL+=1))
  fi
}

check_http() {
  local label="$1"
  local url="$2"
  local expect="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" || true)
  if [ "${code}" = "${expect}" ]; then
    echo -e "${GREEN}✓${NC} ${label} responded HTTP ${code} (${url})"
    ((PASS+=1))
  else
    echo -e "${RED}✗${NC} ${label} responded HTTP ${code}, expected ${expect} (${url})"
    ((FAIL+=1))
  fi
}

check_cmd() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} ${label}"
    ((PASS+=1))
  else
    echo -e "${RED}✗${NC} ${label}"
    ((FAIL+=1))
  fi
}

# ------------------------------------------------------------------
# Infra services (from compose)
# ------------------------------------------------------------------

echo "=== Infra Containers ==="

check_port "PostgreSQL" "127.0.0.1" "5434"
check_port "NATS client" "127.0.0.1" "4222"
check_port "NATS monitoring" "127.0.0.1" "8222"
check_port "MinIO API" "127.0.0.1" "9000"
check_port "MinIO Console" "127.0.0.1" "9001"

# NATS health via HTTP monitoring
check_http "NATS health" "http://127.0.0.1:8222/healthz" "200"

# MinIO health endpoint
check_http "MinIO health" "http://127.0.0.1:9000/minio/health/live" "200"

# PostgreSQL connectivity using psql if available, else nc
if command -v psql >/dev/null 2>&1; then
  check_cmd "PostgreSQL accepts connections" \
    psql "postgresql://supportplane:supportplane_dev@127.0.0.1:5434/supportplane" -c "SELECT 1;"
elif command -v nc >/dev/null 2>&1; then
  check_cmd "PostgreSQL port reachable (nc)" \
    nc -z -w 2 127.0.0.1 5434
else
  echo -e "${YELLOW}!${NC} PostgreSQL connectivity skipped (neither psql nor nc found)"
fi

# ------------------------------------------------------------------
# Host-run apps (optional — verify only if ports are listening)
# ------------------------------------------------------------------

echo ""
echo "=== Host-Run Apps (optional) ==="

if ss -ltn 2>/dev/null | grep -q "127.0.0.1:4110\|*:4110"; then
  check_http "API health" "http://127.0.0.1:4110/health" "200"
else
  echo -e "${YELLOW}!${NC} API not running on port 4110 (start with: cd apps/api && npm run dev)"
fi

if ss -ltn 2>/dev/null | grep -q "127.0.0.1:3200\|*:3200"; then
  check_http "Web root" "http://127.0.0.1:3200/" "200"
else
  echo -e "${YELLOW}!${NC} Web not running on port 3200 (start with: cd apps/web && npm run dev)"
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------

echo ""
echo "=== Summary ==="
echo -e "Passed: ${GREEN}${PASS}${NC}"
echo -e "Failed: ${RED}${FAIL}${NC}"

if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
exit 0
