# BL-108/109/110/115 Proof State Mapping

Canonical folder: `output/playwright/session-109-bl108-109-110-115-real-sandbox-enablement/`

Screenshot count: 8. Max-20 cap respected.

| # | File | State proved |
|---|---|---|
| 1 | `01-cluster-api-health-current-head.png` | Cluster API health and runtime identity from `/health`. |
| 2 | `02-ui-real-zammad-sandbox-read.png` | UI still loads real Zammad sandbox ticket data and shows sandbox/read-only/no-writeback truth. |
| 3 | `03-openbao-resolver-no-secret.png` | OpenBao sandbox resolver metadata is visible without exposing the raw Zammad token. |
| 4 | `04-ollama-local-no-cloud-metadata.png` | Ollama local provider/fallback metadata includes model, prompt, context hash, no-cloud marker, and no autonomous send. |
| 5 | `05-nats-jetstream-worker-mode.png` | Worker/outbox status surfaces NATS JetStream local sandbox bridge mode. |
| 6 | `06-egress-safety-writeback-blocked.png` | API denies writeback with explicit safe denial metadata and no external write attempt. |
| 7 | `07-local-mvp-regression-proof.png` | Existing local MVP endpoints remain reachable; local dev/memory workflow limitation is documented. |
| 8 | `08-state-docs-backlog-next-actions.png` | State docs show BL-108 partial, BL-109/110/115 accepted, and BL-108 repair before BL-111. |

CLI artifacts cover non-visual proof states:

- OpenBao seed/resolver/no-secret: `openbao-secret-seed-proof.txt`, `openbao-resolver-proof.txt`, `openbao-no-secret-leak-proof.txt`
- Egress/writeback: `egress-policy-proof.txt`, `blocked-external-egress-proof.txt`, `boundary-proof.txt`
- Ollama: `ollama-provider-proof.txt`, `ollama-no-cloud-proof.txt`, `ollama-fallback-proof.txt`
- NATS: `nats-stream-consumer-proof.txt`, `nats-worker-bridge-proof.txt`, `nats-restart-or-durable-proof.txt`, `supportplane-worker-status.txt`
- Runtime/deploy: `image-build-load-proof.txt`, `deploy-rollout-migrate-seed.txt`, `supportplane-api-health.txt`
- Validation: `validation-gate.txt`, `runtime-enable-proof-after-nats-restart.txt`, `screenshot-md5s.txt`
