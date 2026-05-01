import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function json<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
import type {
  SupportSession as SupportSessionShape,
  TicketReference as TicketReferenceShape,
  AIContextPacket as AIContextPacketShape,
  AuditEvent as AuditEventShape,
  InternalNoteDraft as InternalNoteDraftShape,
  CallEvent as CallEventShape,
  CallRecording as CallRecordingShape,
  ScreenObservation as ScreenObservationShape,
  CustomerReference as CustomerReferenceShape,
  ConnectorInstallation as ConnectorInstallationShape,
  ConnectorCredentialReference as ConnectorCredentialReferenceShape,
  SupportAction as SupportActionShape,
  ActionOutboxItem as ActionOutboxItemShape,
  ActionOutboxAttempt as ActionOutboxAttemptShape,
  DeliveryPolicy as DeliveryPolicyShape,
  ConnectorPolicy as ConnectorPolicyShape,
  AiPolicy as AiPolicyShape,
  RetentionPolicy as RetentionPolicyShape,
  EndpointDevice as EndpointDeviceShape,
  EndpointHeartbeat as EndpointHeartbeatShape,
  EndpointDiagnosticSnapshot as EndpointDiagnosticSnapshotShape,
  EndpointCommand as EndpointCommandShape,
  EndpointCommandResult as EndpointCommandResultShape,
} from '@supportplane/contracts';
import type { Store, SharingStateShape } from './store.interface.js';

