import { randomUUID } from 'crypto';
import type {
  SupportSession,
  TicketReference,
  AIContextPacket,
  AuditEvent,
  CallEvent,
  EvidenceBundle,
  EvidenceBundleFormat,
  EvidenceBundleSessionSummary,
  EvidenceBundleTicketSummary,
  EvidenceBundleContextPacketSummary,
  EvidenceBundleConnectorOperationSummary,
  EvidenceBundleAiUsageSummary,
  EvidenceBundleAuditSummary,
  EvidenceBundleCallEventSummary,
  TenantId,
  SupportSessionId,
  EvidenceBundleId,
} from '@supportplane/contracts';
import { redactSecrets, redactString } from './redaction.js';

export interface BuildEvidenceBundleInput {
  tenantId: TenantId;
  sessionId: SupportSessionId;
  generatedBy: string;
  format: EvidenceBundleFormat;
  session: SupportSession;
  tickets: TicketReference[];
  contextPackets: AIContextPacket[];
  auditEvents: AuditEvent[];
  callEvents?: CallEvent[];
  connectorMode?: string;
}

function toSessionSummary(session: SupportSession): EvidenceBundleSessionSummary {
  return {
    id: session.id,
    tenantId: session.tenantId,
    status: session.status,
    priority: session.priority,
    title: session.title,
    description: session.description,
    assignedUserId: session.assignedUserId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function toTicketSummaries(tickets: TicketReference[]): EvidenceBundleTicketSummary[] {
  return tickets.map((t) => ({
    id: t.id,
    externalTicketId: t.externalTicketId,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    customerName: t.customerName,
    customerEmail: t.customerEmail,
    adapterId: t.adapterId,
    lastSyncedAt: t.lastSyncedAt,
  }));
}

function toContextPacketSummaries(packets: AIContextPacket[]): EvidenceBundleContextPacketSummary[] {
  return packets.map((p) => ({
    id: p.id,
    provenance: p.provenance,
    sourceTicketIds: p.sourceTicketIds,
    sourceAdapterId: p.sourceAdapterId,
    payloadSummary: redactSecrets(p.payload as Record<string, unknown>),
    redactionLog: p.redactionLog,
    createdAt: p.createdAt,
  }));
}

function toConnectorOperationSummaries(auditEvents: AuditEvent[]): EvidenceBundleConnectorOperationSummary[] {
  return auditEvents
    .filter((e) =>
      [
        'zammad_ticket_loaded',
        'internal_note_drafted',
        'internal_note_writeback_attempted',
        'internal_note_writeback_succeeded',
        'internal_note_writeback_failed',
      ].includes(e.eventType)
    )
    .map((e) => ({
      operationType: e.eventType,
      connectorType: (e.metadata.connectorType as string) ?? 'unknown',
      connectorMode: (e.metadata.connectorMode as string) ?? 'unknown',
      externalTicketId: (e.metadata.externalTicketId as string) ?? undefined,
      success: e.eventType === 'internal_note_writeback_succeeded' ? true : e.eventType === 'internal_note_writeback_failed' ? false : undefined,
      externalArticleId: (e.metadata.externalArticleId as string) ?? undefined,
      errorCode: (e.metadata.errorCode as string) ?? undefined,
      errorMessage: (e.metadata.errorMessage as string) ?? undefined,
      occurredAt: e.createdAt,
    }));
}

function toAiUsageSummaries(auditEvents: AuditEvent[]): EvidenceBundleAiUsageSummary[] {
  return auditEvents
    .filter((e) => e.eventType === 'ai_draft_generated')
    .map((e) => ({
      provider: (e.metadata.provider as string) ?? 'unknown',
      model: (e.metadata.model as string) ?? 'unknown',
      promptId: (e.metadata.promptId as string) ?? undefined,
      promptVersion: (e.metadata.promptVersion as string) ?? undefined,
      contextHash: (e.metadata.contextHash as string) ?? undefined,
      mockOnly: (e.metadata.mockOnly as boolean) ?? true,
      externalCallMade: false,
      reviewRequired: true,
      writebackAllowed: false,
      generatedAt: e.createdAt,
    }));
}

function toAuditSummaries(auditEvents: AuditEvent[]): EvidenceBundleAuditSummary[] {
  return auditEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    actorType: e.actorType,
    actorId: e.actorId,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    metadataSummary: redactSecrets(e.metadata as Record<string, unknown>),
    integrityHash: e.integrityHash,
    createdAt: e.createdAt,
  }));
}

function toCallEventSummaries(callEvents: CallEvent[] | undefined): EvidenceBundleCallEventSummary[] {
  if (!callEvents) return [];
  return callEvents.map((c) => ({
    callEventId: c.id,
    provider: c.provider,
    source: c.source,
    externalCallId: c.externalCallId,
    direction: c.direction,
    status: c.status,
    rawNumber: c.caller.rawNumber,
    normalizedNumber: c.caller.normalizedNumber,
    displayName: c.caller.displayName,
    matchStatus: c.callerMatch?.status ?? 'unknown',
    matchConfidence: c.callerMatch?.confidence ?? 0,
    customerName: c.callerMatch?.customerName,
    matchedTicketIds: c.callerMatch?.matchedTicketIds ?? [],
    linkedSessionId: c.sessionId,
    mockDevOnly: c.mockDevOnly,
    startedAt: c.startedAt,
  }));
}

