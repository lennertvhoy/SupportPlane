# Telephony Architecture Proof — BL-117/130/131/132

## What Is Implemented Now

1. **Telephony Adapter Registry** (`packages/connectors/src/telephony-registry.ts`)
   - `mock-telephony` adapter — wraps existing mock behavior
   - `asterisk-ami` adapter — stub for Asterisk Manager Interface
   - Registry functions: `registerTelephonyAdapter`, `getTelephonyAdapterFactory`, `listTelephonyAdapters`
   - Duplicate registration fails
   - Unknown adapter returns `undefined`

2. **Asterisk Local Sandbox** (`infra/kubernetes/local-podman/integrations/asterisk/`)
   - Asterisk 22.8.2 deployed in `supportplane-integrations` namespace
   - AMI enabled on port 5038, cluster-internal only
   - Local sandbox secret `local-sandbox-secret` in Kubernetes Secret
   - Minimal dialplan with `default` context and `test` extension
   - No SIP trunk, no PSTN, no recording, no RTP

3. **AMI Event Ingestion** (`apps/api/src/telephony/telephony.controller.ts` + `telephony.service.ts`)
   - POST `/telephony/asterisk/events` accepts canonical AMI events
   - Service-auth required (`x-supportplane-service-token`)
   - Creates `CallEvent` with `source: "asterisk-ami"`
   - Caller matching runs automatically
   - Session auto-creation supported
   - Audit events record `amiEvent: true`, `sandboxOnly: true`, `pstn: false`, `recording: false`

4. **Bridge Script** (`scripts/asterisk_ami_bridge.js`)
   - Connects to Asterisk AMI via TCP
   - Authenticates with sandbox secret
   - `--test-event` mode generates local AMI test event and posts to API
   - `--listen` mode continuously forwards AMI events to API
   - Redacts secrets in forwarded events

5. **UI Updates** (`apps/web/app/call-console/page.tsx`)
   - Call list shows source indicator
   - Call banner shows "Asterisk AMI local event" for AMI calls
   - Telephony bridge panel shows source and sandbox status
   - Caller identity panel shows AMI-specific disclaimers
   - Fake webhook simulator remains available as secondary control

## Asterisk-Only vs FreePBX Status

- **Asterisk**: Deployed and running in local sandbox. AMI authentication works.
- **FreePBX**: NOT deployed. GUI deferred to future slice.
- **BL-117 acceptance wording**: "Local Asterisk AMI bridge; FreePBX GUI deferred; no PSTN."

## AMI vs ARI Choice

- **AMI chosen** for this slice because:
  - Simpler event model for call events (Newchannel, Newstate, Hangup)
  - No need for RESTful HTTP complexity
  - Easier to bridge with a lightweight TCP client
- **ARI** remains a future option if more sophisticated call control is needed.

## No-PSTN Boundary

- No SIP trunk configured
- No outbound route to PSTN
- No DID/DDI numbers
- `pstn: false` on all ingested events
- UI explicitly states "No PSTN" on Asterisk calls

## No Recording/Transcription Boundary

- `recording: false` on all ingested events
- No RTP ports exposed
- No audio capture infrastructure
- No STT/TTS integration
- Mock recording panel remains for deterministic metadata only

## Tenant/Event Model

- All AMI events are tenant-scoped via `tenantId` parameter
- Cross-tenant event ingestion is blocked by service-auth middleware
- `CallEvent` stores `tenantId` and is filtered in all queries

## Service-Auth Model

- Bridge script uses `x-supportplane-service-token` header
- API validates against `SUPPORTPLANE_INTERNAL_SERVICE_TOKEN`
- Bridge runs with `x-service-actor: asterisk-ami-bridge`
- Invalid service token returns 401

## Future FreePBX/PSTN Gaps

- FreePBX GUI not deployed
- No real SIP trunk or provider integration
- No outbound call origination
- No call transfer/hangup via AMI Actions
- No real audio/media handling
- No production telephony readiness
