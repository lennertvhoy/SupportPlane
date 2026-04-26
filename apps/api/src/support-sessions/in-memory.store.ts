import type {
  SupportSession as SupportSessionShape,
  TicketReference as TicketReferenceShape,
  AIContextPacket as AIContextPacketShape,
  AuditEvent as AuditEventShape,
  InternalNoteDraft as InternalNoteDraftShape,
  CallEvent as CallEventShape,
} from '@supportplane/contracts';

export class InMemoryStore {
  private sessions = new Map<string, SupportSessionShape>();
  private ticketReferences = new Map<string, TicketReferenceShape[]>();
  private contextPackets = new Map<string, AIContextPacketShape[]>();
  private auditEvents = new Map<string, AuditEventShape[]>();
  private drafts = new Map<string, InternalNoteDraftShape>();
  private callEvents = new Map<string, CallEventShape>();

  saveSession(session: SupportSessionShape): void {
    this.sessions.set(`${session.tenantId}:${session.id}`, session);
  }

  getSession(tenantId: string, id: string): SupportSessionShape | undefined {
    return this.sessions.get(`${tenantId}:${id}`);
  }

  listSessions(tenantId: string): SupportSessionShape[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  saveTicketReference(sessionId: string, ticket: TicketReferenceShape): void {
    const key = `${ticket.tenantId}:${sessionId}`;
    const existing = this.ticketReferences.get(key) ?? [];
    const next = existing.filter((t) => t.id !== ticket.id);
    next.push(ticket);
    this.ticketReferences.set(key, next);
  }

  getTicketReferences(tenantId: string, sessionId: string): TicketReferenceShape[] {
    return this.ticketReferences.get(`${tenantId}:${sessionId}`) ?? [];
  }

  saveContextPacket(packet: AIContextPacketShape): void {
    const key = `${packet.tenantId}:${packet.sessionId}`;
    const existing = this.contextPackets.get(key) ?? [];
    existing.push(packet);
    this.contextPackets.set(key, existing);
  }

  getContextPackets(tenantId: string, sessionId: string): AIContextPacketShape[] {
    return this.contextPackets.get(`${tenantId}:${sessionId}`) ?? [];
  }

  saveAuditEvent(event: AuditEventShape): void {
    const key = `${event.tenantId}:${event.sessionId}`;
    const existing = this.auditEvents.get(key) ?? [];
    existing.push(event);
    this.auditEvents.set(key, existing);
  }

  getAuditEvents(tenantId: string, sessionId: string): AuditEventShape[] {
    return (this.auditEvents.get(`${tenantId}:${sessionId}`) ?? []).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    );
  }

  saveInternalNoteDraft(draft: InternalNoteDraftShape): void {
    this.drafts.set(`${draft.tenantId}:${draft.id}`, draft);
  }

  getInternalNoteDraft(tenantId: string, draftId: string): InternalNoteDraftShape | undefined {
    return this.drafts.get(`${tenantId}:${draftId}`);
  }

  listInternalNoteDrafts(tenantId: string, sessionId: string): InternalNoteDraftShape[] {
    return Array.from(this.drafts.values()).filter(
      (d) => d.tenantId === tenantId && d.sessionId === sessionId
    );
  }

  saveCallEvent(event: CallEventShape): void {
    this.callEvents.set(`${event.tenantId}:${event.id}`, event);
  }

  getCallEvent(tenantId: string, id: string): CallEventShape | undefined {
    return this.callEvents.get(`${tenantId}:${id}`);
  }

  listCallEvents(tenantId: string): CallEventShape[] {
    return Array.from(this.callEvents.values())
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listCallEventsForSession(tenantId: string, sessionId: string): CallEventShape[] {
    return Array.from(this.callEvents.values())
      .filter((c) => c.tenantId === tenantId && c.sessionId === sessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
