#!/usr/bin/env node
/**
 * Direct contract/schema validation script.
 * Validates that Zod schemas accept well-formed sample data.
 */

const {
  Tenant,
  User,
  Role,
  SupportSession,
  TicketReference,
  TicketingAdapter,
  AIContextPacket,
  ScreenObservation,
  PolicyDecision,
  AuditEvent,
  EvidenceBundle,
  EvidenceBundleExportRequest,
  EvidenceBundleExportResponse,
  TelephonyAdapterStatus,
  TelephonyWebhookEvent,
  TelephonyCallControlIntent,
} = require('../packages/contracts/dist/index.js');

function assertValid(label, schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`❌ ${label} failed validation:`);
    console.error(result.error.format());
    process.exit(1);
  }
  console.log(`✅ ${label}`);
}

const now = new Date().toISOString();

assertValid('Tenant', Tenant, {
  id: 'tenant_001',
  name: 'Acme Corp',
  slug: 'acme-corp',
  status: 'active',
  settings: {},
  createdAt: now,
  updatedAt: now,
});

assertValid('User', User, {
  id: 'user_001',
  tenantId: 'tenant_001',
  email: 'alice@example.com',
  name: 'Alice',
  status: 'active',
  roleIds: ['role_001'],
  createdAt: now,
  updatedAt: now,
});

assertValid('Role', Role, {
  id: 'role_001',
  tenantId: 'tenant_001',
  name: 'Support Agent',
  permissions: ['session:read', 'ticket:read'],
  createdAt: now,
  updatedAt: now,
});

assertValid('SupportSession', SupportSession, {
  id: 'session_001',
  tenantId: 'tenant_001',
  status: 'open',
  priority: 'high',
  title: 'Printer not working',
  assignedUserId: 'user_001',
  linkedTicketIds: ['ticket_001'],
  aiContextPacketIds: [],
  screenObservationIds: [],
  callEventIds: [],
  auditEventIds: [],
  startedAt: now,
  createdAt: now,
  updatedAt: now,
});

assertValid('TicketingAdapter', TicketingAdapter, {
  id: 'adapter_001',
  tenantId: 'tenant_001',
  name: 'Zammad Main',
  adapterType: 'zammad',
  capabilities: ['read_tickets', 'write_notes'],
  status: 'active',
  config: { baseUrl: 'https://zammad.example.com' },
  secretReferenceIds: [],
  createdAt: now,
  updatedAt: now,
});

assertValid('TicketReference', TicketReference, {
  id: 'ticket_001',
  tenantId: 'tenant_001',
  adapterId: 'adapter_001',
  externalTicketId: '42',
  subject: 'Printer issue',
  status: 'open',
  priority: 'normal',
  customerEmail: 'bob@example.com',
  lastSyncedAt: now,
  createdAt: now,
  updatedAt: now,
});

assertValid('AIContextPacket', AIContextPacket, {
  id: 'ctx_001',
  tenantId: 'tenant_001',
  sessionId: 'session_001',
  provenance: 'ticket',
  sourceTicketIds: ['ticket_001'],
  payload: { summary: 'Printer not responding' },
  redactionLog: [],
  contextHash: 'abc123',
  createdAt: now,
});

assertValid('ScreenObservation', ScreenObservation, {
  id: 'obs_001',
  tenantId: 'tenant_001',
  sessionId: 'session_001',
  source: 'mock_operator_companion',
  kind: 'active_window',
  status: 'captured',
  noRawPixels: true,
  noClipboard: true,
  noOcr: true,
  noCredentialCapture: true,
  mockDevOnly: true,
  createdAt: now,
});

assertValid('PolicyDecision', PolicyDecision, {
  id: 'pol_001',
  tenantId: 'tenant_001',
  sessionId: 'session_001',
  outcome: 'allow',
  action: 'draft_internal_note',
  resourceType: 'ticket',
  resourceId: 'ticket_001',
  actorUserId: 'user_001',
  reason: 'User has write_notes permission and risk level is low.',
  evidence: {},
  riskLevel: 'low',
  createdAt: now,
});