export function buildEvidenceBundle(input: BuildEvidenceBundleInput): EvidenceBundle {
  const now = new Date().toISOString();

  const bundle: EvidenceBundle = {
    bundleId: randomUUID() as EvidenceBundleId,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    generatedAt: now,
    generatedBy: input.generatedBy,
    exportFormat: input.format,
    version: '1.0.0-mvp',
    sessionSummary: toSessionSummary(input.session),
    linkedTickets: toTicketSummaries(input.tickets),
    contextPackets: toContextPacketSummaries(input.contextPackets),
    aiUsage: toAiUsageSummaries(input.auditEvents),
    connectorOperations: toConnectorOperationSummaries(input.auditEvents),
    callEvents: toCallEventSummaries(input.callEvents),
    auditTimeline: toAuditSummaries(input.auditEvents),
    mockDevOnlyDisclaimers: [
      'This evidence bundle was generated from an in-memory mock development store.',
      'No real database persistence, external ticketing system, or AI provider was used.',
      'Data is lost on API restart. This is not production audit-grade evidence.',
      'Connector mode is mock unless explicitly configured otherwise.',
      'Call events are simulated via fake webhook. No real telephony is connected.',
      'Caller matching uses deterministic mock fixtures, not a real customer database.',
    ],
    limitations: [
      'No cryptographic hash chain integrity guarantee.',
      'No tamper-evident storage or object storage persistence.',
      'No real authentication; actor identity is from mock dev headers.',
      'No GDPR or legal compliance claims are made for this export format.',
      'Secrets and tokens have been redacted using pattern matching, not guaranteed zero-knowledge.',
      'Phone normalization is Belgian-style heuristic only, not telecom-grade validation.',
    ],
    sourceProvenance: {
      storeType: 'in-memory',
      persistenceClaimed: false,
      generatedByService: 'supportplane-api-evidence-bundle-builder',
      schemaVersion: '1.0.0-mvp',
    },
  };

  return bundle;
}

