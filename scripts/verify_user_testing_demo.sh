#!/usr/bin/env bash
set -euo pipefail

# SupportPlane User Testing Demo — Smoke Test
#
# Runs a comprehensive demo readiness check and writes results to an
# evidence file. Designed to be run before handing the demo to a tester.
#
# Usage:
#   bash scripts/verify_user_testing_demo.sh
#   bash scripts/verify_user_testing_demo.sh --evidence output/demo-smoke-report.txt
#
# Exit code: 0 = all mandatory checks passed, non-0 = at least one failed.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_PORT="${SUPPORTPLANE_DEMO_API_PORT:-4210}"
WEB_PORT="${SUPPORTPLANE_DEMO_WEB_PORT:-3300}"
EVIDENCE_FILE="${1:-output/playwright/session-144-user-testing-demo-readiness/demo-smoke-report.txt}"
DEMO_EMAIL="${SUPPORTPLANE_DEMO_EMAIL:-admin@supportplane.local}"
DEMO_PASS="${SUPPORTPLANE_DEMO_PASS:-supportplane-demo}"
DEMO_TENANT="${SUPPORTPLANE_DEMO_TENANT:-dev-tenant}"

PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $*"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $*"; FAIL=$((FAIL+1)); }
warn() { echo -e "${RED}[WARN]${NC} $*"; }

mkdir -p "$(dirname "$EVIDENCE_FILE")"

