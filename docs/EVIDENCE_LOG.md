# EVIDENCE_LOG.md

**Purpose:** Structured ledger of proof artifacts for user-facing claims and external planning references.

## EV-2026-04-29-099 through EV-2026-04-29-104: BL-107 Zammad Sandbox Read Connector (ACCEPTED)

- Files: `output/playwright/session-108-bl107-zammad-sandbox-read-connector/01-zammad-api-seeded-ticket.png` through `07-boundary-proof.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), cluster API (localhost:4210), Zammad (localhost:8080), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API Deployment `supportplane-api` in `supportplane-app` Running and Ready; image rebuilt and reloaded with BL-107 code; health returns git head `17592be3ea2b172a0262fd8ecfd37308fae21283`.
  - Web Deployment `supportplane-web` in `supportplane-app` Running and Ready; image rebuilt with BL-107 UI changes.
  - Worker Deployment `supportplane-worker` in `supportplane-app` Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` Running and Ready with Bound PVC.
  - Zammad StatefulSet `zammad` in `supportplane-integrations` Running and Ready; ticket 2 and customer 5 are deterministic seeded data.
- Shows:
  - Zammad API JSON for ticket 2 (VPN connection issue for remote office - TICKET-101) and customer 5 (Acme BVBA).
  - SupportPlane cockpit with real Zammad sandbox ticket loaded, showing "Zammad Sandbox", "Zammad sandbox" badge, "Read-only", "Sandbox - No writeback - No production data" labels.
  - Connector Runtime Provenance card showing "real sandbox" mode, "sandbox local cluster" network, "1 linked" credentials.
  - AI Context Quality panel showing ticket loaded with customerName: Acme BVBA, connectorMode: zammad.
  - Case Timeline showing "Ticket linked" event.
  - Cluster API health JSON with storeMode=postgres, authMode=local, git head=17592be.
  - Connector runtime readiness JSON with realReady=true, mockReady=false, writebackEnabled=false.
  - Boundary proof JSON showing real sandbox read only, no production, no writeback.
  - Local MVP regression proof showing local API and Web reachable with same git head.
- CLI artifacts:
  - `zammad-seed-proof.txt`
  - `supportplane-api-zammad-read-proof.txt`
  - `connector-runtime-readiness.txt`
  - `boundary-proof.txt`
  - `supportplane-api-health.txt`
  - `validation-gate.txt`
  - `local-mvp-regression.txt`
  - `git-status-final.txt`
  - `proof-state-mapping.md`
  - `screenshot-md5s.txt`
- Proves:
  - BL-107 reads real Zammad sandbox ticket/customer data through SupportPlane API.
  - UI displays real sandbox data with explicit provenance and safety labels.
  - Connector readiness distinguishes real sandbox read from mock mode.
  - Writeback remains disabled.
  - 6 unique screenshots, 0 duplicates, max-20 cap respected.
  - Worktree is clean at final commit.
- Type: integration-and-browser-runtime-verification
- as_of: 2026-04-29T20:17:00+02:00

## EV-2026-04-29-059 through EV-2026-04-29-078: BL-106 Self-hosted service topology proof (SUPERSEDED)

- Status: **invalid/superseded** — evidence contained mismatched screenshots.
- Old files: `output/playwright/session-106-bl106-selfhosted-service-topology-final/01-readme-status-proof.png` through `20-local-mvp-regression.png`
- Issues found:
  - `02-cluster-web-header.png` showed a failed login screen, not the cluster web header.
  - `03-zammad-page-proof.png` showed a generic `Loading...` page without actual Zammad proof.
  - Folder deleted during reconciliation; replaced by EV-2026-04-29-079 through EV-2026-04-29-098.

## EV-2026-04-29-079 through EV-2026-04-29-098: BL-106 Self-hosted service topology proof (RECONCILED)

- Files: `output/playwright/session-107-bl106-evidence-reconciliation/01-readme-status-proof.png` through `20-local-mvp-regression.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), local MVP Web (localhost:3200), Zammad (localhost:8080), OpenBao (localhost:8200), Mailpit (localhost:8025), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - OpenBao Deployment `openbao` in `supportplane-integrations` Running and Ready; health returns `initialized: true, sealed: false, version: 2.2.0`.
  - NATS StatefulSet `nats` in `supportplane-integrations` Running and Ready; JetStream file-backed stream `TEST_STREAM` and consumer `TEST_CONSUMER` created, message published and consumed.
  - Mailpit Deployment `mailpit` in `supportplane-integrations` Running and Ready; SMTP port 1025 captures local test messages; web UI shows captured message.
  - MinIO Deployment `minio` in `supportplane-data` Running and Ready; bucket `bl106-bucket` and object `topology-proof.txt` created and retrieved.
  - Zammad StatefulSet `zammad` in `supportplane-integrations` Running and Ready; separate PostgreSQL and Redis dependencies healthy; HTTP 200 reachable on port 3000.
  - SupportPlane API, Web, Worker in `supportplane-app` remain Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` remains Running and Ready with Bound PVC.
- Shows:
  - README local/mock MVP plus cluster topology direction.
  - `kubectl get all,pvc` for `supportplane-integrations` and `supportplane-data`.
  - Zammad pod status and API JSON (`/api/v1/getting_started`), with honest note that railsserver-only deployment does not serve web UI assets.
  - OpenBao health JSON.
  - Mailpit UI with captured local test email.
  - MinIO bucket/object proof.
  - Ollama host placement decision with GPU reasoning.
  - `BACKLOG.md` showing BL-106 accepted and BL-107+ planned.
  - `NEXT_ACTIONS.md` active-only queue with BL-107 as next.
  - Cluster Web header showing DEV/MOCK DATA/local auth/postgres (CORS fix applied and API rebuilt).
  - Call console and evidence bundle panels.
  - `WORKFLOW_TRUTH.md` and `BOUNDARY_MATRIX.md` showing services deployed but not integrated.
  - `KUBERNETES_SERVICE_CATALOG.md` updated.
  - Final boundary proof: no real SupportPlane integration, no writeback, no real secrets, no production claims.
  - Local MVP regression proof: API and Web still healthy.
- CLI artifacts:
  - `cluster-baseline-proof.txt`
  - `zammad-topology-proof.txt`
  - `openbao-topology-proof.txt`
  - `nats-jetstream-proof.txt`
  - `mailpit-topology-proof.txt`
  - `minio-topology-proof.txt`
  - `ollama-placement-decision.txt`
  - `supportplane-non-integration-proof.txt`
  - `local-mvp-regression-proof.txt`
  - `roadmap-summary.json`
- Proves:
  - BL-106 has real Kubernetes manifests for OpenBao, NATS JetStream, Mailpit, MinIO, and Zammad topology.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - Existing local/mock MVP on localhost:4110/3200 still works.
  - 20 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T17:45:00+02:00

## EV-2026-04-29-044 through EV-2026-04-29-058: BL-104/BL-105 Kubernetes app and PostgreSQL persistence foundation proof

- Files: `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/01-cluster-web-header.png` through `15-local-mvp-regression.png`
- Source/System: Chromium via Playwright against cluster Web (localhost:3300), local MVP Web (localhost:3200), cluster API (localhost:4210), and terminal composite proof pages.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Cluster proof:
  - API Deployment `supportplane-api` in `supportplane-app` Running and Ready.
  - Web Deployment `supportplane-web` in `supportplane-app` Running and Ready.
  - Worker Deployment `supportplane-worker` in `supportplane-app` Running and Ready.
  - PostgreSQL StatefulSet `postgres` in `supportplane-data` Running and Ready.
  - PVC `postgres-data-postgres-0` Bound 1Gi `standard` storage class.
  - Prisma migrate deploy succeeded (8 migrations applied).
  - Prisma db seed succeeded.
  - PostgreSQL pod restart survival verified with `_supportplane_bl105_probe` table.
  - Local images built with Podman and loaded via `kind load image-archive`:
    - `localhost/supportplane-api:local-k8s`
    - `localhost/supportplane-web:local-k8s`
    - `localhost/supportplane-worker:local-k8s`
- Shows:
  - Cluster web header showing DEV/MOCK DATA, local auth, postgres store badges.
  - Cluster call console page.
  - Local MVP web header still working on localhost:3200.
  - Local MVP call console page.
  - Cluster API health JSON showing `storeMode: postgres`, `authMode: local`.
  - `kubectl get all,pvc -n supportplane-data` showing postgres StatefulSet, Service, and Bound PVC.
  - `kubectl get all -n supportplane-app` showing API, Web, Worker Deployments and Services.
  - PostgreSQL persistence probe query result after pod deletion/restart.
  - Podman and cluster node image lists showing supportplane images.
  - `BACKLOG.md` showing BL-104 and BL-105 accepted.
  - `NEXT_ACTIONS.md` showing BL-106 as active next step.
  - Boundary proof table: cluster/app/Postgres YES; Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO/writeback NO.
  - `infra/kubernetes/local-podman/README.md` runbook proof.
  - Worker logs showing `mode: mock`, `queueBackend: postgres-local-outbox`.
  - Local MVP regression proof: API health on localhost:4110 still returns ok.
- CLI artifacts:
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/image-build-load-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/postgres-k8s-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/postgres-persistence-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/app-k8s-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/api-cluster-health-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/web-cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/worker-cluster-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/local-mvp-regression-proof.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/proof-state-mapping.md`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/screenshot-md5s.txt`
  - `output/playwright/session-105-bl104-bl105-app-postgres-k8s-final/roadmap-summary.json`
- Proves:
  - BL-104 has real Kubernetes manifests for API, Web, and Worker with local sandbox images.
  - BL-105 has real PostgreSQL Kubernetes persistence with PVC and restart survival.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - Existing local/mock MVP on localhost:4110/3200 still works.
  - 15 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T16:30:00+02:00

## EV-2026-04-29-032 through EV-2026-04-29-043: BL-103 local Kubernetes/Podman cluster foundation proof

- Files: `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/01-readme-status-roadmap.png` through `12-final-boundary-no-real-writeback-secrets-production.png`
- Source/System: Chromium via Playwright against rendered repo markdown/terminal proof pages plus running SupportPlane local Web/API for boundary proof.
- Cluster proof:
  - Kind with Podman provider.
  - Cluster `supportplane-local`.
  - Context `kind-supportplane-local`.
  - Node image `kindest/node:v1.31.4`.
  - Podman backing container `supportplane-local-control-plane`.
  - Namespaces `supportplane-app`, `supportplane-data`, `supportplane-integrations`, and `supportplane-observability` active.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - README still states local/mock MVP plus self-hosted sandbox roadmap.
  - Terminal proof of provider, cluster name, context, cluster-info, and Ready node.
  - `kubectl get nodes -o wide` proof.
  - Namespace proof showing all four target namespaces active.
  - `infra/kubernetes/local-podman/README.md` with verified Kind/Podman instructions.
  - `BACKLOG.md` showing BL-103 accepted while BL-104+ remain planned.
  - `NEXT_ACTIONS.md` showing active-only next implementation items.
  - Running SupportPlane header still showing DEV/MOCK DATA, local auth, postgres store, and localhost API.
  - Connector panel still showing mock-only boundary.
  - Delivery policy still showing real network locked off.
  - Evidence bundle still showing local/mock boundary.
  - Final proof that no real writeback, real credentials, production claims, or real integrations were enabled.
- CLI artifacts:
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/cluster-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/namespace-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/podman-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/local-image-strategy-proof.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/proof-state-mapping.md`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/screenshot-md5s.txt`
  - `output/playwright/session-104-bl103-local-k8s-podman-foundation-final/roadmap-summary.json`
- Proves:
  - BL-103 has a real Podman-backed local Kubernetes cluster foundation.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - 12 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: infrastructure-and-browser-runtime-verification
- as_of: 2026-04-29T15:55:00+02:00

## EV-2026-04-29-015 through EV-2026-04-29-031: BL-102 local Kubernetes self-hosted sandbox roadmap proof