export function bundleToMarkdown(bundle: EvidenceBundle): string {
  const lines: string[] = [];

  lines.push(`# SupportPlane Evidence Bundle`);
  lines.push(``);
  lines.push(`> **Bundle ID:** ${bundle.bundleId}`);
  lines.push(`> **Tenant:** ${bundle.tenantId}`);
  lines.push(`> **Session:** ${bundle.sessionId}`);
  lines.push(`> **Generated:** ${bundle.generatedAt}`);
  lines.push(`> **Generated By:** ${bundle.generatedBy}`);
  lines.push(`> **Format:** ${bundle.exportFormat}`);
  lines.push(`> **Version:** ${bundle.version}`);
  lines.push(``);

  lines.push(`---`);
  lines.push(``);
  lines.push(`## Session Summary`);
  lines.push(``);
  lines.push(`- **Title:** ${bundle.sessionSummary.title}`);
  lines.push(`- **Status:** ${bundle.sessionSummary.status}`);
  lines.push(`- **Priority:** ${bundle.sessionSummary.priority}`);
  if (bundle.sessionSummary.description) {
    lines.push(`- **Description:** ${bundle.sessionSummary.description}`);
  }
  if (bundle.sessionSummary.assignedUserId) {
    lines.push(`- **Assigned User:** ${bundle.sessionSummary.assignedUserId}`);
  }
  lines.push(`- **Started:** ${bundle.sessionSummary.startedAt}`);
  lines.push(`- **Updated:** ${bundle.sessionSummary.updatedAt}`);
  lines.push(``);

  lines.push(`## Linked Tickets`);
  lines.push(``);
  if (bundle.linkedTickets.length === 0) {
    lines.push(`*No linked tickets.*`);
  } else {
    for (const t of bundle.linkedTickets) {
      lines.push(`### ${t.externalTicketId}`);
      lines.push(`- **Subject:** ${t.subject}`);
      lines.push(`- **Status:** ${t.status}`);
      lines.push(`- **Priority:** ${t.priority}`);
      if (t.customerName) lines.push(`- **Customer:** ${t.customerName}`);
      if (t.customerEmail) lines.push(`- **Email:** ${t.customerEmail}`);
      lines.push(`- **Adapter:** ${t.adapterId}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## AI Context Packets`);
  lines.push(``);
  if (bundle.contextPackets.length === 0) {
    lines.push(`*No context packets.*`);
  } else {
    for (const p of bundle.contextPackets) {
      lines.push(`### ${p.provenance} (${p.id})`);
      lines.push(`- **Source Tickets:** ${p.sourceTicketIds.join(', ') || 'none'}`);
      if (p.sourceAdapterId) lines.push(`- **Adapter:** ${p.sourceAdapterId}`);
      lines.push(`- **Created:** ${p.createdAt}`);
      lines.push(`- **Payload Summary:**`);
      lines.push(`\`\`\`json`);
      lines.push(JSON.stringify(p.payloadSummary, null, 2));
      lines.push(`\`\`\``);
      if (p.redactionLog.length > 0) {
        lines.push(`- **Redactions:**`);
        for (const r of p.redactionLog) {
          lines.push(`  - \`${r.field}\` — ${r.reason} (${r.method})`);
        }
      }
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## AI Usage`);
  lines.push(``);
  if (bundle.aiUsage.length === 0) {
    lines.push(`*No AI usage recorded.*`);
  } else {
    for (const u of bundle.aiUsage) {
      lines.push(`- **Provider:** ${u.provider}`);
      lines.push(`- **Model:** ${u.model}`);
      if (u.promptVersion) lines.push(`- **Prompt Version:** ${u.promptVersion}`);
      if (u.contextHash) lines.push(`- **Context Hash:** ${u.contextHash}`);
      lines.push(`- **Mock Only:** ${u.mockOnly}`);
      lines.push(`- **Review Required:** ${u.reviewRequired}`);
      lines.push(`- **Writeback Allowed:** ${u.writebackAllowed}`);
      if (u.generatedAt) lines.push(`- **Generated At:** ${u.generatedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Connector Operations`);
  lines.push(``);
  if (bundle.connectorOperations.length === 0) {
    lines.push(`*No connector operations recorded.*`);
  } else {
    for (const op of bundle.connectorOperations) {
      lines.push(`- **${op.operationType}** (${op.connectorType} / ${op.connectorMode})`);
      if (op.externalTicketId) lines.push(`  - Ticket: ${op.externalTicketId}`);
      if (op.success !== undefined) lines.push(`  - Success: ${op.success}`);
      if (op.externalArticleId) lines.push(`  - Article ID: ${op.externalArticleId}`);
      if (op.errorCode) lines.push(`  - Error: ${op.errorCode} — ${op.errorMessage ?? ''}`);
      lines.push(`  - At: ${op.occurredAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Call Events`);
  lines.push(``);
  if (bundle.callEvents.length === 0) {
    lines.push(`*No call events recorded.*`);
  } else {
    for (const c of bundle.callEvents) {
      lines.push(`### ${c.externalCallId} (${c.callEventId})`);
      lines.push(`- **Provider:** ${c.provider}`);
      lines.push(`- **Direction:** ${c.direction}`);
      lines.push(`- **Status:** ${c.status}`);
      lines.push(`- **Raw Number:** ${c.rawNumber}`);
      if (c.normalizedNumber) lines.push(`- **Normalized Number:** ${c.normalizedNumber}`);
      if (c.displayName) lines.push(`- **Display Name:** ${c.displayName}`);
      lines.push(`- **Match Status:** ${c.matchStatus} (confidence: ${c.matchConfidence})`);
      if (c.customerName) lines.push(`- **Matched Customer:** ${c.customerName}`);
      if (c.matchedTicketIds.length > 0) lines.push(`- **Matched Tickets:** ${c.matchedTicketIds.join(', ')}`);
      if (c.linkedSessionId) lines.push(`- **Linked Session:** ${c.linkedSessionId}`);
      lines.push(`- **Mock/Dev-Only:** ${c.mockDevOnly}`);
      lines.push(`- **Started:** ${c.startedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Audit Timeline`);
  lines.push(``);
  if (bundle.auditTimeline.length === 0) {
    lines.push(`*No audit events.*`);
  } else {
    for (const e of bundle.auditTimeline) {
      lines.push(`### ${e.eventType} — ${e.createdAt}`);
      lines.push(`- **Actor:** ${e.actorType} / ${e.actorId}`);
      lines.push(`- **Action:** ${e.action}`);
      lines.push(`- **Resource:** ${e.resourceType} / ${e.resourceId}`);
      if (e.integrityHash) lines.push(`- **Integrity Hash:** ${e.integrityHash}`);
      lines.push(`- **Metadata:**`);
      lines.push(`\`\`\`json`);
      lines.push(JSON.stringify(e.metadataSummary, null, 2));
      lines.push(`\`\`\``);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Mock / Dev-Only Disclaimers`);
  lines.push(``);
  for (const d of bundle.mockDevOnlyDisclaimers) {
    lines.push(`> ${d}`);
  }
  lines.push(``);

  lines.push(`## Limitations`);
  lines.push(``);
  for (const l of bundle.limitations) {
    lines.push(`- ${l}`);
  }
  lines.push(``);

  lines.push(`## Source Provenance`);
  lines.push(``);
  lines.push(`- **Store Type:** ${bundle.sourceProvenance.storeType}`);
  lines.push(`- **Persistence Claimed:** ${bundle.sourceProvenance.persistenceClaimed}`);
  lines.push(`- **Generated By:** ${bundle.sourceProvenance.generatedByService}`);
  lines.push(`- **Schema Version:** ${bundle.sourceProvenance.schemaVersion}`);
  lines.push(``);

  lines.push(`---`);
  lines.push(`*End of evidence bundle.*`);
  lines.push(``);

  return redactString(lines.join('\n'));
}
