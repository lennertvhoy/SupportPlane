# Real E2E Sandbox Flow

**Backlog:** BL-102  
**Status:** Accepted (BL-116). All core phases through BL-117 are complete. Most steps are now REAL NOW in the matrix.

## Target Flow Status Matrix

| #   | Step                                                                                | Status                                            | Current truth                                                                                                        | Target proof                                                                  |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Operator logs into SupportPlane.                                                    | REAL NOW                                          | Local username/password demo auth works.                                                                             | Cluster Web/API preserve local auth or documented dev auth.                   |
| 2   | Operator creates/selects a SupportSession.                                          | REAL NOW                                          | Sessions persist in PostgreSQL in local mode.                                                                        | Same behavior works in cluster.                                               |
| 3   | SupportPlane loads customer/ticket from self-hosted Zammad sandbox.                 | REAL NOW                                          | Real Zammad sandbox read via FetchZammadHttpClient with server-side OpenBao credential resolution (BL-107 accepted). | Real Zammad API read against sandbox with provenance.                         |
| 4   | SupportPlane builds AIContextPacket with ticket/customer/session/policy provenance. | REAL NOW                                          | Context packets include real Zammad sandbox data (BL-107 accepted).                                                  | Packet includes real Zammad provenance and policy source.                     |
| 5   | Ollama generates draft note and/or ticket summary.                                  | REAL NOW                                          | Real Ollama model calls to gemma4:e4b with fallbackUsed=false (BL-108/BL-121 accepted).                              | Local Ollama provider, model metadata, prompt version, context hash, latency. |
| 6   | Operator reviews the draft.                                                         | REAL NOW                                          | Review-required local workflow exists.                                                                               | UI shows local model output and source context.                               |
| 7   | Operator submits for review.                                                        | REAL NOW                                          | Action lifecycle supports review state.                                                                              | Same lifecycle uses real sandbox draft metadata.                              |
| 8   | Admin/authorized operator approves.                                                 | REAL NOW                                          | RBAC and approval state exist.                                                                                       | Approval required for sandbox writeback.                                      |
| 9   | Delivery policy evaluates the action.                                               | REAL NOW                                          | Policy blocks real network and allows mock delivery only.                                                            | Policy can allow sandbox-only internal-note writeback under gates.            |
| 10  | Outbox item is queued.                                                              | REAL NOW                                          | PostgreSQL outbox exists.                                                                                            | Outbox bridges to NATS JetStream or accepted durable worker path.             |
| 11  | NATS JetStream worker consumes/processes action.                                    | REAL NOW                                          | NATS JetStream durable consumer processes outbox actions via product stream (BL-110 accepted).                       | Durable stream/consumer, retries, dead-letter, idempotency proof.             |
| 12  | Worker resolves Zammad credential via OpenBao.                                      | REAL NOW                                          | Server-side OpenBao resolver for Zammad token, no raw secret in API/UI (BL-109 accepted).                            | Server-side resolver obtains local placeholder token without leakage.         |
| 13  | Worker performs sandbox-only internal-note writeback to Zammad.                     | REAL NOW                                          | Approval-gated idempotent sandbox writeback proven (BL-111 accepted).                                                | One internal note written to sandbox ticket only.                             |
| 14  | Worker stores writeback result.                                                     | REAL NOW                                          | Real sandbox result stored with redacted HTTP summary (BL-111 accepted).                                             | Real sandbox result stored with redacted HTTP summary.                        |
| 15  | Worker emits audit events.                                                          | REAL NOW                                          | Local audit events exist.                                                                                            | Events include real sandbox writeback, policy, resolver, worker IDs.          |
| 16  | Mailpit captures optional local notification email.                                 | REAL NOW                                          | SMTP message captured in Mailpit; 13 messages proven; no internet email (BL-113 accepted).                           | SMTP message captured in Mailpit; no internet email.                          |
| 17  | Evidence bundle is generated.                                                       | REAL NOW                                          | JSON/Markdown local/mock bundle exists.                                                                              | Bundle includes real sandbox provenance and artifact metadata.                |
| 18  | Evidence JSON/Markdown is stored in MinIO.                                          | REAL NOW                                          | Evidence artifact persisted to MinIO with SHA-256 checksum (BL-112 accepted).                                        | Object key, checksum, local disclaimer stored and visible.                    |
| 19  | UI shows full provenance chain.                                                     | REAL NOW (full provenance chain proven in BL-116) | UI shows mock provenance, policy, outbox, evidence.                                                                  | UI shows Zammad/Ollama/OpenBao/NATS/MinIO provenance without secrets.         |
| 20  | Demo proves viewer RBAC denial and kill-switch denial.                              | REAL NOW                                          | Viewer denial and policy gates are proven for mock/local.                                                            | Same denial paths proven against sandbox writeback.                           |