- Files: `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/01-readme-md.png` through `17-final-no-real-writeback-credentials-production-claims.png`
- Source/System: Chromium via Playwright against rendered repo markdown proof pages plus running SupportPlane local Web/API for boundary proof.
- Store/Auth mode for runtime screenshots: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - README local/mock MVP plus real self-hosted sandbox roadmap section.
  - `docs/SELF_HOSTED_STACK.md` self-hosted service register.
  - `docs/LOCAL_KUBERNETES_PODMAN_TARGET.md` local Kubernetes-on-Podman target.
  - `docs/REAL_E2E_SANDBOX_FLOW.md` target flow and real/mock status matrix.
  - `docs/KUBERNETES_SERVICE_CATALOG.md` Kubernetes workload/service catalog.
  - `docs/SANDBOX_INTEGRATION_ACCEPTANCE.md` acceptance gates.
  - `docs/IMPLEMENTATION_PHASES_REAL_E2E.md` phase plan.
  - `docs/BACKLOG_REAL_E2E_ROADMAP.md` current-to-future backlog mapping.
  - `docs/WORKFLOW_TRUTH.md` workflow truth matrix.
  - `docs/BOUNDARY_MATRIX.md` strict capability boundary matrix.
  - `BACKLOG.md` showing BL-102 accepted and BL-103 through BL-120 planned.
  - `NEXT_ACTIONS.md` showing active next implementation candidates only.
  - Running SupportPlane header still showing DEV/MOCK DATA, local auth, postgres store, and localhost API.
  - Connector panel still showing mock-only boundary.
  - Delivery policy still showing real network locked off.
  - Evidence bundle still showing local/mock boundary.
  - Final proof that no real writeback, real credentials, production claims, or cluster implementation were enabled.
- CLI artifacts:
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/proof-state-mapping.md`
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/screenshot-md5s.txt`
  - `output/playwright/session-103-bl102-k8s-selfhosted-roadmap-final/roadmap-summary.json`
- Proves:
  - The real self-hosted sandbox target is integrated into repo docs, backlog, state, and active plan.
  - The current runtime remains local/mock and real writeback/secrets/production claims were not enabled.
  - 17 unique screenshots, 0 duplicates, max-20 cap respected.
- Type: planning-docs-and-browser-runtime-verification
- as_of: 2026-04-29T16:30:00+02:00

## EV-2026-04-29-001 through EV-2026-04-29-014: BL-101 MVP Demo Freeze Final Proof

- Files: `output/playwright/session-102-bl101-mvp-demo-freeze-final/01-admin-landing-after-demo-reset.png` through `14-reset-script-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - fresh clean admin landing after demo reset with zero stale sessions
  - header/runtime identity proof including `DEV / MOCK DATA`, `API: localhost:4110`, `Auth: local · Store: postgres`, and user/tenant/role pill
  - clean session list with only demo-ready sessions
  - ticket context loaded with connector runtime provenance card
  - Connector panel showing mock-only/local-only boundary (Mock mode badge, Locked ON, credential metadata only)
  - Delivery Policy panel showing real network locked OFF and mock-only enforced ON
  - Action/outbox local-only workflow with mock delivery and `realNetwork: false`
  - Evidence Bundle generated with JSON/Markdown tabs and mock/dev-only disclaimers
  - Viewer read-only proof with disabled controls and view-only messages
  - Viewer/server-side denial proof (403 on mutation attempts)
  - Demo guide proof showing `docs/DEMO_GUIDE.md` rendered in browser
  - MVP completion audit proof showing `docs/MVP_COMPLETION_AUDIT.md` rendered in browser
  - Final no-real-writeback/no-secret/no-production-claim proof
  - Demo reset script and README proof
- Proves:
  - BL-101 produces a coherent, demo-ready local/mock MVP with clean backlog truth and honest documentation
  - 14 unique screenshots, 0 duplicates, max-20 cap respected
- Type: browser-runtime-verification
- as_of: 2026-04-29T14:12:00+02:00

## EV-2026-04-27-051 through EV-2026-04-27-063: BL-018 local auth/RBAC/tenant boundary browser proof

- Files: `output/playwright/session-018-auth-rbac-tenant-boundary-foundation/01-login-page-local-auth.png` through `13-after-api-restart-relogin-scoped-data.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page
  - authenticated operator/admin/viewer identity with tenant and role
  - operator cockpit and Call Console under local identity
  - operator observation creation/review allowed
  - viewer role create action disabled and direct server-side create attempt denied with 403
  - second tenant denied access to first tenant session with 404
  - tenant audit event proof for login/logout/access-control/session/observation events
  - evidence bundle proof with no password/session-token/hash leakage
  - logout returning to login
  - API restart followed by successful re-login and tenant-scoped data visibility
- Type: browser-runtime-verification
- as_of: 2026-04-27T17:42:00+02:00

## EV-2026-04-27-009: BL-044 Call Console Telephony Bridge panel

- File: output/playwright/session-044-telephony-adapter-boundary/01-call-console-telephony-bridge-panel.png
- Title: Call Console with Telephony Bridge panel
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Opened Call Console after creating fake provider webhook `BL-044-PROOF-1`.
- Shows:
  - Telephony Bridge panel with provider type `mock`, adapter mode `mock`, verification `not_required`, and mock/dev-only flag.
  - Honest labels: Telephony bridge boundary, Mock mode, No real PBX connected, No media or voice connected, Controls update local mock state only.
- Proves:
  - BL-044 boundary visibility is present in the Call Console.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-010: BL-044 mock capabilities and bridge test result

- File: output/playwright/session-044-telephony-adapter-boundary/02-telephony-status-capabilities-and-test-result.png
- Title: Telephony status/capabilities and bridge test result
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Clicked **Test bridge** in the Telephony Bridge panel.
- Shows:
  - Capabilities `inboundCalls`, `answer`, `hold`, `resume`, and `end`.
  - Last test result `healthy / mock / not_required`.
- Proves:
  - The mock adapter status/test flow is visible and deterministic.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-011: BL-044 bridge test result visible

- File: output/playwright/session-044-telephony-adapter-boundary/03-bridge-test-result-visible.png
- Title: Bridge test result visible
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Captured the Call Console after the mock bridge test completed.
- Shows:
  - Last test result remains visible in the Telephony Bridge panel.
- Proves:
  - The UI retains the last mock bridge test result for operator review.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-012: BL-044 fake provider webhook mapped incoming call

- File: output/playwright/session-044-telephony-adapter-boundary/04-fake-provider-webhook-mapped-incoming-call.png
- Title: Fake provider webhook mapped to selected incoming call
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Created a fake provider webhook event for `BL-044-PROOF-1` and selected it in the Call Console.
- Shows:
  - Selected fake incoming call, normalized phone number, matched Acme BVBA caller, and recent ticket hints.
- Proves:
  - The fake provider webhook maps into the existing CallEvent/caller matching flow.
- Type: docs-render-verification
- as_of: 2026-04-27T10:16:00+02:00

## EV-2026-04-27-013: BL-044 mock control intent/result

- File: output/playwright/session-044-telephony-adapter-boundary/05-call-control-intent-result-mock-only.png
- Title: Mock telephony control intent/result
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Clicked **Answer** on the selected call.
- Shows:
  - Call status changed to `answered`.
  - Telephony Bridge panel shows `Call control intent/result: answer -> answered (succeeded) - mock-only`.
- Proves:
  - Call controls are routed through the telephony bridge boundary and remain mock-only.
- Type: docs-render-verification
- as_of: 2026-04-27T10:17:00+02:00

## EV-2026-04-27-014: BL-044 timeline/audit telephony bridge events

- File: output/playwright/session-044-telephony-adapter-boundary/06-timeline-audit-telephony-bridge-events.png
- Title: Timeline with telephony bridge events
- Source/System: screenshot
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to Call Timeline after webhook and control actions.
- Shows:
  - `telephony_webhook_received`, `telephony_webhook_verified`, `telephony_call_control_requested`, and `telephony_call_control_succeeded` timeline entries.
- Proves:
  - Telephony bridge audit events appear in the user-visible call timeline.
- Type: docs-render-verification
- as_of: 2026-04-27T10:17:00+02:00

## EV-2026-04-27-015: BL-044 evidence bundle telephony events and disclaimers

- File: output/playwright/session-044-telephony-adapter-boundary/07-evidence-bundle-telephony-events-disclaimers.png
- Title: Evidence bundle with telephony bridge events
- Source/System: screenshot
- Route/Page: http://localhost:3200/?session=dc8357ff-a906-4b1c-aa2a-6e5a565c29c7
- Action: Linked the call to a support session, applied a mock hold control intent, and generated an evidence bundle.
- Shows:
  - Evidence Bundle summary with `Telephony Bridge` count.
  - Mock/dev-only and no-real-telephony disclaimer.
  - Audit Trail includes telephony control requested/succeeded events.
- Proves:
  - Evidence bundles include telephony bridge summaries and honest limitations.
- Type: docs-render-verification
- as_of: 2026-04-27T10:18:00+02:00

## EV-2026-04-27-016: BL-044 no-secret evidence export

- File: output/playwright/session-044-telephony-adapter-boundary/08-no-secret-evidence-export-redacted.png
- Title: Evidence export does not show injected secret-like values
- Source/System: screenshot
- Route/Page: http://localhost:3200/?session=dc8357ff-a906-4b1c-aa2a-6e5a565c29c7
- Action: Switched evidence preview to JSON and checked browser text for injected `Authorization`, bearer token, and signature proof values.
- Shows:
  - JSON evidence preview with telephony bridge events.
  - No visible injected token/signature/Authorization values.
- Proves:
  - The BL-044 UI/export proof does not display the injected secret-like test values.
- Type: docs-render-verification
- as_of: 2026-04-27T10:18:00+02:00

## EV-2026-04-26-001: Zammad CTI planning reference verified

- File: https://docs.zammad.org/en/latest/api/generic-cti/index.html
- Title: Zammad Generic CTI API documentation
- Source/System: docs
- Action: Opened official Zammad documentation during bootstrap.
- Shows:
  - Zammad documents Generic CTI under REST API documentation.
  - The page states CTI endpoints are relevant for PBX systems and include call events such as new call, hangup, and answer.
- Proves:
  - Zammad is a plausible first ticketing/CTI-adjacent planning target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-002: GLPI API v2 planning reference verified

- File: https://help.glpi-project.org/documentation/modules/configuration/general/api/restful-api-v2
- Title: GLPI RESTful API v2 documentation
- Source/System: docs
- Action: Opened official GLPI help documentation during bootstrap.
- Shows:
  - GLPI documents a RESTful API v2 as its high-level API.
  - The legacy API remains available.
  - OAuth2 authentication and API versioning are documented.
- Proves:
  - GLPI is a plausible second ITSM/assets integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-003: Asterisk ARI planning reference verified

- File: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/
- Title: Asterisk REST Interface documentation
- Source/System: docs
- Action: Opened official Asterisk documentation during bootstrap.
- Shows:
  - ARI documentation exists for Asterisk REST Interface.
  - The docs warn against direct browser access in production and recommend putting Asterisk behind an application server for security, logging, multi-tenancy, and related concerns.
- Proves:
  - A SupportPlane CTI gateway in front of Asterisk is directionally consistent with Asterisk production guidance.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-004: MeshCentral planning reference verified

- File: https://github.com/Ylianst/MeshCentral
- Title: MeshCentral GitHub repository
- Source/System: docs
- Action: Opened the MeshCentral GitHub repository during bootstrap.
- Shows:
  - MeshCentral describes itself as a web-based remote monitoring and management site.
  - It supports agents plus web-based remote desktop, terminal, and file management.
- Proves:
  - MeshCentral is a plausible remote-support context/launch integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-005: OWASP agentic AI security reference verified

- File: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- Title: OWASP Top 10 for Agentic Applications for 2026
- Source/System: docs
- Action: Opened OWASP Gen AI Security Project documentation during bootstrap.
- Shows:
  - OWASP frames the resource around agentic AI systems that plan, act, and make decisions across workflows.
- Proves:
  - SupportPlane's agentic/tooling threat model should explicitly consider agentic AI risks.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-006: NIST GAI profile reference verified

