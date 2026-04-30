# BL-114 Observability Architecture Proof

**Scope:** local-only observability baseline for the SupportPlane self-hosted sandbox.  
**Status:** architecture proof only; no manifests, code, dashboards, or runtime telemetry are implemented by this file.  
**Target namespace:** `supportplane-observability`.  
**Backlog:** BL-114, planned.  

## Baseline Decision

Use a small local stack:

| Component | Decision | Local role |
|---|---:|---|
| OpenTelemetry Collector | include | Single local telemetry ingress for OTLP traces, metrics, and structured logs from SupportPlane API/worker first. |
| Prometheus | include | Local metrics store and scraper for app, worker, collector, NATS, and future service health. |
| Grafana | include | Local dashboards and Explore UI for correlation-ID searches across metrics, logs, and traces when enabled. |
| Loki | include | Reasonable for the local sandbox because logs are the fastest path to prove request/outbox/writeback correlation without adding a heavier tracing backend first. |

Do not add a production monitoring claim. This stack is for localhost/Kind/Podman proof only.

## Local Topology

```text
SupportPlane API
  -> OTLP traces/metrics/logs -> OpenTelemetry Collector
  -> structured stdout logs    -> collector/log agent path or pod log scrape

SupportPlane Worker
  -> OTLP traces/metrics/logs -> OpenTelemetry Collector
  -> structured stdout logs    -> collector/log agent path or pod log scrape

OpenTelemetry Collector
  -> Prometheus scrape/export endpoint for metrics
  -> Loki for structured logs
  -> optional local trace export path retained as file/debug until a trace backend is added

Grafana
  -> Prometheus datasource
  -> Loki datasource
```

Trace storage is intentionally minimal for BL-114. If a trace backend is needed later, add Tempo in a future slice after proving the simpler log/metric path. For BL-114, the collector should still accept trace spans and expose/debug them, but closure should not claim durable trace retention unless a backend is actually deployed and queried.

## Signals Collected

| Signal | Source | Required fields | Storage/query target |
|---|---|---|---|
| API request log | NestJS API request boundary | `timestamp`, `service.name=supportplane-api`, `correlation_id`, `request_id`, `tenant_id`, `actor_id`, `route`, `method`, `status_code`, `duration_ms`, `git_commit`, `runtime_mode=local-sandbox` | Loki |
| API request metric | NestJS API request boundary | route template, method, status class, duration histogram, request count | Prometheus |
| Worker processing log | worker loop/process-once/NATS consume | `service.name=supportplane-worker`, `correlation_id`, `outbox_item_id`, `idempotency_key`, `worker_id`, `queue_backend`, `result_status` | Loki |
| Worker metric | worker loop/process-once/NATS consume | processed count, failed count, retry count, processing duration, no-eligible count | Prometheus |
| Outbox item lifecycle log | API outbox + worker | `correlation_id`, `support_session_id`, `action_id`, `outbox_item_id`, `idempotency_key`, `outbox_status`, `policy_decision` | Loki |
| Sandbox writeback result log | worker/API delivery result | `correlation_id`, `outbox_item_id`, `delivery_mode=sandbox`, `external_write_attempted`, `writeback_status`, redacted destination label | Loki |
| Integration status metric | API/worker health probes | healthy/unhealthy gauges for NATS bridge, OpenBao resolver, MinIO, Mailpit, Zammad sandbox, Ollama local provider | Prometheus |
| Local AI metadata log | AI draft path | `correlation_id`, `provider=ollama`, `model`, `cloud_provider=false`, `no_cloud_ai=true`, `fallback_used`, `latency_ms`, `context_hash` | Loki |

## Correlation ID Contract

Use a single canonical field name everywhere: `correlation_id`.

Rules:

- Incoming HTTP requests accept `x-correlation-id` only if it is present, non-empty, and safe to log. Otherwise the API generates one.
- The API returns `x-correlation-id` on every response.
- The API writes `correlation_id` into request logs, audit metadata, action/outbox metadata, and any worker envelope it publishes.
- NATS JetStream messages include `correlation_id`, `outbox_item_id`, `support_session_id`, `action_id`, `tenant_id`, and `idempotency_key`.
- Worker logs preserve the inbound `correlation_id`; fallback PostgreSQL processing also reads it from outbox metadata.
- Evidence metadata records the `correlation_id`, but evidence content must not become the telemetry source of truth.
- Do not derive correlation IDs from user-provided secrets, tokens, emails, raw ticket bodies, or prompt content.

