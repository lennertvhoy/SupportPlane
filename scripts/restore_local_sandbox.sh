#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Local Sandbox Restore
# BL-087 — Backup/Restore
#
# Defaults to dry-run. Requires --confirm AND SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1.
# NEVER use this against production.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DRY_RUN=true
CONFIRM=false
DUMP_FILE=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --confirm) CONFIRM=true ;;
    --dump-file=*) DUMP_FILE="${arg#*=}" ;;
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
# Safeguard 1: kubectl context must be kind-supportplane-local
# ------------------------------------------------------------------

if ! command -v kubectl >/dev/null 2>&1; then
  log_fatal "kubectl not found. Restore requires kubectl."
fi

CURRENT_CTX="$(kubectl config current-context 2>/dev/null || echo 'unknown')"
if [[ "$CURRENT_CTX" != "kind-supportplane-local" ]]; then
  log_fatal "Restore refused: current kubectl context is '${CURRENT_CTX}', expected 'kind-supportplane-local'."
fi
log_info "kubectl context verified: ${CURRENT_CTX}"

# ------------------------------------------------------------------
# Safeguard 2: DATABASE_URL must not point to production
# ------------------------------------------------------------------

DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$DATABASE_URL" ]]; then
  log_warn "DATABASE_URL not set in environment."
fi

if [[ -n "$DATABASE_URL" ]]; then
  # Extract host
  DB_HOST="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')"
  if [[ -z "$DB_HOST" ]]; then
    DB_HOST="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^/]*\)\/.*/\1/p')"
  fi

  # Reject if host looks production-like
  if [[ "$DB_HOST" =~ \.rds\.amazonaws\.com$ ]] || \
     [[ "$DB_HOST" =~ \.cloud\.google\.com$ ]] || \
     [[ "$DB_HOST" =~ \.azure\.com$ ]] || \
     [[ "$DB_HOST" =~ \.database\.cloud\.ovh\.net$ ]] || \
     [[ "$DB_HOST" =~ \.db\.ondigitalocean\.com$ ]] || \
     [[ "$DB_HOST" =~ ^prod- ]] || \
     [[ "$DB_HOST" =~ -production- ]] || \
     [[ "$DB_HOST" =~ \.svc\.cluster\.local$ && "$CURRENT_CTX" != "kind-supportplane-local" ]]; then
    log_fatal "Restore refused: DATABASE_URL host '${DB_HOST}' looks like a production endpoint."
  fi

  if [[ "$DB_HOST" != "localhost" && "$DB_HOST" != "127.0.0.1" && "$DB_HOST" != "::1" && "$DB_HOST" != "postgres.supportplane-data.svc.cluster.local" ]]; then
    log_warn "DATABASE_URL host '${DB_HOST}' is not a recognized local sandbox host."
    log_warn "Restore is allowed only against localhost, 127.0.0.1, or the local cluster DNS."
    log_fatal "To override, explicitly set DATABASE_URL to a local endpoint and rerun."
  fi

  DB_URL_REDACTED="${DATABASE_URL//:*@/:***@}"
  log_info "DATABASE_URL host check passed (redacted): ${DB_URL_REDACTED}"
fi

# ------------------------------------------------------------------
# Safeguard 3: environment variable gate
# ------------------------------------------------------------------

if [[ "${SUPPORTPLANE_ALLOW_RESTORE_LOCAL:-0}" != "1" && "$DRY_RUN" == false ]]; then
  log_fatal "Restore refused: SUPPORTPLANE_ALLOW_RESTORE_LOCAL is not set to 1."
fi
if [[ "${SUPPORTPLANE_ALLOW_RESTORE_LOCAL:-0}" == "1" ]]; then
  log_info "SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1 detected."
else
  log_dry "SUPPORTPLANE_ALLOW_RESTORE_LOCAL is not set; live restore would be refused."
fi

# ------------------------------------------------------------------
# Safeguard 4: require --confirm for non-dry-run
# ------------------------------------------------------------------