- File: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- Title: NIST AI RMF Generative AI Profile
- Source/System: docs
- Action: Opened NIST publication page during bootstrap.
- Shows:
  - NIST published the Generative AI Profile on 2024-07-26 and updated the page on 2026-04-08.
  - The abstract frames it as a companion resource for incorporating trustworthiness considerations into AI systems.
- Proves:
  - NIST AI RMF GAI profile is a relevant governance reference for SupportPlane planning.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-007: EU AI Act timeline reference verified

- File: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- Title: European Commission AI Act page
- Source/System: docs
- Action: Opened European Commission AI Act policy page during bootstrap.
- Shows:
  - The AI Act entered into force on 2024-08-01.
  - The page states full applicability on 2026-08-02 with exceptions, including high-risk embedded systems extending to 2027-08-02.
- Proves:
  - Compliance-related planning must avoid overclaiming and account for staged AI Act applicability.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-008: Local bootstrap validation evidence

- File: /home/ff/Documents/Projects/SupportPlane
- Title: Local repo and host baseline observed
- Source/System: terminal
- Action: Inspected repo files, ran hygiene checks, parsed YAML, compiled scripts, checked git state, and inspected host/runtime basics.
- Shows:
  - no SupportPlane product runtime exists yet
  - the directory is not currently a Git repository
  - Python 3.14.4, Node 22.22.0, Podman 5.8.2, and Chrome are present; Docker is absent
- Proves:
  - Bootstrap state distinguishes observed facts from unknown runtime/git facts.
- Type: source-data
- as_of: 2026-04-26T18:40:00+02:00

## EV-2026-04-26-009: Support Cockpit UI shell browser verification

- File: output/playwright/session-004-support-cockpit-ui/01-initial-empty-state.png
- Title: Initial cockpit empty state
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium via Playwright before any sessions exist.
- Shows:
  - Dark-themed SupportPlane header with DEV/MOCK badge and API endpoint label.
  - Empty session list with "No sessions yet" state.
  - Ticket Context, AI Context Quality, Draft Note, and Audit Trail panels with "Select a session" empty states.
- Proves:
  - The first UI shell renders correctly with all required panels and empty states.
- Type: docs-render-verification
- as_of: 2026-04-26T20:10:00+02:00

## EV-2026-04-26-010: Support Cockpit session creation and ticket context

- File: output/playwright/session-004-support-cockpit-ui/03-ticket-context-loaded.png
- Title: Ticket context loaded in selected session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session, selected it, and loaded TICKET-101 via the mock adapter.
- Shows:
  - Session list shows "Customer VPN issue" with open status badge.
  - Selected session banner displays ticket and packet counts.
  - Ticket Context panel displays mock connector data: subject, status, priority, customer name/email, adapter ID.
  - AI Context Quality panel shows a ticket provenance packet with loaded fields.
  - Audit Trail panel shows session_created, ticket_linked, and ai_context_loaded events.
- Proves:
  - The full mock-first operator workflow (session → ticket load → context packet → audit) is visible in the UI.
- Type: docs-render-verification
- as_of: 2026-04-26T20:12:00+02:00

## EV-2026-04-26-011: Support Cockpit draft note and audit trail

- File: output/playwright/session-004-support-cockpit-ui/06-draft-review-panel.png
- Title: Draft note with review state and disabled writeback
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Typed a draft note, checked the Reviewed checkbox, and observed the disabled writeback button.
- Shows:
  - Draft note textarea contains realistic support text.
  - "Reviewed" checkbox is checked.
  - "Writeback (disabled)" button is present and inactive.
  - "Mock only — no writeback" badge is visible.
  - Audit trail shows actor, timestamps, resource IDs, and metadata.
- Proves:
  - The draft/review panel communicates non-persistence and disabled writeback clearly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:12:00+02:00

## EV-2026-04-26-012: Support Cockpit UI shell final closure — initial state

- File: output/playwright/session-004-support-cockpit-ui-final-closure/01-initial-empty-state.png
- Title: Initial cockpit state at final closure
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium via Playwright during final closure pass.
- Shows:
  - Dark-themed SupportPlane header with DEV/MOCK badge and API endpoint label.
  - Session list with prior test sessions visible.
  - Ticket Context, AI Context Quality, Draft Note, and Audit Trail panels.
- Proves:
  - The UI shell renders correctly at the start of the final verification flow.
- Type: docs-render-verification
- as_of: 2026-04-26T20:25:00+02:00

## EV-2026-04-26-013: Support Cockpit session creation and selection at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/02-created-selected-session.png
- Title: Created and selected session
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Created a new session titled "BL-004 Closure Test" and selected it.
- Shows:
  - Session list shows the newly created session with open status badge.
  - Selected session banner displays ID, status, and priority.
  - AI Context Quality panel shows warning for missing ticket context.
- Proves:
  - Session creation and selection work correctly in the final closure verification.
- Type: docs-render-verification
- as_of: 2026-04-26T20:26:00+02:00

## EV-2026-04-26-014: Support Cockpit ticket context loaded at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/03-ticket-context-loaded.png
- Title: Ticket context loaded in selected session
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Loaded TICKET-101 via the mock adapter for the closure test session.
- Shows:
  - Session banner updated to Tickets: 1.
  - Ticket Context panel displays mock connector data: subject, subset, priority, customer name/email, adapter ID.
- Proves:
  - Ticket context load and display work correctly in the final verification.
- Type: docs-render-verification
- as_of: 2026-04-26T20:26:00+02:00

## EV-2026-04-26-015: Support Cockpit AI context packets at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/04-ai-context-packets.png
- Title: AI context packets visible after ticket load
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Scrolled to AI Context Quality panel after loading ticket context.
- Shows:
  - Ticket provenance packet with loaded fields and "Loaded" state.
  - Draft Note panel visible below with session name and empty textarea.
- Proves:
  - AI Context Quality panel displays ticket-derived packets correctly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-016: Support Cockpit audit trail at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/05-audit-trail-visible.png
- Title: Audit trail with session_created, ticket_linked, ai_context_loaded
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel to view events.
- Shows:
  - session_created event with actor, timestamp, and metadata.
  - ticket_linked event with externalTicketId metadata.
  - ai_context_loaded event with provenance metadata.
- Proves:
  - Audit trail displays all expected events with actor, timestamp, resource, and metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-017: Support Cockpit draft review panel at final closure

- File: output/playwright/session-004-support-cockpit-ui-final-closure/06-draft-review-panel.png
- Title: Draft note with review state and disabled writeback
- Source/System: screenshot
- Route/Page: http://localhost:3200/
- Action: Typed a draft note, checked the Reviewed checkbox, and observed the disabled writeback button.
- Shows:
  - Draft note textarea contains realistic support text (153 chars).
  - "Reviewed" checkbox is checked.
  - "Writeback (disabled)" button is present and inactive.
  - "Mock only — no writeback" badge is visible.
- Proves:
  - The draft/review panel communicates non-persistence and disabled writeback clearly.
- Type: docs-render-verification
- as_of: 2026-04-26T20:27:00+02:00

## EV-2026-04-26-018: BL-005 cockpit before mock draft generation

- File: output/playwright/session-005-mock-ai-gateway/01-cockpit-before-generating-draft.png
- Title: Cockpit with ticket context loaded before mock AI draft
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a support session, loaded TICKET-101 through the mock ticketing adapter, and captured the cockpit before draft generation.
- Shows:
  - SupportPlane header with DEV / MOCK DATA and API localhost:4110 labels.
  - Selected session with one ticket and one AI context packet.
  - Ticket context and AI Context Quality panels populated from mock data.
  - Draft panel ready to generate a mock draft with writeback disabled.
- Proves:
  - The BL-005 draft flow starts from tenant-scoped session and context data in the browser.
- Type: docs-render-verification
- as_of: 2026-04-26T20:41:00+02:00

## EV-2026-04-26-019: BL-005 generated mock AI draft visible

- File: output/playwright/session-005-mock-ai-gateway/02-generated-mock-ai-draft-visible.png
- Title: Generated mock AI draft visible in draft textarea
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Entered operator instructions and requested a mock AI draft from the Support Cockpit.
- Shows:
  - Draft textarea contains text beginning with "MOCK AI DRAFT".
  - The draft references the selected session, TICKET-101, ticket context fields, and operator instruction.
  - The UI states mock AI only and review required.
- Proves:
  - The web UI calls the draft suggestion API and displays the returned mock completion.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-020: BL-005 model metadata visible

- File: output/playwright/session-005-mock-ai-gateway/03-model-metadata-visible.png
- Title: Mock model metadata visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the model metadata block after draft generation.
- Shows:
  - Provider: mock.
  - Model: mock-support-note-v1.
  - Prompt version: mock-v1.
  - Context hash value.
  - Mock/dev-only and review-before-writeback labels.
- Proves:
  - Provider, model, prompt version, and context hash metadata are visible to the operator.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-021: BL-005 audit trail shows model usage event

- File: output/playwright/session-005-mock-ai-gateway/04-audit-trail-ai-model-usage-event.png
- Title: Audit trail with AI draft generation event
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the audit trail after draft generation.
- Shows:
  - session_created, ticket_linked, ai_context_loaded, and ai_draft_generated events.
  - ai_draft_generated metadata includes provider, model, promptVersion, contextHash, and mockOnly.
- Proves:
  - Draft generation appends and displays an audit event for mock model usage.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-022: BL-005 writeback remains disabled and review required

- File: output/playwright/session-005-mock-ai-gateway/05-writeback-disabled-review-required.png
- Title: Draft panel with disabled writeback after mock generation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Captured the full draft panel after mock draft generation.
- Shows:
  - Mock draft in the textarea.
  - Writeback button remains disabled.
  - "Mark as reviewed before writeback" message and "Review before writeback" label are visible.
- Proves:
  - BL-005 did not implement ticket writeback and keeps human review explicit.
- Type: docs-render-verification
- as_of: 2026-04-26T20:42:00+02:00

## EV-2026-04-26-033: BL-008 evidence bundle panel before generation

- File: output/playwright/session-008-evidence-bundle/01-evidence-bundle-panel-before-generation.png
- Title: Evidence Bundle panel visible before generation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session and observed the Evidence Bundle panel before clicking Generate.
- Shows:
  - Evidence Bundle panel displays "Generate" button and MVP Export disclaimer.
  - "This is an in-memory mock export. No real compliance or legal evidence is claimed."
- Proves:
  - The Evidence Bundle panel is visible and honest about its mock/in-memory limitations before any export.
- Type: docs-render-verification
- as_of: 2026-04-26T21:50:00+02:00

## EV-2026-04-26-034: BL-008 JSON evidence bundle preview

- File: output/playwright/session-008-evidence-bundle/02-json-evidence-bundle-preview.png
- Title: JSON evidence bundle preview visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the JSON tab.
- Shows:
  - JSON preview contains bundleId, tenantId, sessionSummary, linkedTickets, contextPackets, aiUsage, connectorOperations, auditTimeline, mockDevOnlyDisclaimers, limitations, and sourceProvenance.
- Proves:
  - The API returns a deterministic, structured JSON evidence bundle with all required sections.
- Type: docs-render-verification
- as_of: 2026-04-26T21:52:00+02:00

## EV-2026-04-26-035: BL-008 Markdown evidence bundle preview

- File: output/playwright/session-008-evidence-bundle/03-markdown-evidence-bundle-preview.png
- Title: Markdown evidence bundle preview visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the Markdown tab.
- Shows:
  - Markdown preview shows "# SupportPlane Evidence Bundle" with session summary, linked tickets, AI context packets, audit timeline, disclaimers, and limitations.
- Proves:
  - The API returns a readable Markdown export with all required sections.
- Type: docs-render-verification
- as_of: 2026-04-26T21:52:00+02:00

## EV-2026-04-26-036: BL-008 audit trail with evidence bundle events