Suggested local format:

```text
sp-<yyyymmddhhmmss>-<12 lowercase hex chars>
```

Accepted external format:

```text
^[a-zA-Z0-9._:-]{8,128}$
```

If an inbound value fails validation, generate a new ID and log only `correlation_id_replaced=true`; do not log the rejected value.

## Required Coverage Map

| Coverage requirement | Baseline event or metric | Required proof query |
|---|---|---|
| API request correlation | API request log + duration metric with `correlation_id` | Loki query by exact `correlation_id` returns request route/status and no secrets. |
| Worker processing | Worker processing log and processed/failure counters | Loki query by `correlation_id` shows worker claim/process result; Prometheus shows counter movement. |
| Outbox item correlation | Outbox lifecycle log with `outbox_item_id` and `idempotency_key` | Loki query by `outbox_item_id` returns queued, consumed, and terminal status events with same `correlation_id`. |
| Sandbox writeback result | Delivery result log | Loki query shows sandbox result, redacted destination label, and no raw Zammad token/body secret. |
| Zammad internal note result | Zammad writeback result log | Query includes `zammad_article_id`, `ticket_id`, `internal_note=true`, redacted HTTP status summary, and idempotency marker hash. |
| MinIO evidence result | Evidence artifact stored log + metric | Query includes bucket, object key, checksum, byte count, local sandbox disclaimer; no access key or secret key. |
| Mailpit notification result | Notification captured log + metric | Query includes Mailpit message ID, subject, captured timestamp, and `internet_email_sent=false`. |
| Local AI metadata no-cloud marker | AI provider log | Query includes `provider=ollama`, model, `no_cloud_ai=true`, `cloud_provider=false`, `fallback_used`, latency, context hash. |
| NATS bridge status | Worker status log + bridge health gauge | Query/metric shows `queue_backend=nats-jetstream`, stream, consumer, connected status, and fallback status. |
| OpenBao resolver status without secrets | Resolver log + health gauge | Query shows credential reference ID, resolver enabled/disabled/fail-closed status, and `secret_material_logged=false`. |

## Log Schema

Minimum structured JSON log fields:

```json
{
  "timestamp": "2026-04-30T09:15:00.000Z",
  "level": "info",
  "service.name": "supportplane-api",
  "environment": "local-sandbox",
  "git_commit": "full-commit-hash",
  "correlation_id": "sp-20260430091500-a1b2c3d4e5f6",
  "tenant_id": "dev-tenant",
  "actor_id": "admin@supportplane.local",
  "event_name": "outbox_item_queued",
  "support_session_id": "uuid",
  "action_id": "uuid",
  "outbox_item_id": "uuid",
  "idempotency_key": "sha256:...",
  "result_status": "queued"
}
```

Field constraints:

- `tenant_id` is required for tenant-scoped operations.
- `actor_id` may be a stable local demo identity; avoid raw session cookies or auth headers.
- `route` must be the route template, not a path containing arbitrary IDs unless IDs are already approved metadata.
- `error.message` may be logged after redaction; `error.stack` should be disabled by default in Loki for this local baseline unless a no-secret stack redaction test exists.

## Metrics

Minimum local Prometheus series:

| Metric | Type | Labels |
|---|---|---|
| `supportplane_api_http_requests_total` | counter | `service`, `method`, `route`, `status_class` |
| `supportplane_api_http_request_duration_seconds` | histogram | `service`, `method`, `route`, `status_class` |
| `supportplane_worker_outbox_processed_total` | counter | `service`, `queue_backend`, `result_status`, `delivery_mode` |
| `supportplane_worker_outbox_processing_duration_seconds` | histogram | `service`, `queue_backend`, `delivery_mode` |
| `supportplane_nats_bridge_connected` | gauge | `stream`, `consumer` |
| `supportplane_openbao_resolver_available` | gauge | `resolver_mode` |
| `supportplane_minio_evidence_writes_total` | counter | `bucket`, `result_status` |
| `supportplane_mailpit_notifications_total` | counter | `result_status` |
| `supportplane_zammad_writebacks_total` | counter | `delivery_mode`, `result_status` |
| `supportplane_ai_local_requests_total` | counter | `provider`, `model`, `fallback_used`, `no_cloud_ai` |

