import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from './in-memory.store.js';
import {
  SupportSessionStatus,
  SupportSessionPriority,
  AIContextProvenance,
  AuditEventType,
  AuditActorType,
  ConnectorMode,
  InternalNoteWritebackResult,
  EvidenceBundleFormat,
  type SupportSession as SupportSessionShape,
  type AIContextPacket as AIContextPacketShape,
  type AuditEvent as AuditEventShape,
  type TenantId,
  type SupportSessionId,
  type AIContextPacketId,
  type AuditEventId,
  type TicketingAdapterId,
  type InternalNoteDraft as InternalNoteDraftShape,
  type TicketReference as TicketReferenceShape,
  type EvidenceBundle,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import {
  createZammadAdapter,
  type TicketingAdapterDriver,
} from '@supportplane/connectors';
import {
  createDefaultModelGateway,
  GenerateDraftResponse,
  ModelSelection,
  type GenerateDraftResponse as GenerateDraftResponseShape,
} from '@supportplane/ai';
import { type DevIdentity } from '../common/dev-identity.middleware.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import {
  buildEvidenceBundle,
  bundleToMarkdown,
} from '../evidence-bundle/evidence-bundle.builder.js';

@Injectable()
export class SupportSessionsService {
  private readonly modelGateway = createDefaultModelGateway();
  private readonly fallbackAdapter = createZammadAdapter(
    ConnectorMode.enum.mock,
    'mock-adapter-001' as TicketingAdapterId
  );

  constructor(
    @Inject(ConnectorsService)
    private readonly connectorsService: ConnectorsService,
    @Inject(InMemoryStore)
    private readonly store: InMemoryStore
  ) {}

  private getAdapter(): TicketingAdapterDriver {
    return this.connectorsService.getZammadAdapter() ?? this.fallbackAdapter;
  }

  createSession(
    identity: DevIdentity,
    dto: { title: string; description?: string; priority?: string }
  ): SupportSessionShape {
    const now = new Date().toISOString();
    const id = randomUUID();
    const priority = dto.priority
      ? SupportSessionPriority.parse(dto.priority)
      : SupportSessionPriority.enum.normal;

    const session: SupportSessionShape = {
      id: id as SupportSessionId,
      tenantId: identity.tenantId as TenantId,
      status: SupportSessionStatus.enum.open,
      priority,
      title: dto.title,
      description: dto.description,
      assignedUserId: identity.userId,
      linkedTicketIds: [],
      aiContextPacketIds: [],
      screenObservationIds: [],
      callEventIds: [],
      auditEventIds: [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.store.saveSession(session);
    this.appendAuditEvent(
      identity,
      session.id,
      AuditEventType.enum.session_created,
      'session',
      session.id,
      { title: session.title }
    );
    return session;
  }

  getSession(identity: DevIdentity, id: string): SupportSessionShape {
    const session = this.store.getSession(identity.tenantId, id);
    if (!session) {
      throw new NotFoundException(`Support session ${id} not found`);
    }
    return session;
  }

  async loadTicketContext(
    identity: DevIdentity,
    sessionId: string,
    externalTicketId: string
  ): Promise<{
    ticketReference: unknown;
    contextPacket: AIContextPacketShape;
    session: SupportSessionShape;
  }> {
    const session = this.getSession(identity, sessionId);
    const adapter = this.getAdapter();
    const mode = this.connectorsService.getMode();

    const ticket = await adapter.getTicket(
      identity.tenantId as TenantId,
      externalTicketId
    );

    const linkedSession: SupportSessionShape = {
      ...session,
      linkedTicketIds: Array.from(new Set([...session.linkedTicketIds, (ticket as { id: string }).id])),
      callEventIds: session.callEventIds,
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(linkedSession);
    this.store.saveTicketReference(linkedSession.id, ticket as TicketReferenceShape);

    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance: AIContextProvenance.enum.ticket,
      sourceTicketIds: [(ticket as { id: string }).id],
      sourceAdapterId: (adapter.getAdapterMetadata?.().id as string) ?? 'unknown',
      payload: {
        ticketSubject: (ticket as { subject: string }).subject,
        ticketStatus: (ticket as { status: string }).status,
        ticketPriority: (ticket as { priority: string }).priority,
        customerEmail: (ticket as { customerEmail?: string }).customerEmail,
        customerName: (ticket as { customerName?: string }).customerName,
        connectorMode: mode,
      },
      redactionLog: [],
      createdAt: new Date().toISOString(),
    };
    this.store.saveContextPacket(packet);
    const updatedSession: SupportSessionShape = {
      ...linkedSession,
      aiContextPacketIds: Array.from(
        new Set([...linkedSession.aiContextPacketIds, packet.id])
      ),
      callEventIds: linkedSession.callEventIds,
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(updatedSession);

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_linked,
      'ticket_reference',
      (ticket as { id: string }).id,
      { externalTicketId, connectorMode: mode, connectorType: adapter.adapterType }
    );
    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, connectorMode: mode }
    );
    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.zammad_ticket_loaded,
      'ticket_reference',
      (ticket as { id: string }).id,
      { externalTicketId, connectorMode: mode, connectorType: adapter.adapterType }
    );

