#!/usr/bin/env bash
set -euo pipefail
#
# Setup GLPI sandbox for SupportPlane demo.
#
# GLPI runs without a PVC in the current sandbox, so the API configuration,
# API user credentials, and test ticket are lost on pod restart.
# This script re-creates them. Run it after the GLPI pod is Ready.
#
# Usage: bash scripts/setup_glpi_sandbox.sh

GLPI_NS="${GLPI_NS:-supportplane-integrations}"
GLPI_POD="${GLPI_POD:-glpi-0}"
GLPI_CONTAINER="${GLPI_CONTAINER:-glpi}"
GLPI_DB_USER="${GLPI_DB_USER:-glpi}"
GLPI_DB_PASS="${GLPI_DB_PASS:-glpi-dev-password}"
GLPI_DB_NAME="${GLPI_DB_NAME:-glpi}"
API_USER="${API_USER:-sp-api}"
API_PASS="${API_PASS:-supportplane}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
ok()  { echo -e "${GREEN}[OK]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; }

# Check pod is running
if ! kubectl get pod "$GLPI_POD" -n "$GLPI_NS" &>/dev/null; then
  fail "GLPI pod $GLPI_POD not found in namespace $GLPI_NS"
  exit 1
fi

echo "Setting up GLPI sandbox..."

# --- 1. Enable GLPI API ---
echo "  Enabling GLPI API..."
kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  php /var/www/glpi/bin/console config:set enable_api 1 2>/dev/null
ok "API enabled"

kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  php /var/www/glpi/bin/console config:set enable_api_login_credentials 1 2>/dev/null
ok "API login with credentials enabled"

kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  php /var/www/glpi/bin/console config:set enable_api_login_external_token 1 2>/dev/null
ok "API external token login enabled"

kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  php /var/www/glpi/bin/console config:set url_base_api "http://glpi.supportplane-integrations.svc.cluster.local" 2>/dev/null
ok "API base URL set"

# --- 2. Set API client IP range (allow 10.0.0.0/8) ---
echo "  Configuring API client IP range..."
kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  mysql -h 127.0.0.1 -u "$GLPI_DB_USER" -p"$GLPI_DB_PASS" "$GLPI_DB_NAME" \
  -e "UPDATE glpi_apiclients SET ipv4_range_start = 167772160, ipv4_range_end = 184549375 WHERE id = 1;" 2>/dev/null
ok "API client IP range set to 10.0.0.0/8"

# --- 3. Create sp-api user ---
echo "  Creating API user: $API_USER..."
# GLPI 11 uses sha512 for password hashing
API_PASS_HASH=$(kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  php -r "echo password_hash('$API_PASS', PASSWORD_DEFAULT);" 2>/dev/null || echo "")

if [[ -n "$API_PASS_HASH" ]]; then
  kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
    mysql -h 127.0.0.1 -u "$GLPI_DB_USER" -p"$GLPI_DB_PASS" "$GLPI_DB_NAME" \
    -e "INSERT INTO glpi_users (name, password, realname, firstname, is_active, is_deleted, authtype, usertitles_id, usercategories_id, language, _profiles_id, _entities_id, date_creation, date_mod)
        VALUES ('$API_USER', '$API_PASS_HASH', 'SupportPlane', 'API', 1, 0, 1, 0, 0, 'en_GB', 0, 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE password='$API_PASS_HASH', is_active=1, is_deleted=0;" 2>/dev/null
  ok "API user $API_USER created/updated"
else
  fail "Could not generate password hash for $API_USER"
fi

# --- 4. Assign Super-Admin profile to sp-api ---
echo "  Assigning Super-Admin profile..."
API_USER_ID=$(kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  mysql -h 127.0.0.1 -u "$GLPI_DB_USER" -p"$GLPI_DB_PASS" "$GLPI_DB_NAME" -N \
  -e "SELECT id FROM glpi_users WHERE name='$API_USER';" 2>/dev/null | tr -d ' ')

if [[ -n "$API_USER_ID" ]]; then
  kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
    mysql -h 127.0.0.1 -u "$GLPI_DB_USER" -p"$GLPI_DB_PASS" "$GLPI_DB_NAME" \
    -e "INSERT INTO glpi_profiles_users (users_id, profiles_id, entities_id, is_recursive, is_dynamic)
        VALUES ($API_USER_ID, 4, 0, 1, 0)
        ON DUPLICATE KEY UPDATE profiles_id=4;" 2>/dev/null
  ok "Super-Admin profile assigned to user $API_USER_ID"
else
  fail "Could not find API user ID"
fi

# --- 5. Create test ticket #1 ---
echo "  Creating test ticket #1..."
SESSION_TOKEN=$(kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  curl -s "http://localhost/apirest.php/initSession" \
  -H "Authorization: Basic $(echo -n "$API_USER:$API_PASS" | base64)" \
  -H "Content-Type: application/json" 2>/dev/null | \
  python3 -c "import json,sys; print(json.load(sys.stdin).get('session_token',''))" 2>/dev/null || echo "")

if [[ -n "$SESSION_TOKEN" ]]; then
  TICKET_RESULT=$(kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
    curl -s -X POST "http://localhost/apirest.php/Ticket" \
    -H "Session-Token: $SESSION_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"input":{"name":"VPN connection issue","content":"Remote office VPN not connecting. Users in branch office unable to connect.","status":1,"priority":5,"type":1}}' 2>/dev/null)
  TICKET_ID=$(echo "$TICKET_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null || echo "?")
  if [[ "$TICKET_ID" != "?" ]]; then
    ok "Test ticket #${TICKET_ID} created: VPN connection issue"
  else
    warn "Ticket creation may have failed: $TICKET_RESULT"
  fi
else
  fail "Could not get GLPI session token for ticket creation"
fi

# --- 6. Verify ---
echo "  Verifying GLPI API..."
GLPI_STATUS=$(kubectl exec -n "$GLPI_NS" "$GLPI_POD" -c "$GLPI_CONTAINER" -- \
  curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "http://localhost/apirest.php/initSession" \
  -H "Authorization: Basic $(echo -n "$API_USER:$API_PASS" | base64)" \
  -H "Content-Type: application/json" 2>/dev/null || echo "000")

if [[ "$GLPI_STATUS" == "200" ]]; then
  ok "GLPI API initSession works (HTTP 200)"
else
  fail "GLPI API initSession returned HTTP $GLPI_STATUS"
fi

echo ""
echo "GLPI sandbox setup complete."
echo "User: $API_USER / $API_PASS"
echo "IP range: 10.0.0.0/8"
echo ""
echo "Note: These settings are lost on GLPI pod restart (no PVC)."
echo "Re-run this script after pod restart."
