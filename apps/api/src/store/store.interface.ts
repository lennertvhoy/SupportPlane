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

export interface SharingStateShape {
  tenantId: string;
  sessionId: string;
  state: 'inactive' | 'active' | 'paused';
  mockDevOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  // SupportSession
  saveSession(session: SupportSessionShape): Promise<void> | void;
  getSession(tenantId: string, id: string): Promise<SupportSessionShape | undefined> | SupportSessionShape | undefined;
  listSessions(tenantId: string): Promise<SupportSessionShape[]> | SupportSessionShape[];

  // TicketReference
  saveTicketReference(sessionId: string, ticket: TicketReferenceShape): Promise<void> | void;
  getTicketReferences(tenantId: string, sessionId: string): Promise<TicketReferenceShape[]> | TicketReferenceShape[];
  listAllTicketReferences(tenantId: string): Promise<TicketReferenceShape[]> | TicketReferenceShape[];

  // AIContextPacket
  saveContextPacket(packet: AIContextPacketShape): Promise<void> | void;
  getContextPackets(tenantId: string, sessionId: string): Promise<AIContextPacketShape[]> | AIContextPacketShape[];

  // AuditEvent
  saveAuditEvent(event: AuditEventShape): Promise<void> | void;
  getAuditEvents(tenantId: string, sessionId: string): Promise<AuditEventShape[]> | AuditEventShape[];
  getAllAuditEvents(tenantId: string): Promise<AuditEventShape[]> | AuditEventShape[];

  // InternalNoteDraft
  saveInternalNoteDraft(draft: InternalNoteDraftShape): Promise<void> | void;
  getInternalNoteDraft(tenantId: string, draftId: string): Promise<InternalNoteDraftShape | undefined> | InternalNoteDraftShape | undefined;
  listInternalNoteDrafts(tenantId: string, sessionId: string): Promise<InternalNoteDraftShape[]> | InternalNoteDraftShape[];

  // CallEvent
  saveCallEvent(event: CallEventShape): Promise<void> | void;
  getCallEvent(tenantId: string, id: string): Promise<CallEventShape | undefined> | CallEventShape | undefined;
  listCallEvents(tenantId: string): Promise<CallEventShape[]> | CallEventShape[];
  listCallEventsForSession(tenantId: string, sessionId: string): Promise<CallEventShape[]> | CallEventShape[];

  // CallRecording
  saveCallRecording(recording: CallRecordingShape): Promise<void> | void;
  getCallRecording(tenantId: string, id: string): Promise<CallRecordingShape | undefined> | CallRecordingShape | undefined;
  listCallRecordings(tenantId: string, callEventId: string): Promise<CallRecordingShape[]> | CallRecordingShape[];

  // ScreenObservation
  saveScreenObservation(observation: ScreenObservationShape): Promise<void> | void;
  getScreenObservation(tenantId: string, id: string): Promise<ScreenObservationShape | undefined> | ScreenObservationShape | undefined;
  listScreenObservations(tenantId: string, sessionId: string): Promise<ScreenObservationShape[]> | ScreenObservationShape[];
  listScreenObservationsForCallEvent(tenantId: string, callEventId: string): Promise<ScreenObservationShape[]> | ScreenObservationShape[];

  // SharingState
  getSharingState(tenantId: string, sessionId: string): Promise<SharingStateShape | undefined> | SharingStateShape | undefined;
  saveSharingState(state: SharingStateShape): Promise<void> | void;

  // CustomerReference
  saveCustomerReference(customer: CustomerReferenceShape): Promise<void> | void;
  getCustomerReference(tenantId: string, id: string): Promise<CustomerReferenceShape | undefined> | CustomerReferenceShape | undefined;
  listCustomerReferences(tenantId: string, options?: { email?: string; phone?: string; adapterId?: string }): Promise<CustomerReferenceShape[]> | CustomerReferenceShape[];

  // ConnectorInstallation
  saveConnectorInstallation(installation: ConnectorInstallationShape): Promise<void> | void;
  getConnectorInstallation(tenantId: string, id: string): Promise<ConnectorInstallationShape | undefined> | ConnectorInstallationShape | undefined;
  listConnectorInstallations(tenantId: string): Promise<ConnectorInstallationShape[]> | ConnectorInstallationShape[];

  // ConnectorCredentialReference
  saveCredentialReference(ref: ConnectorCredentialReferenceShape): Promise<void> | void;
  getCredentialReference(tenantId: string, id: string): Promise<ConnectorCredentialReferenceShape | undefined> | ConnectorCredentialReferenceShape | undefined;
  listCredentialReferences(tenantId: string, options?: { connectorType?: string }): Promise<ConnectorCredentialReferenceShape[]> | ConnectorCredentialReferenceShape[];

  // Durable action/outbox
  saveSupportAction(action: SupportActionShape): Promise<void> | void;
  getSupportAction(tenantId: string, id: string): Promise<SupportActionShape | undefined> | SupportActionShape | undefined;
  listSupportActions(tenantId: string, options?: { sessionId?: string }): Promise<SupportActionShape[]> | SupportActionShape[];
  saveActionOutboxItem(item: ActionOutboxItemShape): Promise<void> | void;
  getActionOutboxItem(tenantId: string, id: string): Promise<ActionOutboxItemShape | undefined> | ActionOutboxItemShape | undefined;
  listActionOutboxItems(tenantId: string, options?: { sessionId?: string; supportActionId?: string }): Promise<ActionOutboxItemShape[]> | ActionOutboxItemShape[];
  claimNextActionOutboxItem(
    tenantId: string,
    options: { workerId: string; now: string; lockExpiresAt: string; outboxItemId?: string }
  ): Promise<ActionOutboxItemShape | undefined> | ActionOutboxItemShape | undefined;
  saveActionOutboxAttempt(attempt: ActionOutboxAttemptShape): Promise<void> | void;
  listActionOutboxAttempts(tenantId: string, outboxItemId: string): Promise<ActionOutboxAttemptShape[]> | ActionOutboxAttemptShape[];

  // DeliveryPolicy
  saveDeliveryPolicy(policy: DeliveryPolicyShape): Promise<void> | void;
  getDeliveryPolicy(tenantId: string, id: string): Promise<DeliveryPolicyShape | undefined> | DeliveryPolicyShape | undefined;
  getDeliveryPolicyByConnector(tenantId: string, connectorInstallationId: string | null): Promise<DeliveryPolicyShape | undefined> | DeliveryPolicyShape | undefined;
  listDeliveryPolicies(tenantId: string): Promise<DeliveryPolicyShape[]> | DeliveryPolicyShape[];
}
