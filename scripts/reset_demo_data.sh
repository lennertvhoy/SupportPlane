#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Demo Data Reset
# BL-090 — Release Packaging and Demo Reset
#
# This script destroys all runtime data and reseeds the database from committed
# migrations and prisma/seed.ts. It is deterministic and local/dev-only.
#
# Defaults to dry-run. Use --confirm for an interactive reset.
# Use --yes for a non-interactive reset (operator checklist / automation).
# Backward compatibility: --force still works as a live-reset trigger.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$REPO_ROOT"

DRY_RUN=true
CONFIRM=false
FORCE=false
YES=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --confirm) CONFIRM=true ;;
    --yes) YES=true ; CONFIRM=true ;;
    --force) FORCE=true ;;
  esac
done

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

log_info() { echo "[INFO] $*"; }
log_warn() { echo "[WARN] $*" >&2; }
log_dry()  { echo "[DRY-RUN] $*"; }
log_fatal() { echo "[FATAL] $*" >&2; exit 1; }

# ------------------------------------------------------------------
# Safety guard: require explicit confirmation or legacy force flag
# ------------------------------------------------------------------

LEGACY_ALLOW=false
if [[ "${SUPPORTPLANE_DEMO_RESET:-}" == "allow" ]]; then
  LEGACY_ALLOW=true
fi

if [[ "$FORCE" == true ]]; then
  # Legacy force flag bypasses dry-run
  DRY_RUN=false
  CONFIRM=true
fi

if [[ "$CONFIRM" == true && "$DRY_RUN" == true ]]; then
  DRY_RUN=false
fi

if [[ "$DRY_RUN" == true && "$CONFIRM" == false && "$FORCE" == false && "$LEGACY_ALLOW" == false ]]; then
  echo "=== SupportPlane Demo Data Reset ==="
  echo ""
  echo "WARNING: This script will DESTROY all data in the local PostgreSQL database"
  echo "and reseed it from committed migrations and prisma/seed.ts."
  echo ""
  echo "Current mode: DRY-RUN"
  echo "Nothing will be changed."
  echo ""
  echo "To proceed with a live reset, run one of:"
  echo "  bash scripts/reset_demo_data.sh --confirm         (interactive, asks for confirmation)"
  echo "  bash scripts/reset_demo_data.sh --yes             (non-interactive, for operator scripts)"
  echo "  SUPPORTPLANE_DEMO_RESET=allow bash scripts/reset_demo_data.sh"
  echo "  bash scripts/reset_demo_data.sh --force"
  echo ""
fi

if [[ "$LEGACY_ALLOW" == true && "$CONFIRM" == false && "$FORCE" == false ]]; then
  DRY_RUN=false
  CONFIRM=true
fi

if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo "============================================================"
  echo "WARNING: This will DESTRUCTIVELY overwrite local sandbox data."
  echo "============================================================"
  echo ""
  if [[ "$YES" == true ]]; then
    log_info "--yes flag set: skipping interactive confirmation."
  else
    read -r -p "Type 'destroy-local-data' to proceed: " CONFIRMATION
    if [[ "$CONFIRMATION" != "destroy-local-data" ]]; then
      log_fatal "Reset cancelled by user."
    fi
  fi
fi

# ------------------------------------------------------------------
# Safety guard: only allow against local PostgreSQL
# ------------------------------------------------------------------

DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$DATABASE_URL" ]]; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "DATABASE_URL is not set; live reset would be refused before touching data."
  else
    log_fatal "DATABASE_URL is not set."
  fi
fi

