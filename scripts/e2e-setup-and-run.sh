#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

export DATABASE_URL="${E2E_DATABASE_URL:-postgresql://supportplane:supportplane_dev@localhost:5434/supportplane_e2e?schema=public}"
export API_PORT="${E2E_API_PORT:-4111}"
export WEB_PORT="${E2E_WEB_PORT:-3201}"
export NEXT_PUBLIC_API_BASE_URL="http://localhost:${API_PORT}"
export NODE_ENV="test"
export SUPPORTPLANE_AUTH_MODE="local"
export SUPPORTPLANE_STORE="postgres"
export E2E_WEB_PORT="${WEB_PORT}"
export E2E_API_PORT="${API_PORT}"

echo "[e2e] DATABASE_URL=${DATABASE_URL}"
echo "[e2e] API_PORT=${API_PORT}"
echo "[e2e] WEB_PORT=${WEB_PORT}"

echo "[e2e] Ensuring test database exists..."
node scripts/e2e-create-test-db.js

echo "[e2e] Running Prisma migrations..."
npx prisma migrate deploy

echo "[e2e] Seeding deterministic test data..."
node_modules/.bin/tsx prisma/seed.ts

echo "[e2e] Building workspaces..."
npm run build

echo "[e2e] Starting API on port ${API_PORT}..."
PORT="${API_PORT}" NODE_ENV="${NODE_ENV}" SUPPORTPLANE_AUTH_MODE="${SUPPORTPLANE_AUTH_MODE}" SUPPORTPLANE_STORE="${SUPPORTPLANE_STORE}" node apps/api/dist/src/main.js &
API_PID=$!

echo "[e2e] Starting Web on port ${WEB_PORT}..."
cd apps/web
PORT="${WEB_PORT}" ../../node_modules/.bin/next start -p "${WEB_PORT}" &
WEB_PID=$!
cd "${REPO_ROOT}"

cleanup() {
  echo "[e2e] Cleaning up background processes..."
  kill "${API_PID}" "${WEB_PID}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT

echo "[e2e] Waiting for API health..."
for i in $(seq 1 60); do
  if curl -sf "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
    echo "[e2e] API is healthy"
    break
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "[e2e] API did not become healthy in time"
    exit 1
  fi
done

echo "[e2e] Running Playwright tests..."
npx playwright test "$@"

echo "[e2e] Done"
