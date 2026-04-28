#!/usr/bin/env bash
# Verify connector runtime readiness foundation (BL-098)
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
TENANT_A="dev-tenant"
ADMIN_EMAIL="admin@supportplane.local"
ADMIN_PASSWORD="supportplane-demo"
VIEWER_EMAIL="viewer@supportplane.local"
VIEWER_PASSWORD="supportplane-demo"
ALT_TENANT="alt-tenant"
ALT_ADMIN_EMAIL="admin@alt.supportplane.local"
ALT_ADMIN_PASSWORD="supportplane-demo"

echo "=== BL-098 Connector Runtime Readiness Verification ==="
echo "API: $API_URL"
echo ""

# Helper: login and get cookie
login() {
  local email="$1"
  local password="$2"
  local tenant="$3"
  curl -s -c /tmp/sp_bl098_cookies.txt -X POST "$API_URL/auth/local/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"tenantSlug\":\"$tenant\"}"
}

# Helper: admin API call
admin_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -b /tmp/sp_bl098_cookies.txt -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -b /tmp/sp_bl098_cookies.txt -X "$method" "$API_URL$path"
  fi
}

# Helper: viewer API call (separate cookie jar)
viewer_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -b /tmp/sp_bl098_viewer_cookies.txt -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -b /tmp/sp_bl098_viewer_cookies.txt -X "$method" "$API_URL$path"
  fi
}

# Helper: alt-tenant API call
alt_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -b /tmp/sp_bl098_alt_cookies.txt -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -b /tmp/sp_bl098_alt_cookies.txt -X "$method" "$API_URL$path"
  fi
}

# 1. Login as admin
echo "[1/12] Admin login..."
rm -f /tmp/sp_bl098_cookies.txt /tmp/sp_bl098_viewer_cookies.txt /tmp/sp_bl098_alt_cookies.txt
login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$TENANT_A" > /dev/null
echo "PASS"

# 2. Config schema endpoint works
echo "[2/12] Config schema endpoint..."
INSTALLATIONS=$(admin_api GET "/connector-installations")
INST_ID=$(echo "$INSTALLATIONS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['installations'][0]['id'] if d.get('installations') else '')")
if [ -z "$INST_ID" ]; then
  echo "SKIP: no installations found, creating one..."
  CREATED=$(admin_api POST "/connector-installations" '{"name":"BL-098 Verify Connector","adapterType":"zammad"}')
  INST_ID=$(echo "$CREATED" | python3 -c "import sys,json; print(json.load(sys.stdin)['installation']['id'])")
fi
SCHEMA=$(admin_api GET "/connector-installations/$INST_ID/config-schema")
echo "$SCHEMA" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('mockOnly')==True, 'mockOnly must be true'; assert 'safeFields' in d"
echo "PASS"

# 3. Safe config validation passes
echo "[3/12] Safe config validation passes..."
SAFE_CONFIG=$(admin_api POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true,"enabled":true,"validateBeforeWrite":true,"timeoutMs":5000,"capabilities":["read_tickets"],"baseUrlPlaceholder":"mock-zammad"}}')
echo "$SAFE_CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['result']['valid']==True, 'safe config should be valid'; assert d['result']['realNetwork']==False; assert d['result']['writebackEnabled']==False"
echo "PASS"