function toISO(value: Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

function dateOrNow(value: string | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for PrismaStore');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

@Injectable()
export class PrismaStore implements Store {
  private readonly prisma = createPrismaClient();

  // SupportSession
  async saveSession(session: SupportSessionShape): Promise<void> {
    let assignedUserId = session.assignedUserId ?? null;
    if (assignedUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: assignedUserId } });
      if (!user) assignedUserId = null;
    }
    await this.prisma.supportSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        tenantId: session.tenantId,
        status: session.status,
        priority: session.priority,
        title: session.title,
        description: session.description,
        assignedUserId: assignedUserId,
        linkedTicketIds: session.linkedTicketIds,
        aiContextPacketIds: session.aiContextPacketIds,
        screenObservationIds: session.screenObservationIds,
        callEventIds: session.callEventIds,
        auditEventIds: session.auditEventIds,
        startedAt: dateOrNow(session.startedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        createdAt: dateOrNow(session.createdAt),
        updatedAt: dateOrNow(session.updatedAt),
      },
      update: {
        status: session.status,
        priority: session.priority,
        title: session.title,
        description: session.description,
        assignedUserId: assignedUserId,
        linkedTicketIds: session.linkedTicketIds,
        aiContextPacketIds: session.aiContextPacketIds,
        screenObservationIds: session.screenObservationIds,
        callEventIds: session.callEventIds,
        auditEventIds: session.auditEventIds,
        startedAt: dateOrNow(session.startedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        updatedAt: dateOrNow(session.updatedAt),
      },
    });
  }

  async getSession(tenantId: string, id: string): Promise<SupportSessionShape | undefined> {
    const row = await this.prisma.supportSession.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapSession(row);
  }

  async listSessions(tenantId: string): Promise<SupportSessionShape[]> {
    const rows = await this.prisma.supportSession.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapSession(r));
  }

  private mapSession(row: {
    id: string;
    tenantId: string;
    status: string;
    priority: string;
    title: string;
    description: string | null;
    assignedUserId: string | null;
    linkedTicketIds: string[];
    aiContextPacketIds: string[];
    screenObservationIds: string[];
    callEventIds: string[];
    auditEventIds: string[];
    startedAt: Date;
    endedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SupportSessionShape {
    return {
      id: row.id as SupportSessionShape['id'],
      tenantId: row.tenantId as SupportSessionShape['tenantId'],
      status: row.status as SupportSessionShape['status'],
      priority: row.priority as SupportSessionShape['priority'],
      title: row.title,
      description: row.description ?? undefined,
      assignedUserId: row.assignedUserId ?? undefined,
      linkedTicketIds: row.linkedTicketIds,
      aiContextPacketIds: row.aiContextPacketIds,
      screenObservationIds: row.screenObservationIds,
      callEventIds: row.callEventIds,
      auditEventIds: row.auditEventIds,
      startedAt: toISO(row.startedAt)!,
      endedAt: toISO(row.endedAt),
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  // TicketReference
  async saveTicketReference(sessionId: string, ticket: TicketReferenceShape): Promise<void> {
    await this.prisma.ticketReference.upsert({
      where: {
        tenantId_adapterId_externalTicketId: {
          tenantId: ticket.tenantId,
          adapterId: ticket.adapterId,
          externalTicketId: ticket.externalTicketId,
        },
      },
      create: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        adapterId: ticket.adapterId,
        externalTicketId: ticket.externalTicketId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customerEmail: ticket.customerEmail,
        customerName: ticket.customerName,
        rawData: ticket.rawData ? json(ticket.rawData) : undefined,
        lastSyncedAt: dateOrNow(ticket.lastSyncedAt),
        createdAt: dateOrNow(ticket.createdAt),
        updatedAt: dateOrNow(ticket.updatedAt),
      },
      update: {
        adapterId: ticket.adapterId,
        externalTicketId: ticket.externalTicketId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customerEmail: ticket.customerEmail,
        customerName: ticket.customerName,
        rawData: ticket.rawData ? json(ticket.rawData) : undefined,
        lastSyncedAt: dateOrNow(ticket.lastSyncedAt),
        updatedAt: dateOrNow(ticket.updatedAt),
      },
    });
  }

  async getTicketReferences(tenantId: string, _sessionId: string): Promise<TicketReferenceShape[]> {
    // Original in-memory used sessionId as a composite key for a map of arrays.
    // For PostgreSQL we query by tenant since session linkage is via linkedTicketIds on the session.
    // To preserve semantics, we look up the session to get its linkedTicketIds, then fetch those tickets.
    const session = await this.prisma.supportSession.findFirst({
      where: { id: _sessionId, tenantId },
      select: { linkedTicketIds: true },
    });
    if (!session || session.linkedTicketIds.length === 0) return [];
    const rows = await this.prisma.ticketReference.findMany({
      where: { tenantId, id: { in: session.linkedTicketIds } },
    });
    return rows.map((r) => this.mapTicketReference(r));
  }

  async listAllTicketReferences(tenantId: string): Promise<TicketReferenceShape[]> {
    const rows = await this.prisma.ticketReference.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapTicketReference(r));
  }

  private mapTicketReference(row: {
    id: string;
    tenantId: string;
    adapterId: string;
    externalTicketId: string;
    subject: string;
    status: string;
    priority: string;
    customerEmail: string | null;
    customerName: string | null;
    rawData: unknown;
    lastSyncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): TicketReferenceShape {
    return {
      id: row.id as TicketReferenceShape['id'],
      tenantId: row.tenantId as TicketReferenceShape['tenantId'],
      adapterId: row.adapterId as TicketReferenceShape['adapterId'],
      externalTicketId: row.externalTicketId,
      subject: row.subject,
      status: row.status as TicketReferenceShape['status'],
      priority: row.priority as TicketReferenceShape['priority'],
      customerEmail: row.customerEmail ?? undefined,
      customerName: row.customerName ?? undefined,
      rawData: row.rawData as Record<string, unknown> | undefined,
      lastSyncedAt: toISO(row.lastSyncedAt)!,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  // AIContextPacket
  async saveContextPacket(packet: AIContextPacketShape): Promise<void> {
    await this.prisma.aIContextPacket.create({
      data: {
        id: packet.id,
        tenantId: packet.tenantId,
        sessionId: packet.sessionId,
        provenance: packet.provenance,
        sourceTicketIds: packet.sourceTicketIds,
        sourceAdapterId: packet.sourceAdapterId,
        payload: packet.payload,
        redactionLog: json(packet.redactionLog),
        contextHash: packet.contextHash,
        modelPolicySnapshotId: packet.modelPolicySnapshotId,
        createdAt: dateOrNow(packet.createdAt),
      },
    });
  }

  async getContextPackets(tenantId: string, sessionId: string): Promise<AIContextPacketShape[]> {
    const rows = await this.prisma.aIContextPacket.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapContextPacket(r));
  }

  private mapContextPacket(row: {
    id: string;
    tenantId: string;
    sessionId: string;
    provenance: string;
    sourceTicketIds: string[];
    sourceAdapterId: string | null;
    payload: unknown;
    redactionLog: unknown;
    contextHash: string | null;
    modelPolicySnapshotId: string | null;
    createdAt: Date;
  }): AIContextPacketShape {
    return {
      id: row.id as AIContextPacketShape['id'],
      tenantId: row.tenantId as AIContextPacketShape['tenantId'],
      sessionId: row.sessionId,
      provenance: row.provenance as AIContextPacketShape['provenance'],
      sourceTicketIds: row.sourceTicketIds,
      sourceAdapterId: row.sourceAdapterId ?? undefined,
      payload: row.payload as Record<string, unknown>,
      redactionLog: (row.redactionLog as unknown as AIContextPacketShape['redactionLog']) ?? [],
      contextHash: row.contextHash ?? undefined,
      modelPolicySnapshotId: row.modelPolicySnapshotId ?? undefined,
      createdAt: toISO(row.createdAt)!,
    };
  }

  // AuditEvent
  async saveAuditEvent(event: AuditEventShape): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        id: event.id,
        tenantId: event.tenantId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        actorType: event.actorType,
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        metadata: json(event.metadata),
        hashChainPrevious: event.hashChainPrevious,
        integrityHash: event.integrityHash,
        createdAt: dateOrNow(event.createdAt),
      },
    });
  }

  async getAuditEvents(tenantId: string, sessionId: string): Promise<AuditEventShape[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapAuditEvent(r));
  }

  async getAllAuditEvents(tenantId: string): Promise<AuditEventShape[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapAuditEvent(r));
  }

  private mapAuditEvent(row: {
    id: string;
    tenantId: string;
    sessionId: string | null;
    eventType: string;
    actorType: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: unknown;
    hashChainPrevious: string | null;
    integrityHash: string | null;
    createdAt: Date;
  }): AuditEventShape {
    return {
      id: row.id as AuditEventShape['id'],
      tenantId: row.tenantId as AuditEventShape['tenantId'],
      sessionId: row.sessionId ?? undefined,
      eventType: row.eventType as AuditEventShape['eventType'],
      actorType: row.actorType as AuditEventShape['actorType'],
      actorId: row.actorId,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      metadata: row.metadata as Record<string, unknown>,
      hashChainPrevious: row.hashChainPrevious ?? undefined,
      integrityHash: row.integrityHash ?? undefined,
      createdAt: toISO(row.createdAt)!,
    };
  }

  // InternalNoteDraft
  async saveInternalNoteDraft(draft: InternalNoteDraftShape): Promise<void> {
    await this.prisma.internalNoteDraft.upsert({
      where: { id: draft.id },
      create: {
        id: draft.id,
        tenantId: draft.tenantId,
        sessionId: draft.sessionId,
        externalTicketId: draft.externalTicketId,
        subject: draft.subject,
        body: draft.body,
        reviewed: draft.reviewed,
        reviewerId: draft.reviewerId,
        createdAt: dateOrNow(draft.createdAt),
      },
      update: {
        externalTicketId: draft.externalTicketId,
        subject: draft.subject,
        body: draft.body,
        reviewed: draft.reviewed,
        reviewerId: draft.reviewerId,
      },
    });
  }

  async getInternalNoteDraft(tenantId: string, draftId: string): Promise<InternalNoteDraftShape | undefined> {
    const row = await this.prisma.internalNoteDraft.findFirst({
      where: { id: draftId, tenantId },
    });
    if (!row) return undefined;
    return this.mapInternalNoteDraft(row);
  }

  async listInternalNoteDrafts(tenantId: string, sessionId: string): Promise<InternalNoteDraftShape[]> {
    const rows = await this.prisma.internalNoteDraft.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapInternalNoteDraft(r));
  }

  private mapInternalNoteDraft(row: {
    id: string;
    tenantId: string;
    sessionId: string;
    externalTicketId: string;
    subject: string | null;
    body: string;
    reviewed: boolean;
    reviewerId: string | null;
    createdAt: Date;
  }): InternalNoteDraftShape {
    return {
      id: row.id as InternalNoteDraftShape['id'],
      tenantId: row.tenantId as InternalNoteDraftShape['tenantId'],
      sessionId: row.sessionId,
      externalTicketId: row.externalTicketId,
      subject: row.subject ?? undefined,
      body: row.body,
      reviewed: row.reviewed,
      reviewerId: row.reviewerId ?? undefined,
      createdAt: toISO(row.createdAt)!,
    };
  }

  // CallEvent
  async saveCallEvent(event: CallEventShape): Promise<void> {
    await this.prisma.callEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        tenantId: event.tenantId,
        sessionId: event.sessionId,
        provider: event.provider,
        source: event.source,
        externalCallId: event.externalCallId,
        direction: event.direction,
        status: event.status,
        caller: json(event.caller),
        callerMatch: event.callerMatch ? json(event.callerMatch) : undefined,
        startedAt: dateOrNow(event.startedAt),
        endedAt: event.endedAt ? new Date(event.endedAt) : null,
        answeredAt: event.answeredAt ? new Date(event.answeredAt) : null,
        metadata: json(event.metadata),
        mockDevOnly: event.mockDevOnly,
        createdAt: dateOrNow(event.createdAt),
        updatedAt: dateOrNow(event.updatedAt),
      },
      update: {
        sessionId: event.sessionId,
        provider: event.provider,
        source: event.source,
        externalCallId: event.externalCallId,
        direction: event.direction,
        status: event.status,
        caller: json(event.caller),
        callerMatch: event.callerMatch ? json(event.callerMatch) : undefined,
        startedAt: dateOrNow(event.startedAt),
        endedAt: event.endedAt ? new Date(event.endedAt) : null,
        answeredAt: event.answeredAt ? new Date(event.answeredAt) : null,
        metadata: json(event.metadata),
        mockDevOnly: event.mockDevOnly,
        updatedAt: dateOrNow(event.updatedAt),
      },
    });
  }

  async getCallEvent(tenantId: string, id: string): Promise<CallEventShape | undefined> {
    const row = await this.prisma.callEvent.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapCallEvent(row);
  }

  async listCallEvents(tenantId: string): Promise<CallEventShape[]> {
    const rows = await this.prisma.callEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapCallEvent(r));
  }

  async listCallEventsForSession(tenantId: string, sessionId: string): Promise<CallEventShape[]> {
    const rows = await this.prisma.callEvent.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapCallEvent(r));
  }

  private mapCallEvent(row: {
    id: string;
    tenantId: string;
    sessionId: string | null;
    provider: string;
    source: string;
    externalCallId: string;
    direction: string;
    status: string;
    caller: unknown;
    callerMatch: unknown;
    startedAt: Date;
    endedAt: Date | null;
    answeredAt: Date | null;
    metadata: unknown;
    mockDevOnly: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CallEventShape {
    return {
      id: row.id as CallEventShape['id'],
      tenantId: row.tenantId as CallEventShape['tenantId'],
      sessionId: row.sessionId ?? undefined,
      provider: row.provider,
      source: row.source,
      externalCallId: row.externalCallId,
      direction: row.direction as CallEventShape['direction'],
      status: row.status as CallEventShape['status'],
      caller: row.caller as CallEventShape['caller'],
      callerMatch: row.callerMatch as CallEventShape['callerMatch'] | undefined,
      startedAt: toISO(row.startedAt)!,
      endedAt: toISO(row.endedAt),
      answeredAt: toISO(row.answeredAt),
      metadata: row.metadata as Record<string, unknown>,
      mockDevOnly: row.mockDevOnly,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  // CallRecording
  async saveCallRecording(recording: CallRecordingShape): Promise<void> {
    await this.prisma.callRecording.upsert({
      where: { id: recording.id },
      create: {
        id: recording.id,
        tenantId: recording.tenantId,
        callEventId: recording.callEventId,
        supportSessionId: recording.supportSessionId,
        source: recording.source,
        status: recording.status,
        durationSeconds: recording.durationSeconds ?? null,
        mockMediaUrl: recording.mockMediaUrl ?? null,
        placeholderReference: recording.placeholderReference ?? null,
        storageType: recording.storageType,
        checksumHash: recording.checksumHash ?? null,
        reviewedAt: recording.reviewedAt ? new Date(recording.reviewedAt) : null,
        reviewedBy: recording.reviewedBy ?? null,
        updatedAt: recording.updatedAt ? new Date(recording.updatedAt) : null,
        mockDevOnly: recording.mockDevOnly,
        complianceDisclaimer: recording.complianceDisclaimer ?? null,
        noRealAudio: recording.noRealAudio,
        createdAt: dateOrNow(recording.createdAt),
      },
      update: {
        callEventId: recording.callEventId,
        supportSessionId: recording.supportSessionId,
        source: recording.source,
        status: recording.status,
        durationSeconds: recording.durationSeconds ?? null,
        mockMediaUrl: recording.mockMediaUrl ?? null,
        placeholderReference: recording.placeholderReference ?? null,
        storageType: recording.storageType,
        checksumHash: recording.checksumHash ?? null,
        reviewedAt: recording.reviewedAt ? new Date(recording.reviewedAt) : null,
        reviewedBy: recording.reviewedBy ?? null,
        updatedAt: recording.updatedAt ? new Date(recording.updatedAt) : null,
        mockDevOnly: recording.mockDevOnly,
        complianceDisclaimer: recording.complianceDisclaimer ?? null,
        noRealAudio: recording.noRealAudio,
      },
    });
  }

  async getCallRecording(tenantId: string, id: string): Promise<CallRecordingShape | undefined> {
    const row = await this.prisma.callRecording.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapCallRecording(row);
  }

  async listCallRecordings(tenantId: string, callEventId: string): Promise<CallRecordingShape[]> {
    const rows = await this.prisma.callRecording.findMany({
      where: { tenantId, callEventId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapCallRecording(r));
  }

  private mapCallRecording(row: {
    id: string;
    tenantId: string;
    callEventId: string;
    supportSessionId: string | null;
    source: string;
    status: string;
    durationSeconds: number | null;
    mockMediaUrl: string | null;
    placeholderReference: string | null;
    storageType: string;
    checksumHash: string | null;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    updatedAt: Date | null;
    mockDevOnly: boolean;
    complianceDisclaimer: string | null;
    noRealAudio: boolean;
    createdAt: Date;
  }): CallRecordingShape {
    return {
      id: row.id as CallRecordingShape['id'],
      tenantId: row.tenantId as CallRecordingShape['tenantId'],
      callEventId: row.callEventId,
      supportSessionId: row.supportSessionId ?? undefined,
      source: row.source as CallRecordingShape['source'],
      status: row.status as CallRecordingShape['status'],
      durationSeconds: row.durationSeconds ?? undefined,
      mockMediaUrl: row.mockMediaUrl ?? undefined,
      placeholderReference: row.placeholderReference ?? undefined,
      storageType: row.storageType as CallRecordingShape['storageType'],
      checksumHash: row.checksumHash ?? undefined,
      reviewedAt: toISO(row.reviewedAt),
      reviewedBy: row.reviewedBy ?? undefined,
      updatedAt: toISO(row.updatedAt),
      mockDevOnly: row.mockDevOnly,
      complianceDisclaimer: row.complianceDisclaimer ?? undefined,
      noRealAudio: row.noRealAudio,
      createdAt: toISO(row.createdAt)!,
    };
  }

  // ScreenObservation
  async saveScreenObservation(observation: ScreenObservationShape): Promise<void> {
    await this.prisma.screenObservation.upsert({
      where: { id: observation.id },
      create: {
        id: observation.id,
        tenantId: observation.tenantId,
        sessionId: observation.sessionId,
        callEventId: observation.callEventId ?? null,
        source: observation.source,
        kind: observation.kind,
        status: observation.status,
        rawInputPlaceholder: observation.rawInputPlaceholder ?? null,
        redactedSummary: observation.redactedSummary ?? null,
        appLabel: observation.appLabel ?? null,
        windowLabel: observation.windowLabel ?? null,
        urlLabel: observation.urlLabel ?? null,
        sharingState: observation.sharingState,
        rawImageRetention: observation.rawImageRetention,
        redactionStatus: observation.redactionStatus,
        safetyFlags: json(observation.safetyFlags),
        noRawPixels: observation.noRawPixels,
        noClipboard: observation.noClipboard,
        noOcr: observation.noOcr,
        noCredentialCapture: observation.noCredentialCapture,
        mockDevOnly: observation.mockDevOnly,
        reviewedAt: observation.reviewedAt ? new Date(observation.reviewedAt) : null,
        reviewedBy: observation.reviewedBy ?? null,
        contextPacketId: observation.contextPacketId ?? null,
        createdAt: dateOrNow(observation.createdAt),
      },
      update: {
        sessionId: observation.sessionId,
        callEventId: observation.callEventId ?? null,
        source: observation.source,
        kind: observation.kind,
        status: observation.status,
        rawInputPlaceholder: observation.rawInputPlaceholder ?? null,
        redactedSummary: observation.redactedSummary ?? null,
        appLabel: observation.appLabel ?? null,
        windowLabel: observation.windowLabel ?? null,
        urlLabel: observation.urlLabel ?? null,
        sharingState: observation.sharingState,
        rawImageRetention: observation.rawImageRetention,
        redactionStatus: observation.redactionStatus,
        safetyFlags: json(observation.safetyFlags),
        noRawPixels: observation.noRawPixels,
        noClipboard: observation.noClipboard,
        noOcr: observation.noOcr,
        noCredentialCapture: observation.noCredentialCapture,
        mockDevOnly: observation.mockDevOnly,
        reviewedAt: observation.reviewedAt ? new Date(observation.reviewedAt) : null,
        reviewedBy: observation.reviewedBy ?? null,
        contextPacketId: observation.contextPacketId ?? null,
      },
    });
  }

  async getScreenObservation(tenantId: string, id: string): Promise<ScreenObservationShape | undefined> {
    const row = await this.prisma.screenObservation.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapScreenObservation(row);
  }

  async listScreenObservations(tenantId: string, sessionId: string): Promise<ScreenObservationShape[]> {
    const rows = await this.prisma.screenObservation.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapScreenObservation(r));
  }

  async listScreenObservationsForCallEvent(tenantId: string, callEventId: string): Promise<ScreenObservationShape[]> {
    const rows = await this.prisma.screenObservation.findMany({
      where: { tenantId, callEventId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapScreenObservation(r));
  }

  private mapScreenObservation(row: {
    id: string;
    tenantId: string;
    sessionId: string;
    callEventId: string | null;
    source: string;
    kind: string;
    status: string;
    rawInputPlaceholder: string | null;
    redactedSummary: string | null;
    appLabel: string | null;
    windowLabel: string | null;
    urlLabel: string | null;
    sharingState: string;
    rawImageRetention: string;
    redactionStatus: string;
    safetyFlags: unknown;
    noRawPixels: boolean;
    noClipboard: boolean;
    noOcr: boolean;
    noCredentialCapture: boolean;
    mockDevOnly: boolean;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    contextPacketId: string | null;
    createdAt: Date;
  }): ScreenObservationShape {
    return {
      id: row.id as ScreenObservationShape['id'],
      tenantId: row.tenantId as ScreenObservationShape['tenantId'],
      sessionId: row.sessionId,
      callEventId: row.callEventId ?? undefined,
      source: row.source as ScreenObservationShape['source'],
      kind: row.kind as ScreenObservationShape['kind'],
      status: row.status as ScreenObservationShape['status'],
      rawInputPlaceholder: row.rawInputPlaceholder ?? undefined,
      redactedSummary: row.redactedSummary ?? undefined,
      appLabel: row.appLabel ?? undefined,
      windowLabel: row.windowLabel ?? undefined,
      urlLabel: row.urlLabel ?? undefined,
      sharingState: row.sharingState as ScreenObservationShape['sharingState'],
      rawImageRetention: row.rawImageRetention as ScreenObservationShape['rawImageRetention'],
      redactionStatus: row.redactionStatus as ScreenObservationShape['redactionStatus'],
      safetyFlags: row.safetyFlags as ScreenObservationShape['safetyFlags'],
      noRawPixels: row.noRawPixels,
      noClipboard: row.noClipboard,
      noOcr: row.noOcr,
      noCredentialCapture: row.noCredentialCapture,
      mockDevOnly: row.mockDevOnly,
      createdAt: toISO(row.createdAt)!,
      reviewedAt: toISO(row.reviewedAt),
      reviewedBy: row.reviewedBy ?? undefined,
      contextPacketId: row.contextPacketId ?? undefined,
    };
  }

  // SharingState
  async getSharingState(tenantId: string, sessionId: string): Promise<SharingStateShape | undefined> {
    const row = await this.prisma.sharingState.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
    });
    if (!row) return undefined;
    return {
      tenantId: row.tenantId,
      sessionId: row.sessionId,
      state: row.state as SharingStateShape['state'],
      mockDevOnly: row.mockDevOnly,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  async saveSharingState(state: SharingStateShape): Promise<void> {
    await this.prisma.sharingState.upsert({
      where: { tenantId_sessionId: { tenantId: state.tenantId, sessionId: state.sessionId } },
      create: {
        tenantId: state.tenantId,
        sessionId: state.sessionId,
        state: state.state,
        mockDevOnly: state.mockDevOnly,
        createdAt: dateOrNow(state.createdAt),
        updatedAt: dateOrNow(state.updatedAt),
      },
      update: {
        state: state.state,
        mockDevOnly: state.mockDevOnly,
        updatedAt: dateOrNow(state.updatedAt),
      },
    });
  }

  // CustomerReference
  async saveCustomerReference(customer: CustomerReferenceShape): Promise<void> {
    await this.prisma.customerReference.upsert({
      where: { id: customer.id },
      create: {
        id: customer.id,
        tenantId: customer.tenantId,
        adapterId: customer.adapterId,
        externalCustomerId: customer.externalCustomerId,
        name: customer.name ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        company: customer.company ?? null,
        rawData: customer.rawData ? json(customer.rawData) : undefined,
        lastSyncedAt: dateOrNow(customer.lastSyncedAt),
        createdAt: dateOrNow(customer.createdAt),
        updatedAt: dateOrNow(customer.updatedAt),
      },
      update: {
        adapterId: customer.adapterId,
        externalCustomerId: customer.externalCustomerId,
        name: customer.name ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        company: customer.company ?? null,
        rawData: customer.rawData ? json(customer.rawData) : undefined,
        lastSyncedAt: dateOrNow(customer.lastSyncedAt),
        updatedAt: dateOrNow(customer.updatedAt),
      },
    });
  }

  async getCustomerReference(tenantId: string, id: string): Promise<CustomerReferenceShape | undefined> {
    const row = await this.prisma.customerReference.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapCustomerReference(row);
  }

  async listCustomerReferences(tenantId: string, options?: { email?: string; phone?: string; adapterId?: string }): Promise<CustomerReferenceShape[]> {
    const where: Prisma.CustomerReferenceWhereInput = { tenantId };
    if (options?.email) where.email = { equals: options.email, mode: 'insensitive' };
    if (options?.phone) where.phone = options.phone;
    if (options?.adapterId) where.adapterId = options.adapterId;
    const rows = await this.prisma.customerReference.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return rows.map((r) => this.mapCustomerReference(r));
  }

  private mapCustomerReference(row: {
    id: string;
    tenantId: string;
    adapterId: string;
    externalCustomerId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    rawData: unknown;
    lastSyncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerReferenceShape {
    return {
      id: row.id as CustomerReferenceShape['id'],
      tenantId: row.tenantId as CustomerReferenceShape['tenantId'],
      adapterId: row.adapterId as CustomerReferenceShape['adapterId'],
      externalCustomerId: row.externalCustomerId,
      name: row.name ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      company: row.company ?? undefined,
      rawData: row.rawData as Record<string, unknown> | undefined,
      lastSyncedAt: toISO(row.lastSyncedAt)!,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  // ConnectorInstallation
  async saveConnectorInstallation(installation: ConnectorInstallationShape): Promise<void> {
    await this.prisma.connectorInstallation.upsert({
      where: { id: installation.id },
      create: {
        id: installation.id,
        tenantId: installation.tenantId,
        name: installation.name,
        displayName: installation.displayName ?? null,
        description: installation.description ?? null,
        adapterType: installation.adapterType,
        capabilities: installation.capabilities,
        config: json(installation.config),
        secretReferenceIds: installation.secretReferenceIds,
        status: installation.status,
        mockMode: installation.mockMode,
        enabled: installation.enabled,
        safetyFlags: json(installation.safetyFlags),
        timeoutMs: installation.timeoutMs ?? null,
        lastVerifiedAt: installation.lastVerifiedAt ? new Date(installation.lastVerifiedAt) : null,
        lastError: installation.lastError ?? null,
        createdAt: dateOrNow(installation.createdAt),
        updatedAt: dateOrNow(installation.updatedAt),
      },
      update: {
        name: installation.name,
        displayName: installation.displayName ?? null,
        description: installation.description ?? null,
        adapterType: installation.adapterType,
        capabilities: installation.capabilities,
        config: json(installation.config),
        secretReferenceIds: installation.secretReferenceIds,
        status: installation.status,
        mockMode: installation.mockMode,
        enabled: installation.enabled,
        safetyFlags: json(installation.safetyFlags),
        timeoutMs: installation.timeoutMs ?? null,
        lastVerifiedAt: installation.lastVerifiedAt ? new Date(installation.lastVerifiedAt) : null,
        lastError: installation.lastError ?? null,
        updatedAt: dateOrNow(installation.updatedAt),
      },
    });
  }

  async getConnectorInstallation(tenantId: string, id: string): Promise<ConnectorInstallationShape | undefined> {
    const row = await this.prisma.connectorInstallation.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapConnectorInstallation(row);
  }

  async listConnectorInstallations(tenantId: string): Promise<ConnectorInstallationShape[]> {
    const rows = await this.prisma.connectorInstallation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapConnectorInstallation(r));
  }

  // ConnectorCredentialReference
  async saveCredentialReference(ref: ConnectorCredentialReferenceShape): Promise<void> {
    await this.prisma.connectorCredentialReference.upsert({
      where: { id: ref.id },
      create: {
        id: ref.id,
        tenantId: ref.tenantId,
        connectorType: ref.connectorType,
        displayName: ref.displayName,
        description: ref.description ?? null,
        status: ref.status,
        secretKind: ref.secretKind,
        secretRef: ref.secretRef,
        lastValidatedAt: ref.lastValidatedAt ? new Date(ref.lastValidatedAt) : null,
        createdByUserId: ref.createdByUserId ?? null,
        updatedByUserId: ref.updatedByUserId ?? null,
        createdAt: dateOrNow(ref.createdAt),
        updatedAt: dateOrNow(ref.updatedAt),
      },
      update: {
        connectorType: ref.connectorType,
        displayName: ref.displayName,
        description: ref.description ?? null,
        status: ref.status,
        secretKind: ref.secretKind,
        secretRef: ref.secretRef,
        lastValidatedAt: ref.lastValidatedAt ? new Date(ref.lastValidatedAt) : null,
        updatedByUserId: ref.updatedByUserId ?? null,
        updatedAt: dateOrNow(ref.updatedAt),
      },
    });
  }

  async getCredentialReference(tenantId: string, id: string): Promise<ConnectorCredentialReferenceShape | undefined> {
    const row = await this.prisma.connectorCredentialReference.findFirst({
      where: { id, tenantId },
    });
    if (!row) return undefined;
    return this.mapCredentialReference(row);
  }

  async listCredentialReferences(tenantId: string, options?: { connectorType?: string }): Promise<ConnectorCredentialReferenceShape[]> {
    const where: Prisma.ConnectorCredentialReferenceWhereInput = { tenantId };
    if (options?.connectorType) where.connectorType = options.connectorType;
    const rows = await this.prisma.connectorCredentialReference.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapCredentialReference(r));
  }

  private mapCredentialReference(row: {
    id: string;
    tenantId: string;
    connectorType: string;
    displayName: string;
    description: string | null;
    status: string;
    secretKind: string;
    secretRef: string;
    lastValidatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdByUserId: string | null;
    updatedByUserId: string | null;
  }): ConnectorCredentialReferenceShape {
    return {
      id: row.id as ConnectorCredentialReferenceShape['id'],
      tenantId: row.tenantId as ConnectorCredentialReferenceShape['tenantId'],
      connectorType: row.connectorType,
      displayName: row.displayName,
      description: row.description ?? undefined,
      status: row.status as ConnectorCredentialReferenceShape['status'],
      secretKind: row.secretKind as ConnectorCredentialReferenceShape['secretKind'],
      secretRef: row.secretRef,
      lastValidatedAt: toISO(row.lastValidatedAt),
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
      createdByUserId: row.createdByUserId ?? undefined,
      updatedByUserId: row.updatedByUserId ?? undefined,
    };
  }

  private mapConnectorInstallation(row: {
    id: string;
    tenantId: string;
    name: string;
    displayName: string | null;
    description: string | null;
    adapterType: string;
    capabilities: string[];
    config: unknown;
    secretReferenceIds: string[];
    status: string;
    mockMode: boolean;
    enabled: boolean;
    safetyFlags: unknown;
    timeoutMs: number | null;
    lastVerifiedAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ConnectorInstallationShape {
    return {
      id: row.id as ConnectorInstallationShape['id'],
      tenantId: row.tenantId as ConnectorInstallationShape['tenantId'],
      name: row.name,
      displayName: row.displayName ?? undefined,
      description: row.description ?? undefined,
      adapterType: row.adapterType,
      capabilities: row.capabilities,
      config: row.config as Record<string, unknown>,
      secretReferenceIds: row.secretReferenceIds,
      status: row.status as ConnectorInstallationShape['status'],
      mockMode: row.mockMode,
      enabled: row.enabled,
      safetyFlags: row.safetyFlags as Record<string, unknown>,
      timeoutMs: row.timeoutMs ?? undefined,
      lastVerifiedAt: toISO(row.lastVerifiedAt),
      lastError: row.lastError ?? undefined,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  async saveSupportAction(action: SupportActionShape): Promise<void> {
    await this.prisma.supportAction.upsert({
      where: { id: action.id },
      create: {
        id: action.id,
        tenantId: action.tenantId,
        sessionId: action.sessionId,
        callEventId: action.callEventId ?? null,
        customerReferenceId: action.customerReferenceId ?? null,
        ticketReferenceId: action.ticketReferenceId ?? null,
        connectorInstallationId: action.connectorInstallationId ?? null,
        actionType: action.actionType,
        status: action.status,
        idempotencyKey: action.idempotencyKey,
        requestedBy: action.requestedBy,
        submittedAt: action.submittedAt ? new Date(action.submittedAt) : null,
        reviewedBy: action.reviewedBy ?? null,
        reviewDecision: action.reviewDecision ?? null,
        reviewReason: action.reviewReason ?? null,
        reviewedAt: action.reviewedAt ? new Date(action.reviewedAt) : null,
        queuedAt: action.queuedAt ? new Date(action.queuedAt) : null,
        mockDeliveredAt: action.mockDeliveredAt ? new Date(action.mockDeliveredAt) : null,
        failureReason: action.failureReason ?? null,
        payloadSummary: json(action.payloadSummary),
        safeBodyPreview: action.safeBodyPreview ?? null,
        mockDevOnly: action.mockDevOnly,
        createdAt: dateOrNow(action.createdAt),
        updatedAt: dateOrNow(action.updatedAt),
      },
      update: {
        status: action.status,
        submittedAt: action.submittedAt ? new Date(action.submittedAt) : null,
        reviewedBy: action.reviewedBy ?? null,
        reviewDecision: action.reviewDecision ?? null,
        reviewReason: action.reviewReason ?? null,
        reviewedAt: action.reviewedAt ? new Date(action.reviewedAt) : null,
        queuedAt: action.queuedAt ? new Date(action.queuedAt) : null,
        mockDeliveredAt: action.mockDeliveredAt ? new Date(action.mockDeliveredAt) : null,
        failureReason: action.failureReason ?? null,
        payloadSummary: json(action.payloadSummary),
        safeBodyPreview: action.safeBodyPreview ?? null,
        updatedAt: dateOrNow(action.updatedAt),
      },
    });
  }

  async getSupportAction(tenantId: string, id: string): Promise<SupportActionShape | undefined> {
    const row = await this.prisma.supportAction.findFirst({ where: { tenantId, id } });
    return row ? this.mapSupportAction(row) : undefined;
  }

  async listSupportActions(tenantId: string, options?: { sessionId?: string }): Promise<SupportActionShape[]> {
    const rows = await this.prisma.supportAction.findMany({
      where: { tenantId, ...(options?.sessionId ? { sessionId: options.sessionId } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapSupportAction(r));
  }

  private mapSupportAction(row: {
    id: string; tenantId: string; sessionId: string; callEventId: string | null; customerReferenceId: string | null;
    ticketReferenceId: string | null; connectorInstallationId: string | null; actionType: string; status: string;
    idempotencyKey: string; requestedBy: string; submittedAt: Date | null; reviewedBy: string | null;
    reviewDecision: string | null; reviewReason: string | null; reviewedAt: Date | null; queuedAt: Date | null;
    mockDeliveredAt: Date | null; failureReason: string | null; payloadSummary: unknown; safeBodyPreview: string | null;
    mockDevOnly: boolean; createdAt: Date; updatedAt: Date;
  }): SupportActionShape {
    return {
      id: row.id as SupportActionShape['id'],
      tenantId: row.tenantId as SupportActionShape['tenantId'],
      sessionId: row.sessionId,
      callEventId: row.callEventId ?? undefined,
      customerReferenceId: row.customerReferenceId ?? undefined,
      ticketReferenceId: row.ticketReferenceId ?? undefined,
      connectorInstallationId: row.connectorInstallationId ?? undefined,
      actionType: row.actionType as SupportActionShape['actionType'],
      status: row.status as SupportActionShape['status'],
      idempotencyKey: row.idempotencyKey,
      requestedBy: row.requestedBy,
      submittedAt: toISO(row.submittedAt),
      reviewedBy: row.reviewedBy ?? undefined,
      reviewDecision: row.reviewDecision as SupportActionShape['reviewDecision'],
      reviewReason: row.reviewReason ?? undefined,
      reviewedAt: toISO(row.reviewedAt),
      queuedAt: toISO(row.queuedAt),
      mockDeliveredAt: toISO(row.mockDeliveredAt),
      failureReason: row.failureReason ?? undefined,
      payloadSummary: row.payloadSummary as Record<string, unknown>,
      safeBodyPreview: row.safeBodyPreview ?? undefined,
      mockDevOnly: row.mockDevOnly,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  async saveActionOutboxItem(item: ActionOutboxItemShape): Promise<void> {
    await this.prisma.actionOutboxItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        tenantId: item.tenantId,
        supportActionId: item.supportActionId,
        sessionId: item.sessionId,
        connectorInstallationId: item.connectorInstallationId ?? null,
        actionType: item.actionType,
        status: item.status,
        idempotencyKey: item.idempotencyKey,
        deliveryMode: item.deliveryMode,
        deliveryIntent: json(item.deliveryIntent),
        attemptCount: item.attemptCount,
        maxAttempts: item.maxAttempts,
        latestAttemptState: item.latestAttemptState ?? null,
        queuedAt: dateOrNow(item.queuedAt),
        nextAttemptAt: item.nextAttemptAt ? new Date(item.nextAttemptAt) : null,
        processingStartedAt: item.processingStartedAt ? new Date(item.processingStartedAt) : null,
        workerLockId: item.workerLockId ?? null,
        workerLockedAt: item.workerLockedAt ? new Date(item.workerLockedAt) : null,
        workerLockExpiresAt: item.workerLockExpiresAt ? new Date(item.workerLockExpiresAt) : null,
        mockDeliveredAt: item.mockDeliveredAt ? new Date(item.mockDeliveredAt) : null,
        failedAt: item.failedAt ? new Date(item.failedAt) : null,
        retryScheduledAt: item.retryScheduledAt ? new Date(item.retryScheduledAt) : null,
        deadLetteredAt: item.deadLetteredAt ? new Date(item.deadLetteredAt) : null,
        cancelledAt: item.cancelledAt ? new Date(item.cancelledAt) : null,
        lastError: item.lastError ?? null,
        lastErrorCode: item.lastErrorCode ?? null,
        lastErrorMessage: item.lastErrorMessage ?? null,
        lastErrorRedacted: item.lastErrorRedacted,
        deadLetterReason: item.deadLetterReason ?? null,
        safetyFlags: json(item.safetyFlags),
        mockDevOnly: item.mockDevOnly,
        createdAt: dateOrNow(item.createdAt),
        updatedAt: dateOrNow(item.updatedAt),
      },
      update: {
        status: item.status,
        deliveryMode: item.deliveryMode,
        deliveryIntent: json(item.deliveryIntent),
        attemptCount: item.attemptCount,
        maxAttempts: item.maxAttempts,
        latestAttemptState: item.latestAttemptState ?? null,
        nextAttemptAt: item.nextAttemptAt ? new Date(item.nextAttemptAt) : null,
        processingStartedAt: item.processingStartedAt ? new Date(item.processingStartedAt) : null,
        workerLockId: item.workerLockId ?? null,
        workerLockedAt: item.workerLockedAt ? new Date(item.workerLockedAt) : null,
        workerLockExpiresAt: item.workerLockExpiresAt ? new Date(item.workerLockExpiresAt) : null,
        mockDeliveredAt: item.mockDeliveredAt ? new Date(item.mockDeliveredAt) : null,
        failedAt: item.failedAt ? new Date(item.failedAt) : null,
        retryScheduledAt: item.retryScheduledAt ? new Date(item.retryScheduledAt) : null,
        deadLetteredAt: item.deadLetteredAt ? new Date(item.deadLetteredAt) : null,
        cancelledAt: item.cancelledAt ? new Date(item.cancelledAt) : null,
        lastError: item.lastError ?? null,
        lastErrorCode: item.lastErrorCode ?? null,
        lastErrorMessage: item.lastErrorMessage ?? null,
        lastErrorRedacted: item.lastErrorRedacted,
        deadLetterReason: item.deadLetterReason ?? null,
        safetyFlags: json(item.safetyFlags),
        updatedAt: dateOrNow(item.updatedAt),
      },
    });
  }

  async getActionOutboxItem(tenantId: string, id: string): Promise<ActionOutboxItemShape | undefined> {
    const row = await this.prisma.actionOutboxItem.findFirst({ where: { tenantId, id } });
    return row ? this.mapActionOutboxItem(row) : undefined;
  }

  async listActionOutboxItems(tenantId: string, options?: { sessionId?: string; supportActionId?: string }): Promise<ActionOutboxItemShape[]> {
    const rows = await this.prisma.actionOutboxItem.findMany({
      where: {
        tenantId,
        ...(options?.sessionId ? { sessionId: options.sessionId } : {}),
        ...(options?.supportActionId ? { supportActionId: options.supportActionId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapActionOutboxItem(r));
  }

  async claimNextActionOutboxItem(
    tenantId: string,
    options: { workerId: string; now: string; lockExpiresAt: string; outboxItemId?: string }
  ): Promise<ActionOutboxItemShape | undefined> {
    const now = new Date(options.now);
    const lockExpiresAt = new Date(options.lockExpiresAt);
    const claimed = await this.prisma.$transaction(async (tx) => {
      const candidate = await tx.actionOutboxItem.findFirst({
        where: {
          tenantId,
          ...(options.outboxItemId ? { id: options.outboxItemId } : {}),
          status: { in: ['queued', 'retry_scheduled', 'processing'] },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        orderBy: [{ queuedAt: 'asc' }],
      });
      if (!candidate) return undefined;
      if (candidate.attemptCount >= candidate.maxAttempts) return undefined;
      if (candidate.status === 'processing' && candidate.workerLockExpiresAt && candidate.workerLockExpiresAt > now) {
        return undefined;
      }
      const result = await tx.actionOutboxItem.updateMany({
        where: {
          id: candidate.id,
          tenantId,
          status: candidate.status,
          OR:
            candidate.status === 'processing'
              ? [{ workerLockExpiresAt: null }, { workerLockExpiresAt: { lte: now } }]
              : [{ workerLockExpiresAt: null }, { workerLockExpiresAt: { lte: now } }, { status: { not: 'processing' } }],
        },
        data: {
          status: 'processing',
          latestAttemptState: 'processing',
          processingStartedAt: now,
          workerLockId: options.workerId,
          workerLockedAt: now,
          workerLockExpiresAt: lockExpiresAt,
          updatedAt: now,
        },
      });
      if (result.count !== 1) return undefined;
      return tx.actionOutboxItem.findFirst({ where: { tenantId, id: candidate.id } });
    });
    return claimed ? this.mapActionOutboxItem(claimed) : undefined;
  }

  private mapActionOutboxItem(row: {
    id: string; tenantId: string; supportActionId: string; sessionId: string; connectorInstallationId: string | null;
    actionType: string; status: string; idempotencyKey: string; deliveryMode: string; deliveryIntent: unknown; attemptCount: number;
    maxAttempts: number; latestAttemptState: string | null; queuedAt: Date; nextAttemptAt: Date | null;
    processingStartedAt: Date | null; workerLockId: string | null; workerLockedAt: Date | null; workerLockExpiresAt: Date | null;
    mockDeliveredAt: Date | null; failedAt: Date | null; retryScheduledAt: Date | null; deadLetteredAt: Date | null;
    cancelledAt: Date | null; lastError: string | null; lastErrorCode: string | null; lastErrorMessage: string | null;
    lastErrorRedacted: boolean; deadLetterReason: string | null;
    safetyFlags: unknown; mockDevOnly: boolean; createdAt: Date; updatedAt: Date;
  }): ActionOutboxItemShape {
    return {
      id: row.id as ActionOutboxItemShape['id'],
      tenantId: row.tenantId as ActionOutboxItemShape['tenantId'],
      supportActionId: row.supportActionId,
      sessionId: row.sessionId,
      connectorInstallationId: row.connectorInstallationId ?? undefined,
      actionType: row.actionType as ActionOutboxItemShape['actionType'],
      status: row.status as ActionOutboxItemShape['status'],
      idempotencyKey: row.idempotencyKey,
      deliveryMode: row.deliveryMode as ActionOutboxItemShape['deliveryMode'],
      deliveryIntent: row.deliveryIntent as Record<string, unknown>,
      attemptCount: row.attemptCount,
      maxAttempts: row.maxAttempts,
      latestAttemptState: row.latestAttemptState as ActionOutboxItemShape['latestAttemptState'],
      queuedAt: toISO(row.queuedAt)!,
      nextAttemptAt: toISO(row.nextAttemptAt),
      processingStartedAt: toISO(row.processingStartedAt),
      workerLockId: row.workerLockId ?? undefined,
      workerLockedAt: toISO(row.workerLockedAt),
      workerLockExpiresAt: toISO(row.workerLockExpiresAt),
      mockDeliveredAt: toISO(row.mockDeliveredAt),
      failedAt: toISO(row.failedAt),
      retryScheduledAt: toISO(row.retryScheduledAt),
      deadLetteredAt: toISO(row.deadLetteredAt),
      cancelledAt: toISO(row.cancelledAt),
      lastError: row.lastError ?? undefined,
      lastErrorCode: row.lastErrorCode ?? undefined,
      lastErrorMessage: row.lastErrorMessage ?? undefined,
      lastErrorRedacted: row.lastErrorRedacted,
      deadLetterReason: row.deadLetterReason ?? undefined,
      safetyFlags: row.safetyFlags as ActionOutboxItemShape['safetyFlags'],
      mockDevOnly: row.mockDevOnly,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  async saveActionOutboxAttempt(attempt: ActionOutboxAttemptShape): Promise<void> {
    await this.prisma.actionOutboxAttempt.upsert({
      where: { id: attempt.id },
      create: {
        id: attempt.id,
        tenantId: attempt.tenantId,
        outboxItemId: attempt.outboxItemId,
        supportActionId: attempt.supportActionId,
        attemptNumber: attempt.attemptNumber,
        state: attempt.state,
        deliveryResult: json(attempt.deliveryResult),
        errorCode: attempt.errorCode ?? null,
        errorMessage: attempt.errorMessage ?? null,
        errorRedacted: attempt.errorRedacted,
        attemptedAt: dateOrNow(attempt.attemptedAt),
        completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
        mockDevOnly: attempt.mockDevOnly,
      },
      update: {
        state: attempt.state,
        deliveryResult: json(attempt.deliveryResult),
        errorCode: attempt.errorCode ?? null,
        errorMessage: attempt.errorMessage ?? null,
        errorRedacted: attempt.errorRedacted,
        completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
      },
    });
  }

  async listActionOutboxAttempts(tenantId: string, outboxItemId: string): Promise<ActionOutboxAttemptShape[]> {
    const rows = await this.prisma.actionOutboxAttempt.findMany({
      where: { tenantId, outboxItemId },
      orderBy: { attemptNumber: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id as ActionOutboxAttemptShape['id'],
      tenantId: r.tenantId as ActionOutboxAttemptShape['tenantId'],
      outboxItemId: r.outboxItemId,
      supportActionId: r.supportActionId,
      attemptNumber: r.attemptNumber,
      state: r.state as ActionOutboxAttemptShape['state'],
      deliveryResult: r.deliveryResult as Record<string, unknown>,
      errorCode: r.errorCode ?? undefined,
      errorMessage: r.errorMessage ?? undefined,
      errorRedacted: r.errorRedacted,
      attemptedAt: toISO(r.attemptedAt)!,
      completedAt: toISO(r.completedAt),
      mockDevOnly: r.mockDevOnly,
    }));
  }

  async saveDeliveryPolicy(policy: DeliveryPolicyShape): Promise<void> {
    await this.prisma.deliveryPolicy.upsert({
      where: { id: policy.id },
      create: {
        id: policy.id,
        tenantId: policy.tenantId,
        connectorInstallationId: policy.connectorInstallationId ?? null,
        name: policy.name,
        enabled: policy.enabled,
        killSwitch: policy.killSwitch,
        dryRunRequired: policy.dryRunRequired,
        mockOnlyEnforced: policy.mockOnlyEnforced,
        allowRealNetworkCalls: policy.allowRealNetworkCalls,
        allowedActionTypes: policy.allowedActionTypes,
        approvalRequired: policy.approvalRequired,
        minimumApproverRole: policy.minimumApproverRole,
        requireHumanReview: policy.requireHumanReview,
        requireEvidenceBundleBeforeDelivery: policy.requireEvidenceBundleBeforeDelivery,
        requireConnectorValidationBeforeDelivery: policy.requireConnectorValidationBeforeDelivery,
        retryPolicy: json(policy.retryPolicy),
        deadLetterPolicy: json(policy.deadLetterPolicy),
        updatedBy: policy.updatedBy ?? null,
        policyVersion: policy.policyVersion,
        lastValidationStatus: policy.lastValidationStatus,
        safetyFlags: json(policy.safetyFlags),
        createdAt: dateOrNow(policy.createdAt),
        updatedAt: dateOrNow(policy.updatedAt),
      },
      update: {
        connectorInstallationId: policy.connectorInstallationId ?? null,
        name: policy.name,
        enabled: policy.enabled,
        killSwitch: policy.killSwitch,
        dryRunRequired: policy.dryRunRequired,
        mockOnlyEnforced: policy.mockOnlyEnforced,
        allowRealNetworkCalls: policy.allowRealNetworkCalls,
        allowedActionTypes: policy.allowedActionTypes,
        approvalRequired: policy.approvalRequired,
        minimumApproverRole: policy.minimumApproverRole,
        requireHumanReview: policy.requireHumanReview,
        requireEvidenceBundleBeforeDelivery: policy.requireEvidenceBundleBeforeDelivery,
        requireConnectorValidationBeforeDelivery: policy.requireConnectorValidationBeforeDelivery,
        retryPolicy: json(policy.retryPolicy),
        deadLetterPolicy: json(policy.deadLetterPolicy),
        updatedBy: policy.updatedBy ?? null,
        policyVersion: policy.policyVersion,
        lastValidationStatus: policy.lastValidationStatus,
        safetyFlags: json(policy.safetyFlags),
        updatedAt: dateOrNow(policy.updatedAt),
      },
    });
  }

  async getDeliveryPolicy(tenantId: string, id: string): Promise<DeliveryPolicyShape | undefined> {
    const row = await this.prisma.deliveryPolicy.findFirst({ where: { id, tenantId } });
    if (!row) return undefined;
    return this.mapDeliveryPolicy(row);
  }

  async getDeliveryPolicyByConnector(tenantId: string, connectorInstallationId: string | null): Promise<DeliveryPolicyShape | undefined> {
    const row = await this.prisma.deliveryPolicy.findFirst({
      where: { tenantId, connectorInstallationId },
    });
    if (!row) return undefined;
    return this.mapDeliveryPolicy(row);
  }

  async listDeliveryPolicies(tenantId: string): Promise<DeliveryPolicyShape[]> {
    const rows = await this.prisma.deliveryPolicy.findMany({ where: { tenantId } });
    return rows.map((r) => this.mapDeliveryPolicy(r));
  }

  private mapDeliveryPolicy(row: {
    id: string;
    tenantId: string;
    connectorInstallationId: string | null;
    name: string;
    enabled: boolean;
    killSwitch: boolean;
    dryRunRequired: boolean;
    mockOnlyEnforced: boolean;
    allowRealNetworkCalls: boolean;
    allowedActionTypes: string[];
    approvalRequired: boolean;
    minimumApproverRole: string;
    requireHumanReview: boolean;
    requireEvidenceBundleBeforeDelivery: boolean;
    requireConnectorValidationBeforeDelivery: boolean;
    retryPolicy: unknown;
    deadLetterPolicy: unknown;
    updatedBy: string | null;
    updatedAt: Date;
    policyVersion: number;
    lastValidationStatus: string;
    safetyFlags: unknown;
    createdAt: Date;
  }): DeliveryPolicyShape {
    return {
      id: row.id as DeliveryPolicyShape['id'],
      tenantId: row.tenantId as DeliveryPolicyShape['tenantId'],
      connectorInstallationId: row.connectorInstallationId,
      name: row.name,
      enabled: row.enabled,
      killSwitch: row.killSwitch,
      dryRunRequired: row.dryRunRequired,
      mockOnlyEnforced: row.mockOnlyEnforced,
      allowRealNetworkCalls: row.allowRealNetworkCalls,
      allowedActionTypes: row.allowedActionTypes,
      approvalRequired: row.approvalRequired,
      minimumApproverRole: row.minimumApproverRole as DeliveryPolicyShape['minimumApproverRole'],
      requireHumanReview: row.requireHumanReview,
      requireEvidenceBundleBeforeDelivery: row.requireEvidenceBundleBeforeDelivery,
      requireConnectorValidationBeforeDelivery: row.requireConnectorValidationBeforeDelivery,
      retryPolicy: row.retryPolicy as DeliveryPolicyShape['retryPolicy'],
      deadLetterPolicy: row.deadLetterPolicy as DeliveryPolicyShape['deadLetterPolicy'],
      updatedBy: row.updatedBy,
      updatedAt: toISO(row.updatedAt)!,
      policyVersion: row.policyVersion,
      lastValidationStatus: row.lastValidationStatus as DeliveryPolicyShape['lastValidationStatus'],
      safetyFlags: row.safetyFlags as DeliveryPolicyShape['safetyFlags'],
      createdAt: toISO(row.createdAt)!,
    };
  }

  // TenantPolicy (Connector, AI, Retention)
  async saveTenantPolicy(
    policy: ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape,
    policyType: string,
    scopeId?: string | null
  ): Promise<void> {
    const effectiveScopeId = scopeId ?? null;
    const existing = await this.prisma.tenantPolicy.findFirst({
      where: { tenantId: policy.tenantId, policyType, scopeId: effectiveScopeId },
    });
    if (existing) {
      await this.prisma.tenantPolicy.update({
        where: { id: existing.id },
        data: {
          name: policy.name,
          config: json(policy),
          version: { increment: 1 },
          updatedBy: policy.updatedBy,
        },
      });
    } else {
      await this.prisma.tenantPolicy.create({
        data: {
          tenantId: policy.tenantId,
          policyType,
          scopeId: effectiveScopeId,
          name: policy.name,
          config: json(policy),
          version: 1,
          updatedBy: policy.updatedBy,
        },
      });
    }
  }

  async getTenantPolicy(
    tenantId: string,
    policyType: string,
    scopeId?: string | null
  ): Promise<ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape | undefined> {
    const effectiveScopeId = scopeId ?? null;
    const row = await this.prisma.tenantPolicy.findFirst({
      where: { tenantId, policyType, scopeId: effectiveScopeId },
    });
    if (!row) return undefined;
    return row.config as ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape;
  }

  async listTenantPolicies(
    tenantId: string
  ): Promise<Array<ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape>> {
    const rows = await this.prisma.tenantPolicy.findMany({ where: { tenantId } });
    return rows.map((r) => r.config as ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape);
  }

  // Endpoint agent/device diagnostics
  async saveEndpointDevice(device: EndpointDeviceShape, tokenHash?: string): Promise<void> {
    const existing = await this.prisma.endpointDevice.findFirst({ where: { tenantId: device.tenantId, id: device.id } });
    await this.prisma.endpointDevice.upsert({
      where: { id: device.id },
      create: {
        id: device.id,
        tenantId: device.tenantId,
        displayName: device.displayName,
        hostname: device.hostname,
        deviceKey: device.deviceKey,
        tokenHash: tokenHash ?? '',
        fingerprint: device.fingerprint,
        platform: device.platform,
        agentVersion: device.agentVersion,
        status: device.status,
        lastSeenAt: device.lastSeenAt ? dateOrNow(device.lastSeenAt) : null,
        enrolledAt: dateOrNow(device.enrolledAt),
        createdAt: dateOrNow(device.createdAt),
        updatedAt: dateOrNow(device.updatedAt),
      },
      update: {
        displayName: device.displayName,
        hostname: device.hostname,
        tokenHash: tokenHash ?? existing?.tokenHash ?? '',
        fingerprint: device.fingerprint,
        platform: device.platform,
        agentVersion: device.agentVersion,
        status: device.status,
        lastSeenAt: device.lastSeenAt ? dateOrNow(device.lastSeenAt) : null,
        updatedAt: dateOrNow(device.updatedAt),
      },
    });
  }

  async getEndpointDevice(tenantId: string, id: string): Promise<EndpointDeviceShape | undefined> {
    const row = await this.prisma.endpointDevice.findFirst({ where: { tenantId, id } });
    return row ? this.mapEndpointDevice(row) : undefined;
  }

  async getEndpointDeviceByKey(tenantId: string, deviceKey: string): Promise<(EndpointDeviceShape & { tokenHash?: string }) | undefined> {
    const row = await this.prisma.endpointDevice.findFirst({ where: { tenantId, deviceKey } });
    return row ? { ...this.mapEndpointDevice(row), tokenHash: row.tokenHash } : undefined;
  }

  async listEndpointDevices(tenantId: string): Promise<EndpointDeviceShape[]> {
    const rows = await this.prisma.endpointDevice.findMany({
      where: { tenantId },
      orderBy: [{ lastSeenAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return rows.map((r) => this.mapEndpointDevice(r));
  }

  async saveEndpointHeartbeat(heartbeat: EndpointHeartbeatShape): Promise<void> {
    await this.prisma.endpointHeartbeat.create({
      data: {
        id: heartbeat.id,
        tenantId: heartbeat.tenantId,
        deviceId: heartbeat.deviceId,
        status: heartbeat.status,
        agentVersion: heartbeat.agentVersion,
        observedAt: dateOrNow(heartbeat.observedAt),
        summary: json(heartbeat.summary),
      },
    });
  }

  async listEndpointHeartbeats(tenantId: string, deviceId: string): Promise<EndpointHeartbeatShape[]> {
    const rows = await this.prisma.endpointHeartbeat.findMany({
      where: { tenantId, deviceId },
      orderBy: { observedAt: 'desc' },
      take: 20,
    });
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId as EndpointHeartbeatShape['tenantId'],
      deviceId: r.deviceId as EndpointHeartbeatShape['deviceId'],
      status: r.status as EndpointHeartbeatShape['status'],
      agentVersion: r.agentVersion,
      observedAt: toISO(r.observedAt)!,
      summary: r.summary as Record<string, unknown>,
    }));
  }

  async saveEndpointDiagnosticSnapshot(snapshot: EndpointDiagnosticSnapshotShape): Promise<void> {
    await this.prisma.endpointDiagnosticSnapshot.create({
      data: {
        id: snapshot.id,
        tenantId: snapshot.tenantId,
        deviceId: snapshot.deviceId,
        kind: snapshot.kind,
        payload: json(snapshot.payload),
        collectedAt: dateOrNow(snapshot.collectedAt),
        sourceAgentVersion: snapshot.sourceAgentVersion,
        createdAt: dateOrNow(snapshot.createdAt),
      },
    });
  }

  async listEndpointDiagnosticSnapshots(tenantId: string, deviceId: string): Promise<EndpointDiagnosticSnapshotShape[]> {
    const rows = await this.prisma.endpointDiagnosticSnapshot.findMany({
      where: { tenantId, deviceId },
      orderBy: { collectedAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id as EndpointDiagnosticSnapshotShape['id'],
      tenantId: r.tenantId as EndpointDiagnosticSnapshotShape['tenantId'],
      deviceId: r.deviceId as EndpointDiagnosticSnapshotShape['deviceId'],
      kind: r.kind as EndpointDiagnosticSnapshotShape['kind'],
      payload: r.payload as Record<string, unknown>,
      collectedAt: toISO(r.collectedAt)!,
      sourceAgentVersion: r.sourceAgentVersion,
      createdAt: toISO(r.createdAt)!,
    }));
  }

  async saveEndpointCommand(command: EndpointCommandShape): Promise<void> {
    await this.prisma.endpointCommand.upsert({
      where: { id: command.id },
      create: {
        id: command.id,
        tenantId: command.tenantId,
        deviceId: command.deviceId,
        commandKind: command.commandKind,
        status: command.status,
        nonce: command.nonce,
        idempotencyKey: command.idempotencyKey,
        requestedByUserId: command.requestedByUserId,
        requestedAt: dateOrNow(command.requestedAt),
        claimedAt: command.claimedAt ? dateOrNow(command.claimedAt) : null,
        completedAt: command.completedAt ? dateOrNow(command.completedAt) : null,
        expiresAt: dateOrNow(command.expiresAt),
        policyDecision: json(command.policyDecision),
        result: command.result ? json(command.result) : undefined,
        errorCode: command.errorCode,
        errorMessage: command.errorMessage,
        createdAt: dateOrNow(command.createdAt),
        updatedAt: dateOrNow(command.updatedAt),
      },
      update: {
        status: command.status,
        claimedAt: command.claimedAt ? dateOrNow(command.claimedAt) : null,
        completedAt: command.completedAt ? dateOrNow(command.completedAt) : null,
        policyDecision: json(command.policyDecision),
        result: command.result ? json(command.result) : undefined,
        errorCode: command.errorCode,
        errorMessage: command.errorMessage,
        updatedAt: dateOrNow(command.updatedAt),
      },
    });
  }

  async getEndpointCommand(tenantId: string, id: string): Promise<EndpointCommandShape | undefined> {
    const row = await this.prisma.endpointCommand.findFirst({ where: { tenantId, id } });
    return row ? this.mapEndpointCommand(row) : undefined;
  }

  async getEndpointCommandByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<EndpointCommandShape | undefined> {
    const row = await this.prisma.endpointCommand.findFirst({ where: { tenantId, idempotencyKey } });
    return row ? this.mapEndpointCommand(row) : undefined;
  }

  async claimNextEndpointCommand(tenantId: string, deviceId: string, options: { now: string }): Promise<EndpointCommandShape | undefined> {
    const candidate = await this.prisma.endpointCommand.findFirst({
      where: { tenantId, deviceId, status: 'queued', expiresAt: { gt: dateOrNow(options.now) } },
      orderBy: { requestedAt: 'asc' },
    });
    if (!candidate) return undefined;
    const updated = await this.prisma.endpointCommand.update({
      where: { id: candidate.id },
      data: { status: 'claimed', claimedAt: dateOrNow(options.now), updatedAt: dateOrNow(options.now) },
    });
    return this.mapEndpointCommand(updated);
  }

  async listEndpointCommands(tenantId: string, deviceId?: string): Promise<EndpointCommandShape[]> {
    const rows = await this.prisma.endpointCommand.findMany({
      where: { tenantId, ...(deviceId ? { deviceId } : {}) },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.mapEndpointCommand(r));
  }

  async saveEndpointCommandResult(result: EndpointCommandResultShape): Promise<void> {
    await this.prisma.endpointCommandResult.create({
      data: {
        id: result.id,
        commandId: result.commandId,
        tenantId: result.tenantId,
        deviceId: result.deviceId,
        status: result.status,
        payload: json(result.payload),
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        submittedAt: dateOrNow(result.submittedAt),
      },
    });
  }

  async getEndpointCommandResult(tenantId: string, commandId: string): Promise<EndpointCommandResultShape | undefined> {
    const r = await this.prisma.endpointCommandResult.findFirst({ where: { tenantId, commandId } });
    return r ? {
      id: r.id as EndpointCommandResultShape['id'],
      commandId: r.commandId as EndpointCommandResultShape['commandId'],
      tenantId: r.tenantId as EndpointCommandResultShape['tenantId'],
      deviceId: r.deviceId as EndpointCommandResultShape['deviceId'],
      status: r.status as EndpointCommandResultShape['status'],
      payload: r.payload as Record<string, unknown>,
      errorCode: r.errorCode ?? undefined,
      errorMessage: r.errorMessage ?? undefined,
      submittedAt: toISO(r.submittedAt)!,
    } : undefined;
  }

  private mapEndpointDevice(row: {
    id: string; tenantId: string; displayName: string; hostname: string; deviceKey: string; fingerprint: string; platform: string; agentVersion: string; status: string; lastSeenAt: Date | null; enrolledAt: Date; createdAt: Date; updatedAt: Date;
  }): EndpointDeviceShape {
    return {
      id: row.id as EndpointDeviceShape['id'],
      tenantId: row.tenantId as EndpointDeviceShape['tenantId'],
      displayName: row.displayName,
      hostname: row.hostname,
      deviceKey: row.deviceKey,
      fingerprint: row.fingerprint,
      platform: row.platform,
      agentVersion: row.agentVersion,
      status: row.status as EndpointDeviceShape['status'],
      lastSeenAt: toISO(row.lastSeenAt),
      enrolledAt: toISO(row.enrolledAt)!,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }

  private mapEndpointCommand(row: {
    id: string; tenantId: string; deviceId: string; commandKind: string; status: string; nonce: string; idempotencyKey: string; requestedByUserId: string; requestedAt: Date; claimedAt: Date | null; completedAt: Date | null; expiresAt: Date; policyDecision: unknown; result: unknown; errorCode: string | null; errorMessage: string | null; createdAt: Date; updatedAt: Date;
  }): EndpointCommandShape {
    return {
      id: row.id as EndpointCommandShape['id'],
      tenantId: row.tenantId as EndpointCommandShape['tenantId'],
      deviceId: row.deviceId as EndpointCommandShape['deviceId'],
      commandKind: row.commandKind as EndpointCommandShape['commandKind'],
      status: row.status as EndpointCommandShape['status'],
      nonce: row.nonce,
      idempotencyKey: row.idempotencyKey,
      requestedByUserId: row.requestedByUserId,
      requestedAt: toISO(row.requestedAt)!,
      claimedAt: toISO(row.claimedAt),
      completedAt: toISO(row.completedAt),
      expiresAt: toISO(row.expiresAt)!,
      policyDecision: row.policyDecision as Record<string, unknown>,
      result: row.result as Record<string, unknown> | undefined,
      errorCode: row.errorCode ?? undefined,
      errorMessage: row.errorMessage ?? undefined,
      createdAt: toISO(row.createdAt)!,
      updatedAt: toISO(row.updatedAt)!,
    };
  }
}
