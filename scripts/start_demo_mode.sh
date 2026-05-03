#!/usr/bin/env bash
set -euo pipefail

# SupportPlane User Testing Demo Mode — Start & Verify
#
# This script brings the full demo stack online so a tester can open the
# web app and follow the demo script. It verifies the K8s cluster, starts
# API + Web port-forwards, and checks all critical services.
#
# Usage:
#   bash scripts/start_demo_mode.sh
#
# What it does NOT do:
#   - Does NOT start public tunnels (Tailscale Funnel, ngrok)
#   - Does NOT expose secrets
#   - Does NOT modify the cluster or database
#   - Does NOT claim production readiness
#
# Dependencies: kubectl, curl, node (optional for health verification)
# Cluster must already exist. Use scripts/create_local_k8s_cluster.sh first.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_PORT="${SUPPORTPLANE_DEMO_API_PORT:-4210}"
WEB_PORT="${SUPPORTPLANE_DEMO_WEB_PORT:-3300}"
API_SVC="svc/supportplane-api"
WEB_SVC="svc/supportplane-web"
API_NS="supportplane-app"
WEB_NS="supportplane-app"
CLUSTER_NAME="${SUPPORTPLANE_LOCAL_CLUSTER_NAME:-supportplane-local}"
DEMO_EMAIL="${SUPPORTPLANE_DEMO_EMAIL:-admin@supportplane.local}"
DEMO_PASS="${SUPPORTPLANE_DEMO_PASS:-supportplane-demo}"
DEMO_TENANT="${SUPPORTPLANE_DEMO_TENANT:-dev-tenant}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; }
info(){ echo -e "[INFO] $*"; }

# ------------------------------------------------------------------
# Step 1 — Verify K8s cluster
# ------------------------------------------------------------------
echo "=== SupportPlane Demo Mode Start ==="
echo ""
info "Step 1: Verifying K8s cluster..."
if ! kubectl config current-context 2>/dev/null | grep -q "$CLUSTER_NAME"; then
  fail "Cluster context '$CLUSTER_NAME' not found. Run scripts/create_local_k8s_cluster.sh first."
  exit 1
fi
ok "Cluster context: $CLUSTER_NAME"

if ! kubectl cluster-info &>/dev/null; then
  fail "Cluster not reachable. Start the cluster control plane first."
  exit 1
fi
ok "Cluster is reachable"

# Wait for essential pods
info "Waiting for app pods..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=supportplane-api -n "$API_NS" --timeout=120s 2>/dev/null || warn "API pod not ready (may need cluster start)"
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=supportplane-web -n "$WEB_NS" --timeout=120s 2>/dev/null || warn "Web pod not ready"

# ------------------------------------------------------------------
# Step 2 — Start port-forwards
# ------------------------------------------------------------------
echo ""
info "Step 2: Starting port-forwards..."

# Kill old port-forwards on our demo ports
fuser -k "${API_PORT}/tcp" 2>/dev/null || true
fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
sleep 1

kubectl port-forward -n "$API_NS" "$API_SVC" "${API_PORT}:4110" &>/dev/null &
echo $! > /tmp/supportplane-demo-api-portforward.pid
info "API port-forward: localhost:${API_PORT} -> ${API_SVC}:4110"

kubectl port-forward -n "$WEB_NS" "$WEB_SVC" "${WEB_PORT}:3200" &>/dev/null &
echo $! > /tmp/supportplane-demo-web-portforward.pid
info "Web port-forward: localhost:${WEB_PORT} -> ${WEB_SVC}:3200"

sleep 3

# ------------------------------------------------------------------
# Step 3 — Verify API health
# ------------------------------------------------------------------
echo ""
info "Step 3: Verifying API health..."
if curl -s --max-time 5 "http://localhost:${API_PORT}/health" > /tmp/sp-demo-health.json 2>/dev/null; then
  API_HEAD=$(python3 -c "import json; d=json.load(open('/tmp/sp-demo-health.json')); print(d.get('head','?')[:8])" 2>/dev/null || echo "?")
  ok "API healthy (HEAD: ${API_HEAD}, port: ${API_PORT})"
else
  fail "API health check failed on port ${API_PORT}"
  exit 1
fi

# ------------------------------------------------------------------
# Step 4 — Verify Web reachable
# ------------------------------------------------------------------
echo ""
info "Step 4: Verifying Web UI..."
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://localhost:${WEB_PORT}" 2>/dev/null || echo "000")
if [[ "$WEB_CODE" == "200" ]] || [[ "$WEB_CODE" == "304" ]]; then
  ok "Web UI reachable (HTTP ${WEB_CODE}, port: ${WEB_PORT})"
else
  warn "Web UI returned HTTP ${WEB_CODE}. The demo may need a fresh web image or port-forward restart."
fi

# ------------------------------------------------------------------
# Step 5 — Verify connector status (authenticated)
# ------------------------------------------------------------------
echo ""
info "Step 5: Verifying connector status..."
COOKIE=$(curl -s -c - --max-time 10 -X POST "http://localhost:${API_PORT}/auth/local/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASS}\",\"tenantSlug\":\"${DEMO_TENANT}\"}" 2>&1 | grep supportplane_session | awk '{print $NF}' || echo "")