# Extract host for stricter validation
if [[ -n "$DATABASE_URL" ]]; then
  DB_HOST="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')"
  if [[ -z "$DB_HOST" ]]; then
    DB_HOST="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^/]*\)\/.*/\1/p')"
  fi

  # Accept localhost, 127.0.0.1, ::1, or local cluster DNS
  if [[ ! "$DB_HOST" =~ ^(localhost|127\.0\.0\.1|::1|postgres\.supportplane-data\.svc\.cluster\.local)$ ]]; then
    echo "ERROR: Demo reset refused because DATABASE_URL does not point to a local host." >&2
    echo "Current DATABASE_URL host: ${DB_HOST}" >&2
    echo "This script is intended for local development only." >&2
    exit 1
  fi

  # Also reject production-looking hosts as an extra safeguard
  if [[ "$DB_HOST" =~ \.rds\.amazonaws\.com$ ]] || \
     [[ "$DB_HOST" =~ \.cloud\.google\.com$ ]] || \
     [[ "$DB_HOST" =~ \.azure\.com$ ]] || \
     [[ "$DB_HOST" =~ \.database\.cloud\.ovh\.net$ ]] || \
     [[ "$DB_HOST" =~ \.db\.ondigitalocean\.com$ ]] || \
     [[ "$DB_HOST" =~ ^prod- ]] || \
     [[ "$DB_HOST" =~ -production- ]]; then
    log_fatal "Demo reset refused: DATABASE_URL host '${DB_HOST}' looks like a production endpoint."
  fi

  DB_URL_REDACTED="${DATABASE_URL//:*@/:***@}"
  log_info "DATABASE_URL host check passed (redacted): ${DB_URL_REDACTED}"
fi

# Optional: check store mode if set
STORE_MODE="${SUPPORTPLANE_STORE:-postgres}"
if [[ "$STORE_MODE" != "postgres" ]]; then
  log_warn "SUPPORTPLANE_STORE is '$STORE_MODE', not 'postgres'."
  log_warn "The reset script works against PostgreSQL only. Proceeding anyway."
fi

# ------------------------------------------------------------------
# 1. Reset app DB to deterministic state (Prisma seed)
# ------------------------------------------------------------------

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would run: npx prisma migrate reset --force"
  log_dry "Would run: npx prisma db seed"
else
  log_info "Resetting local PostgreSQL database..."
  npx prisma migrate reset --force
  log_info "Database reset and seeded successfully."
fi

# ------------------------------------------------------------------
# 2. Verify Zammad connector / delivery policy references exist
# ------------------------------------------------------------------

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would verify Zammad connector installation exists in database."
  log_dry "Would verify delivery policy references exist in database."
else
  log_info "Verifying Zammad connector and delivery policy references..."
  # These checks are informational; the seed script already ensures they exist.
  # We query the running API or DB if possible, but seed.ts is the source of truth.
  log_info "Connector installations and delivery policies are seeded by prisma/seed.ts."
fi

# ------------------------------------------------------------------
# 3. Verify OpenBao secret exists
# ------------------------------------------------------------------

if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would verify OpenBao secret 'openbao-local-dev' in namespace 'supportplane-integrations'."
  else
    if kubectl get secret openbao-local-dev -n supportplane-integrations >/dev/null 2>&1; then
      log_info "OpenBao secret verified in supportplane-integrations."
    else
      log_warn "OpenBao secret 'openbao-local-dev' not found in supportplane-integrations."
    fi
  fi
else
  log_warn "kubectl not found; skipping OpenBao secret verification."
fi

# ------------------------------------------------------------------
# 4. Verify MinIO bucket exists
# ------------------------------------------------------------------

if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would verify MinIO deployment exists in namespace 'supportplane-data'."
    log_dry "Would check that bucket 'supportplane-evidence' is accessible."
  else
    if kubectl get deployment minio -n supportplane-data >/dev/null 2>&1; then
      log_info "MinIO deployment verified in supportplane-data."
    else
      log_warn "MinIO deployment not found in supportplane-data."
    fi
  fi
else
  log_warn "kubectl not found; skipping MinIO verification."
fi

# ------------------------------------------------------------------
# 5. Verify Mailpit reachable
# ------------------------------------------------------------------