if [[ "$DRY_RUN" == true && "$CONFIRM" == false ]]; then
  echo ""
  echo "============================================================"
  echo "WARNING: This will DESTRUCTIVELY overwrite local sandbox data."
  echo "============================================================"
  echo ""
  echo "Current mode: DRY-RUN"
  echo "Nothing will be changed."
  echo ""
  echo "To perform an actual restore, you MUST run:"
  echo "  SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1 bash scripts/restore_local_sandbox.sh --confirm --dump-file=<path>"
  echo ""
fi

if [[ "$CONFIRM" == true && "$DRY_RUN" == true ]]; then
  # --confirm turns off dry-run
  DRY_RUN=false
fi

if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo "============================================================"
  echo "WARNING: This will DESTRUCTIVELY overwrite local sandbox data."
  echo "============================================================"
  echo ""
  read -r -p "Type 'destroy-local-data' to proceed: " CONFIRMATION
  if [[ "$CONFIRMATION" != "destroy-local-data" ]]; then
    log_fatal "Restore cancelled by user."
  fi
fi

# ------------------------------------------------------------------
# Validate dump file
# ------------------------------------------------------------------

if [[ -z "$DUMP_FILE" ]]; then
  log_warn "No --dump-file specified. PostgreSQL restore will be skipped."
else
  if [[ ! -f "$DUMP_FILE" ]]; then
    log_fatal "Dump file not found: ${DUMP_FILE}"
  fi
  log_info "Dump file validated: ${DUMP_FILE}"
fi

# ------------------------------------------------------------------
# Restore steps
# ------------------------------------------------------------------

echo ""
echo "=== Restore Steps ==="

# 1. Restore PostgreSQL from pg_dump file
if [[ -n "$DUMP_FILE" ]]; then
  if command -v psql >/dev/null 2>&1; then
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would run: psql -f ${DUMP_FILE} (connection redacted)"
    else
      export PGPASSWORD="$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')"
      psql \
        --host="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')" \
        --port="$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')" \
        --username="$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')" \
        --dbname="$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')" \
        -f "$DUMP_FILE" || log_warn "psql restore encountered errors"
      unset PGPASSWORD
      log_info "PostgreSQL restore completed from ${DUMP_FILE}"
    fi
  else
    log_warn "psql not found; skipping PostgreSQL restore."
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would have run psql restore if psql were installed."
    fi
  fi
else
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Skipping PostgreSQL restore: no dump file provided."
  fi
fi

# 2. Verify MinIO bucket exists
if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would verify MinIO deployment is present in namespace supportplane-data."
    log_dry "Would check that bucket 'supportplane-evidence' exists (via kubectl exec or mc/aws if available)."
  else
    if kubectl get deployment minio -n supportplane-data >/dev/null 2>&1; then
      log_info "MinIO deployment found in supportplane-data."
    else
      log_warn "MinIO deployment not found in supportplane-data."
    fi
  fi
else
  log_warn "kubectl not found; cannot verify MinIO bucket."
fi

# 3. Verify OpenBao secret exists
if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would verify OpenBao secret 'openbao-local-dev' exists in namespace supportplane-integrations."
  else
    if kubectl get secret openbao-local-dev -n supportplane-integrations >/dev/null 2>&1; then
      log_info "OpenBao secret found in supportplane-integrations."
    else
      log_warn "OpenBao secret not found in supportplane-integrations."
    fi
  fi
else
  log_warn "kubectl not found; cannot verify OpenBao secret."
fi

# 4. Restart deployments
if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would rollout restart deployments in supportplane-app namespace:"
    log_dry "  kubectl rollout restart deployment -n supportplane-app"
  else
    log_info "Restarting deployments in supportplane-app..."
    kubectl rollout restart deployment -n supportplane-app >/dev/null 2>&1 || log_warn "Deployment restart encountered errors"
    log_info "Deployments restarted."
  fi
else
  log_warn "kubectl not found; cannot restart deployments."
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------

echo ""
echo "=== Restore Summary ==="
if [[ "$DRY_RUN" == true ]]; then
  echo "Mode: DRY-RUN — no changes were made."
else
  echo "Mode: LIVE restore executed."
fi
echo "kubectl context: ${CURRENT_CTX}"
if [[ -n "$DUMP_FILE" ]]; then
  echo "Dump file: ${DUMP_FILE}"
fi
echo "Done."
