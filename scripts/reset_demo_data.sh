#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# SupportPlane Demo Data Reset
# This script destroys all runtime data and reseeds the database from committed
# migrations and prisma/seed.ts. It is deterministic and local/dev-only.

echo "=== SupportPlane Demo Data Reset ==="
echo ""

# Safety guard: require explicit environment or flag
if [[ "${SUPPORTPLANE_DEMO_RESET:-}" != "allow" && "${1:-}" != "--force" ]]; then
  echo "ERROR: Demo reset refused." >&2
  echo "This script will DESTROY all data in the local PostgreSQL database" >&2
  echo "and reseed it from committed migrations and prisma/seed.ts." >&2
  echo "" >&2
  echo "To proceed, run one of:" >&2
  echo "  SUPPORTPLANE_DEMO_RESET=allow bash scripts/reset_demo_data.sh" >&2
  echo "  bash scripts/reset_demo_data.sh --force" >&2
  exit 1
fi

# Safety guard: only allow against local PostgreSQL
DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

# Accept localhost, 127.0.0.1, or unix socket for local dev
if [[ ! "$DATABASE_URL" =~ (localhost|127\.0\.0\.1|::1) ]]; then
  echo "ERROR: Demo reset refused because DATABASE_URL does not point to localhost." >&2
  echo "Current DATABASE_URL: ${DATABASE_URL//:*@/:***@}" >&2
  echo "This script is intended for local development only." >&2
  exit 1
fi

# Optional: check store mode if set
STORE_MODE="${SUPPORTPLANE_STORE:-postgres}"
if [[ "$STORE_MODE" != "postgres" ]]; then
  echo "WARNING: SUPPORTPLANE_STORE is '$STORE_MODE', not 'postgres'." >&2
  echo "The reset script works against PostgreSQL only. Proceeding anyway." >&2
fi

echo "Resetting local PostgreSQL database..."
echo "  DATABASE_URL: ${DATABASE_URL//:*@/:***@}"
echo ""

# Run Prisma migrate reset to recreate schema from migrations, then seed
npx prisma migrate reset --force

echo ""
echo "=== Demo reset complete ==="
echo "The database now contains only deterministic seed data:"
echo "  - Tenants: dev-tenant, alt-tenant"
echo "  - Users: admin@supportplane.local, operator@supportplane.local, viewer@supportplane.local"
echo "  - Connector installations: Local Zammad Mock, Alt Tenant Mock Connector"
echo "  - Credential references: dev and alt placeholders (no real secrets)"
echo "  - Delivery policies: default mock-only policies for both tenants"
echo "  - Tickets: TICKET-101, TICKET-102 (fixture data)"
echo ""
echo "No stale test sessions remain. Start the demo with a clean state."