## Implemented API Endpoints

- Existing local endpoints: auth, sessions, ticket context, draft generation, actions, outbox, delivery policies, connector runtime, evidence bundle.
- Accepted additions (BL-103 through BL-116):
  - Zammad sandbox read endpoint or connector driver path.
  - Ollama provider endpoint/path through existing AI gateway.
  - OpenBao-backed credential resolution path, server-side only.
  - NATS JetStream worker status and dead-letter visibility.
  - MinIO evidence artifact write/read metadata.
  - Mailpit notification status metadata.

## Implemented UI Panels

- Runtime identity header.
- Sessions.
- Ticket Context with real sandbox Zammad provenance.
- AI Context Quality.
- Draft Note / AI draft metadata.
- Action Center.
- Delivery Policy.
- Delivery Operations / Worker Status.
- Connector Runtime.
- Evidence Bundle with object storage key/checksum.
- Admin/viewer RBAC proof surfaces.

## Required Audit Events

- `zammad_sandbox_ticket_read`
- `ai_context_packet_built`
- `ollama_draft_generated`
- `support_action_submitted_for_review`
- `support_action_approved`
- `delivery_policy_evaluated`
- `outbox_item_queued`
- `jetstream_message_published`
- `jetstream_message_consumed`
- `credential_resolved_server_side`
- `zammad_internal_note_writeback_attempted`
- `zammad_internal_note_writeback_succeeded`
- `mailpit_notification_captured`
- `evidence_artifact_stored`
- Existing RBAC/tenant denial events.

## Required Evidence Fields

- Zammad sandbox base identifier and ticket ID, without token.
- Customer/ticket provenance.
- AI provider `ollama`, model name, prompt version, context hash, latency, local-provider marker.
- Action ID, state, approval actor/time.
- Delivery policy decision and kill-switch state.
- Outbox item ID, idempotency key, worker attempt history.
- Credential reference ID and resolver result metadata, never the raw secret.
- Zammad writeback result: article/internal-note ID, redacted status, idempotency marker.
- MinIO bucket/key/checksum.
- Mailpit message ID if notification enabled.
- Audit timeline.
- Disclaimer: sandbox/local, not compliance certification.

## Required Tests

- Unit tests for provider/resolver/worker idempotency and redaction.
- API integration tests for Zammad sandbox read, writeback dry-run, approval gates, kill switch, viewer denial, cross-tenant denial.
- Worker tests for JetStream ack/retry/dead-letter.
- Evidence tests proving no tokens in API responses, evidence, logs, browser storage, or screenshots.
- Browser tests covering allowed and blocked paths.

## Failure Modes

- Zammad unavailable or ticket not found: action stays unprocessed or read fails with audit event.
- Ollama unavailable: draft generation returns honest unavailable state or deterministic test fallback only in test mode.
- OpenBao unavailable: writeback blocks and audits resolver failure.
- NATS unavailable: outbox remains queued/pending with retryable status.
- MinIO unavailable: evidence artifact storage fails without claiming compliance storage.
- Mailpit unavailable: notification status is disabled/failed and no internet email is attempted.
- Kill switch enabled: no writeback network call occurs.
- Viewer/cross-tenant access: denied server-side.

## Rollback and Disable Behavior

- Keep global and tenant-scoped writeback kill switch.
- Revert connector installations to mock mode.
- Disable OpenBao credential resolver.
- Pause NATS consumer or move stream to dead-letter processing mode.
- Disable Mailpit notification sending.
- Fall back to local/mock demo only after explicitly documenting the regression.
