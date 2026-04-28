#!/usr/bin/env bash
# Verify connector runtime contracts (BL-099)
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
TENANT_A="dev-tenant"
ADMIN_EMAIL="admin@supportplane.local"
ADMIN_PASSWORD="supportplane-demo"
OPERATOR_EMAIL="operator@supportplane.local"
OPERATOR_PASSWORD="supportplane-demo"
VIEWER_EMAIL="viewer@supportplane.local"
VIEWER_PASSWORD="supportplane-demo"
ALT_TENANT="alt-tenant"
ALT_ADMIN_EMAIL="admin@alt.supportplane.local"
ALT_ADMIN_PASSWORD="supportplane-demo"

echo "=== BL-099 Connector Runtime Contract Verification ==="
echo "API: $API_URL"
echo ""

# Helper: login and get cookie
login() {
  local email="$1"
  local password="$2"
  local tenant="$3"
  local jar="$4"
  curl -s -c "$jar" -X POST "$API_URL/auth/local/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"tenantSlug\":\"$tenant\"}" > /dev/null
}

# Helper: API call with cookie jar
api_call() {
  local jar="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"
  if [ -n "$body" ]; then
    curl -s -b "$jar" -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -b "$jar" -X "$method" "$API_URL$path"
  fi
}

rm -f /tmp/sp_bl099_admin.jar /tmp/sp_bl099_operator.jar /tmp/sp_bl099_viewer.jar /tmp/sp_bl099_alt.jar

# 1. Admin login
echo "[1/14] Admin login..."
login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$TENANT_A" /tmp/sp_bl099_admin.jar
echo "PASS"

# 2. Config schema returns mock-only
echo "[2/14] Config schema is mock-only..."
INSTALLATIONS=$(api_call /tmp/sp_bl099_admin.jar GET "/connector-installations")
INST_ID=$(echo "$INSTALLATIONS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['installations'][0]['id'] if d.get('installations') else '')")
if [ -z "$INST_ID" ]; then
  CREATED=$(api_call /tmp/sp_bl099_admin.jar POST "/connector-installations" '{"name":"BL-099 Verify","adapterType":"zammad"}')
  INST_ID=$(echo "$CREATED" | python3 -c "import sys,json; print(json.load(sys.stdin)['installation']['id'])")
fi
SCHEMA=$(api_call /tmp/sp_bl099_admin.jar GET "/connector-installations/$INST_ID/config-schema")
echo "$SCHEMA" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('mockOnly')==True; assert 'mockMode' in d['safeFields']; assert 'apiToken' in d['rejectedFields']"
echo "PASS"

# 3. Valid config passes
echo "[3/14] Valid mock config passes..."
VALID=$(api_call /tmp/sp_bl099_admin.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true,"enabled":true,"validateBeforeWrite":true,"baseUrlPlaceholder":"mock"}}')
echo "$VALID" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['result']['valid']==True; assert d['result']['realNetwork']==False; assert d['result']['writebackEnabled']==False"
echo "PASS"

# 4. Unsafe config rejected
echo "[4/14] Unsafe config rejected..."
UNSAFE=$(api_call /tmp/sp_bl099_admin.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":false,"apiToken":"secret","baseUrl":"http://real.example.com"}}')
echo "$UNSAFE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['result']['valid']==False; codes=[i['code'] for i in d['result']['issues'] if i['severity']=='error']; assert 'MOCK_MODE_REQUIRED' in codes; assert 'UNSAFE_FIELD_REJECTED' in codes; assert 'REAL_NETWORK_FIELD_REJECTED' in codes"
echo "PASS"

# 5. Runtime readiness mock-only
echo "[5/14] Runtime readiness mock-only..."
READINESS=$(api_call /tmp/sp_bl099_admin.jar POST "/connector-installations/$INST_ID/runtime-readiness")
echo "$READINESS" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['result']; assert r['realReady']==False; assert r['realNetwork']==False; assert r['writebackEnabled']==False; assert r['externalWriteAttempted']==False"
echo "PASS"

# 6. Runtime resolver returns credential metadata only
echo "[6/14] Runtime resolver credential metadata only..."
RESOLVE=$(api_call /tmp/sp_bl099_admin.jar GET "/connector-installations/runtime/resolve?connectorType=zammad")
echo "$RESOLVE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['mode']=='mock'; assert d['realNetwork']==False; assert d['writebackEnabled']==False; creds=d.get('credentialReferences',[]); assert all('secretRef' not in c for c in creds); assert all(c.get('secretResolutionImplemented')==False for c in creds)"
echo "PASS"

# 7. Deterministic linked credential count from seed
echo "[7/14] Deterministic credential count..."
echo "$RESOLVE" | python3 -c "import sys,json; d=json.load(sys.stdin); creds=d.get('credentialReferences',[]); assert len(creds)==1, f'expected 1 cred, got {len(creds)}'; assert creds[0]['id']=='cred-ref-dev-001'"
echo "PASS"

# 8. Evidence bundle connector metadata secret-free
echo "[8/14] Evidence bundle secret-free..."
SESSION=$(api_call /tmp/sp_bl099_admin.jar POST "/support-sessions" '{"title":"BL-099 Evidence Test"}')
SESSION_ID=$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
BUNDLE=$(api_call /tmp/sp_bl099_admin.jar GET "/support-sessions/$SESSION_ID/evidence-bundle.json")
echo "$BUNDLE" | python3 -c "import sys,json; d=json.load(sys.stdin); b=d['bundle']; insts=b['connectorInstallations']; assert all(i.get('realNetwork')==False for i in insts); assert all(i.get('writebackEnabled')==False for i in insts); creds=b.get('credentialReferences',[]); assert all(c.get('secretRef')!='secret' for c in creds)"
echo "PASS"

# 9. Operator allowed on test endpoints
echo "[9/14] Operator allowed on test endpoints..."
login "$OPERATOR_EMAIL" "$OPERATOR_PASSWORD" "$TENANT_A" /tmp/sp_bl099_operator.jar
api_call /tmp/sp_bl099_operator.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true}}' | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('result',{}).get('valid')==True or d.get('statusCode')!=403, 'operator should not be forbidden'"
api_call /tmp/sp_bl099_operator.jar POST "/connector-installations/$INST_ID/runtime-readiness" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')!=403, 'operator should not be forbidden'"
echo "PASS"

