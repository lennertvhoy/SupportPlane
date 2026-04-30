#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-112 MinIO Evidence Persistence Verification ==="
echo

MINIO_URL="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin123}"
BUCKET="${MINIO_EVIDENCE_BUCKET:-supportplane-evidence}"

echo "1. MinIO health:"
curl -s "${MINIO_URL}/minio/health/live" -o /dev/null -w "live: %{http_code}\n" || echo "live check failed"
curl -s "${MINIO_URL}/minio/health/ready" -o /dev/null -w "ready: %{http_code}\n" || echo "ready check failed"

echo
echo "2. Listing bucket objects (supportplane-evidence/writebacks/):"
curl -s "${MINIO_URL}/${BUCKET}?list-type=2&prefix=supportplane-evidence/" -u "${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}" | head -200 || echo "List failed"

echo
echo "=== Verification complete ==="
