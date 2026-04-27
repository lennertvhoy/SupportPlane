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
  SupportAction as SupportActionShape,
  ActionOutboxItem as ActionOutboxItemShape,
  ActionOutboxAttempt as ActionOutboxAttemptShape,
} from '@supportplane/contracts';
import type { Store, SharingStateShape } from '../store/store.interface.js';

export class InMemoryStore implements Store {
  private sessions = new Map<string, SupportSessionShape>();
  private ticketReferences = new Map<string, TicketReferenceShape[]>();
  private contextPackets = new Map<string, AIContextPacketShape[]>();
  private auditEvents = new Map<string, AuditEventShape[]>();
  private drafts = new Map<string, InternalNoteDraftShape>();
  private callEvents = new Map<string, CallEventShape>();
  private callRecordings = new Map<string, CallRecordingShape>();
  private screenObservations = new Map<string, ScreenObservationShape>();
  private sharingStates = new Map<string, SharingStateShape>();
  private customerReferences = new Map<string, CustomerReferenceShape>();
  private connectorInstallations = new Map<string, ConnectorInstallationShape>();
  private supportActions = new Map<string, SupportActionShape>();
  private actionOutboxItems = new Map<string, ActionOutboxItemShape>();
  private actionOutboxAttempts = new Map<string, ActionOutboxAttemptShape>();

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

  listAllTicketReferences(tenantId: string): TicketReferenceShape[] {
    return Array.from(this.ticketReferences.values())
      .flat()
      .filter((t) => t.tenantId === tenantId);
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

  getAllAuditEvents(tenantId: string): AuditEventShape[] {
    return Array.from(this.auditEvents.values())
      .flat()
      .filter((e) => e.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

  saveCallRecording(recording: CallRecordingShape): void {
    this.callRecordings.set(`${recording.tenantId}:${recording.id}`, recording);
  }

  getCallRecording(tenantId: string, id: string): CallRecordingShape | undefined {
    return this.callRecordings.get(`${tenantId}:${id}`);
  }

  listCallRecordings(tenantId: string, callEventId: string): CallRecordingShape[] {
    return Array.from(this.callRecordings.values())
      .filter((r) => r.tenantId === tenantId && r.callEventId === callEventId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveScreenObservation(observation: ScreenObservationShape): void {
    this.screenObservations.set(`${observation.tenantId}:${observation.id}`, observation);
  }

  getScreenObservation(tenantId: string, id: string): ScreenObservationShape | undefined {
    return this.screenObservations.get(`${tenantId}:${id}`);
  }

  listScreenObservations(tenantId: string, sessionId: string): ScreenObservationShape[] {
    return Array.from(this.screenObservations.values())
      .filter((o) => o.tenantId === tenantId && o.sessionId === sessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listScreenObservationsForCallEvent(tenantId: string, callEventId: string): ScreenObservationShape[] {
    return Array.from(this.screenObservations.values())
      .filter((o) => o.tenantId === tenantId && o.callEventId === callEventId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getSharingState(tenantId: string, sessionId: string): SharingStateShape | undefined {
    return this.sharingStates.get(`${tenantId}:${sessionId}`);
  }

  saveSharingState(state: SharingStateShape): void {
    this.sharingStates.set(`${state.tenantId}:${state.sessionId}`, state);
  }

  saveCustomerReference(customer: CustomerReferenceShape): void {
    this.customerReferences.set(`${customer.tenantId}:${customer.id}`, customer);
  }

  getCustomerReference(tenantId: string, id: string): CustomerReferenceShape | undefined {
    return this.customerReferences.get(`${tenantId}:${id}`);
  }

  listCustomerReferences(tenantId: string, options?: { email?: string; phone?: string; adapterId?: string }): CustomerReferenceShape[] {
    let results = Array.from(this.customerReferences.values()).filter((c) => c.tenantId === tenantId);
    if (options?.email) {
      results = results.filter((c) => c.email?.toLowerCase() === options.email!.toLowerCase());
    }
    if (options?.phone) {
      results = results.filter((c) => c.phone === options.phone);
    }
    if (options?.adapterId) {
      results = results.filter((c) => c.adapterId === options.adapterId);
    }
    return results;
  }

  saveConnectorInstallation(installation: ConnectorInstallationShape): void {
    this.connectorInstallations.set(`${installation.tenantId}:${installation.id}`, installation);
  }

  getConnectorInstallation(tenantId: string, id: string): ConnectorInstallationShape | undefined {
    return this.connectorInstallations.get(`${tenantId}:${id}`);
  }

  listConnectorInstallations(tenantId: string): ConnectorInstallationShape[] {
    return Array.from(this.connectorInstallations.values()).filter((i) => i.tenantId === tenantId);
  }

  saveSupportAction(action: SupportActionShape): void {
    this.supportActions.set(`${action.tenantId}:${action.id}`, action);
  }

  getSupportAction(tenantId: string, id: string): SupportActionShape | undefined {
    return this.supportActions.get(`${tenantId}:${id}`);
  }

  listSupportActions(tenantId: string, options?: { sessionId?: string }): SupportActionShape[] {
    return Array.from(this.supportActions.values())
      .filter((a) => a.tenantId === tenantId && (!options?.sessionId || a.sessionId === options.sessionId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  saveActionOutboxItem(item: ActionOutboxItemShape): void {
    this.actionOutboxItems.set(`${item.tenantId}:${item.id}`, item);
  }

  getActionOutboxItem(tenantId: string, id: string): ActionOutboxItemShape | undefined {
    return this.actionOutboxItems.get(`${tenantId}:${id}`);
  }

  listActionOutboxItems(tenantId: string, options?: { sessionId?: string; supportActionId?: string }): ActionOutboxItemShape[] {
    return Array.from(this.actionOutboxItems.values())
      .filter(
        (i) =>
          i.tenantId === tenantId &&
          (!options?.sessionId || i.sessionId === options.sessionId) &&
          (!options?.supportActionId || i.supportActionId === options.supportActionId)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  saveActionOutboxAttempt(attempt: ActionOutboxAttemptShape): void {
    this.actionOutboxAttempts.set(`${attempt.tenantId}:${attempt.id}`, attempt);
  }

  listActionOutboxAttempts(tenantId: string, outboxItemId: string): ActionOutboxAttemptShape[] {
    return Array.from(this.actionOutboxAttempts.values())
      .filter((a) => a.tenantId === tenantId && a.outboxItemId === outboxItemId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }
}
