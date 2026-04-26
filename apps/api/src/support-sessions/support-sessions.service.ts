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
import { InMemoryStore } from './in-memory.store.js';
import { type DevIdentity } from '../common/dev-identity.middleware.js';

@Injectable()
export class SupportSessionsService {
  private readonly store = new InMemoryStore();
  private readonly mockAdapter = new MockTicketingAdapter(
    'mock-adapter-001' as TicketingAdapterId
  );

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

    const updatedSession: SupportSessionShape = {
      ...session,
      linkedTicketIds: [...session.linkedTicketIds, ticket.id],
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(updatedSession);

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
