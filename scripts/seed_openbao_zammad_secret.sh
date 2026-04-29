#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${OPENBAO_NAMESPACE:-supportplane-integrations}"
POD_SELECTOR="${OPENBAO_POD_SELECTOR:-app.kubernetes.io/name=openbao}"
SECRET_PATH="${OPENBAO_ZAMMAD_SECRET_PATH:-secret/supportplane/dev/zammad}"
TOKEN="${OPENBAO_TOKEN:-openbao-local-root-token}"

if [[ -z "${ZAMMAD_API_TOKEN:-}" ]]; then
  ZAMMAD_API_TOKEN="$(
    kubectl get secret app-secret-local -n supportplane-app \
      -o jsonpath='{.data.ZAMMAD_API_TOKEN}' 2>/dev/null | base64 -d 2>/dev/null || true
  )"
fi

if [[ -z "${ZAMMAD_API_TOKEN:-}" ]]; then
  echo "OpenBao seed failed: ZAMMAD_API_TOKEN env var or existing app-secret-local key is required." >&2
  exit 1
fi

POD="$(
  kubectl get pod -n "$NAMESPACE" -l "$POD_SELECTOR" \
    -o jsonpath='{.items[0].metadata.name}'
)"

kubectl exec -n "$NAMESPACE" "$POD" -- env \
  BAO_ADDR=http://127.0.0.1:8200 \
  BAO_TOKEN="$TOKEN" \
  SECRET_PATH="$SECRET_PATH" \
  ZAMMAD_API_TOKEN="$ZAMMAD_API_TOKEN" \
  sh -c 'bao kv put "$SECRET_PATH" apiToken="$ZAMMAD_API_TOKEN" >/dev/null'

echo "OpenBao sandbox Zammad secret seeded at ${SECRET_PATH}; raw token intentionally not printed."