# 4. Unsafe real-network config validation is rejected
echo "[4/12] Unsafe config validation rejected..."
UNSAFE_CONFIG=$(admin_api POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":false,"apiToken":"secret","baseUrl":"http://real.example.com","realEndpoint":"http://prod"}}')
echo "$UNSAFE_CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['result']['valid']==False, 'unsafe config should be invalid'; errors=[i for i in d['result']['issues'] if i['severity']=='error']; assert len(errors)>=3, f'expected >=3 errors, got {len(errors)}'"
echo "PASS"

# 5. Runtime readiness returns realNetwork: false
echo "[5/12] Runtime readiness..."
READINESS=$(admin_api POST "/connector-installations/$INST_ID/runtime-readiness")
echo "$READINESS" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['result']; assert r['realReady']==False; assert r['realNetwork']==False; assert r['writebackEnabled']==False; assert r['externalWriteAttempted']==False"
echo "PASS"

# 6. Credential reference linked metadata appears
echo "[6/12] Credential reference linked metadata..."
CRED=$(admin_api POST "/credential-references" '{"connectorType":"zammad","displayName":"BL-098 Verify Credential"}')
CRED_ID=$(echo "$CRED" | python3 -c "import sys,json; print(json.load(sys.stdin)['credentialReference']['id'])")
admin_api POST "/connector-installations/$INST_ID/link-credential" "{\"credentialReferenceId\":\"$CRED_ID\"}" > /dev/null
RESOLVE=$(admin_api GET "/connector-installations/runtime/resolve?connectorType=zammad")
echo "$RESOLVE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['mode']=='mock'; assert d['realNetwork']==False; assert d['writebackEnabled']==False; creds=d.get('credentialReferences',[]); assert any(c['id']=='$CRED_ID' for c in creds), 'linked credential not found'"
echo "PASS"

# 7. Evidence bundle redacts secrets
echo "[7/12] Evidence bundle redacts secrets..."
SESSION=$(admin_api POST "/support-sessions" '{"title":"BL-098 Evidence Test"}')
SESSION_ID=$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
BUNDLE=$(admin_api GET "/support-sessions/$SESSION_ID/evidence-bundle.json")
echo "$BUNDLE" | python3 -c "import sys,json; d=json.load(sys.stdin); b=d['bundle']; assert 'connectorInstallations' in b; insts=b['connectorInstallations']; assert all(i.get('realNetwork')==False for i in insts), 'realNetwork must be false'; assert all(i.get('writebackEnabled')==False for i in insts), 'writebackEnabled must be false'; creds=b.get('credentialReferences',[]); assert all(c.get('secretRef')!='secret' for c in creds), 'secret values must not appear'"
echo "PASS"

# 8. Viewer mutation denied
echo "[8/12] Viewer mutation denied..."
curl -s -c /tmp/sp_bl098_viewer_cookies.txt -X POST "$API_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VIEWER_EMAIL\",\"password\":\"$VIEWER_PASSWORD\",\"tenantSlug\":\"$TENANT_A\"}" > /dev/null
VIEWER_VALIDATE=$(viewer_api POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true}}')
echo "$VIEWER_VALIDATE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==403 or d.get('error')=='Forbidden', f'viewer should be denied, got {d}'"
echo "PASS"

# 9. Cross-tenant denied
echo "[9/12] Cross-tenant access denied..."
curl -s -c /tmp/sp_bl098_alt_cookies.txt -X POST "$API_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALT_ADMIN_EMAIL\",\"password\":\"$ALT_ADMIN_PASSWORD\",\"tenantSlug\":\"$ALT_TENANT\"}" > /dev/null
ALT_GET=$(alt_api GET "/connector-installations/$INST_ID")
echo "$ALT_GET" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==404 or d.get('error')=='Not Found', f'alt tenant should get 404, got {d}'"
echo "PASS"

# 10. Runtime resolver never returns raw secretRef
echo "[10/12] Runtime resolver redacts secrets..."
echo "$RESOLVE" | python3 -c "import sys,json; d=json.load(sys.stdin); creds=d.get('credentialReferences',[]); assert all('secretRef' not in c for c in creds), 'secretRef must not be exposed'; assert all(c.get('secretResolutionImplemented')==False for c in creds)"
echo "PASS"

# 11. Config validation warns on unknown fields
echo "[11/12] Config validation warns on unknown fields..."
UNKNOWN_FIELDS=$(admin_api POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true,"enabled":true,"someUnknownField":"value","anotherUnknown":123}}')
echo "$UNKNOWN_FIELDS" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['result']; assert r['valid']==True, 'config with only unknown fields should still be valid'; warns=[i for i in r['issues'] if i['severity']=='warning']; assert len(warns)>=2, f'expected >=2 warnings for unknown fields, got {len(warns)}'"
echo "PASS"

# 12. Delivery policy still denies real writeback
echo "[12/12] Delivery policy still denies real writeback..."
POLICIES=$(admin_api GET "/delivery-policies")
POLICY_ID=$(echo "$POLICIES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['policies'][0]['id'])")
POLICY_CHECK=$(admin_api POST "/delivery-policies/$POLICY_ID/validate")
echo "$POLICY_CHECK" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['decision']['realNetworkAllowed']==False; assert d['decision']['writebackEnabled']==False"
echo "PASS"

echo ""
echo "=== BL-098 Verification Complete: 12/12 checks passed ==="
