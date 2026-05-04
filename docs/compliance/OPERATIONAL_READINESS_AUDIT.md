# Operational Readiness Audit

> **Status:** Readiness / Precheck — NOT a production operational certification.  
> **Scope:** Backup/restore, incident response, health checks, migrations, monitoring, runbooks.  
> **As of:** 2026-05-04

## 1. Backup & Restore

| Component | Backup Script | Restore Script | Tested? | Notes |
|-----------|---------------|----------------|---------|-------|
| PostgreSQL | `scripts/backup_local_sandbox.sh` | `scripts/restore_local_sandbox.sh` | Partial — dry-run tested | Backs up to `backups/` dir; restore has `--dry-run` default; secret redaction included |
| Object storage (MinIO) | Not automated | Not automated | No | Evidence objects exist; no bucket-level backup strategy |
| NATS JetStream | Not automated | Not automated | No | Streams persist on PVC; no stream export/backup |
| Configuration | Git only | Git only | Implicit | All K8s manifests and env examples are committed |
| OpenBao secrets | Reseed script only | `scripts/seed_openbao.sh` | Manual | Inmem storage — secrets lost on pod restart; reseed is manual |

### 1.1 Backup Runbook Status

| Document | Exists? | Quality |
|----------|---------|---------|
| `docs/RUNBOOK_BACKUP_RESTORE.md` | Yes | Dry-run focused; local-only; warns against production use |
| RTO / RPO defined | No | — |
| Off-site backup | No | All local to Fedora workstation |

## 2. Incident Response

| Capability | Status | Evidence | Gap |
|------------|--------|----------|-----|
| Incident response runbook | **Missing** | — | No `docs/RUNBOOK_INCIDENT_RESPONSE.md` |
| Severity classification | No | — | No P1/P2/P3/P4 operational severity matrix |
| On-call roster | No | — | No on-call schedule or escalation path |
| CSIRT contact / reporting | No | — | No NIS2 incident reporting workflow |
| Communication templates | No | — | No customer/stakeholder breach notification templates |
| Post-incident review process | No | — | No blameless postmortem template |
| Kill switch / circuit breaker | Partial | Delivery policy kill switch blocks all writeback | Good emergency stop, but no documented incident trigger procedure |

## 3. Health Checks & Observability

| Endpoint / Check | Exists? | Status | Notes |
|------------------|---------|--------|-------|
| API `/health` | Yes | Runtime proven | Returns git HEAD, store mode, auth mode |
| Web root HTTP 200 | Yes | Runtime proven | Basic liveness |
| Worker status endpoint | Yes | Runtime proven | Returns mode, queue backend, job counts |
| Prometheus `/metrics` | Yes | Runtime proven | Scraped by Prometheus in cluster |
| Observability status UI | Yes | Runtime proven | `LocalObservabilityPanel` shows correlation IDs, metrics, logs |
| Loki log queries | Partial | Ready | Loki deployed; no log shipper proven in this slice |
| Alerting rules | No | — | No Prometheus Alertmanager rules committed |
| Paging / notification | No | — | No PagerDuty/Opsgenie integration |

## 4. Migrations & Rollback

| Capability | Status | Evidence | Gap |
|------------|--------|----------|-----|
| Database migrations | Yes | Prisma Migrate; 8+ migrations applied | Migration files committed; rollback strategy is "restore from backup" |
| Schema drift detection | Partial | `npm run validate` includes Prisma schema check | No automated drift alert |
| Zero-downtime deploy | No | — | K8s rolling update exists but not tested with active sessions |
| Rollback procedure | Partial | Re-deploy previous image tag | No documented rollback runbook |
| Data migration testing | Partial | Seed data exercises models | No migration validation against production-like data volume |

## 5. Runbook Inventory

| Runbook | Exists? | Path | Completeness |
|---------|---------|------|--------------|
| Backup/restore | Yes | `docs/RUNBOOK_BACKUP_RESTORE.md` | Local-only; dry-run defaults |
| Windows endpoint verification | Yes | `docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md` | 17-item checklist; CI + manual |
| Demo / reset | Yes | `docs/DEMO_RUNBOOK.md` | Reset script + smoke test |
| Release packaging | Yes | `docs/RELEASE_RUNBOOK.md` | Dry-run package script |
| User testing ops | Yes | `docs/user-testing/README.md` | Tester onboarding + triage workflow |
| Incident response | **No** | — | **Highest gap** |
| Disaster recovery | **No** | — | Missing |
| Capacity planning | **No** | — | Missing |
| Security incident | **No** | — | Missing |

## 6. Monitoring & Logging Status

| System | Deployed? | Proven? | Notes |
|--------|-----------|---------|-------|
| Prometheus | Yes | Yes | Scrapes API metrics endpoint |
| Grafana | Yes | Yes | Reachable in cluster; no custom dashboards committed |
| Loki | Yes | Partial | Deployed; log shipper not proven |
| OpenTelemetry Collector | Yes | Partial | Deployed; traces not validated end-to-end |
| Alertmanager | No | — | Not deployed |
| Uptime / synthetic checks | No | — | No blackbox exporter or external probe |

## 7. Operational Gaps Summary

| Gap | Impact | Recommended Backlog |
|-----|--------|---------------------|
| No incident response runbook | High | Create `docs/RUNBOOK_INCIDENT_RESPONSE.md` |
| No disaster recovery test | High | Perform full restore from backup on fresh cluster |
| No off-site backup | Medium | Document backup export to external media/cloud |
| No alerting rules | Medium | Add Prometheus Alertmanager + basic rules |
| No rollback runbook | Medium | Document image-tag rollback procedure |
| No capacity planning | Low | Add resource request/limit tuning guide |
| OpenBao inmem durability | Medium | Document secret reseed procedure; evaluate persistent storage |

## 8. Recommended Immediate Actions

1. **Draft incident response runbook** — One-page initial response + severity matrix + contact list.
2. **Test restore** — Restore PostgreSQL backup to a fresh local cluster and verify app health.
3. **Add Alertmanager** — Deploy basic pod-crash and API-down alerts.
4. **Commit Grafana dashboards** — Export and version-control at least the API health dashboard.
5. **Document rollback** — `kubectl rollout undo` procedure for API/Web/Worker deployments.

---
*This audit is a readiness precheck, not a production operations certification.*