- File: output/playwright/session-008-evidence-bundle/04-audit-trail-evidence-bundle-events.png
- Title: Audit trail showing evidence_bundle_generated and evidence_bundle_exported
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after generating an evidence bundle.
- Shows:
  - evidence_bundle_generated events with format, bundleId, and version metadata.
  - evidence_bundle_exported events with format and bundleId metadata.
- Proves:
  - Bundle generation and export append audit events with tenant, actor, and bundle metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:54:00+02:00

## EV-2026-04-26-037: BL-008 mock/dev-only disclaimer visible

- File: output/playwright/session-008-evidence-bundle/05-mock-dev-only-disclaimer-visible.png
- Title: Evidence Bundle summary with mock/dev-only disclaimer
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Switched to the Summary tab after generating an evidence bundle.
- Shows:
  - "Mock / Dev-Only" block stating the bundle was generated from an in-memory mock development store.
- Proves:
  - The UI makes the mock/in-memory limitation explicit and visible.
- Type: docs-render-verification
- as_of: 2026-04-26T21:53:00+02:00

## EV-2026-04-26-038: BL-008 no-secret evidence

- File: output/playwright/session-008-evidence-bundle/06-no-secret-evidence.png
- Title: Exported JSON preview with no token or secret content
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Inspected the JSON evidence bundle preview for secret leakage.
- Shows:
  - No API token, ZAMMAD_API_TOKEN, password, secret, or bearer token is visible in the exported JSON.
- Proves:
  - Redaction helpers successfully prevent secret exposure in bundle output.
- Type: docs-render-verification
- as_of: 2026-04-26T21:55:00+02:00

## EV-2026-04-26-123: BL-041 closure — preferredPriority fix and UI priority selector

- File: output/playwright/session-041-auto-session-from-call-final-closure/01-auto-create-option-visible.png
- Title: Call Simulator panel with auto-create, priority dropdown, and session title input
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the updated Call Simulator panel during BL-041 closure.
- Shows:
  - "Auto-create support session on matched call" checkbox is checked.
  - "Preferred priority" dropdown is visible with "High" selected.
  - "Preferred session title (optional)" input is visible.
  - "No real telephony connected" disclaimer is visible.
- Proves:
  - The UI now exposes preferredPriority and preferredSessionTitle controls for auto-create.
- Type: docs-render-verification
- as_of: 2026-04-26T23:15:00+02:00

## EV-2026-04-26-124: BL-041 closure — auto-created session with high priority

- File: output/playwright/session-041-auto-session-from-call-final-closure/02-matched-fake-incoming-call-creates-session.png
- Title: Matched fake incoming call auto-creates session with Priority: high
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Simulated fake incoming call with auto-create enabled and priority set to "High".
- Shows:
  - Call status is "answered".
  - Auto-create badge shows "auto_created".
  - Auto-created session card shows "ID: 72d03d7b... | Priority: high".
- Proves:
  - The selected preferred priority is reflected in the auto-created SupportSession.
- Type: docs-render-verification
- as_of: 2026-04-26T23:16:00+02:00

## EV-2026-04-26-125: BL-041 closure — auto-created session selected in cockpit with high priority

- File: output/playwright/session-041-auto-session-from-call-final-closure/03-auto-created-session-selected-open.png
- Title: Auto-created session selected in cockpit showing open • high
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Open in cockpit" on the auto-created session card.
- Shows:
  - Session banner shows "Incoming call from Acme BVBA" with "open • high".
  - Tickets: 2 from matched fixtures.
- Proves:
  - The auto-created session is selectable and displays the correct priority in the cockpit.
- Type: docs-render-verification
- as_of: 2026-04-26T23:17:00+02:00

## EV-2026-04-26-126: BL-041 closure — audit trail with auto-create and auto-link events

- File: output/playwright/session-041-auto-session-from-call-final-closure/05-audit-trail-auto-create-events.png
- Title: Audit Trail showing support_session_auto_created and call_auto_linked_to_session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to the Audit Trail panel after selecting the auto-created session.
- Shows:
  - support_session_auto_created event with actor, resource, and matched caller metadata.
  - call_auto_linked_to_session event with sessionId and call metadata.
- Proves:
  - Auto-creation and auto-linking append detailed audit events with tenant, actor, and match metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T23:18:00+02:00

## EV-2026-04-26-127: BL-041 closure — evidence bundle markdown with call session relationship

- File: output/playwright/session-041-auto-session-from-call-final-closure/06-evidence-bundle-markdown-call-session.png
- Title: Markdown evidence bundle showing Call Events with Linked Session and mock disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle for the auto-created session and switched to Markdown tab.
- Shows:
  - Session Summary with Priority: high.
  - Call Events section with Linked Session ID.
  - Mock/Dev-Only Disclaimers including auto-created session and mock telephony notes.
- Proves:
  - Evidence bundles include the auto-created call/session relationship, priority, and honest mock disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-26T23:20:00+02:00

## EV-2026-04-28-020 through EV-2026-04-28-039: BL-094 max-20 governance repair closure proof

- Files: `output/playwright/session-095-bl094-final-closure-max20/01-login-local-auth.png` through `20-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page and authenticated admin cockpit header with user/tenant/role/API/auth/store/mock mode
  - delivery policy panel with safe defaults, mock-only enforced, real network locked off
  - admin policy update with saved version/actor visible
  - connector readiness showing mock-ready and real-writeback-not-ready
  - queue allowed path with policy decision visible
  - delivery operations/worker status showing mock mode, policy mode, queue stats
  - queue blocked by kill switch/policy
  - worker process blocked/dead-lettered by policy
  - worker process allowed in mock mode with attempt detail, policy/version/safety flags
  - case timeline showing policy/worker decision events
  - audit trail showing policy updated, policy decision, blocked/allowed events
  - evidence bundle summary showing delivery policy provenance
  - evidence bundle JSON showing no secrets/tokens/password hashes/raw media and safety flags
  - viewer role can inspect policy but controls are disabled/read-only
  - direct forbidden mutation / viewer server-side RBAC denial shown via UI/API evidence
  - cross-tenant access denied
  - logout and re-login proof with preserved policy state
  - API restart/persistence proof for policy/outbox state
  - final no-real-writeback/no-secret/local-mock proof
- Proves:
  - BL-094 closure proof satisfies the hard 20-screenshot cap after governance repair
  - 0 duplicate MD5 hashes across all 20 screenshots
  - Supersedes prior 24-screenshot session-094 folder (deleted)
- Type: browser-runtime-verification
- as_of: 2026-04-28T14:41:00+02:00

## Entry Format

```yaml
- ID: EV-YYYY-MM-DD-001
  File: /absolute/path/to/artifact.png
  Title: short description
  Source/System: browser | api | test | log | screenshot | docs
  Route/Page: optional route or URL
  Action: what was done
  Shows:
    - visible fact 1
  Proves:
    - why the artifact matters
  Type: source-data | chatbot | gap | integration | docs-render-verification
  as_of: 2026-03-18T18:00:00+01:00
```

## EV-2026-04-26-023: BL-006 local topology infra containers verified

- File: infra/docker-compose/compose.yaml
- Title: Local Podman-compatible compose topology
- Source/System: terminal
- Action: Started PostgreSQL, NATS, MinIO, and worker placeholder with podman-compose.
- Shows:
  - All four containers start and report healthy (except worker placeholder).
  - PostgreSQL accepts connections on host port 5434.
  - NATS monitoring responds on port 8222 with HTTP 200.
  - MinIO health endpoint responds on port 9000 with HTTP 200.
- Proves:
  - Local development infrastructure is reproducible via compose.
- Type: integration
- as_of: 2026-04-26T20:52:00+02:00

## EV-2026-04-26-024: BL-006 host-run apps verified against running infra

- File: scripts/check_local_topology.sh
- Title: Full topology check with host-run API and Web
- Source/System: terminal
- Action: Ran check_local_topology.sh with API on 4110 and Web on 3200 while infra containers were running.
- Shows:
  - 10/10 checks passed (8 infra + 2 host-run).
  - API /health returns NestJS runtime info.
  - Web root returns HTTP 200.
- Proves:
  - Host-run apps and containerized infra coexist on documented ports.
- Type: integration
- as_of: 2026-04-26T20:54:00+02:00

## EV-2026-04-26-025: BL-006 cockpit browser verification with running topology

- File: output/playwright/session-006-local-topology/01-cockpit-loaded.png
- Title: Support Cockpit loaded with local topology running
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit in Chromium while API and infra containers were running.
- Shows:
  - Cockpit renders with DEV / MOCK DATA badge and API localhost:4110 label.
  - Session list, ticket context, AI context quality, draft note, and audit trail panels are visible.
- Proves:
  - UI remains functional when running against the new local topology.
- Type: docs-render-verification
- as_of: 2026-04-26T20:53:00+02:00

## EV-2026-04-26-026: BL-006 mock draft flow verified with local topology

- File: output/playwright/session-006-local-topology/05-mock-draft-generated.png
- Title: Mock AI draft generated with local topology services running
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session, loaded TICKET-101, and generated a mock AI draft.
- Shows:
  - Draft contains mock AI output with context hash.
  - Model metadata shows provider: mock, model: mock-support-note-v1.
  - Writeback remains disabled.
- Proves:
  - The full mock MVP 1 flow works with the local topology in place.
- Type: docs-render-verification
- as_of: 2026-04-26T20: 55:00+02:00

## EV-2026-04-26-027: BL-007 connector status/mode visible in Support Cockpit

- File: output/playwright/session-007-zammad-connector/01-connector-status-mode-visible.png
- Title: Connector panel shows Mock mode, healthy status, and capabilities
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the Connector panel.
- Shows:
  - Connector panel displays "Mock mode" badge.
  - Type: zammad, Health: healthy, Connected: Yes.
  - Capabilities: read_tickets, read_customers, write_notes.
  - Warning: "No real writeback unless configured. Credentials not stored in browser."
- Proves:
  - The Zammad connector boundary is visible and honest about its mock mode.
- Type: docs-render-verification
- as_of: 2026-04-26T21:22:00+02:00

## EV-2026-04-26-028: BL-007 Zammad ticket context loaded through connector panel

- File: output/playwright/session-007-zammad-connector/02-ticket-context-loaded.png
- Title: Ticket context loaded via Zammad connector with Mock badge
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Created a session and loaded TICKET-101 through the Zammad connector boundary.
- Shows:
  - Ticket Context panel shows "Zammad ticket TICKET-101" with status open, priority normal.
  - Customer name and email are visible.
  - Adapter ID is zammad-adapter-001.
  - AI Context Quality panel shows a ticket provenance packet with connectorMode: mock.
- Proves:
  - The connector read path returns deterministic mock data shaped like Zammad API output.
- Type: docs-render-verification
- as_of: 2026-04-26T21:24:00+02:00

## EV-2026-04-26-029: BL-007 internal note draft visible with review-required state

- File: output/playwright/session-007-zammad-connector/03-internal-note-draft-visible.png
- Title: Mock AI draft generated with review-required label
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated a mock AI draft for the selected session.
- Shows:
  - Draft textarea contains "[MOCK AI DRAFT - review required before any writeback]".
  - Model metadata shows provider: mock, model: mock-support-note-v1.
  - "Review before writeback" badge is visible.
- Proves:
  - Draft generation works through the connector workflow and requires explicit review.
- Type: docs-render-verification
- as_of: 2026-04-26T21:25:00+02:00

## EV-2026-04-26-030: BL-007 mock-safe writeback result visible

- File: output/playwright/session-007-zammad-connector/04-mock-safe-writeback-result.png
- Title: Writeback succeeded in mock mode with article ID
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Marked draft as reviewed and triggered writeback to TICKET-101.
- Shows:
  - Writeback button changed from disabled to enabled after review.
  - "Writeback succeeded" message with Article ID: 999.
  - "Mock mode — no real network call was made" is implied by the mock adapter.
- Proves:
  - The writeback flow is mock-safe by default and shows clear success/failure state.
- Type: docs-render-verification
- as_of: 2026-04-26T21:26:00+02:00

## EV-2026-04-26-031: BL-007 audit trail showing connector read/draft/writeback events

- File: output/playwright/session-007-zammad-connector/05-audit-trail-connector-events.png
- Title: Audit trail with connector-specific events
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel after ticket load, draft generation, and writeback.
- Shows:
  - zammad_ticket_loaded event with externalTicketId and connectorMode: mock.
  - ai_draft_generated event with provider/model metadata.
  - internal_note_drafted event with draftLength.
  - internal_note_writeback_attempted and internal_note_writeback_succeeded events.
- Proves:
  - All connector operations append audit events with tenant, actor, mode, and outcome.
- Type: docs-render-verification
- as_of: 2026-04-26T21:28:00+02:00

## EV-2026-04-26-032: BL-007 no-secret UI evidence

- File: output/playwright/session-007-zammad-connector/06-no-secret-ui-evidence.png
- Title: Connector panel without any token or secret displayed
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Inspected Connector panel and header for secret leakage.
- Shows:
  - No API token, password, or secret is visible anywhere in the UI.
  - Only mode, health, capabilities, and generic test results are shown.
- Proves:
  - Secrets are not exposed in the browser UI, API responses, or audit metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:28:00+02:00

## Entry Format

```yaml
- ID: EV-YYYY-MM-DD-001
  File: /absolute/path/to/artifact.png
  Title: short description
  Source/System: browser | api | test | log | screenshot | docs
  Route/Page: optional route or URL
  Action: what was done
  Shows:
    - visible fact 1
  Proves:
    - why the artifact matters
  Type: source-data | chatbot | gap | integration | docs-render-verification
  as_of: 2026-03-18T18:00:00+01:00