Do not put correlation IDs, user emails, ticket titles, object keys, prompt text, exception text, token IDs, or raw URLs into metric labels. Use logs for high-cardinality correlation.

## Secret Redaction Contract

Telemetry must never include:

- Zammad API token or authorization header.
- OpenBao root token, client token, unseal key, secret path values that reveal secret material, or resolved secret bytes.
- MinIO secret key, access key in auth headers, signed URL query strings, or AWS signature headers.
- Mailpit SMTP credentials if introduced later.
- Session cookies, service tokens, password hashes, or local auth passwords.
- Raw prompt text, unrelated ticket body content, or user screen/OCR content.

Allowed safe identifiers:

- Credential reference ID.
- OpenBao resolver mode: `enabled`, `disabled`, `fail_closed`, or `unavailable`.
- Zammad ticket ID and article ID from the local sandbox.
- MinIO bucket and object key for local evidence artifacts, provided keys contain no secret material.
- Mailpit message ID and subject for the local sandbox notification.
- Hashes/checksums such as `context_hash`, evidence SHA-256, and idempotency marker hash.

Required proof before BL-114 acceptance:

```text
Search Loki export/log artifacts for token-like patterns and known local placeholder values.
Result must show no raw secret material in API logs, worker logs, collector logs, evidence metadata logs, or dashboard screenshots.
```

## Grafana Baseline Views

Keep dashboards small:

1. **Sandbox Request Correlation**
   - Text input or documented Explore query for `correlation_id`.
   - Panels: API request log, outbox lifecycle log, worker result log, integration result logs.
2. **Worker and Outbox**
   - Processed/failed/retry counters.
   - NATS bridge connected gauge.
   - Last outbox terminal statuses by log query.
3. **Integration Health**
   - Zammad, OpenBao, NATS, MinIO, Mailpit, Ollama local provider status.
   - Explicit local-only labels.
4. **No-Cloud AI**
   - Local AI requests by model.
   - `no_cloud_ai=true` and `cloud_provider=false` visible.

## Local-Only Limitations

- No production monitoring, alerting, paging, retention, SLO, or incident workflow.
- No production-grade authentication for Grafana/Prometheus/Loki is claimed.
- No TLS, network policy, mTLS, or secure exporter boundary is claimed for observability.
- No durable trace backend is claimed unless added later.
- No cross-cluster, multi-tenant, HA, backup, restore, or long-retention telemetry is claimed.
- No compliance-grade audit immutability is created by Loki, Prometheus, Grafana, or the collector.
- No cloud telemetry exporter is allowed in this baseline.

## Future Production Gaps

- Add production telemetry threat model and PII classification.
- Add authenticated/authorized observability access per tenant/operator role.
- Add TLS and network policies around telemetry ingest and query paths.
- Add retention, backup, restore, and deletion policies for logs and metrics.
- Add alerting rules and SLO definitions after real operational targets exist.
- Add trace backend and sampling policy if distributed trace retention becomes necessary.
- Add dashboard provisioning and immutable config review.
- Add redaction tests in CI that cover logs, spans, metrics, collector config, and screenshots.

## Acceptance Proof Required Later

BL-114 should not be accepted from this architecture proof alone. A later implementation proof must show:

- Collector, Prometheus, Grafana, and Loki pods/services running in `supportplane-observability`.
- API and worker configured to emit the agreed fields.
- One real sandbox writeback flow with a single `correlation_id` visible across API request, outbox item, NATS worker processing, Zammad result, MinIO result, Mailpit result, local AI metadata, NATS bridge status, and OpenBao resolver status.
- Prometheus metrics for API request count/duration and worker processing count/duration.
- Grafana/Loki query by `correlation_id`.
- No-secret telemetry proof from exported logs or query results.
- Explicit runtime identity proof for the cluster, commit, namespace, pods, and local port-forwards used.
