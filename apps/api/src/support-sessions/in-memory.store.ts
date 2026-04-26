import type {
  SupportSession as SupportSessionShape,
  AIContextPacket as AIContextPacketShape,
  AuditEvent as AuditEventShape,
  TicketReference as TicketReferenceShape,
} from '@supportplane/contracts';

/**
 * Simple in-memory store with explicit tenant-scoped keys.
 * This is intentionally naive; it will be replaced by Prisma/PostgreSQL
 * in a later slice.
 */
export class InMemoryStore {
  private sessions = new Map<string, SupportSessionShape>();
  private ticketReferences = new Map<string, TicketReferenceShape[]>();
  private contextPackets = new Map<string, AIContextPacketShape[]>();
  private auditEvents = new Map<string, AuditEventShape[]>();

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  saveSession(session: SupportSessionShape): void {
    this.sessions.set(this.key(session.tenantId, session.id), session);
  }

  getSession(tenantId: string, id: string): SupportSessionShape | undefined {
    return this.sessions.get(this.key(tenantId, id));
  }

  saveTicketReference(sessionId: string, ticket: TicketReferenceShape): void {
    const k = this.key(ticket.tenantId, sessionId);
    const list = this.ticketReferences.get(k) ?? [];
    const withoutDuplicate = list.filter((item) => item.id !== ticket.id);
    this.ticketReferences.set(k, [...withoutDuplicate, ticket]);
  }

  getTicketReferences(
    tenantId: string,
    sessionId: string
  ): TicketReferenceShape[] {
    return this.ticketReferences.get(this.key(tenantId, sessionId)) ?? [];
  }

  saveContextPacket(packet: AIContextPacketShape): void {
    const k = this.key(packet.tenantId, packet.sessionId);
    const list = this.contextPackets.get(k) ?? [];
    list.push(packet);
    this.contextPackets.set(k, list);
  }

  getContextPackets(
    tenantId: string,
    sessionId: string
  ): AIContextPacketShape[] {
    return this.contextPackets.get(this.key(tenantId, sessionId)) ?? [];
  }

  saveAuditEvent(event: AuditEventShape): void {
    const k = this.key(event.tenantId, event.sessionId ?? 'global');
    const list = this.auditEvents.get(k) ?? [];
    list.push(event);
    this.auditEvents.set(k, list);
  }

  getAuditEvents(tenantId: string, sessionId: string): AuditEventShape[] {
    return this.auditEvents.get(this.key(tenantId, sessionId)) ?? [];
  }

  listSessions(tenantId: string): SupportSessionShape[] {
    const result: SupportSessionShape[] = [];
    for (const session of this.sessions.values()) {
      if (session.tenantId === tenantId) {
        result.push(session);
      }
    }
    return result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}
