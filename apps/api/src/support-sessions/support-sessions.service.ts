import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from './in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import {
  SupportSessionStatus,
  SupportSessionPriority,
  AIContextProvenance,
  AuditEventType,
  AuditActorType,
  ConnectorErrorCode,
  ConnectorMode,
  InternalNoteWritebackResult,
  EvidenceBundleFormat,
  GreetingSuggestionTone,
  ScreenObservationSource,
  ScreenObservationStatus,
  ScreenObservationSharingState,
  ScreenObservationRawImageRetention,

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
  type ScreenObservation as ScreenObservationShape,
  type ScreenObservationId,

} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import {
  createZammadAdapter,
  type TicketingAdapterDriver,
  type TicketingAdapterClient,
  getTicketingAdapterFactory,
  resolveAdapterRuntime,
  AdapterRuntimeResolverError,
} from '@supportplane/connectors';
import { evaluateEgressPolicy } from '@supportplane/policy';
import {
  createDefaultModelGateway,
  GenerateDraftResponse,
  ModelSelection,
  type GenerateDraftResponse as GenerateDraftResponseShape,
  GreetingSuggestionResponse,
  type GreetingSuggestionResponse as GreetingSuggestionResponseShape,
} from '@supportplane/ai';
import { type DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import { CredentialResolverService } from '../credential-references/credential-resolver.service.js';
import {
  buildEvidenceBundle,
  bundleToMarkdown,
} from '../evidence-bundle/evidence-bundle.builder.js';
import { redactPlaceholder } from '../evidence-bundle/redaction.js';

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
    @Inject(CredentialResolverService)
    private readonly credentialResolver: CredentialResolverService,
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  private async getAdapter(identity: DevIdentity, installation?: { id: string; secretReferenceIds: string[]; config?: Record<string, unknown> }): Promise<{
    adapter: TicketingAdapterClient;
    credentialResolution?: Record<string, unknown>;
    egressDecision?: ReturnType<typeof evaluateEgressPolicy>;
    registryMetadata?: Record<string, unknown>;
  }> {
    const mode = this.connectorsService.getMode();
    // Registry path: prefer ConnectorInstallation config when available
    const factory = getTicketingAdapterFactory('zammad') ?? getTicketingAdapterFactory('zammad-mock');
    if (!factory) {
      // Fallback to legacy hardcoded path
      if (mode !== ConnectorMode.enum.zammad) {
        return { adapter: this.connectorsService.getZammadAdapter() ?? this.fallbackAdapter };
      }
      // Legacy real path
      const baseUrl = process.env['ZAMMAD_BASE_URL'];
      const egressDecision = evaluateEgressPolicy({
        tenantId: identity.tenantId,
        connectorType: 'zammad',
        operation: 'read',
        url: baseUrl,
      });
      if (!egressDecision.allowed) {
        throw new ForbiddenException({ message: egressDecision.reason, egressDecision });
      }
      if (!baseUrl || !installation) {
        throw new BadRequestException('Zammad sandbox read is not configured with an active installation.');
      }
      const resolved = await this.credentialResolver.resolveZammadApiToken(identity.tenantId, installation as never);
      const adapter = await this.connectorsService.createResolvedZammadAdapter({ baseUrl, apiToken: resolved.apiToken, timeoutMs: 10000 });
      return { adapter, credentialResolution: resolved.metadata, egressDecision };
    }

    // Registry-driven path
    const isMock = mode !== ConnectorMode.enum.zammad;
    if (isMock) {
      const adapter = factory.createAdapter('zammad-adapter-001' as never);
      if (typeof (adapter as unknown as { connect?: (c: Record<string, unknown>) => Promise<void> }).connect === 'function') {
        await (adapter as unknown as { connect: (c: Record<string, unknown>) => Promise<void> }).connect({ mockMode: true });
      }
      return { adapter, registryMetadata: { mode: 'mock', registryPattern: true } };
    }

    const baseUrl = installation?.config?.baseUrl as string | undefined ?? process.env['ZAMMAD_BASE_URL'];
    const egressDecision = evaluateEgressPolicy({
      tenantId: identity.tenantId,
      connectorType: 'zammad',
      operation: 'read',
      url: baseUrl,
    });
    if (!egressDecision.allowed) {
      throw new ForbiddenException({ message: egressDecision.reason, egressDecision });
    }

    if (!baseUrl || !installation) {
      throw new BadRequestException('Zammad sandbox read is not configured with an active installation.');
    }

    const resolved = await this.credentialResolver.resolveZammadApiToken(identity.tenantId, installation as never);
    try {
      const runtimeResult = await resolveAdapterRuntime({
        adapterType: factory.adapterType,
        adapterId: 'zammad-adapter-001',
        installation: {
          id: installation.id,
          enabled: true,
          config: { ...installation.config, baseUrl },
          capabilities: factory.capabilities,
        },
        credentials: { apiToken: resolved.apiToken },
        safety: {
          egressPolicy: egressDecision,
          writebackEnabled: false,
          mockMode: false,
          sandboxMode: true,
        },
      });
      return {
        adapter: runtimeResult.adapter,
        credentialResolution: resolved.metadata,
        egressDecision,
        registryMetadata: runtimeResult.metadata,
      };
    } catch (err) {
      if (err instanceof AdapterRuntimeResolverError) {
        throw new BadRequestException(`Adapter runtime resolution failed: ${err.message}`);
      }
      throw err;
    }
  }

  async createSession(
    identity: DevIdentity,
    dto: { title: string; description?: string; priority?: string }
  ): Promise<SupportSessionShape> {
    requirePermission(identity, 'support_session:create');
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

    await this.store.saveSession(session);
    await this.appendAuditEvent(
      identity,
      session.id,
      AuditEventType.enum.session_created,
      'session',
      session.id,
      { title: session.title }
    );
    return session;
  }

  async getSession(identity: DevIdentity, id: string): Promise<SupportSessionShape>{
    requirePermission(identity, 'support_session:read');
    const session = await this.store.getSession(identity.tenantId, id);
    if (!session) {
      await this.recordTenantBoundaryDenial(identity, 'support_session', id);
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
    requirePermission(identity, 'ticket_context:load');
    const session = await this.getSession(identity, sessionId);
    const mode = this.connectorsService.getMode();

    // Resolve connector installation provenance
    const installations = await this.store.listConnectorInstallations(identity.tenantId);
    const activeInstallation = installations.find(
      (i) => i.adapterType === 'zammad' && i.enabled
    ) ?? installations.find((i) => i.adapterType === 'zammad');
    const credentialRefs = activeInstallation
      ? await Promise.all(
          (activeInstallation.secretReferenceIds ?? []).map((cid) =>
            this.store.getCredentialReference(identity.tenantId, cid)
          )
        )
      : [];
    const linkedCredentialRefs = credentialRefs.filter((c): c is NonNullable<typeof c> => c != null);

    const { adapter, credentialResolution, egressDecision } = await this.getAdapter(identity, activeInstallation);

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
    await this.store.saveSession(linkedSession);
    await this.store.saveTicketReference(linkedSession.id, ticket as TicketReferenceShape);

    const isRealNetwork =
      mode === 'zammad' && activeInstallation?.mockMode === false;

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
        connectorInstallationProvenance: activeInstallation
          ? {
              installationId: activeInstallation.id,
              installationDisplayName: activeInstallation.displayName ?? activeInstallation.name,
              adapterType: activeInstallation.adapterType,
              capabilities: activeInstallation.capabilities,
              credentialReferencesLinked: linkedCredentialRefs.length > 0,
              linkedCredentialReferenceCount: linkedCredentialRefs.length,
              realNetwork: isRealNetwork,
              writebackEnabled: false,
              noRealNetworkCall: !isRealNetwork,
              credentialResolver: credentialResolution ?? {
                resolver: 'disabled',
                resolverMode: 'disabled',
                status: 'disabled',
                secretExposed: false,
              },
              egressDecision: egressDecision?.decision ?? 'not_applicable_mock_mode',
            }
          : null,
      },
      redactionLog: [],
      createdAt: new Date().toISOString(),
    };
    await this.store.saveContextPacket(packet);
    const updatedSession: SupportSessionShape = {
      ...linkedSession,
      aiContextPacketIds: Array.from(
        new Set([...linkedSession.aiContextPacketIds, packet.id])
      ),
      callEventIds: linkedSession.callEventIds,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(updatedSession);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_linked,
      'ticket_reference',
      (ticket as { id: string }).id,
      { externalTicketId, connectorMode: mode, connectorType: adapter.adapterType, connectorInstallationId: activeInstallation?.id }
    );
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, connectorMode: mode, connectorInstallationId: activeInstallation?.id }
    );
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.zammad_ticket_loaded,
      'ticket_reference',
      (ticket as { id: string }).id,
      {
        externalTicketId,
        connectorMode: mode,
        connectorType: adapter.adapterType,
        connectorInstallationId: activeInstallation?.id,
        noRealNetworkCall: !isRealNetwork,
        egressDecision: egressDecision?.decision,
        credentialResolver: credentialResolution
          ? {
              resolver: credentialResolution.resolver,
              resolverMode: credentialResolution.resolverMode,
              status: credentialResolution.status,
              secretExposed: false,
            }
          : undefined,
      }
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
    requirePermission(identity, 'ai:generate');
    const session = await this.getSession(identity, sessionId);
    const contextPackets = await this.store.getContextPackets(
      identity.tenantId,
      sessionId
    );
    const ticketReferences = await this.store.getTicketReferences(
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

    await this.appendAuditEvent(
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
        providerMode: response.usage.providerMode,
        fallbackUsed: response.usage.fallbackUsed,
        noCloudCall: response.usage.noCloudCall,
        cloudCallMade: response.safety.cloudCallMade,
        localProviderCallMade: response.safety.localProviderCallMade,
        latencyMs: response.usage.latencyMs,
        autonomousSend: response.safety.autonomousSend,
        writebackAllowed: response.safety.writebackAllowed,
      }
    );

    return response;
  }

  async generateGreetingSuggestion(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      tone?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ): Promise<GreetingSuggestionResponseShape> {
    const session = await this.getSession(identity, sessionId);
    const tone = dto.tone
      ? GreetingSuggestionTone.parse(dto.tone)
      : GreetingSuggestionTone.enum.professional;
    const modelSelection = dto.modelSelection
      ? ModelSelection.parse(dto.modelSelection)
      : undefined;

    let callEvent = undefined;
    if (dto.callEventId) {
      callEvent = await this.store.getCallEvent(identity.tenantId, dto.callEventId);
      if (!callEvent) {
        await this.recordTenantBoundaryDenial(identity, 'call_event', dto.callEventId);
        throw new NotFoundException(`Call event ${dto.callEventId} not found`);
      }
      if (callEvent.sessionId && callEvent.sessionId !== sessionId) {
        throw new ForbiddenException(`Call event ${dto.callEventId} is not linked to session ${sessionId}`);
      }
    }

    const ticketReferences = await this.store.getTicketReferences(
      identity.tenantId,
      sessionId
    );

    const response = GreetingSuggestionResponse.parse(
      await this.modelGateway.generateGreeting({
        tenantId: identity.tenantId,
        actorId: identity.userId,
        supportSessionId: session.id,
        callEventId: callEvent?.id,
        tone,
        callerName: callEvent?.caller?.displayName,
        normalizedPhoneNumber: callEvent?.caller?.normalizedNumber,
        matchedTicketIds: callEvent?.callerMatch?.matchedTicketIds ?? ticketReferences.map((t) => t.externalTicketId),
        matchedCustomerName: callEvent?.callerMatch?.customerName,
        sessionTitle: session.title,
        modelSelection,
      })
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.greeting_suggestion_generated,
      'support_session',
      session.id,
      {
        provider: response.provider,
        model: response.model,
        promptId: response.prompt.id,
        promptVersion: response.prompt.version,
        contextHash: response.contextHash,
        tone: response.suggestion.tone,
        callEventId: callEvent?.id,
        greetingText: response.suggestion.greetingText,
        mockOnly: response.safety.mockOnly,
      }
    );

    return response;
  }

  async createInternalNoteDraft(
    identity: DevIdentity,
    sessionId: string,
    dto: { externalTicketId: string; body: string; subject?: string }
  ): Promise<InternalNoteDraftShape> {
    requirePermission(identity, 'ticket:write');
    await this.getSession(identity, sessionId);
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

    await this.store.saveInternalNoteDraft(draft);

    await this.appendAuditEvent(
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
    requirePermission(identity, 'ticket:write');
    await this.getSession(identity, sessionId);
    const mode = this.connectorsService.getMode();

    const draft = await this.store.getInternalNoteDraft(identity.tenantId, dto.draftId);
    if (!draft) {
      throw new NotFoundException(`Draft ${dto.draftId} not found`);
    }

    const egressDecision = evaluateEgressPolicy({
      tenantId: identity.tenantId,
      connectorType: 'zammad',
      operation: 'writeback',
      url: process.env['ZAMMAD_BASE_URL'],
      writebackEnabled: false,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_writeback_attempted,
      'internal_note_draft',
      dto.draftId,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        connectorType: 'zammad',
        egressDecision: egressDecision.decision,
        writebackEnabled: false,
        externalWriteAttempted: false,
      }
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_writeback_failed,
      'internal_note_draft',
      dto.draftId,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        connectorType: 'zammad',
        errorCode: 'WRITEBACK_BLOCKED',
        errorMessage: egressDecision.reason,
        egressDecision: egressDecision.decision,
        writebackEnabled: false,
        externalWriteAttempted: false,
      }
    );

    return InternalNoteWritebackResult.parse({
      success: false,
      error: {
        code: ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED,
        message: egressDecision.reason,
        safeToDisplay: true,
      },
      metadata: {
        connectorMode: mode,
        connectorType: 'zammad',
        egressDecision: egressDecision.decision,
        writebackEnabled: false,
        externalWriteAttempted: false,
      },
    });
  }

  async createContextPacket(
    identity: DevIdentity,
    sessionId: string,
    dto: { provenance: string; payload: Record<string, unknown> }
  ): Promise<AIContextPacketShape> {
    requirePermission(identity, 'context_packet:create');
    const session = await this.getSession(identity, sessionId);
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
    await this.store.saveContextPacket(packet);
    await this.store.saveSession({
      ...session,
      aiContextPacketIds: Array.from(
        new Set([...session.aiContextPacketIds, packet.id])
      ),
      updatedAt: new Date().toISOString(),
    });
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, source: 'manual' }
    );
    return packet;
  }

  async getContextPackets(
    identity: DevIdentity,
    sessionId: string
  ): Promise<AIContextPacketShape[]>{
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    return await this.store.getContextPackets(identity.tenantId, sessionId);
  }

  async linkTicketToSession(
    identity: DevIdentity,
    sessionId: string,
    dto: { ticketReferenceId: string }
  ): Promise<SupportSessionShape> {
    requirePermission(identity, 'ticket:link');
    const session = await this.getSession(identity, sessionId);
    const tickets = await this.store.getTicketReferences(identity.tenantId, sessionId);
    const ticket = tickets.find((t) => t.id === dto.ticketReferenceId);
    if (!ticket) {
      throw new NotFoundException(`Ticket reference ${dto.ticketReferenceId} not found in tenant`);
    }
    const updated: SupportSessionShape = {
      ...session,
      linkedTicketIds: Array.from(new Set([...session.linkedTicketIds, dto.ticketReferenceId])),
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(updated);
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_linked_to_session,
      'support_session',
      sessionId,
      { ticketReferenceId: dto.ticketReferenceId, externalTicketId: ticket.externalTicketId }
    );
    return updated;
  }

  async unlinkTicketFromSession(
    identity: DevIdentity,
    sessionId: string,
    dto: { ticketReferenceId: string }
  ): Promise<SupportSessionShape> {
    requirePermission(identity, 'ticket:unlink');
    const session = await this.getSession(identity, sessionId);
    if (!session.linkedTicketIds.includes(dto.ticketReferenceId)) {
      throw new NotFoundException(`Ticket reference ${dto.ticketReferenceId} is not linked to session ${sessionId}`);
    }
    const updated: SupportSessionShape = {
      ...session,
      linkedTicketIds: session.linkedTicketIds.filter((id) => id !== dto.ticketReferenceId),
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(updated);
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_unlinked_from_session,
      'support_session',
      sessionId,
      { ticketReferenceId: dto.ticketReferenceId }
    );
    return updated;
  }

  async getCustomerReferencesForSession(
    identity: DevIdentity,
    sessionId: string
  ): Promise<{ customers: unknown[] }> {
    requirePermission(identity, 'customer:read');
    await this.getSession(identity, sessionId);
    const tickets = await this.store.getTicketReferences(identity.tenantId, sessionId);
    const customerIds = Array.from(new Set(tickets.map((t) => t.customerId).filter(Boolean)));
    const customers = [];
    for (const customerId of customerIds) {
      if (!customerId) continue;
      const customer = await this.store.getCustomerReference(identity.tenantId, customerId);
      if (customer) customers.push(customer);
    }
    return { customers };
  }

  async getCaseTimeline(
    identity: DevIdentity,
    sessionId: string
  ): Promise<{ timeline: Array<{ id: string; type: string; timestamp: string; title: string; description?: string; metadata: Record<string, unknown> }>; generatedAt: string }> {
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);

    const auditEvents = await this.store.getAuditEvents(identity.tenantId, sessionId);
    const callEvents = await this.store.listCallEventsForSession(identity.tenantId, sessionId);
    const drafts = await this.store.listInternalNoteDrafts(identity.tenantId, sessionId);
    const supportActions = await this.store.listSupportActions(identity.tenantId, { sessionId });
    const outboxItems = await this.store.listActionOutboxItems(identity.tenantId, { sessionId });

    const timeline: Array<{ id: string; type: string; timestamp: string; title: string; description?: string; metadata: Record<string, unknown> }> = [];

    for (const event of auditEvents) {
      const titleMap: Record<string, string> = {
        [AuditEventType.enum.session_created]: 'Session created',
        [AuditEventType.enum.ticket_linked]: 'Ticket linked',
        [AuditEventType.enum.ticket_unlinked]: 'Ticket unlinked',
        [AuditEventType.enum.ai_context_loaded]: 'AI context loaded',
        [AuditEventType.enum.ai_draft_generated]: 'AI draft generated',
        [AuditEventType.enum.greeting_suggestion_generated]: 'Greeting suggestion generated',
        [AuditEventType.enum.screen_observation_captured]: 'Observation captured',
        [AuditEventType.enum.screen_observation_reviewed]: 'Observation reviewed',
        [AuditEventType.enum.screen_observation_context_packet_created]: 'Context packet created from observation',
        [AuditEventType.enum.internal_note_drafted]: 'Internal note drafted',
        [AuditEventType.enum.internal_note_writeback_attempted]: 'Writeback attempted',
        [AuditEventType.enum.internal_note_writeback_succeeded]: 'Writeback succeeded',
        [AuditEventType.enum.internal_note_writeback_failed]: 'Writeback failed',
        [AuditEventType.enum.evidence_bundle_generated]: 'Evidence bundle generated',
        [AuditEventType.enum.evidence_bundle_exported]: 'Evidence bundle exported',
        [AuditEventType.enum.call_linked_to_session]: 'Call linked',
        [AuditEventType.enum.call_auto_linked_to_session]: 'Call auto-linked',
        [AuditEventType.enum.call_event_received]: 'Call received',
        [AuditEventType.enum.caller_matched]: 'Caller matched',
        [AuditEventType.enum.call_status_changed]: 'Call status changed',
        [AuditEventType.enum.connector_config_validated]: 'Connector validated',
        [AuditEventType.enum.connector_config_validation_failed]: 'Connector validation failed',
        [AuditEventType.enum.connector_tested]: 'Connector tested',
        [AuditEventType.enum.action_created]: 'Action created',
        [AuditEventType.enum.action_submitted_for_review]: 'Action submitted for review',
        [AuditEventType.enum.action_approved]: 'Action approved',
        [AuditEventType.enum.action_rejected]: 'Action rejected',
        [AuditEventType.enum.action_queued]: 'Action queued',
        [AuditEventType.enum.action_mock_delivered]: 'Action mock delivered',
        [AuditEventType.enum.action_sandbox_delivered]: 'Action sandbox delivered',
        [AuditEventType.enum.action_failed]: 'Action failed',
        [AuditEventType.enum.action_cancelled]: 'Action cancelled',
        [AuditEventType.enum.action_retry_requested]: 'Action retry requested',
        [AuditEventType.enum.outbox_item_created]: 'Outbox item created',
        [AuditEventType.enum.outbox_item_attempted]: 'Outbox item attempted',
        [AuditEventType.enum.outbox_processing_started]: 'Outbox processing started',
        [AuditEventType.enum.outbox_processing_succeeded]: 'Outbox processing succeeded',
        [AuditEventType.enum.outbox_processing_failed]: 'Outbox processing failed',
        [AuditEventType.enum.outbox_retry_scheduled]: 'Outbox retry scheduled',
        [AuditEventType.enum.outbox_retry_requested]: 'Outbox retry requested',
        [AuditEventType.enum.outbox_dead_lettered]: 'Outbox dead-lettered',
        [AuditEventType.enum.outbox_cancelled]: 'Outbox cancelled',
        [AuditEventType.enum.outbox_worker_status_checked]: 'Outbox worker status checked',
        [AuditEventType.enum.outbox_access_denied]: 'Outbox access denied',
        [AuditEventType.enum.outbox_process_once_requested]: 'Outbox process-once requested',
        [AuditEventType.enum.credential_reference_created]: 'Credential reference created',
        [AuditEventType.enum.credential_reference_updated]: 'Credential reference updated',
        [AuditEventType.enum.credential_reference_linked]: 'Credential reference linked',
        [AuditEventType.enum.credential_reference_unlinked]: 'Credential reference unlinked',
      };
      timeline.push({
        id: event.id,
        type: `audit:${event.eventType}`,
        timestamp: event.createdAt,
        title: titleMap[event.eventType] ?? event.eventType,
        metadata: { ...event.metadata, actorId: event.actorId, resourceType: event.resourceType, resourceId: event.resourceId },
      });
    }

    for (const call of callEvents) {
      timeline.push({
        id: call.id,
        type: 'call_event',
        timestamp: call.createdAt,
        title: `Call ${call.direction} — ${call.status}`,
        description: call.caller?.displayName || call.externalCallId,
        metadata: { externalCallId: call.externalCallId, provider: call.provider, status: call.status, callerMatch: call.callerMatch },
      });
    }

    for (const draft of drafts) {
      timeline.push({
        id: draft.id,
        type: 'internal_note_draft',
        timestamp: draft.createdAt,
        title: 'Support note draft',
        description: draft.reviewed ? 'Reviewed' : 'Pending review',
        metadata: { externalTicketId: draft.externalTicketId, reviewed: draft.reviewed, draftLength: draft.body.length },
      });
    }

    for (const action of supportActions) {
      timeline.push({
        id: action.id,
        type: 'support_action',
        timestamp: action.updatedAt,
        title: `Action ${action.status}`,
        description: `${action.actionType} / ${action.idempotencyKey}`,
        metadata: {
          status: action.status,
          actionType: action.actionType,
          reviewedBy: action.reviewedBy,
          reviewDecision: action.reviewDecision,
          mockDevOnly: action.mockDevOnly,
        },
      });
    }

    for (const item of outboxItems) {
      timeline.push({
        id: item.id,
        type: 'action_outbox_item',
        timestamp: item.updatedAt,
        title: `Outbox ${item.status}`,
        description: item.latestAttemptState ?? 'Local mock delivery state',
        metadata: {
          supportActionId: item.supportActionId,
          attemptCount: item.attemptCount,
          maxAttempts: item.maxAttempts,
          latestAttemptState: item.latestAttemptState,
          nextAttemptAt: item.nextAttemptAt,
          retryScheduledAt: item.retryScheduledAt,
          deadLetteredAt: item.deadLetteredAt,
          deadLetterReason: item.deadLetterReason,
          lastErrorCode: item.lastErrorCode,
          lastErrorMessage: item.lastErrorMessage,
          workerLockId: item.workerLockId,
          realNetwork: false,
          writebackEnabled: false,
          externalWriteAttempted: false,
        },
      });
    }

    timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return { timeline, generatedAt: new Date().toISOString() };
  }

  async createSupportNoteDraft(
    identity: DevIdentity,
    sessionId: string,
    dto: { externalTicketId: string; operatorNotes?: string }
  ): Promise<{ draft: string; mockDevOnly: true; notSentToZammad: true; requiresHumanReview: true; generatedAt: string }> {
    requirePermission(identity, 'ticket:write');
    await this.getSession(identity, sessionId);

    const tickets = await this.store.getTicketReferences(identity.tenantId, sessionId);
    const ticket = tickets.find((t) => t.externalTicketId === dto.externalTicketId);
    const customer = ticket?.customerId ? await this.store.getCustomerReference(identity.tenantId, ticket.customerId) : undefined;

    const draftLines = [
      `[LOCAL MOCK SUPPORT NOTE DRAFT — NOT SENT TO ZAMMAD — REQUIRES HUMAN REVIEW]`,
      ``,
      `Ticket: ${dto.externalTicketId}`,
      `Customer: ${customer?.name ?? ticket?.customerName ?? 'Unknown'}`,
      `Subject: ${ticket?.subject ?? 'N/A'}`,
      ``,
      `Operator notes: ${dto.operatorNotes ?? 'None provided'}`,
      ``,
      `This draft was generated deterministically by the local mock AI provider.`,
      `It is NOT connected to a real AI model.`,
      `It is NOT written back to Zammad automatically.`,
      `Review and edit before any manual copy-paste.`,
    ];

    const draft = draftLines.join('\n');

    const noteDraft: InternalNoteDraftShape = {
      id: randomUUID() as never,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      externalTicketId: dto.externalTicketId,
      subject: ticket?.subject,
      body: draft,
      reviewed: false,
      createdAt: new Date().toISOString(),
    };
    await this.store.saveInternalNoteDraft(noteDraft);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_drafted,
      'support_note_draft',
      randomUUID(),
      {
        externalTicketId: dto.externalTicketId,
        mockDevOnly: true,
        notSentToZammad: true,
        draftLength: draft.length,
        source: 'deterministic_local_mock',
      }
    );

    return {
      draft,
      mockDevOnly: true,
      notSentToZammad: true,
      requiresHumanReview: true,
      generatedAt: new Date().toISOString(),
    };
  }

  async getAuditEvents(
    identity: DevIdentity,
    sessionId: string
  ): Promise<AuditEventShape[]>{
    requirePermission(identity, 'audit:read');
    await this.getSession(identity, sessionId);
    return await this.store.getAuditEvents(identity.tenantId, sessionId);
  }

  async listSessions(identity: DevIdentity): Promise<SupportSessionShape[]>{
    requirePermission(identity, 'support_session:read');
    return await this.store.listSessions(identity.tenantId);
  }

  async captureMockScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      kind: string;
      callEventId?: string;
      rawInputPlaceholder?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
    }
  ): Promise<ScreenObservationShape> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.mock_operator_companion,
      kind: dto.kind as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.screen_observation_captured,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return observation;
  }

  async captureActiveWindowMockMetadata(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.mock_operator_companion,
      kind: 'active_window' as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.active_window_metadata_captured,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true };
  }

  async attachManualScreenshotMetadata(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
      fileNameHint?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean; rawImageRetention: 'disabled' }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.manual_screenshot_metadata,
      kind: 'screenshot_metadata' as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: ScreenObservationSharingState.enum.active,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.manual_screenshot_metadata_attached,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
        fileNameHint: dto.fileNameHint,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true, rawImageRetention: 'disabled' };
  }

  async uploadStructuredScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      kind: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean; redactionStatus: ScreenObservationShape['redactionStatus'] }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.structured_upload,
      kind: dto.kind as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: ScreenObservationSharingState.enum.active,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.structured_screen_observation_uploaded,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true, redactionStatus };
  }

  async getSharingState(
    identity: DevIdentity,
    sessionId: string
  ) {
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    return {
      sessionId,
      state: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      mockDevOnly: true,
    };
  }

  async updateSharingState(
    identity: DevIdentity,
    sessionId: string,
    dto: { state: string }
  ): Promise<{ sessionId: string; state: ScreenObservationShape['sharingState']; previousState: ScreenObservationShape['sharingState'] | undefined; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:create');
    await this.getSession(identity, sessionId);
    const newState = ScreenObservationSharingState.parse(dto.state);
    const existing = await this.store.getSharingState(identity.tenantId, sessionId);
    const previousState = existing?.state;

    if (previousState === newState) {
      throw new BadRequestException(`Sharing state is already '${newState}'`);
    }

    const allowedTransitions: Record<string, string[]> = {
      inactive: ['active'],
      active: ['paused', 'inactive'],
      paused: ['active', 'inactive'],
    };

    const allowed = allowedTransitions[previousState ?? 'inactive'] ?? [];
    if (!allowed.includes(newState)) {
      throw new BadRequestException(
        `Invalid sharing state transition from '${previousState ?? 'inactive'}' to '${newState}'. Allowed: ${allowed.join(', ')}`
      );
    }

    const now = new Date().toISOString();
    await this.store.saveSharingState({
      tenantId: identity.tenantId,
      sessionId,
      state: newState,
      mockDevOnly: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    const eventTypeMap: Record<string, AuditEventType> = {
      active: AuditEventType.enum.screen_observation_sharing_started,
      paused: AuditEventType.enum.screen_observation_sharing_paused,
      inactive: AuditEventType.enum.screen_observation_sharing_stopped,
    };

    await this.appendAuditEvent(
      identity,
      sessionId,
      eventTypeMap[newState],
      'support_session',
      sessionId,
      {
        previousState: previousState ?? 'inactive',
        newState,
        mockDevOnly: true,
      }
    );

    return { sessionId, state: newState, previousState: previousState ?? ScreenObservationSharingState.enum.inactive, mockDevOnly: true };
  }

  async listScreenObservations(
    identity: DevIdentity,
    sessionId: string
  ): Promise<ScreenObservationShape[]>{
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    return await this.store.listScreenObservations(identity.tenantId, sessionId);
  }

  async reviewScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    observationId: string,
    dto: { status: 'approved' | 'discarded' }
  ): Promise<{ observation: ScreenObservationShape; previousStatus: string; newStatus: string }> {
    requirePermission(identity, 'screen_observation:review');
    await this.getSession(identity, sessionId);
    const observation = await this.store.getScreenObservation(identity.tenantId, observationId);
    if (!observation) {
      throw new NotFoundException(`Screen observation ${observationId} not found`);
    }
    if (observation.sessionId !== sessionId) {
      throw new NotFoundException(`Screen observation ${observationId} does not belong to session ${sessionId}`);
    }

    const previousStatus = observation.status;
    const now = new Date().toISOString();
    const updated: ScreenObservationShape = {
      ...observation,
      status: dto.status as ScreenObservationShape['status'],
      reviewedAt: now,
      reviewedBy: identity.userId,
    };

    await this.store.saveScreenObservation(updated);

    await this.appendAuditEvent(
      identity,
      sessionId,
      dto.status === 'approved'
        ? AuditEventType.enum.screen_observation_reviewed
        : AuditEventType.enum.screen_observation_discarded,
      'screen_observation',
      observationId,
      {
        previousStatus,
        newStatus: dto.status,
        reviewedBy: identity.userId,
        mockDevOnly: true,
      }
    );

    return { observation: updated, previousStatus, newStatus: dto.status };
  }

  async createContextPacketFromObservation(
    identity: DevIdentity,
    sessionId: string,
    observationId: string,
    dto?: { provenance?: string }
  ): Promise<{ observation: ScreenObservationShape; contextPacketId: string; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:review');
    requirePermission(identity, 'context_packet:create');
    const session = await this.getSession(identity, sessionId);
    const observation = await this.store.getScreenObservation(identity.tenantId, observationId);
    if (!observation) {
      throw new NotFoundException(`Screen observation ${observationId} not found`);
    }
    if (observation.sessionId !== sessionId) {
      throw new NotFoundException(`Screen observation ${observationId} does not belong to session ${sessionId}`);
    }
    if (observation.status !== 'approved') {
      throw new Error(`Screen observation ${observationId} must be approved before creating a context packet`);
    }

    const provenance = dto?.provenance ?? 'screen_observation';
    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance: provenance as AIContextPacketShape['provenance'],
      sourceTicketIds: [],
      payload: {
        source: 'screen_observation',
        observationId: observation.id,
        kind: observation.kind,
        appLabel: observation.appLabel,
        windowLabel: observation.windowLabel,
        urlLabel: observation.urlLabel,
        redactedSummary: observation.redactedSummary,
        rawInputPlaceholder: observation.redactedSummary ?? '[REDACTED]',
        mockDevOnly: true,
      },
      redactionLog: [
        { field: 'rawInputPlaceholder', reason: 'secret', method: 'mask' },
        { field: 'payload', reason: 'policy', method: 'mask' },
      ],
      createdAt: new Date().toISOString(),
    };

    await this.store.saveContextPacket(packet);
    await this.store.saveSession({
      ...session,
      aiContextPacketIds: Array.from(new Set([...session.aiContextPacketIds, packet.id])),
      updatedAt: new Date().toISOString(),
    });

    const updatedObservation: ScreenObservationShape = {
      ...observation,
      contextPacketId: packet.id,
    };
    await this.store.saveScreenObservation(updatedObservation);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.screen_observation_context_packet_created,
      'screen_observation',
      observationId,
      {
        contextPacketId: packet.id,
        provenance,
        mockDevOnly: true,
      }
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance, source: 'screen_observation', observationId }
    );

    return { observation: updatedObservation, contextPacketId: packet.id, mockDevOnly: true };
  }

  async generateEvidenceBundle(
    identity: DevIdentity,
    sessionId: string,
    format: EvidenceBundleFormat
  ) {
    requirePermission(identity, 'evidence_bundle:read');
    const session = await this.getSession(identity, sessionId);
    const tickets = await this.store.getTicketReferences(identity.tenantId, sessionId);
    const contextPackets = await this.store.getContextPackets(identity.tenantId, sessionId);
    const callEvents = await this.store.listCallEventsForSession(identity.tenantId, sessionId);
    const callRecordingsNested = await Promise.all(
      callEvents.map((call) => this.store.listCallRecordings(identity.tenantId, call.id))
    );
    const callRecordings = callRecordingsNested.flat();
    const screenObservations = await this.store.listScreenObservations(identity.tenantId, sessionId);
    const customerRefsResult = await this.getCustomerReferencesForSession(identity, sessionId);
    const customerReferences = customerRefsResult.customers as unknown as import('@supportplane/contracts').CustomerReference[];
    const connectorInstallations = await this.store.listConnectorInstallations(identity.tenantId);
    const credentialReferences = await this.store.listCredentialReferences(identity.tenantId);
    const supportNoteDrafts = await this.store.listInternalNoteDrafts(identity.tenantId, sessionId);
    const supportActions = await this.store.listSupportActions(identity.tenantId, { sessionId });
    const actionOutboxItems = await this.store.listActionOutboxItems(identity.tenantId, { sessionId });
    const actionOutboxAttempts = (
      await Promise.all(actionOutboxItems.map((item) => this.store.listActionOutboxAttempts(identity.tenantId, item.id)))
    ).flat();
    const deliveryPolicies = await this.store.listDeliveryPolicies(identity.tenantId);
    const sessionAuditEvents = await this.store.getAuditEvents(identity.tenantId, sessionId);
    const callEventIds = new Set<string>(callEvents.map((call) => call.id));
    const externalCallIds = new Set(callEvents.map((call) => call.externalCallId));
    const allAuditEvents = await this.store.getAllAuditEvents(identity.tenantId);
    const callAuditEvents = allAuditEvents.filter((event) => {
      if (event.sessionId === sessionId) return false;
      return (
        event.eventType === AuditEventType.enum.telephony_adapter_tested ||
        callEventIds.has(event.resourceId) ||
        (typeof event.metadata.externalCallId === 'string' && externalCallIds.has(event.metadata.externalCallId))
      );
    });
    const auditEvents = [...sessionAuditEvents, ...callAuditEvents].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    const storeType = process.env['SUPPORTPLANE_STORE'] ?? 'memory';
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
      callRecordings,
      screenObservations,
      customerReferences,
      connectorInstallations,
      credentialReferences,
      supportNoteDrafts,
      supportActions,
      actionOutboxItems,
      actionOutboxAttempts,
      deliveryPolicies,
      connectorMode: this.connectorsService.getMode(),
      storeType: storeType === 'postgres' ? 'postgres' : 'memory',
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.evidence_bundle_generated,
      'evidence_bundle',
      bundle.bundleId,
      { format, bundleId: bundle.bundleId, version: bundle.version }
    );

    if (format === EvidenceBundleFormat.enum.markdown) {
      await this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.evidence_bundle_exported,
        'evidence_bundle',
        bundle.bundleId,
        { format: 'markdown', bundleId: bundle.bundleId }
      );
    } else {
      await this.appendAuditEvent(
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

  private async appendAuditEvent(
    identity: DevIdentity,
    sessionId: string,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
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
    await this.store.saveAuditEvent(event);
  }

  private async recordTenantBoundaryDenial(identity: DevIdentity, resourceType: string, resourceId: string): Promise<void> {
    const now = new Date().toISOString();
    const metadata = { reason: 'not_found_in_actor_tenant', authMode: identity.authMode };
    const event: AuditEventShape = {
      id: randomUUID() as AuditEventId,
      tenantId: identity.tenantId as TenantId,
      eventType: AuditEventType.enum.tenant_boundary_denied,
      actorType: AuditActorType.enum.user,
      actorId: identity.userId,
      action: AuditEventType.enum.tenant_boundary_denied,
      resourceType,
      resourceId,
      metadata,
      integrityHash: computeIntegrityHash({
        eventType: AuditEventType.enum.tenant_boundary_denied,
        actorId: identity.userId,
        resourceId,
        metadata,
        now,
      }),
      createdAt: now,
    };
    await this.store.saveAuditEvent(event);
  }
}