# 10. Viewer read-only: can read schema, cannot validate or readiness
echo "[10/14] Viewer RBAC boundaries..."
login "$VIEWER_EMAIL" "$VIEWER_PASSWORD" "$TENANT_A" /tmp/sp_bl099_viewer.jar
VIEWER_SCHEMA=$(api_call /tmp/sp_bl099_viewer.jar GET "/connector-installations/$INST_ID/config-schema")
echo "$VIEWER_SCHEMA" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('mockOnly')==True"
VIEWER_VALIDATE=$(api_call /tmp/sp_bl099_viewer.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true}}')
echo "$VIEWER_VALIDATE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==403 or d.get('error')=='Forbidden'"
VIEWER_READINESS=$(api_call /tmp/sp_bl099_viewer.jar POST "/connector-installations/$INST_ID/runtime-readiness")
echo "$VIEWER_READINESS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==403 or d.get('error')=='Forbidden'"
echo "PASS"

# 11. Cross-tenant denied
echo "[11/14] Cross-tenant denied..."
login "$ALT_ADMIN_EMAIL" "$ALT_ADMIN_PASSWORD" "$ALT_TENANT" /tmp/sp_bl099_alt.jar
ALT_GET=$(api_call /tmp/sp_bl099_alt.jar GET "/connector-installations/$INST_ID")
echo "$ALT_GET" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==404 or d.get('error')=='Not Found'"
ALT_VALIDATE=$(api_call /tmp/sp_bl099_alt.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true}}')
echo "$ALT_VALIDATE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('statusCode')==404 or d.get('error')=='Not Found'"
echo "PASS"

# 12. Audit events emitted
echo "[12/14] Audit events emitted..."
AUDIT=$(api_call /tmp/sp_bl099_admin.jar GET "/auth/audit-events")
echo "$AUDIT" | python3 -c "import sys,json; events=json.load(sys.stdin); types=[e['eventType'] for e in events]; assert 'connector_config_validated' in types; assert 'connector_readiness_checked' in types"
echo "PASS"

# 13. Delivery policy denies real writeback
echo "[13/14] Delivery policy denies real writeback..."
POLICIES=$(api_call /tmp/sp_bl099_admin.jar GET "/delivery-policies")
POLICY_ID=$(echo "$POLICIES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['policies'][0]['id'])")
POLICY_CHECK=$(api_call /tmp/sp_bl099_admin.jar POST "/delivery-policies/$POLICY_ID/validate")
echo "$POLICY_CHECK" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['decision']['realNetworkAllowed']==False; assert d['decision']['writebackEnabled']==False"
echo "PASS"

# 14. Config validation warns on unknown fields
echo "[14/14] Unknown field warnings..."
UNKNOWN=$(api_call /tmp/sp_bl099_admin.jar POST "/connector-installations/$INST_ID/validate-config" '{"config":{"mockMode":true,"unknownField":"value"}}')
echo "$UNKNOWN" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['result']['valid']==True; warns=[i for i in d['result']['issues'] if i['severity']=='warning']; assert len(warns)>=1"
echo "PASS"

echo ""
echo "=== BL-099 Verification Complete: 14/14 checks passed ==="
