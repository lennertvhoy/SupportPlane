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
  private credentialReferences = new Map<string, ConnectorCredentialReferenceShape>();
  private supportActions = new Map<string, SupportActionShape>();
  private actionOutboxItems = new Map<string, ActionOutboxItemShape>();
  private actionOutboxAttempts = new Map<string, ActionOutboxAttemptShape>();
  private deliveryPolicies = new Map<string, DeliveryPolicyShape>();

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

  saveCredentialReference(ref: ConnectorCredentialReferenceShape): void {
    this.credentialReferences.set(`${ref.tenantId}:${ref.id}`, ref);
  }

  getCredentialReference(tenantId: string, id: string): ConnectorCredentialReferenceShape | undefined {
    return this.credentialReferences.get(`${tenantId}:${id}`);
  }

  listCredentialReferences(tenantId: string, options?: { connectorType?: string }): ConnectorCredentialReferenceShape[] {
    let results = Array.from(this.credentialReferences.values()).filter((c) => c.tenantId === tenantId);
    if (options?.connectorType) {
      results = results.filter((c) => c.connectorType === options.connectorType);
    }
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

  claimNextActionOutboxItem(
    tenantId: string,
    options: { workerId: string; now: string; lockExpiresAt: string; outboxItemId?: string }
  ): ActionOutboxItemShape | undefined {
    const nowTime = Date.parse(options.now);
    const candidate = Array.from(this.actionOutboxItems.values())
      .filter((item) => {
        if (item.tenantId !== tenantId) return false;
        if (options.outboxItemId && item.id !== options.outboxItemId) return false;
        if (!['queued', 'retry_scheduled', 'processing'].includes(item.status)) return false;
        if (item.status === 'processing' && item.workerLockExpiresAt && Date.parse(item.workerLockExpiresAt) > nowTime) return false;
        if (item.nextAttemptAt && Date.parse(item.nextAttemptAt) > nowTime) return false;
        return item.attemptCount < item.maxAttempts;
      })
      .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))[0];
    if (!candidate) return undefined;
    const updated: ActionOutboxItemShape = {
      ...candidate,
      status: 'processing',
      latestAttemptState: 'processing',
      processingStartedAt: options.now,
      workerLockId: options.workerId,
      workerLockedAt: options.now,
      workerLockExpiresAt: options.lockExpiresAt,
      updatedAt: options.now,
    };
    this.saveActionOutboxItem(updated);
    return updated;
  }

  saveActionOutboxAttempt(attempt: ActionOutboxAttemptShape): void {
    this.actionOutboxAttempts.set(`${attempt.tenantId}:${attempt.id}`, attempt);
  }

  listActionOutboxAttempts(tenantId: string, outboxItemId: string): ActionOutboxAttemptShape[] {
    return Array.from(this.actionOutboxAttempts.values())
      .filter((a) => a.tenantId === tenantId && a.outboxItemId === outboxItemId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  saveDeliveryPolicy(policy: DeliveryPolicyShape): void {
    this.deliveryPolicies.set(`${policy.tenantId}:${policy.id}`, policy);
  }

  getDeliveryPolicy(tenantId: string, id: string): DeliveryPolicyShape | undefined {
    return this.deliveryPolicies.get(`${tenantId}:${id}`);
  }

  getDeliveryPolicyByConnector(tenantId: string, connectorInstallationId: string | null): DeliveryPolicyShape | undefined {
    return Array.from(this.deliveryPolicies.values()).find(
      (p) => p.tenantId === tenantId && p.connectorInstallationId === connectorInstallationId
    );
  }

  listDeliveryPolicies(tenantId: string): DeliveryPolicyShape[] {
    return Array.from(this.deliveryPolicies.values()).filter((p) => p.tenantId === tenantId);
  }
}