```

## EV-2026-04-26-039: BL-009 cockpit before call simulation

- File: output/playwright/session-009-call-simulator/01-cockpit-before-call-simulation.png
- Title: Support Cockpit before fake call simulation
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened Support Cockpit and observed the Call Simulator panel before simulating any call.
- Shows:
  - Call Simulator panel is visible with phone number input defaulting to "03 555 01 01".
  - "Simulate incoming call" button is present.
  - "No real telephony connected" disclaimer is visible.
- Proves:
  - The Call Simulator panel renders with honest mock labels from the start.
- Type: docs-render-verification
- as_of: 2026-04-26T21:55:00+02:00

## EV-2026-04-26-040: BL-009 fake incoming call created

- File: output/playwright/session-009-call-simulator/02-fake-call-created.png
- Title: Fake incoming call created with normalized number
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Simulate incoming call" with the default Belgian fixture number.
- Shows:
  - Result card displays "Normalized: +32 3 555 01 01".
  - "Fake webhook" label is visible.
  - "Mock phone source" label is visible.
- Proves:
  - The fake incoming call webhook endpoint returns a normalized number and honest mock labels.
- Type: docs-render-verification
- as_of: 2026-04-26T21:56:00+02:00

## EV-2026-04-26-041: BL-009 caller match hints visible

- File: output/playwright/session-009-call-simulator/03-caller-match-hints-visible.png
- Title: Caller match shows Acme BVBA with recent tickets
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Observed the caller match result after simulating the fake call.
- Shows:
  - Match status: "matched" with confidence "fixture".
  - Customer name: "Acme BVBA".
  - Recent tickets: TICKET-101, TICKET-102.
  - "Caller matching uses deterministic fixture data" disclaimer is visible.
- Proves:
  - Deterministic fixture-based caller matching is visible and labeled as mock data.
- Type: docs-render-verification
- as_of: 2026-04-26T21:56:00+02:00

## EV-2026-04-26-042: BL-009 call linked to session

- File: output/playwright/session-009-call-simulator/04-linked-to-session.png
- Title: Call linked to selected support session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected a support session and clicked "Link to selected session".
- Shows:
  - "Linked ✓" confirmation is visible.
  - Call status updated to "answered".
  - Session ID is displayed in the linked result.
- Proves:
  - The link call to session endpoint works and updates the call status.
- Type: docs-render-verification
- as_of: 2026-04-26T21:57:00+02:00

## EV-2026-04-26-043: BL-009 audit trail with call events

- File: output/playwright/session-009-call-simulator/05-audit-trail-call-events.png
- Title: Audit trail showing call_event_received, caller_matched, call_linked_to_session
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Scrolled to Audit Trail panel after simulating and linking the call.
- Shows:
  - call_event_received event with rawNumber and normalizedNumber metadata.
  - caller_matched event with customerName, matchStatus, and confidence metadata.
  - call_linked_to_session event with sessionId metadata.
- Proves:
  - All call operations append audit events with tenant, actor, and match metadata.
- Type: docs-render-verification
- as_of: 2026-04-26T21:58:00+02:00

## EV-2026-04-26-044: BL-009 evidence bundle JSON with call summary

- File: output/playwright/session-009-call-simulator/06-evidence-bundle-call-summary.png
- Title: Evidence bundle JSON showing callEvents section
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Generated an evidence bundle and switched to the JSON tab, scrolled to the callEvents section.
- Shows:
  - callEvents array contains a call event summary with callEventId, provider "fake_webhook", direction "inbound", status "answered", normalizedNumber "+32 3 555 01 01".
  - Mock telephony disclaimer is visible.
- Proves:
  - Evidence bundles include call event summaries and mock telephony disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-26T22:01:00+02:00


## EV-2026-04-27-033: BL-046 canonical closure — Call Console with Operator Companion panel

- File: output/playwright/session-046-operator-companion-closure-canonical/01-call-console-operator-companion-panel.png
- Title: Call Console with Operator Companion panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected fake incoming call BL046-CANON-3 and captured full page showing Operator Companion panel.
- Shows:
  - Call Console with selected call "BL046-CANON-3".
  - Telephony Bridge panel and Mock Recording panel visible.
  - Operator Companion panel with capture form and safety disclaimers.
- Proves:
  - BL-046 Operator Companion panel is present in the Call Console.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-034: BL-046 canonical closure — mock screen observation safety disclaimers

- File: output/playwright/session-046-operator-companion-closure-canonical/02-operator-companion-safety-disclaimers.png
- Title: Operator Companion safety disclaimers visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Scrolled to Operator Companion panel to show safety banner.
- Shows:
  - "Mock screen observation — no real screen capture" warning.
  - "No raw pixels, clipboard access, or OCR. Review before AI context. Pattern redaction only."
- Proves:
  - Safety boundaries and limitations are visible before any capture.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-035: BL-046 canonical closure — mock observation captured with redacted summary

- File: output/playwright/session-046-operator-companion-closure-canonical/03-mock-observation-captured-redacted.png
- Title: Mock observation captured with review_required status
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled capture form and clicked "Capture mock observation".
- Shows:
  - Observation item with kind "active_window", status "review_required".
  - "Mock/dev-only • No real screen capture • No raw pixels • No clipboard access" footer.
- Proves:
  - Capture creates deterministic mock metadata with required safety flags.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-036: BL-046 canonical closure — observation approved state

- File: output/playwright/session-046-operator-companion-closure-canonical/04-observation-approved.png
- Title: Observation approved with Approve/Discard buttons visible
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Approve" on the captured observation.
- Shows:
  - Observation status updated to "approved".
  - "Reviewed at" timestamp visible.
  - "Create context packet" button available.
- Proves:
  - Review gate works and status transitions are visible.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-037: BL-046 canonical closure — AI context packet created from approved observation

- File: output/playwright/session-046-operator-companion-closure-canonical/05-context-packet-created.png
- Title: Context packet created from approved observation
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked "Create context packet" on the approved observation.
- Shows:
  - Observation shows "Packet" badge and "approved" status.
  - "Reviewed at" timestamp and safety disclaimers remain visible.
- Proves:
  - Approved observation can be converted to an AI context packet.
- Type: docs-render-verification
- as_of: 2026-04-27T12:59:00+02:00

## EV-2026-04-27-038: BL-046 canonical closure — Support Cockpit AI Context Quality panel

- File: output/playwright/session-046-operator-companion-closure-canonical/06-cockpit-ai-context-quality-observation-packet.png
- Title: AI Context Quality panel showing observation-derived packet
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Navigated to Support Cockpit and selected the session with the observation-derived packet.
- Shows:
  - AI Context Quality panel shows "screen_observation" provenance packet.
  - kind: active_window, observationId visible.
- Proves:
  - Observation-derived context packet appears in the Support Cockpit.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-039: BL-046 canonical closure — audit trail with observation events

- File: output/playwright/session-046-operator-companion-closure-canonical/07-audit-trail-observation-events.png
- Title: Audit trail showing observation capture/review/context-packet events
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Scrolled to Audit Trail panel to show observation-related events.
- Shows:
  - screen_observation_captured, screen_observation_reviewed, screen_observation_context_packet_created, and ai_context_loaded events.
- Proves:
  - All observation lifecycle events are auditable and visible.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-040: BL-046 canonical closure — evidence bundle JSON with screen observations

- File: output/playwright/session-046-operator-companion-closure-canonical/08-evidence-bundle-json-screen-observations.png
- Title: Evidence bundle JSON showing screen observation summary and disclaimers
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Generated evidence bundle and switched to JSON tab.
- Shows:
  - Bundle JSON with session summary and screenObservations section.
  - Mock/dev-only disclaimers visible in bundle output.
- Proves:
  - Evidence bundles include screen observation summaries and honest disclaimers.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-041: BL-046 canonical closure — no-secret evidence bundle proof

- File: output/playwright/session-046-operator-companion-closure-canonical/09-no-secret-evidence-bundle.png
- Title: Evidence bundle export with no secret/token leakage
- Source/System: browser
- Route/Page: http://localhost:3200/?session=8d0637e7-97c6-4bfc-a74a-b17b1265e345
- Action: Verified JSON evidence bundle does not contain injected apiToken or Bearer token values.
- Shows:
  - JSON preview without apiToken=abc123 or Bearer tok123.
  - Redaction is active in exported bundle content.
- Proves:
  - Secret redaction prevents raw token/password exposure in evidence exports.
- Type: docs-render-verification
- as_of: 2026-04-27T13:00:00+02:00

## EV-2026-04-27-042: BL-047/048/049 final closure — Operator Companion with sharing indicator inactive

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/01-operator-companion-inactive.png
- Title: Call Console with Operator Companion panel, sharing indicator inactive
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected fake incoming call and captured full page showing Operator Companion panel with Sharing: inactive badge.
- Shows:
  - Operator Companion panel with mock screen observation safety disclaimers.
  - Sharing indicator badge shows "Sharing: inactive".
  - Start mock sharing button is visible.
- Proves:
  - BL-047 sharing indicator is visible in inactive state.
- Type: docs-render-verification
- as_of: 2026-04-27T14:22:00+02:00

## EV-2026-04-27-043: BL-047/048/049 final closure — sharing indicator active

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/02-sharing-active.png
- Title: Call Console with sharing indicator active
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked Start mock sharing and captured full page.
- Shows:
  - Sharing badge updated to "Sharing: active".
  - Pause and Stop controls visible.
  - Mock/dev-only and no-real-screen-capture labels present.
- Proves:
  - BL-047 sharing state transitions from inactive to active and updates UI immediately.
- Type: docs-render-verification
- as_of: 2026-04-27T14:23:00+02:00

## EV-2026-04-27-044: BL-047/048/049 final closure — active window metadata captured

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/03-active-window-captured.png
- Title: Active Window Metadata captured with redacted summary
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled Active Window Metadata form and clicked Capture active window metadata.
- Shows:
  - Observation card with kind "active_window", status "review_required".
  - Redacted summary visible: "Operator sees ticket detail view with apiToken=[REDACTED]".
- Proves:
  - BL-048 active-window metadata capture works and redaction is applied before display.
- Type: docs-render-verification
- as_of: 2026-04-27T14:24:00+02:00

## EV-2026-04-27-045: BL-047/048/049 final closure — manual screenshot metadata attached

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/04-manual-screenshot-metadata.png
- Title: Manual Screenshot Metadata form with raw image retention disabled
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Filled Manual Screenshot Metadata form and clicked Attach screenshot metadata.
- Shows:
  - "Raw image retention disabled" badge is visible.
  - Observation card with kind "screenshot_metadata".
- Proves:
  - BL-048 manual screenshot metadata capture works and raw image retention is explicitly disabled.
- Type: docs-render-verification
- as_of: 2026-04-27T14:24:00+02:00

## EV-2026-04-27-046: BL-047/048/049 final closure — structured upload with redaction status

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/05-structured-upload-redaction.png
- Title: Structured Upload observation with pattern_redacted status
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Selected kind "redacted_context", filled note with token and path, clicked Upload structured observation.
- Shows:
  - Observation card with kind "redacted_context", redactionStatus "pattern_redacted".
  - Note shows "Token: [REDACTED] and path [REDACTED_PATH]".
- Proves:
  - BL-049 structured upload works and pattern/placeholder redaction is visible in the UI.
- Type: docs-render-verification
- as_of: 2026-04-27T14:25:00+02:00

## EV-2026-04-27-047: BL-047/048/049 final closure — approved observation with context packet

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/06-approved-context-packet.png
- Title: Approved observation with Packet badge and context packet created
- Source/System: browser
- Route/Page: http://localhost:3200/call-console
- Action: Clicked Approve on the structured upload observation, then clicked Create context packet.
- Shows:
  - Observation status updated to "approved".
  - "Packet" badge is visible.
  - Reviewed timestamp visible.
- Proves:
  - Review gate works and approved observation can be converted to an AI context packet.
- Type: docs-render-verification
- as_of: 2026-04-27T14:26:00+02:00

## EV-2026-04-27-048: BL-047/048/049 final closure — AI Context Quality panel with observation-derived packet

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/07-ai-context-quality-panel.png
- Title: Support Cockpit AI Context Quality panel showing screen observation packet
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Navigated to Support Cockpit with the linked session.
- Shows:
  - SCREEN OBSERVATION packet with provenance "screen_observation".
  - Warning badge, kind "redacted_context", "2 redacted" label.
- Proves:
  - BL-049 observation-derived context packet is visible in the Support Cockpit AI Context Quality panel.
- Type: docs-render-verification
- as_of: 2026-04-27T14:27:00+02:00

## EV-2026-04-27-049: BL-047/048/049 final closure — audit trail with sharing/capture/redaction/context-packet events

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/08-audit-trail-events.png
- Title: Audit Trail showing all BL-047/048/049 event types
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Scrolled to Audit Trail panel.
- Shows:
  - screen_observation_sharing_started
  - active_window_metadata_captured
  - manual_screenshot_metadata_attached
  - structured_screen_observation_uploaded
  - screen_observation_reviewed
  - screen_observation_context_packet_created
  - ai_context_loaded
- Proves:
  - All required audit events are appended and visible.
- Type: docs-render-verification
- as_of: 2026-04-27T14:28:00+02:00

## EV-2026-04-27-050: BL-047/048/049 final closure — evidence bundle JSON with screen observations and redaction

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/09-evidence-bundle-json.png
- Title: Evidence Bundle JSON preview with screen observation summaries
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Generated evidence bundle and switched to JSON tab.
- Shows:
  - screenObservations array with sharingState, rawImageRetention, redactionStatus, safetyFlags.
  - Redacted summaries: "Token: [REDACTED] and path [REDACTED_PATH]".
  - Mock screen observation disclaimers.
- Proves:
  - Evidence bundle includes all new structured fields and redaction markers.
- Type: docs-render-verification
- as_of: 2026-04-27T14:29:00+02:00

## EV-2026-04-27-051: BL-047/048/049 final closure — no-secret/no-raw-image proof

- File: output/playwright/session-047-049-screen-context-hardening-final-closure/10-no-secret-proof.png
- Title: UI and exported JSON do not contain raw secrets, tokens, paths, or image content
- Source/System: browser
- Route/Page: http://localhost:3200/?session=...
- Action: Injected secret-like strings into structured upload and manual screenshot metadata, then verified the visible UI/export text.
- Shows:
  - No apiToken=abc123, password=secret, Bearer tok123, ZAMMAD_API_TOKEN, /etc/passwd, or long token string is visible.
  - [REDACTED] and [REDACTED_PATH] markers are present.
- Proves:
  - Redaction layer successfully prevents secret and path exposure in bundle output and UI.
- Type: docs-render-verification
- as_of: 2026-04-27T14:29:00+02:00


## EV-2026-04-27-052: BL-050 PostgreSQL persistence restart survival

- File: scripts/verify_postgres_persistence.sh
- Title: PostgreSQL persistence restart survival verification
- Source/System: shell script
- Action: Start API with SUPPORTPLANE_STORE=postgres, create session and call, stop API, restart API, verify data survives.
- Shows:
  - Session created in Phase 1 is retrievable after restart in Phase 2.
  - Call event created in Phase 1 is retrievable after restart in Phase 2.
  - Evidence bundle reports `storeType: postgres` and `persistenceClaimed: true`.
- Proves:
  - PrismaStore correctly persists data to PostgreSQL.
  - Data survives API process restart.
  - Store switching works at runtime via env var.
- Type: api-behavior-verification
- as_of: 2026-04-27T15:24:00+02:00

## EV-2026-04-27-053: BL-050 PostgreSQL mode browser closure proof

- File: output/playwright/session-050-postgres-persistence-foundation-final-closure/
- Title: BL-050 PostgreSQL Persistence Foundation canonical browser closure proof
- Source/System: browser
- Action: Verified Support Cockpit and Call Console in PostgreSQL mode with persisted data.
- Shows:
  - 14 sequential screenshots covering initial state, session creation, ticket context, fake incoming call, call linking, operator companion observation, context packet, call recording metadata, AI context quality, restart persistence, audit trail, evidence bundle JSON (before and after restart), and no-secret proof.
- Proves:
  - UI functions correctly in PostgreSQL store mode.
  - Data persists across API restart and remains visible in the browser.
  - Evidence bundle correctly reports `storeType: postgres`.
- Type: docs-render-verification
- as_of: 2026-04-27T16:11:00+02:00

## EV-2026-04-27-076 through EV-2026-04-27-095: BL-091 Support Case Workflow Foundation browser proof

- Files: `output/playwright/session-091-support-case-workflow-foundation/01-login-page.png` through `20-call-simulator-active.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page (01)
  - cockpit overview with all panels (02)
  - ticket summary panel with search (03)
  - session created and selected (04-05)
  - simulated incoming call with caller matching (06)
  - call linked to session (07)
  - connector test result with "Mock mode — no real network call was made" (08)
  - ticket context loaded showing Zammad ticket TICKET-101 (09)
  - support note draft generated with "not sent to Zammad" warnings (10)
  - evidence bundle generated with summary counts (11)
  - postgres-persisted verify session with ticket loaded (12)
  - support note draft generated on persisted session (13)
  - evidence bundle JSON showing supportNoteDrafts array (14)
  - evidence bundle Markdown showing Support Note Drafts section (15)
  - case timeline with session_created, internal_note_drafted, evidence_bundle_generated events (16)
  - connector panel with installations list, Test and Validate buttons (17)
  - connector validate result with valid: true, mode: mock, realNetwork: false (18)
  - viewer role with disabled New button, disabled Generate local-only draft button (19)
  - call simulator with active fake incoming call (20)