assertValid('AuditEvent', AuditEvent, {
  id: 'aud_001',
  tenantId: 'tenant_001',
  sessionId: 'session_001',
  eventType: 'session_created',
  actorType: 'user',
  actorId: 'user_001',
  action: 'create',
  resourceType: 'support_session',
  resourceId: 'session_001',
  metadata: {},
  createdAt: now,
});

assertValid('EvidenceBundle', EvidenceBundle, {
  bundleId: 'bundle_001',
  tenantId: 'tenant_001',
  sessionId: 'session_001',
  generatedAt: now,
  generatedBy: 'user_001',
  exportFormat: 'json',
  version: '1.0.0-mvp',
  sessionSummary: {
    id: 'session_001',
    tenantId: 'tenant_001',
    status: 'open',
    priority: 'normal',
    title: 'Test session',
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  linkedTickets: [],
  contextPackets: [],
  aiUsage: [],
  connectorOperations: [],
  callEvents: [],
  auditTimeline: [],
  mockDevOnlyDisclaimers: ['Mock disclaimer'],
  limitations: ['Limitation 1'],
  sourceProvenance: {
    storeType: 'in-memory',
    persistenceClaimed: false,
    generatedByService: 'supportplane-api',
    schemaVersion: '1.0.0-mvp',
  },
});

assertValid('EvidenceBundleExportRequest', EvidenceBundleExportRequest, { format: 'markdown' });
assertValid('EvidenceBundleExportResponse', EvidenceBundleExportResponse, {
  bundle: {
    bundleId: 'bundle_001',
    tenantId: 'tenant_001',
    sessionId: 'session_001',
    generatedAt: now,
    generatedBy: 'user_001',
    exportFormat: 'json',
    version: '1.0.0-mvp',
    sessionSummary: {
      id: 'session_001',
      tenantId: 'tenant_001',
      status: 'open',
      priority: 'normal',
      title: 'Test session',
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    linkedTickets: [],
    contextPackets: [],
    aiUsage: [],
    connectorOperations: [],
    callEvents: [],
    auditTimeline: [],
    mockDevOnlyDisclaimers: ['Mock disclaimer'],
    limitations: ['Limitation 1'],
    sourceProvenance: {
      storeType: 'in-memory',
      persistenceClaimed: false,
      generatedByService: 'supportplane-api',
      schemaVersion: '1.0.0-mvp',
    },
  },
  format: 'json',
});

assertValid('TelephonyAdapterStatus', TelephonyAdapterStatus, {
  tenantId: 'tenant_001',
  providerType: 'mock',
  mode: 'mock',
  health: 'healthy',
  connected: true,
  capabilities: {
    inboundCalls: true,
    answer: true,
    hold: true,
    resume: true,
    end: true,
    transfer: false,
    recording: false,
    transcription: false,
  },
  webhookVerification: {
    status: 'not_required',
    checkedAt: now,
    signatureRequired: false,
    mockDevOnly: true,
  },
  mockDevOnly: true,
});

assertValid('TelephonyWebhookEvent', TelephonyWebhookEvent, {
  tenantId: 'tenant_001',
  providerType: 'mock',
  adapterMode: 'mock',
  sourceEventId: 'provider_event_001',
  externalCallId: 'external_call_001',
  eventType: 'incoming_call',
  rawCallerNumber: '03 555 01 01',
  occurredAt: now,
  verification: {
    status: 'not_required',
    checkedAt: now,
    signatureRequired: false,
    mockDevOnly: true,
  },
  mockDevOnly: true,
});

assertValid('TelephonyCallControlIntent', TelephonyCallControlIntent, {
  tenantId: 'tenant_001',
  actorId: 'user_001',
  callEventId: 'call_001',
  externalCallId: 'external_call_001',
  action: 'answer',
  requestedAt: now,
  mockDevOnly: true,
});

console.log('\n✅ All contract validations passed.');
