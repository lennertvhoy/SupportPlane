#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4210}"
CORRELATION_ID="${CORRELATION_ID:-sp-verify-observability-baseline}"
OUT_DIR="${OUT_DIR:-output/playwright/session-114-bl114-observability-baseline}"
mkdir -p "$OUT_DIR"

echo "=== Observability Baseline Verification ==="
echo "API_URL=$API_URL"
echo "CORRELATION_ID=$CORRELATION_ID"

echo
echo "=== API health with correlation response header ==="
curl -sS -D "$OUT_DIR/.headers.tmp" -H "X-Correlation-Id: $CORRELATION_ID" "$API_URL/health" | tee "$OUT_DIR/.health.tmp"
grep -i "^x-correlation-id: $CORRELATION_ID" "$OUT_DIR/.headers.tmp"

echo
echo "=== Observability status ==="
curl -sS -H "X-Correlation-Id: $CORRELATION_ID" "$API_URL/observability/status" | tee "$OUT_DIR/.observability-status.tmp"
node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$OUT_DIR/.observability-status.tmp','utf8')); if(d.localOnly!==true||d.productionMonitoring!==false) throw new Error('local-only/no-production flags missing'); if(!d.signals?.noSecretsInTelemetry) throw new Error('no-secret telemetry flag missing');"

echo
echo "=== Prometheus metrics ==="
curl -sS -H "X-Correlation-Id: $CORRELATION_ID" "$API_URL/metrics" | tee "$OUT_DIR/.metrics.tmp"
grep "supportplane_info" "$OUT_DIR/.metrics.tmp"
grep "supportplane_api_requests_total" "$OUT_DIR/.metrics.tmp"

echo
echo "=== No-secret telemetry scan ==="
if rg -i "supportplane-demo|x-supportplane-service-token|authorization|bearer [a-z0-9._-]+|minioadmin|token=|password=" "$OUT_DIR/.observability-status.tmp" "$OUT_DIR/.metrics.tmp"; then
  echo "Secret-like telemetry output found" >&2
  exit 1
fi
echo "No secret-like telemetry output found in observability status or metrics."

echo
echo "=== Observability namespace ==="
kubectl get pods -n supportplane-observability
kubectl get svc -n supportplane-observability

echo
echo "PASS verify_observability_baseline"