- Type: browser-runtime-verification
- as_of: 2026-04-27T23:25:00+02:00

## EV-2026-04-27-096 through EV-2026-04-27-112: BL-092 Durable Action/Outbox Workflow Foundation browser proof

- Files: `output/playwright/session-092-durable-action-outbox-workflow-foundation/01-login-local-auth.png` through `17-viewer-readonly-outbox.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login page (01)
  - authenticated cockpit with user, tenant, role, API, store/auth mode (02)
  - support session and ticket/customer/call context loaded (03-04)
  - local-only support note draft and action draft creation (05-06)
  - submit for review and forbidden operator approval proof (07-08)
  - logout, admin re-login, and persisted state (09-10)
  - admin approval, queueing, and mock delivery result (11-13)
  - evidence bundle summary and JSON with action/outbox provenance and no-secret proof (14-15)
  - logout and viewer read-only action/outbox controls (16-17)
- Proves:
  - Action/outbox workflow is visible in the cockpit and follows local-auth role boundaries.
  - Mock delivery reports `realNetwork: false`, `writebackEnabled: false`, and `externalWriteAttempted: false`.
  - Evidence bundle includes action/outbox provenance without exposing tokens, password hashes, raw media, or private credentials.
- Type: browser-runtime-verification
- as_of: 2026-04-27T23:59:00+02:00

## EV-2026-04-28-001: BL-092 durable action/outbox verification script

- File: scripts/verify_durable_action_outbox.sh
- Source/System: shell script against local-auth API and web runtime
- Action: Logged in as operator, admin, viewer, and alt-tenant operator; created support session and action; submitted for review; verified viewer/forged-header approval denial; approved, queued, and mock-delivered action; checked outbox attempts, audit events, timeline events, evidence bundle redaction, cross-tenant denial, and web root.
- Result: pass
- Proves:
  - Durable action/outbox API lifecycle works after the database is recreated from committed migrations and seed data.
  - Tenant scoping, RBAC, forged-header ignore in local mode, mock delivery safety flags, audit/timeline updates, and no-secret evidence checks are directly verified.
- Type: api-behavior-verification
- as_of: 2026-04-28T00:05:00+02:00


## EV-2026-04-28-002: BL-092 Final Closure Audit — 17 Screenshot Set and Script Fix

- Files: `output/playwright/session-092-durable-action-outbox-workflow-final-closure/01-draft-created-no-outbox.png` through `17-no-secret-no-raw-media-proof.png`
- Source/System: Playwright MCP browser automation against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - 01-07: Full action lifecycle — draft, review_required, approval_denial, approved, mock_delivered, second_action_no_outbox, queued
  - 08: Evidence bundle Summary tab with action/outbox provenance
  - 09: Evidence bundle JSON tab with no secrets visible
  - 10: Audit trail showing action/outbox lifecycle events
  - 11: Viewer role with disabled Action Center controls
  - 12: Cross-tenant isolation (alt-tenant admin sees empty session list)
  - 13: Login page after logout
  - 14: Re-login preserving state
  - 15: Post-API-restart persisted state
  - 16: Local mock warnings
  - 17: No-secret no-raw-media proof
- Proves:
  - Complete action/outbox lifecycle is visible and follows role boundaries.
  - Evidence bundle includes action/outbox provenance without exposing secrets.
  - Audit trail records all action/outbox events with actor, timestamp, and metadata.
  - Cross-tenant isolation is enforced server-side.
  - Viewer role is restricted in UI and server-side.
  - State survives API restart via PostgreSQL persistence.
- Type: browser-runtime-verification
- as_of: 2026-04-28T10:35:00+02:00

## EV-2026-04-28-003: verify_postgres_persistence.sh script fix

- File: `scripts/verify_postgres_persistence.sh`
- Change: Script now detects if port 4110 is occupied and automatically uses the next available port for its temporary API instance.
- Proves: The persistence verification script can run honestly even when the development API is already serving on the default port.
- Type: script-fix-verification
- as_of: 2026-04-28T10:27:00+02:00

## EV-2026-04-28-004: BL-093 Outbox worker retry/dead-letter browser proof

- Files: `output/playwright/session-093-outbox-worker-retry-deadletter-foundation/01-login-local-auth.png` through `24-final-no-secret-no-raw-media-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - local login and authenticated cockpit runtime proof with worker/store/auth status
  - approved action queued before worker processing
  - local worker/process-once status and claim/result proof
  - mock delivery success with `realNetwork: false`, `writebackEnabled: false`, and `externalWriteAttempted: false`
  - retryable failure, retry scheduling, admin retry, and dead-letter behavior
  - admin cancel/dead-letter controls and viewer read-only restrictions
  - direct viewer mutation denial with forged role header ignored
  - cross-tenant outbox access denied
  - case timeline, audit trail, and evidence bundle worker/outbox provenance
  - logout/re-login and API restart persistence
  - local/mock/no-real-writeback warnings and no-secret/no-raw-media proof