{
  echo "=== SupportPlane Demo Readiness Smoke Test ==="
  echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "API port: ${API_PORT}"
  echo "Web port: ${WEB_PORT}"
  echo ""

  # --- 1. API health ---
  echo "--- 1. API /health ---"
  HEALTH=$(curl -s --max-time 5 "http://localhost:${API_PORT}/health" 2>/dev/null || echo '{"status":"error"}')
  API_OK=$(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','error'))" 2>/dev/null || echo "error")
  if [[ "$API_OK" == "ok" ]]; then
    H=$(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('head','?')[:8])" 2>/dev/null)
    B=$(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('branch','?'))" 2>/dev/null)
    S=$(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('storeMode','?'))" 2>/dev/null)
    pass "API health ok — head=${H} branch=${B} store=${S}"
  else
    fail "API health NOT ok"
  fi

  # --- 2. Web HTTP ---
  echo ""
  echo "--- 2. Web UI HTTP ---"
  WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://localhost:${WEB_PORT}" 2>/dev/null || echo "000")
  if [[ "$WEB_CODE" == "200" ]] || [[ "$WEB_CODE" == "304" ]]; then
    pass "Web returns HTTP ${WEB_CODE} on port ${WEB_PORT}"
  else
    fail "Web NOT reachable (HTTP ${WEB_CODE})"
  fi

  # --- 3. Authenticated connector status ---
  echo ""
  echo "--- 3. Authenticated connector status ---"
  COOKIE=$(curl -s -c - --max-time 10 -X POST "http://localhost:${API_PORT}/auth/local/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASS}\",\"tenantSlug\":\"${DEMO_TENANT}\"}" 2>&1 | grep supportplane_session | awk '{print $NF}' || echo "")

  if [[ -z "$COOKIE" ]]; then
    fail "Demo login failed"
  else
    CONN=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" "http://localhost:${API_PORT}/connectors/status" 2>/dev/null)
    ZAMMAD=$(echo "$CONN" | python3 -c "import json,sys; d=json.load(sys.stdin); z=[c for c in d['connectors'] if c['id']=='zammad']; print(z[0]['mode']+':'+z[0]['transport'] if z else '?')" 2>/dev/null || echo "?")
    GLPI=$(echo "$CONN" | python3 -c "import json,sys; d=json.load(sys.stdin); g=[c for c in d['connectors'] if c['id']=='glpi']; print(g[0]['mode']+':'+g[0]['transport'] if g else '?')" 2>/dev/null || echo "?")
    OST=$(echo "$CONN" | python3 -c "import json,sys; d=json.load(sys.stdin); o=[c for c in d['connectors'] if c['id']=='osticket']; print(o[0]['mode'] if o else '?')" 2>/dev/null || echo "?")
    MC=$(echo "$CONN" | python3 -c "import json,sys; d=json.load(sys.stdin); m=[c for c in d['connectors'] if c['id']=='meshcentral']; print(m[0]['mode'] if m else '?')" 2>/dev/null || echo "?")
    FT=$(echo "$CONN" | python3 -c "import json,sys; d=json.load(sys.stdin); f=[c for c in d['connectors'] if c['id']=='fortinet']; print(f[0]['mode'] if f else '?')" 2>/dev/null || echo "?")

    [[ "$ZAMMAD" == "configured:real" ]] && pass "Zammad: ${ZAMMAD}" || fail "Zammad: expected configured:real, got ${ZAMMAD}"
    [[ "$GLPI" == "configured:real" ]] && pass "GLPI: ${GLPI}" || fail "GLPI: expected configured:real, got ${GLPI}"
    [[ "$OST" == "fixture" ]] && pass "osTicket: ${OST} (expected)" || warn "osTicket: expected fixture, got ${OST}"
    [[ "$MC" == "unconfigured" ]] && pass "MeshCentral: ${MC} (expected)" || warn "MeshCentral: expected unconfigured, got ${MC}"
    [[ "$FT" == "unconfigured" ]] && pass "Fortinet: ${FT} (expected)" || warn "Fortinet: expected unconfigured, got ${FT}"
  fi

  # --- 4. Zammad context ---
  echo ""
  echo "--- 4. Zammad context ---"
  if [[ -n "$COOKIE" ]]; then
    SZ=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions" \
      -H "Content-Type: application/json" -d '{"title":"Smoke: Zammad","priority":"high"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
    if [[ -n "$SZ" ]]; then
      ZCTX=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions/${SZ}/zammad/ticket-context" \
        -H "Content-Type: application/json" -d '{"externalTicketId":"2"}' 2>/dev/null)
      ZSUBJ=$(echo "$ZCTX" | python3 -c "import json,sys; print(json.load(sys.stdin)['ticketReference']['subject'])" 2>/dev/null || echo "?")
      if [[ "$ZSUBJ" != "?" ]]; then
        pass "Zammad context: '${ZSUBJ}'"
      else
        fail "Zammad context: could not load ticket #2"
      fi
    else
      fail "Zammad context: could not create session"
    fi
  fi

  # --- 5. GLPI context ---
  echo ""
  echo "--- 5. GLPI context ---"
  if [[ -n "$COOKIE" ]]; then
    SG=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions" \
      -H "Content-Type: application/json" -d '{"title":"Smoke: GLPI","priority":"high"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
    if [[ -n "$SG" ]]; then
      GCTX=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions/${SG}/glpi/ticket-context" \
        -H "Content-Type: application/json" -d '{"externalTicketId":"1"}' 2>/dev/null)
      GSUBJ=$(echo "$GCTX" | python3 -c "import json,sys; print(json.load(sys.stdin)['contextPacket']['payload']['ticketSubject'])" 2>/dev/null || echo "?")
      if [[ "$GSUBJ" != "?" ]]; then
        pass "GLPI context: '${GSUBJ}'"
      else
        fail "GLPI context: could not load ticket #1"
      fi
    else
      fail "GLPI context: could not create session"
    fi
  fi

  # --- 6. No secret scan ---
  echo ""
  echo "--- 6. No-secret scan ---"
  HAS_SECRET=false
  for pattern in "session_token" "GLPI_API_TOKEN=sp-api:" "ZAMMAD_API_TOKEN" "password" "Bearer"; do
    if curl -s --max-time 10 -b "supportplane_session=${COOKIE}" "http://localhost:${API_PORT}/connectors/status" 2>/dev/null | grep -qi "$pattern"; then
      fail "Secret-like pattern found in connector status: $pattern"
      HAS_SECRET=true
      break
    fi
  done
  if ! $HAS_SECRET; then
    pass "No raw secrets in connector status response"
  fi

  # --- Summary ---
  echo ""
  echo "========================================"
  echo "  Smoke Test Results"
  echo "========================================"
  echo "  PASS: ${PASS}"
  echo "  FAIL: ${FAIL}"
  echo ""
  if [[ "$FAIL" -eq 0 ]]; then
    echo "  DEMO READY for user testing."
  else
    echo "  DEMO NOT READY. Fix failures above."
  fi
  echo "========================================"
} | tee "$EVIDENCE_FILE"

exit $FAIL