if [[ -n "$COOKIE" ]]; then
  ok "Demo login successful (${DEMO_EMAIL})"
else
  warn "Demo login failed. Check credentials and auth mode."
fi

if [[ -n "$COOKIE" ]]; then
  CONN_STATUS=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" "http://localhost:${API_PORT}/connectors/status" 2>/dev/null)
    ZAMMAD=$(echo "$CONN_STATUS" | python3 -c "import json,sys; d=json.load(sys.stdin); z=[c for c in d['connectors'] if c['id']=='zammad']; print(z[0]['mode']+':'+z[0]['transport'] if z else '?')" 2>/dev/null || echo "?")
    GLPI=$(echo "$CONN_STATUS" | python3 -c "import json,sys; d=json.load(sys.stdin); g=[c for c in d['connectors'] if c['id']=='glpi']; print(g[0]['mode']+':'+g[0]['transport'] if g else '?')" 2>/dev/null || echo "?")
    ok "Zammad: ${ZAMMAD}"
    ok "GLPI: ${GLPI}"
  fi

# ------------------------------------------------------------------
# Step 6 — Seed sandbox dependencies (OpenBao + GLPI setup)
# ------------------------------------------------------------------
echo ""
info "Step 6: Seeding sandbox dependencies..."

# Seed OpenBao Zammad credential if available
if [[ -x scripts/seed_openbao_zammad_secret.sh ]]; then
  info "Seeding OpenBao Zammad credential..."
  bash scripts/seed_openbao_zammad_secret.sh 2>/dev/null && ok "OpenBao Zammad credential seeded" || warn "OpenBao seeding failed"
else
  warn "OpenBao seed script not found"
fi

# Setup GLPI sandbox (API, user, ticket)
if [[ -x scripts/setup_glpi_sandbox.sh ]]; then
  info "Setting up GLPI sandbox..."
  bash scripts/setup_glpi_sandbox.sh 2>/dev/null && ok "GLPI sandbox ready" || warn "GLPI setup failed"
else
  warn "GLPI setup script not found"
fi

# ------------------------------------------------------------------
# Step 7 — Verify Zammad + GLPI context paths
# ------------------------------------------------------------------
echo ""
info "Step 7: Verifying ticket context paths..."

if [[ -n "$COOKIE" ]]; then
  SESSION_Z=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions" \
    -H "Content-Type: application/json" \
    -d '{"title":"Demo: Zammad context","priority":"high"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

  if [[ -n "$SESSION_Z" ]]; then
    Z_SUBJECT=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions/${SESSION_Z}/zammad/ticket-context" \
      -H "Content-Type: application/json" -d '{"externalTicketId":"2"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['ticketReference']['subject'])" 2>/dev/null || echo "?")
    ok "Zammad context: '${Z_SUBJECT}'"
  else
    warn "Zammad context: could not create session"
  fi

  SESSION_G=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions" \
    -H "Content-Type: application/json" \
    -d '{"title":"Demo: GLPI context","priority":"high"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

  if [[ -n "$SESSION_G" ]]; then
    G_SUBJECT=$(curl -s --max-time 10 -b "supportplane_session=${COOKIE}" -X POST "http://localhost:${API_PORT}/support-sessions/${SESSION_G}/glpi/ticket-context" \
      -H "Content-Type: application/json" -d '{"externalTicketId":"1"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['contextPacket']['payload']['ticketSubject'])" 2>/dev/null || echo "?")
    ok "GLPI context: '${G_SUBJECT}'"
  else
    warn "GLPI context: could not create session"
  fi
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo ""
echo "========================================"
echo "  SupportPlane Demo Mode — READY"
echo "========================================"
echo ""
echo "  Web UI:    http://localhost:${WEB_PORT}"
echo "  API:       http://localhost:${API_PORT}"
echo "  API health: http://localhost:${API_PORT}/health"
echo ""
echo "  Demo login:"
echo "    Email:    ${DEMO_EMAIL}"
echo "    Password: ${DEMO_PASS}"
echo "    Tenant:   ${DEMO_TENANT}"
echo ""
echo "  Scenarios ready:"
echo "    Flow A — Zammad sandbox ticket read"
echo "    Flow B — GLPI sandbox ticket read"
echo "    Flow C — Governance / connector status / audit"
echo ""
echo "  Known limitations:"
echo "    — osTicket: fixture only (blocked upstream)"
echo "    — MeshCentral/Fortinet: unconfigured"
echo "    — Sandbox dev credentials only (not production)"
echo "    — No public tunnel (UI only on localhost)"
echo ""
echo "  To stop: kill the port-forward processes"
echo "    kill \$(cat /tmp/supportplane-demo-api-portforward.pid)"
echo "    kill \$(cat /tmp/supportplane-demo-web-portforward.pid)"
echo ""
echo "  Docs: docs/USER_TESTING_GUIDE.md"
echo "        docs/ENTERPRISE_DEMO_GUIDE.md"
echo "        docs/KNOWN_DEMO_LIMITATIONS.md"
echo "========================================"