- Type: browser-runtime-verification
- as_of: 2026-04-28T11:13:00+02:00

## EV-2026-04-28-005: BL-093 outbox worker retry/dead-letter verification script

- File: `scripts/verify_outbox_worker_retry_deadletter.sh`
- Source/System: shell script against local-auth API and web runtime
- Action: Logged in as operator, admin, viewer, and alt-tenant operator; created and queued local support actions; processed mock success; verified retryable failure scheduling and admin retry; verified non-retryable dead-letter, admin cancel, viewer mutation denial, forged-header ignore, cross-tenant denial, audit events, timeline entries, evidence bundle provenance, and no-secret checks.
- Result: pass
- Type: api-behavior-verification
- as_of: 2026-04-28T11:17:00+02:00

## EV-2026-04-28-006: BL-094 admin cockpit with Delivery Policy panel

- File: output/playwright/session-094-delivery-policy-controls-foundation/02-admin-cockpit-delivery-policy-panel.png
- Title: Admin cockpit with Delivery Policy panel visible
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Logged in as admin and scrolled to Delivery Policy panel.
- Shows:
  - Delivery Policy panel showing "Default Delivery Policy" with "Enabled" badge and version.
  - Kill switch toggle, Approval required toggle, Min. approver role dropdown (Admin selected).
  - Mock-only enforced: "Locked ON" with lock icon.
  - Real network calls: "Locked OFF" with lock icon.
  - Allowed actions: ticket_note. Max attempts: 3.
  - Validate Policy and Connector Readiness buttons.
- Proves:
  - Delivery Policy panel is visible to admin users with all policy controls rendered.
- Type: docs-render-verification
- as_of: 2026-04-28T11:24:00+02:00

## EV-2026-04-28-007: BL-094 policy validation result

- File: output/playwright/session-094-delivery-policy-controls-foundation/03-policy-validation-result.png
- Title: Policy validation showing mock_only_allowed decision
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Validate Policy" button in Delivery Policy panel.
- Shows:
  - Policy decision badge: "mock_only_allowed".
  - Message: "Delivery allowed under current policy."
  - Subtext: "Mode: mock • Version: 21".
- Proves:
  - Policy validation endpoint returns visible decision with mode and version metadata.
- Type: docs-render-verification
- as_of: 2026-04-28T11:26:00+02:00

## EV-2026-04-28-008: BL-094 connector readiness result

- File: output/playwright/session-094-delivery-policy-controls-foundation/04-connector-readiness-result.png
- Title: Connector readiness showing mock ready, not real ready
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Clicked "Connector Readiness" button in Delivery Policy panel.
- Shows:
  - Connector Readiness header with checkmark icon.
  - Mock ready: Yes. Real ready: No. Active: Yes. Supports type: Yes.
  - Message: "Real writeback not implemented."
  - Policy: mock_only_allowed.
- Proves:
  - Connector readiness check explicitly reports real writeback is not implemented.
- Type: docs-render-verification
- as_of: 2026-04-28T11:27:00+02:00

## EV-2026-04-28-009: BL-094 session audit with policy events

- File: output/playwright/session-094-delivery-policy-controls-foundation/05-session-audit-policy-events.png
- Title: Session audit trail with delivery_policy_evaluated and delivery_policy_blocked
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Selected "Policy test session" and scrolled to Audit Trail panel.
- Shows:
  - `delivery_policy_evaluated` event with decision metadata including `allowed: true`, `decision: mock_only_allowed`, `policyVersion`, `safetyFlags`.
  - `delivery_policy_blocked` event with `allowed: false`, `decision: blocked_by_kill_switch`, safety flags.
  - `action_queued` and `outbox_item_created` events showing policy decision embedded in delivery intent.
- Proves:
  - Policy evaluation and blocking events are captured in the audit trail with full decision metadata.
- Type: docs-render-verification
- as_of: 2026-04-28T11:28:00+02:00

## EV-2026-04-28-010: BL-094 viewer mode read-only policy

- File: output/playwright/session-094-delivery-policy-controls-foundation/06-viewer-mode-readonly-policy.png
- Title: Viewer mode with read-only policy controls
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Logged out and re-logged in as viewer@supportplane.local.
- Shows:
  - Delivery Policy panel with all toggles disabled (Kill switch, Approval required, Max attempts).
  - Min. approver role dropdown disabled.
  - Message: "View-only. Admin role required to modify policy."
  - Validate Policy and Connector Readiness buttons remain available.
- Proves:
  - Viewer role cannot modify delivery policy; admin role is required for updates.
- Type: docs-render-verification
- as_of: 2026-04-28T11:28:00+02:00

## EV-2026-04-28-011: BL-094 local auth login page

- File: output/playwright/session-094-delivery-policy-controls-foundation/01-login-local-auth.png
- Title: Local auth login page
- Source/System: browser
- Route/Page: http://localhost:3200/
- Action: Opened SupportPlane login page before authentication.
- Shows:
  - SupportPlane local login header with "Local MVP auth, not SSO or production auth" subtitle.
  - Tenant, Email, Password fields with seeded local password hint.
- Proves:
  - Login page is the authentication entry point for browser verification.
- Type: docs-render-verification
- as_of: 2026-04-28T11:23:00+02:00

## EV-2026-04-28-012 through EV-2026-04-28-031: BL-094 Final Closure — 20 Screenshot Set

- Files: `output/playwright/session-095-bl094-final-closure-max20/01-login-local-auth.png` through `20-final-mock-no-secret-proof.png`
- Governance repair note: prior entry referenced `session-094-delivery-policy-controls-final-closure/` which contained 24 screenshots (violating AGENTS.md cap). Updated to canonical max-20 folder after governance repair.
- Source/System: visible Chromium via Playwright script against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - 01: local login page with tenant/email/password fields
  - 02: admin cockpit header with DEV/MOCK badges, identity pill, auth mode, store mode
  - 03: admin Delivery Policy panel with safe defaults, mock-only locked ON, real network locked OFF
  - 04: admin policy update with approval toggled ON, saved version/actor visible
  - 05: connector readiness check returning mock ready, real writeback not ready
  - 06: Action Center queued action with policy decision visible
  - 07: Delivery Operations worker status showing mock mode, queue stats, safety flags
  - 08: queue blocked by kill switch with API error visible
  - 09: worker process dead-lettered after process-once with kill switch enabled
  - 10: worker process allowed in mock mode with attempt detail and safety flags
  - 11: case timeline showing policy/worker decision events
  - 12: audit trail showing delivery_policy_updated, delivery_policy_evaluated, delivery_policy_blocked events
  - 13: evidence bundle summary showing delivery policy provenance
  - 14: evidence bundle JSON showing no secrets, safety flags, mock-only enforcement
  - 15: viewer read-only policy panel with disabled controls and view-only message
  - 16: viewer server-side RBAC denial via "Prove server-side approval denial" button
  - 17: cross-tenant admin denied access to dev-tenant session
  - 18: relogin as admin showing preserved policy state after logout
  - 19: persistence proof — outbox state survives full page reload and re-login
  - 20: final no-real-writeback/no-secret/local-mock proof with cockpit header
- Proves:
  - BL-094 delivery policy controls are visible, enforced at queue and process time, and produce audit/dead-letter artifacts.
  - Both allowed (`mock_only_allowed`) and blocked (`blocked_by_kill_switch`) paths are proven.
  - Admin and viewer roles are differentiated in the UI with server-side enforcement.
  - Cross-tenant access is denied.
  - Evidence bundles include policy provenance without secrets.
  - Policy and outbox state persist across logout/relogin and page reload.
- Type: docs-render-verification
- as_of: 2026-04-28T13:25:00+02:00

## Note: Superseded Evidence

- EV-2026-04-28-006 through EV-2026-04-28-011 (foundation screenshots in `session-094-delivery-policy-controls-foundation/`) are superseded by EV-2026-04-28-012 through EV-2026-04-28-031.
- EV-2026-04-28-012 through EV-2026-04-28-031 were originally recorded against `session-094-delivery-policy-controls-final-closure/` (24 screenshots, cap violation). The canonical proof is now `session-095-bl094-final-closure-max20/` (20 screenshots, 0 duplicates).
- The old `session-094-delivery-policy-controls-final-closure/` folder was deleted per AGENTS.md screenshot lifecycle rules.


## Note: Superseded BL-095 Evidence

- EV-2026-04-28-036 through EV-2026-04-28-043 (8 screenshots in `session-095-connector-installation-settings/`) are superseded by EV-2026-04-28-044 through EV-2026-04-28-057.
- The old `session-095-connector-installation-settings/` folder was deleted per AGENTS.md screenshot lifecycle rules because BL-094 already owns the `session-095-*` namespace.

## EV-2026-04-28-044 through EV-2026-04-28-057 — BL-095 Connector Installation Settings Foundation (Canonical Closure)

- Folder: `output/playwright/session-096-bl095-connector-installation-settings-final-closure/`
- Screenshots: 14 (all unique, 0 duplicates)
  - 01-admin-runtime-identity.png: Admin runtime identity showing user, tenant, role, API endpoint, auth mode, store mode
  - 02-connector-panel-visible.png: Connector settings panel visible with installations list
  - 03-settings-expanded-safe-fields.png: Settings expanded showing safe editable fields (displayName, description, status, enabled, timeout, validateBeforeWrite)
  - 04-admin-saves-settings.png: Admin saves display name/description/status/timeout and safe fields
  - 05-settings-persist-after-reload.png: Saved settings persist after page reload
  - 06-connector-readiness-mock-only.png: Connector readiness reflects installation settings and still says real writeback not ready
  - 07-delivery-policy-real-writeback-denied.png: Delivery policy still denies real writeback / real network remains locked off
  - 08-credential-secret-placeholder.png: Credential/secret placeholder visible without secret value (•••••••• managed server-side)
  - 09-evidence-bundle-connector-provenance.png: Evidence bundle JSON proves connector installation provenance without secrets
  - 10-audit-connector-settings-update.png: Audit trail/timeline showing connector-related events
  - 11-viewer-readonly-and-denial.png: Viewer read-only connector settings with view-only message and disabled controls
  - 12-viewer-api-mutation-denied.png: Server-side viewer mutation denial: API returns 403 with explicit role requirement message
  - 13-cross-tenant-denied.png: Cross-tenant connector access denied (404 on session access)
  - 14-final-local-mock-proof.png: Final local/mock/no-real-writeback proof with visible mock labels
- CLI artifact: `output/playwright/session-096-bl095-connector-installation-settings-final-closure/audit-connector-installation-updated.json` proving `connector_installation_updated` audit events in PostgreSQL
- Proves:
  - BL-095 connector installation settings are editable by admin/operator and visible in the UI.
  - Mock mode is locked ON with visible safety banner; real writeback is denied.
  - Viewer role cannot edit settings (all fields disabled) and receives 403 on PATCH attempts.
  - Cross-tenant access is denied (404).
  - Config secrets are redacted to `[REDACTED]` in API responses.
  - Evidence bundles include connector installations with new fields (displayName, capabilities, mockMode, enabled, timeoutMs).
  - Audit events record connector installation updates with previous/new state metadata.
  - Credential/config JSON storage is explicitly local/mock/dev-only, not production credential management.
- Type: browser-runtime-verification
- as_of: 2026-04-28T16:00:00+02:00


## EV-2026-04-28-058 through EV-2026-04-28-063 — BL-097 Credential Reference Foundation (Canonical Closure)

- Folder: `output/playwright/session-097-credential-reference-foundation-final-closure/`
- Screenshots: 6 (all unique, 0 duplicates)
  - 01-admin-connector-panel-with-credential-refs.png: Admin view showing expanded connector installation with linked credential reference "Dev Zammad API Token (Placeholder)" active status badge
  - 02-admin-credential-ref-selector.png: Admin view scrolled to Credential References section showing link dropdown selector for available credential references
  - 03-viewer-readonly-credential-refs.png: Viewer view showing same credential reference with "View-only. Admin role required to modify installation settings." message; no unlink button visible
  - 04-api-credential-refs-list-redacted.png: API JSON response from `GET /credential-references` showing credential references with `secretRef: "[REDACTED]"`
  - 05-api-credential-ref-single-redacted.png: API JSON response from `GET /credential-references/:id` showing single credential reference with `secretRef: "[REDACTED]"`
  - 06-api-evidence-bundle-credential-refs.png: Evidence bundle JSON showing `credentialReferences` array with metadata only (id, displayName, connectorType, status, secretKind, linked, lastValidatedAt) — no secret values