    return { ticketReference: ticket, contextPacket: packet, session: updatedSession };
  }

  async generateDraftSuggestion(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      operatorInstructions?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ): Promise<GenerateDraftResponseShape> {
    const session = this.getSession(identity, sessionId);
    const contextPackets = this.store.getContextPackets(
      identity.tenantId,
      sessionId
    );
    const ticketReferences = this.store.getTicketReferences(
      identity.tenantId,
      sessionId
    );
    const modelSelection = dto.modelSelection
      ? ModelSelection.parse(dto.modelSelection)
      : undefined;

    const response = GenerateDraftResponse.parse(
      await this.modelGateway.generateDraft({
        tenantId: identity.tenantId,
        actorId: identity.userId,
        session,
        ticketReferences,
        contextPackets,
        operatorInstructions: dto.operatorInstructions,
        modelSelection,
      })
    );

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_draft_generated,
      'support_session',
      session.id,
      {
        provider: response.provider,
        model: response.model,
        promptId: response.prompt.id,
        promptVersion: response.prompt.version,
        contextHash: response.contextHash,
        mockOnly: response.safety.mockOnly,
      }
    );

    return response;
  }

  createInternalNoteDraft(
    identity: DevIdentity,
    sessionId: string,
    dto: { externalTicketId: string; body: string; subject?: string }
  ): InternalNoteDraftShape {
    this.getSession(identity, sessionId);
    const mode = this.connectorsService.getMode();

    const draft: InternalNoteDraftShape = {
      id: randomUUID() as never,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      externalTicketId: dto.externalTicketId,
      subject: dto.subject,
      body: dto.body,
      reviewed: false,
      createdAt: new Date().toISOString(),
    };

    this.store.saveInternalNoteDraft(draft);

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_drafted,
      'internal_note_draft',
      draft.id,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        draftLength: dto.body.length,
      }
    );

    return draft;
  }

  async writebackInternalNote(
    identity: DevIdentity,
    sessionId: string,
    dto: { draftId: string; externalTicketId: string; body: string }
  ): Promise<unknown> {
    this.getSession(identity, sessionId);
    const adapter = this.getAdapter();
    const mode = this.connectorsService.getMode();

    const draft = this.store.getInternalNoteDraft(identity.tenantId, dto.draftId);
    if (!draft) {
      throw new NotFoundException(`Draft ${dto.draftId} not found`);
    }

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_writeback_attempted,
      'internal_note_draft',
      dto.draftId,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        connectorType: adapter.adapterType,
      }
    );

    const result = await adapter.writeInternalNote(dto.externalTicketId, dto.body);
    const typedResult = result as { success: boolean; externalArticleId?: string; error?: { code: string; message: string } };

    if (typedResult.success) {
      this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.internal_note_writeback_succeeded,
        'internal_note_draft',
        dto.draftId,
        {
          externalTicketId: dto.externalTicketId,
          externalArticleId: typedResult.externalArticleId,
          connectorMode: mode,
          connectorType: adapter.adapterType,
        }
      );
    } else {
      this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.internal_note_writeback_failed,
        'internal_note_draft',
        dto.draftId,
        {
          externalTicketId: dto.externalTicketId,
          connectorMode: mode,
          connectorType: adapter.adapterType,
          errorCode: typedResult.error?.code,
          errorMessage: typedResult.error?.message,
        }
      );
    }

    return InternalNoteWritebackResult.parse({
      success: typedResult.success,
      externalArticleId: typedResult.externalArticleId,
      error: typedResult.error
        ? {
            code: typedResult.error.code as never,
            message: typedResult.error.message,
            safeToDisplay: true,
          }
        : undefined,
      metadata: {
        connectorMode: mode,
        connectorType: adapter.adapterType,
      },
    });
  }

  createContextPacket(
    identity: DevIdentity,
    sessionId: string,
    dto: { provenance: string; payload: Record<string, unknown> }
  ): AIContextPacketShape {
    const session = this.getSession(identity, sessionId);
    const provenance = AIContextProvenance.parse(dto.provenance);
    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance,
      sourceTicketIds: [],
      payload: dto.payload,
      redactionLog: [],
      createdAt: new Date().toISOString(),
    };
    this.store.saveContextPacket(packet);
    this.store.saveSession({
      ...session,
      aiContextPacketIds: Array.from(
        new Set([...session.aiContextPacketIds, packet.id])
      ),
      updatedAt: new Date().toISOString(),
    });
    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, source: 'manual' }
    );
    return packet;
  }

  getContextPackets(
    identity: DevIdentity,
    sessionId: string
  ): AIContextPacketShape[] {
    this.getSession(identity, sessionId);
    return this.store.getContextPackets(identity.tenantId, sessionId);
  }

  getAuditEvents(
    identity: DevIdentity,
    sessionId: string
  ): AuditEventShape[] {
    this.getSession(identity, sessionId);
    return this.store.getAuditEvents(identity.tenantId, sessionId);
  }

  listSessions(identity: DevIdentity): SupportSessionShape[] {
    return this.store.listSessions(identity.tenantId);
  }

  generateEvidenceBundle(
    identity: DevIdentity,
    sessionId: string,
    format: EvidenceBundleFormat
  ): { bundle: EvidenceBundle; markdown?: string } {
    const session = this.getSession(identity, sessionId);
    const tickets = this.store.getTicketReferences(identity.tenantId, sessionId);
    const contextPackets = this.store.getContextPackets(identity.tenantId, sessionId);
    const auditEvents = this.store.getAuditEvents(identity.tenantId, sessionId);
    const callEvents = this.store.listCallEventsForSession(identity.tenantId, sessionId);

    const bundle = buildEvidenceBundle({
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id as SupportSessionId,
      generatedBy: identity.userId,
      format,
      session,
      tickets,
      contextPackets,
      auditEvents,
      callEvents,
      connectorMode: this.connectorsService.getMode(),
    });

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.evidence_bundle_generated,
      'evidence_bundle',
      bundle.bundleId,
      { format, bundleId: bundle.bundleId, version: bundle.version }
    );

    if (format === EvidenceBundleFormat.enum.markdown) {
      this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.evidence_bundle_exported,
        'evidence_bundle',
        bundle.bundleId,
        { format: 'markdown', bundleId: bundle.bundleId }
      );
    } else {
      this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.evidence_bundle_exported,
        'evidence_bundle',
        bundle.bundleId,
        { format: 'json', bundleId: bundle.bundleId }
      );
    }

    return {
      bundle,
      markdown: format === EvidenceBundleFormat.enum.markdown ? bundleToMarkdown(bundle) : undefined,
    };
  }

  private appendAuditEvent(
    identity: DevIdentity,
    sessionId: string,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const now = new Date().toISOString();
    const event: AuditEventShape = {
      id: randomUUID() as AuditEventId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      eventType,
      actorType: AuditActorType.enum.user,
      actorId: identity.userId,
      action: eventType,
      resourceType,
      resourceId,
      metadata,
      integrityHash: computeIntegrityHash({
        eventType,
        actorId: identity.userId,
        resourceId,
        metadata,
        now,
      }),
      createdAt: now,
    };
    this.store.saveAuditEvent(event);
  }
}
