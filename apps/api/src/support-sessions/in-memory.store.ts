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
  ToolManifestRecord as ToolManifestRecordShape,
  ToolDefinition as ToolDefinitionShape,
  ToolInvocation as ToolInvocationShape,
  ToolApproval as ToolApprovalShape,
  ToolResultNoteDraft as ToolResultNoteDraftShape,
  KnowledgeSource as KnowledgeSourceShape,
  KnowledgeArticle as KnowledgeArticleShape,
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
  private tenantPolicies = new Map<string, ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape>();
  private endpointDevices = new Map<string, EndpointDeviceShape & { tokenHash?: string }>();
  private endpointHeartbeats = new Map<string, EndpointHeartbeatShape>();
  private endpointSnapshots = new Map<string, EndpointDiagnosticSnapshotShape>();
  private endpointCommands = new Map<string, EndpointCommandShape>();
  private endpointCommandResults = new Map<string, EndpointCommandResultShape>();
  private toolManifestRecords = new Map<string, ToolManifestRecordShape>();
  private toolDefinitions = new Map<string, ToolDefinitionShape>();
  private toolInvocations = new Map<string, ToolInvocationShape>();
  private toolApprovals = new Map<string, ToolApprovalShape>();
  private toolResultNoteDrafts = new Map<string, ToolResultNoteDraftShape>();
  private knowledgeSources = new Map<string, KnowledgeSourceShape>();
  private knowledgeArticles = new Map<string, KnowledgeArticleShape>();

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

  saveTenantPolicy(policy: ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape, policyType: string, scopeId?: string | null): void {
    const key = `${policy.tenantId}:${policyType}:${scopeId ?? 'null'}`;
    this.tenantPolicies.set(key, policy);
  }

  getTenantPolicy(tenantId: string, policyType: string, scopeId?: string | null): ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape | undefined {
    return this.tenantPolicies.get(`${tenantId}:${policyType}:${scopeId ?? 'null'}`);
  }

  listTenantPolicies(tenantId: string): Array<ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape> {
    return Array.from(this.tenantPolicies.values()).filter((p) => p.tenantId === tenantId);
  }

  saveEndpointDevice(device: EndpointDeviceShape, tokenHash?: string): void {
    const existing = this.endpointDevices.get(`${device.tenantId}:${device.id}`);
    this.endpointDevices.set(`${device.tenantId}:${device.id}`, { ...device, tokenHash: tokenHash ?? existing?.tokenHash });
  }

  getEndpointDevice(tenantId: string, id: string): EndpointDeviceShape | undefined {
    const device = this.endpointDevices.get(`${tenantId}:${id}`);
    if (!device) return undefined;
    return {
      id: device.id,
      tenantId: device.tenantId,
      displayName: device.displayName,
      hostname: device.hostname,
      deviceKey: device.deviceKey,
      fingerprint: device.fingerprint,
      platform: device.platform,
      agentVersion: device.agentVersion,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
      enrolledAt: device.enrolledAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  getEndpointDeviceByKey(tenantId: string, deviceKey: string): (EndpointDeviceShape & { tokenHash?: string }) | undefined {
    return Array.from(this.endpointDevices.values()).find((d) => d.tenantId === tenantId && d.deviceKey === deviceKey);
  }

  listEndpointDevices(tenantId: string): EndpointDeviceShape[] {
    return Array.from(this.endpointDevices.values())
      .filter((d) => d.tenantId === tenantId)
      .map((d) => ({
        id: d.id,
        tenantId: d.tenantId,
        displayName: d.displayName,
        hostname: d.hostname,
        deviceKey: d.deviceKey,
        fingerprint: d.fingerprint,
        platform: d.platform,
        agentVersion: d.agentVersion,
        status: d.status,
        lastSeenAt: d.lastSeenAt,
        enrolledAt: d.enrolledAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
      .sort((a, b) => (b.lastSeenAt ?? b.updatedAt).localeCompare(a.lastSeenAt ?? a.updatedAt));
  }

  saveEndpointHeartbeat(heartbeat: EndpointHeartbeatShape): void {
    this.endpointHeartbeats.set(`${heartbeat.tenantId}:${heartbeat.id}`, heartbeat);
  }

  listEndpointHeartbeats(tenantId: string, deviceId: string): EndpointHeartbeatShape[] {
    return Array.from(this.endpointHeartbeats.values())
      .filter((h) => h.tenantId === tenantId && h.deviceId === deviceId)
      .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  }

  saveEndpointDiagnosticSnapshot(snapshot: EndpointDiagnosticSnapshotShape): void {
    this.endpointSnapshots.set(`${snapshot.tenantId}:${snapshot.id}`, snapshot);
  }

  listEndpointDiagnosticSnapshots(tenantId: string, deviceId: string): EndpointDiagnosticSnapshotShape[] {
    return Array.from(this.endpointSnapshots.values())
      .filter((s) => s.tenantId === tenantId && s.deviceId === deviceId)
      .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
  }

  saveEndpointCommand(command: EndpointCommandShape): void {
    this.endpointCommands.set(`${command.tenantId}:${command.id}`, command);
  }

  getEndpointCommand(tenantId: string, id: string): EndpointCommandShape | undefined {
    return this.endpointCommands.get(`${tenantId}:${id}`);
  }

  getEndpointCommandByIdempotencyKey(tenantId: string, idempotencyKey: string): EndpointCommandShape | undefined {
    return Array.from(this.endpointCommands.values()).find((c) => c.tenantId === tenantId && c.idempotencyKey === idempotencyKey);
  }

  claimNextEndpointCommand(tenantId: string, deviceId: string, options: { now: string }): EndpointCommandShape | undefined {
    const nowTime = Date.parse(options.now);
    const candidate = Array.from(this.endpointCommands.values())
      .filter((c) => c.tenantId === tenantId && c.deviceId === deviceId && c.status === 'queued' && Date.parse(c.expiresAt) > nowTime)
      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))[0];
    if (!candidate) return undefined;
    const claimed: EndpointCommandShape = { ...candidate, status: 'claimed', claimedAt: options.now, updatedAt: options.now };
    this.saveEndpointCommand(claimed);
    return claimed;
  }

  listEndpointCommands(tenantId: string, deviceId?: string): EndpointCommandShape[] {
    return Array.from(this.endpointCommands.values())
      .filter((c) => c.tenantId === tenantId && (!deviceId || c.deviceId === deviceId))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }

  saveEndpointCommandResult(result: EndpointCommandResultShape): void {
    this.endpointCommandResults.set(`${result.tenantId}:${result.commandId}`, result);
  }

  getEndpointCommandResult(tenantId: string, commandId: string): EndpointCommandResultShape | undefined {
    return this.endpointCommandResults.get(`${tenantId}:${commandId}`);
  }

  // Tool manifest/registry
  saveToolManifestRecord(record: ToolManifestRecordShape): void {
    this.toolManifestRecords.set(record.id, record);
  }

  getToolManifestRecord(id: string): ToolManifestRecordShape | undefined {
    return this.toolManifestRecords.get(id);
  }

  listToolManifestRecords(): ToolManifestRecordShape[] {
    return Array.from(this.toolManifestRecords.values()).sort((a, b) => b.loadedAt.localeCompare(a.loadedAt));
  }

  saveToolDefinition(def: ToolDefinitionShape): void {
    this.toolDefinitions.set(def.id, def);
  }

  getToolDefinition(id: string): ToolDefinitionShape | undefined {
    return this.toolDefinitions.get(id);
  }

  getToolDefinitionByKey(toolKey: string): ToolDefinitionShape | undefined {
    return Array.from(this.toolDefinitions.values()).find((d) => d.toolKey === toolKey);
  }

  listToolDefinitions(options?: { manifestId?: string; enabled?: boolean; category?: string }): ToolDefinitionShape[] {
    return Array.from(this.toolDefinitions.values())
      .filter((d) => {
        if (options?.manifestId && d.manifestId !== options.manifestId) return false;
        if (options?.enabled !== undefined && d.enabled !== options.enabled) return false;
        if (options?.category && d.category !== options.category) return false;
        return true;
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  // Tool invocation/approval
  saveToolInvocation(invocation: ToolInvocationShape): void {
    this.toolInvocations.set(`${invocation.tenantId}:${invocation.id}`, invocation);
  }

  getToolInvocation(tenantId: string, id: string): ToolInvocationShape | undefined {
    return this.toolInvocations.get(`${tenantId}:${id}`);
  }

  listToolInvocations(tenantId: string, options?: { deviceId?: string; status?: string; toolKey?: string }): ToolInvocationShape[] {
    return Array.from(this.toolInvocations.values())
      .filter((i) => {
        if (i.tenantId !== tenantId) return false;
        if (options?.deviceId && i.deviceId !== options.deviceId) return false;
        if (options?.status && i.status !== options.status) return false;
        if (options?.toolKey && i.toolKey !== options.toolKey) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveToolApproval(approval: ToolApprovalShape): void {
    this.toolApprovals.set(`${approval.tenantId}:${approval.id}`, approval);
  }

  getToolApproval(tenantId: string, id: string): ToolApprovalShape | undefined {
    return this.toolApprovals.get(`${tenantId}:${id}`);
  }

  getToolApprovalByInvocationId(invocationId: string): ToolApprovalShape | undefined {
    return Array.from(this.toolApprovals.values()).find((a) => a.invocationId === invocationId);
  }

  listToolApprovals(tenantId: string, options?: { status?: string; requestedByUserId?: string }): ToolApprovalShape[] {
    return Array.from(this.toolApprovals.values())
      .filter((a) => {
        if (a.tenantId !== tenantId) return false;
        if (options?.status && a.status !== options.status) return false;
        if (options?.requestedByUserId && a.requestedByUserId !== options.requestedByUserId) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveToolResultNoteDraft(draft: ToolResultNoteDraftShape): void {
    this.toolResultNoteDrafts.set(`${draft.tenantId}:${draft.id}`, draft);
  }

  getToolResultNoteDraft(tenantId: string, id: string): ToolResultNoteDraftShape | undefined {
    return this.toolResultNoteDrafts.get(`${tenantId}:${id}`);
  }

  getToolResultNoteDraftByInvocationId(invocationId: string): ToolResultNoteDraftShape | undefined {
    return Array.from(this.toolResultNoteDrafts.values()).find((d) => d.invocationId === invocationId);
  }

  listToolResultNoteDrafts(tenantId: string): ToolResultNoteDraftShape[] {
    return Array.from(this.toolResultNoteDrafts.values())
      .filter((d) => d.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveKnowledgeSource(source: KnowledgeSourceShape): void {
    this.knowledgeSources.set(`${source.tenantId}:${source.id}`, source);
  }

  getKnowledgeSource(tenantId: string, id: string): KnowledgeSourceShape | undefined {
    return this.knowledgeSources.get(`${tenantId}:${id}`);
  }

  listKnowledgeSources(tenantId: string): KnowledgeSourceShape[] {
    return Array.from(this.knowledgeSources.values())
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveKnowledgeArticle(article: KnowledgeArticleShape): void {
    this.knowledgeArticles.set(`${article.tenantId}:${article.id}`, article);
  }

  getKnowledgeArticle(tenantId: string, id: string): KnowledgeArticleShape | undefined {
    return this.knowledgeArticles.get(`${tenantId}:${id}`);
  }

  listKnowledgeArticles(tenantId: string, options?: { sourceId?: string; status?: string }): KnowledgeArticleShape[] {
    return Array.from(this.knowledgeArticles.values())
      .filter((a) => {
        if (a.tenantId !== tenantId) return false;
        if (options?.sourceId && a.sourceId !== options.sourceId) return false;
        if (options?.status && a.status !== options.status) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  searchKnowledgeArticles(tenantId: string, query: string, options?: { sourceIds?: string[]; limit?: number }): KnowledgeArticleShape[] {
    const q = query.toLowerCase();
    return Array.from(this.knowledgeArticles.values())
      .filter((a) => {
        if (a.tenantId !== tenantId) return false;
        if (options?.sourceIds && !options.sourceIds.includes(a.sourceId)) return false;
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, options?.limit ?? 10);
  }
}