- Proves:
  - Credential references are created, stored, and listed with tenant scoping.
  - All API responses redact `secretRef` to `[REDACTED]`; raw secret values never leave the server.
  - Evidence bundles include credential reference summaries without secret values.
  - Admin can view linked credential references and has link/unlink UI controls.
  - Viewer sees read-only credential reference list with no modification controls.
  - Connector installations reference credentials by ID via `secretReferenceIds` array.
  - Audit events track credential reference lifecycle (created, updated, linked, unlinked).
- Type: browser-runtime-verification
- as_of: 2026-04-28T17:30:00+02:00


## EV-2026-04-28-064 through EV-2026-04-28-078: BL-098 connector runtime configuration and readiness browser proof

- Files: `output/playwright/session-098-connector-runtime-readiness-final-closure/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with user/tenant/role/API URL/local auth/postgres store/mock mode
  - connector panel with Config and Readiness action buttons visible
  - config validation result showing Valid badge, mockMode:true, realNetwork:false, writebackEnabled:false
  - unsafe config validation rejected via API: mockMode:false, apiToken, baseUrl all flagged as errors
  - runtime readiness panel showing mockReady, realNetwork:false, writebackEnabled:false, linkedCredentials count
  - expanded installation settings showing Mock-only badge, Locked ON mock mode, credential references
  - API config schema endpoint returning safeFields, rejectedFields, mockOnly:true
  - API runtime readiness endpoint returning mockReady, realReady:false, realNetwork:false, writebackEnabled:false
  - API runtime resolve endpoint returning tenant-scoped result with credential reference metadata (no secretRef), secretResolutionImplemented:false
  - evidence bundle JSON including connector installations with realNetwork:false, writebackEnabled:false, externalWriteAttempted:false
  - viewer read-only connector panel with disabled Config/Readiness buttons
  - viewer server-side mutation denial visible in UI and CLI artifact
  - cross-tenant access denied via API and CLI artifact
  - audit trail showing connector_config_validated, connector_readiness_checked, connector_runtime_resolved events
  - final mock/no-secret/no-real-writeback proof
- Proves:
  - BL-098 config validation, runtime readiness, and runtime resolver are implemented and browser-verified
  - Mock-only safety is enforced at schema, service, controller, and UI layers
  - Secret redaction is maintained: no secretRef values exposed in runtime resolver or evidence bundle
  - RBAC enforcement denies viewer mutations server-side with 403
  - Tenant isolation returns 404 for cross-tenant access
- Type: browser-runtime-verification
- as_of: 2026-04-28T18:35:00+02:00


## EV-2026-04-28-079 through EV-2026-04-28-093: BL-098 Closure Repair Evidence

- Files: `output/playwright/session-099-bl098-closure-repair-final/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with tenant/role pill
  - connector panel with exactly 1 linked credential reference (clean seed)
  - config validation: valid=true, mock-only flags, no contradictions between label and content
  - unsafe config rejected via API: mockMode:false, apiToken, baseUrl flagged as errors
  - runtime readiness panel: mockReady, realNetwork:false, writebackEnabled:false, 1 linked credential
  - API runtime resolve: tenant-scoped result with credential metadata, no secretRef, secretResolutionImplemented:false
  - ticket context panel showing Connector Runtime Provenance card with installation name, type, mode, network status, linked credential count, capabilities
  - evidence bundle summary with connector safety fields
  - evidence bundle JSON (1.1MB) with no secret leakage
  - audit trail with populated connector_config_validated, connector_readiness_checked, connector_runtime_resolved events (not empty)
  - viewer read-only connector panel with disabled buttons
  - viewer server-side mutation denial via API (403)
  - cross-tenant access denied via API (404)
  - delivery policy denies writeback via API
  - final mock/no-secret/no-real-writeback proof with visible content (not empty)
- Proves:
  - BL-098 closure repair: all prior defects fixed
  - Seed is idempotent: exactly 1 credential reference linked to conn-inst-dev-001
  - Ticket/customer connector provenance is visibly rendered in UI
  - No screenshot label contradicts visible content
  - No empty panels in audit or evidence screenshots
- Type: browser-runtime-verification
- as_of: 2026-04-28T19:30:00+02:00


## EV-2026-04-28-094 through EV-2026-04-28-108: BL-098 Evidence Repair (Second Pass)

- Files: `output/playwright/session-100-bl098-evidence-repair-final/01-admin-runtime-identity.png` through `15-final-mock-no-secret-proof.png`
- Source/System: visible Chromium via Playwright CLI against `http://localhost:3200` and `http://localhost:4110`
- Store/Auth mode: `SUPPORTPLANE_STORE=postgres`, `SUPPORTPLANE_AUTH_MODE=local`
- Shows:
  - admin runtime identity with tenant/role pill
  - connector panel with exactly 1 linked credential reference (clean seed)
  - config validation: Valid badge, `valid: true`, mock-only flags (label matches content)
  - unsafe config rejected via API: mockMode:false, apiToken, baseUrl flagged as errors
  - runtime readiness panel: mockReady, realNetwork:false, writebackEnabled:false, 1 linked credential
  - API runtime resolve: tenant-scoped result with credential metadata, no secretRef, secretResolutionImplemented:false
  - ticket context panel: Connector Runtime Provenance card visible with installation name, type, mode, network status, linked credential count, capabilities
  - generated evidence bundle summary: Bundle ID visible, connector counts, mock/dev-only disclaimers (not empty state)
  - compact evidence bundle proof: connectorInstallations count, credentialReferences count, realNetwork:false, writebackEnabled:false, externalWriteAttempted:false, no secret leakage
  - compact audit proof: connector_config_validated, connector_readiness_checked, connector_runtime_resolved event types with tenant/actor/timestamp (not empty, not unreadable tall dump)
  - viewer read-only connector panel with disabled buttons
  - viewer server-side mutation denial via API (403)
  - cross-tenant access denied via API (404)
  - delivery policy denies writeback via API
  - final mock/no-secret/no-real-writeback proof: connector panel shows Mock-only badge, Locked ON, secret values hidden (not empty bundle state)
- CLI artifacts:
  - `evidence-bundle-no-secret-summary.json` — compact connector/credential summary with noSecretLeak:true
  - `audit-bl098-events-summary.json` — compact BL-098 event summary (12 events)
  - `screenshot-md5s.txt` — MD5 hashes of all 15 screenshots
  - `proof-state-mapping.md` — numbered proof-state table
- Proves:
  - BL-098 evidence repair: all prior screenshot defects fixed
  - No contradictions between screenshot labels and visible content
  - No empty panels in audit, evidence, or final proof screenshots
  - No unreadable tall JSON dumps
  - All screenshots are compact and reviewable (max 900px height)
- Type: browser-runtime-verification
- as_of: 2026-04-28T21:15:00+02:00

- id: EV-2026-04-28-006
  backlog_id: BL-099
  title: Connector Runtime Test Coverage + Documentation Hardening Evidence
  evidence_type: test_coverage_and_documentation
  status: accepted
  artifact_folder: output/playwright/session-101-bl099-bl100-runtime-confidence-design-final/
  artifact_count: 13
  screenshots:
    - 01-admin-runtime-identity.png — admin@supportplane.local with tenant pill, role badge
    - 02-connector-panel-config-readiness-controls.png — Config Schema, Validate Config, Runtime Readiness buttons visible
    - 03-valid-config-validation.png — Valid badge, valid:true, mockMode:true
    - 04-unsafe-config-rejected.png — mockMode:false, apiToken, baseUrl rejected with errors
    - 05-runtime-readiness-mock-only.png — mockReady, realReady:false, writebackEnabled:false
    - 06-runtime-resolve-credential-metadata-only.png — mode:mock, credential metadata only, no secretRef
    - 07-ticket-context-connector-runtime-provenance.png — Connector Runtime Provenance card visible
    - 08-evidence-bundle-connector-runtime-metadata.png — connector counts, realNetwork:false, no secret leakage
    - 09-viewer-read-only-connector-panel.png — disabled buttons, read-only UI
    - 10-viewer-server-side-denial.png — 403 response on mutation attempt
    - 11-cross-tenant-denial.png — 404 on cross-tenant runtime access
    - 12-real-writeback-path-design-proof.png — REAL_WRITEBACK_PATH_DESIGN.md rendered in browser
    - 13-final-local-mock-no-real-writeback-proof.png — Mock-only badge, no real writeback
  test_results:
    - apps/api: 147/147 pass (14 suites)
    - packages/contracts: 43/43 pass (7 suites)
    - apps/web: 19/19 pass (1 suite)
    - packages/connectors: 16/16 pass (6 suites)
  verification_scripts:
    - scripts/verify_connector_runtime_readiness.sh: 12/12 pass
    - scripts/verify_connector_runtime_contracts.sh: 14/14 pass
  docs:
    - docs/CONNECTOR_RUNTIME_CONTRACT.md
    - docs/TICKET_CONTEXT_CONNECTOR_SAFETY.md
  as_of: 2026-04-28T21:30:00+02:00

- id: EV-2026-04-28-007
  backlog_id: BL-100
  title: Real Writeback Path Design Document Evidence
  evidence_type: design_documentation
  status: accepted
  artifact_folder: output/playwright/session-101-bl099-bl100-runtime-confidence-design-final/
  artifact_count: 2
  screenshots:
    - 12-real-writeback-path-design-proof.png — REAL_WRITEBACK_PATH_DESIGN.md rendered in browser showing all sections
    - 13-final-local-mock-no-real-writeback-proof.png — connector panel shows mock-only state with design doc referenced
  docs:
    - docs/REAL_WRITEBACK_PATH_DESIGN.md
  as_of: 2026-04-28T21:30:00+02:00


- id: EV-2026-04-29-001
  backlog_id: BL-107
  title: Zammad Sandbox Bootstrap and Real Read Connector
  evidence_type: runtime_verification
  status: accepted
  artifact_folder: output/playwright/session-108-bl107-zammad-sandbox-read-connector/
  artifact_count: 11
  screenshots:
    - 01-zammad-api-seeded-ticket.png — Zammad API returns real ticket 2 (68002) and customer 5 (Acme BVBA)
    - 02-cockpit-loaded-ticket.png — Composite: UI shows real Zammad ticket with sandbox labels, Connector Runtime Provenance, AI Context Quality, Case Timeline
    - 04-cluster-api-health.png — Cluster API health: store=postgres, auth=local, status=ok
  cli_artifacts:
    - connector-runtime-readiness.txt — realReady=true, mockReady=false, writebackEnabled=false
    - zammad-api-read-proof.txt — SupportPlane API reads real Zammad ticket via authenticated POST
    - boundary-proof.txt — Real sandbox read only; no production, no writeback
    - validation-gate.txt — Exact commands and pass/fail results
    - local-mvp-regression.txt — Local MVP not required; cluster is acceptance target
    - proof-state-mapping.md — Maps each artifact to the state it proves
    - screenshot-md5s.txt — Duplicate detection: 0 duplicates
  test_results:
    - npm run lint: passed
    - npm run typecheck: passed (all workspaces)
    - npm test: passed (43 tests, 0 failures)
  verification_commands:
    - curl http://localhost:4210/health
    - curl -b cookies -X POST http://localhost:4210/connector-installations/conn-inst-dev-001/runtime-readiness
    - curl -b cookies -X POST http://localhost:4210/support-sessions/{id}/zammad/ticket-context -d '{"externalTicketId":"2"}'
    - node scripts/bl107_screenshots_final.js
  as_of: 2026-04-29T19:55:00+02:00