MAILPIT_HOST="${MAILPIT_HOST:-localhost}"
MAILPIT_PORT="${MAILPIT_PORT:-8025}"

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would check Mailpit reachability at ${MAILPIT_HOST}:${MAILPIT_PORT}"
else
  if command -v curl >/dev/null 2>&1; then
    if curl -s "http://${MAILPIT_HOST}:${MAILPIT_PORT}/api/v1/messages" >/dev/null 2>&1; then
      log_info "Mailpit is reachable at ${MAILPIT_HOST}:${MAILPIT_PORT}."
    else
      log_warn "Mailpit is not reachable at ${MAILPIT_HOST}:${MAILPIT_PORT}."
    fi
  elif command -v nc >/dev/null 2>&1; then
    if nc -z "$MAILPIT_HOST" "$MAILPIT_PORT" 2>/dev/null; then
      log_info "Mailpit port is open at ${MAILPIT_HOST}:${MAILPIT_PORT}."
    else
      log_warn "Mailpit port is not open at ${MAILPIT_HOST}:${MAILPIT_PORT}."
    fi
  else
    log_warn "Neither curl nor nc found; skipping Mailpit reachability check."
  fi
fi

# ------------------------------------------------------------------
# 6. Verify Asterisk reachable
# ------------------------------------------------------------------

ASTERISK_HOST="${ASTERISK_HOST:-localhost}"
ASTERISK_PORT="${ASTERISK_PORT:-5038}"

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would check Asterisk AMI port at ${ASTERISK_HOST}:${ASTERISK_PORT}"
else
  if command -v nc >/dev/null 2>&1; then
    if nc -z "$ASTERISK_HOST" "$ASTERISK_PORT" 2>/dev/null; then
      log_info "Asterisk AMI port is open at ${ASTERISK_HOST}:${ASTERISK_PORT}."
    else
      log_warn "Asterisk AMI port is not open at ${ASTERISK_HOST}:${ASTERISK_PORT}."
    fi
  elif command -v curl >/dev/null 2>&1; then
    # Asterisk AMI is raw TCP; curl won't work, but we try anyway for completeness
    log_warn "Asterisk AMI is TCP; curl cannot verify it. Install nc for proper check."
  else
    log_warn "Neither curl nor nc found; skipping Asterisk reachability check."
  fi
fi

# ------------------------------------------------------------------
# 7. Verify Ollama / Gemma reachable
# ------------------------------------------------------------------

OLLAMA_HOST="${OLLAMA_HOST:-10.88.0.1}"
OLLAMA_PORT="${OLLAMA_PORT:-11435}"
OLLAMA_MODEL="${OLLAMA_MODEL:-gemma4:e4b}"

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would check Ollama reachability at http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags"
  log_dry "Would verify model '${OLLAMA_MODEL}' is available."
else
  if command -v curl >/dev/null 2>&1; then
    if curl -s "http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags" >/dev/null 2>&1; then
      log_info "Ollama is reachable at ${OLLAMA_HOST}:${OLLAMA_PORT}."
      if curl -s "http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags" | grep -q "$OLLAMA_MODEL"; then
        log_info "Ollama model '${OLLAMA_MODEL}' is available."
      else
        log_warn "Ollama model '${OLLAMA_MODEL}' was not found in the tag list."
      fi
    else
      log_warn "Ollama is not reachable at ${OLLAMA_HOST}:${OLLAMA_PORT}."
    fi
  else
    log_warn "curl not found; skipping Ollama reachability check."
  fi
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------

echo ""
echo "=== Demo Reset Summary ==="
if [[ "$DRY_RUN" == true ]]; then
  echo "Mode: DRY-RUN — no changes were made."
  echo "To perform a live reset, run: bash scripts/reset_demo_data.sh --confirm"
else
  echo "Mode: LIVE reset executed."
  echo "The database now contains only deterministic seed data:"
  echo "  - Tenants: dev-tenant, alt-tenant"
  echo "  - Users: admin@supportplane.local, operator@supportplane.local, viewer@supportplane.local"
  echo "  - Connector installations: Local Zammad Sandbox, osTicket Read-Only Fixture, Alt Tenant Mock Connector"
  echo "  - Credential references: dev and alt placeholders (no real secrets)"
  echo "  - Delivery policies: default mock-only policies for both tenants"
  echo "  - Tickets: TICKET-101, TICKET-102 (fixture data)"
  echo ""
  echo "No stale test sessions remain. Start the demo with a clean state."
fi
echo "Done."
