import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SupportSessionStatus,
  SupportSessionPriority,
  AIContextProvenance,
  AuditEventType,
  AuditActorType,
  type SupportSession as SupportSessionShape,
  type AIContextPacket as AIContextPacketShape,
  type AuditEvent as AuditEventShape,
  type TenantId,
  type SupportSessionId,
  type AIContextPacketId,
  type AuditEventId,
  type TicketingAdapterId,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import { MockTicketingAdapter } from '@supportplane/connectors';
import {
  createDefaultModelGateway,
  GenerateDraftResponse,
  ModelSelection,
  type GenerateDraftResponse as GenerateDraftResponseShape,
} from '@supportplane/ai';
import { InMemoryStore } from './in-memory.store.js';
import { type DevIdentity } from '../common/dev-identity.middleware.js';

@Injectable()
export class SupportSessionsService {
  private readonly store = new InMemoryStore();
  private readonly mockAdapter = new MockTicketingAdapter(
    'mock-adapter-001' as TicketingAdapterId
  );
  private readonly modelGateway = createDefaultModelGateway();

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
    const ticket = await this.mockAdapter.getTicket(
      identity.tenantId as TenantId,
      externalTicketId
    );

    const linkedSession: SupportSessionShape = {
      ...session,
      linkedTicketIds: Array.from(new Set([...session.linkedTicketIds, ticket.id])),
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(linkedSession);
    this.store.saveTicketReference(linkedSession.id, ticket);

    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance: AIContextProvenance.enum.ticket,
      sourceTicketIds: [ticket.id],
      sourceAdapterId: this.mockAdapter.getAdapterMetadata().id,
      payload: {
        ticketSubject: ticket.subject,
        ticketStatus: ticket.status,
        ticketPriority: ticket.priority,
        customerEmail: ticket.customerEmail,
        customerName: ticket.customerName,
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
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(updatedSession);

    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_linked,
      'ticket_reference',
      ticket.id,
      { externalTicketId }
    );
    this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance }
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
