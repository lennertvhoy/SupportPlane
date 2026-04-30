import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import {
  AuditEventType,
  AuditActorType,
  ConnectorRuntimeConfigValidationResult,
  ConnectorRuntimeReadinessResult,
  ConnectorRuntimeResolverResult,
  ConnectorRuntimeCredentialReferenceMetadata,
  ConnectorConfigSchemaResponse,
} from '@supportplane/contracts';
import type {
  AuditEvent as AuditEventShape,
  ConnectorInstallation as ConnectorInstallationShape,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import type { DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';
import { randomUUID } from 'crypto';
import { CredentialResolverService } from '../credential-references/credential-resolver.service.js';
import { getTicketingAdapterFactory, listTicketingAdapters } from '@supportplane/connectors';

const UNSAFE_CONFIG_KEYS = [
  'apiToken',
  'apiKey',
  'authToken',
  'password',
  'secret',
  'token',
  'privateKey',
  'credential',
  'bearer',
  'zammadApiToken',
  'zammadBaseUrl',
  'realEndpoint',
  'productionUrl',
  'webhookSecret',
];

const ALLOWED_CONFIG_KEYS_MOCK = [
  'baseUrlPlaceholder',
  'timeoutMs',
  'capabilities',
  'validateBeforeWrite',
  'maxRetries',
  'mockMode',
  'status',
  'enabled',
  'linkedCredentialReferenceIds',
];

const ALLOWED_CONFIG_KEYS_REAL = [
  ...ALLOWED_CONFIG_KEYS_MOCK,
  'baseUrl',
  'apiToken',
];

@Injectable()
export class ConnectorRuntimeService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store,
    @Inject(CredentialResolverService)
    private readonly credentialResolver: CredentialResolverService
  ) {}

  async getConfigSchema(
    identity: DevIdentity,
    installationId: string
  ): Promise<ConnectorConfigSchemaResponse> {
    requirePermission(identity, 'connector_installation:read');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, installationId);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${installationId} not found`);
    }

    const isMock = installation.mockMode !== false;

    // Registry-driven schema discovery (BL-124)
    const factory = getTicketingAdapterFactory(installation.adapterType);
    if (factory) {
      const schema = factory.getConfigSchema();
      return {
        installationId,
        schema: schema as ConnectorConfigSchemaResponse['schema'],
        safeFields: isMock ? ALLOWED_CONFIG_KEYS_MOCK : ALLOWED_CONFIG_KEYS_REAL,
        rejectedFields: isMock ? UNSAFE_CONFIG_KEYS : [],
        mockOnly: isMock,
      } as ConnectorConfigSchemaResponse;
    }

    // Legacy hardcoded schema fallback
    return {
      installationId,
      schema: {
        type: 'object',
        properties: {
          baseUrlPlaceholder: { type: 'string', description: 'Mock endpoint label or placeholder' },
          baseUrl: { type: 'string', description: 'Real Zammad base URL (required for real mode)' },
          apiToken: { type: 'string', description: 'Zammad API token (required for real mode)' },
          timeoutMs: { type: 'integer', minimum: 1000, maximum: 60000, description: 'Request timeout in milliseconds' },
          capabilities: { type: 'array', items: { type: 'string' }, description: 'Connector capabilities' },
          validateBeforeWrite: { type: 'boolean', description: 'Require validation before write operations' },
          maxRetries: { type: 'integer', minimum: 0, maximum: 10, description: 'Maximum retry attempts' },
          mockMode: { type: 'boolean', description: 'Mock mode — true for mock, false for real Zammad' },
          status: { type: 'string', enum: ['active', 'inactive', 'error'] },
          enabled: { type: 'boolean', description: 'Whether the connector is enabled' },
          linkedCredentialReferenceIds: { type: 'array', items: { type: 'string' }, description: 'Linked credential reference IDs' },
        },
        required: ['mockMode'],
        additionalProperties: false,
      },
      safeFields: isMock ? ALLOWED_CONFIG_KEYS_MOCK : ALLOWED_CONFIG_KEYS_REAL,
      rejectedFields: isMock ? UNSAFE_CONFIG_KEYS : [],
      mockOnly: isMock,
    };
  }

  async validateConfig(
    identity: DevIdentity,
    installationId: string,
    config: Record<string, unknown>
  ): Promise<{ installationId: string; result: ConnectorRuntimeConfigValidationResult }> {
    requirePermission(identity, 'connector_installation:test');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, installationId);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${installationId} not found`);
    }

    const isMock = config.mockMode === true;
    const issues: Array<{ field: string; severity: 'error' | 'warning'; message: string; code: string }> = [];
    const warnings: string[] = [];

    // Check mockMode presence
    if (config.mockMode !== true && config.mockMode !== false) {
      issues.push({
        field: 'mockMode',
        severity: 'error',
        message: 'mockMode must be a boolean (true for mock, false for real).',
        code: 'MOCK_MODE_INVALID',
      });
    }

    // Registry-driven validation (BL-124)
    const factory = getTicketingAdapterFactory(installation.adapterType);
    if (factory) {
      const factoryValidation = factory.validateConfig(config);
      issues.push(...factoryValidation.issues);
    }

    if (isMock) {
      // Check for unsafe keys in mock mode
      for (const key of Object.keys(config)) {
        const lowerKey = key.toLowerCase();
        if (UNSAFE_CONFIG_KEYS.some((unsafe) => lowerKey.includes(unsafe.toLowerCase()))) {
          issues.push({
            field: key,
            severity: 'error',
            message: `Field '${key}' implies real network or secret usage and is not allowed in mock-only mode.`,
            code: 'UNSAFE_FIELD_REJECTED',
          });
        }
        if (!ALLOWED_CONFIG_KEYS_MOCK.includes(key)) {
          issues.push({
            field: key,
            severity: 'warning',
            message: `Field '${key}' is not in the allowed config schema and may be ignored.`,
            code: 'UNKNOWN_FIELD',
          });
        }
      }

      // Check for real-network implication keys in mock mode
      const realNetworkImplyingKeys = ['baseUrl', 'endpoint', 'url', 'host', 'proxy'];
      for (const key of Object.keys(config)) {
        const lowerKey = key.toLowerCase();
        if (realNetworkImplyingKeys.some((rk) => lowerKey.includes(rk) && lowerKey !== 'baseurlplaceholder')) {
          issues.push({
            field: key,
            severity: 'error',
            message: `Field '${key}' may imply real network usage. Only baseUrlPlaceholder is allowed in mock mode.`,
            code: 'REAL_NETWORK_FIELD_REJECTED',
          });
        }
      }
    } else {
      // Real mode validations
      for (const key of Object.keys(config)) {
        if (!ALLOWED_CONFIG_KEYS_REAL.includes(key)) {
          issues.push({
            field: key,
            severity: 'warning',
            message: `Field '${key}' is not in the allowed config schema and may be ignored.`,
            code: 'UNKNOWN_FIELD',
          });
        }
      }

      if (!config.baseUrl && !process.env.ZAMMAD_BASE_URL) {
        warnings.push('No baseUrl configured in installation config and ZAMMAD_BASE_URL env var is not set. Real connection may fail.');
      }
      if (!config.apiToken && !process.env.ZAMMAD_API_TOKEN) {
        warnings.push('No apiToken configured in installation config and ZAMMAD_API_TOKEN env var is not set. Real connection may fail.');
      }
      warnings.push('Real network mode is enabled. Connector will make actual HTTP calls to Zammad.');
    }

    if (issues.length === 0) {
      warnings.push(isMock
        ? 'Config is valid for mock-only mode. No real network call will be made.'
        : 'Config is valid for real Zammad mode. Actual network calls will be made.');
    }

    const result: ConnectorRuntimeConfigValidationResult = {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      mockMode: isMock,
      realNetwork: !isMock,
      writebackEnabled: false,
      issues,
      warnings,
      timestamp: new Date().toISOString(),
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_config_validated, 'connector_installation', installationId, {
      valid: result.valid,
      issueCount: issues.length,
      warningCount: warnings.length,
      mockMode: isMock,
      realNetwork: result.realNetwork,
      registryPattern: Boolean(factory),
    });

    return { installationId, result };
  }

  async checkRuntimeReadiness(
    identity: DevIdentity,
    installationId: string
  ): Promise<{ installationId: string; result: ConnectorRuntimeReadinessResult }> {
    requirePermission(identity, 'connector_installation:test');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, installationId);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${installationId} not found`);
    }

    const credentialRefs = await this.resolveCredentialReferences(identity.tenantId, installation);
    const linkedCount = credentialRefs.length;
    const isMock = installation.mockMode !== false;

    // Registry-driven capability check
    const factory = getTicketingAdapterFactory(installation.adapterType);
    const hasWriteNotes = factory?.capabilities.includes('write_notes') ?? false;
    const sandboxEnabled = process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true';
    const openbaoEnabled = process.env['OPENBAO_RESOLVER_ENABLED'] === 'true';
    const sandboxWritebackReady = !isMock && installation.enabled === true && hasWriteNotes && linkedCount > 0 && openbaoEnabled && sandboxEnabled;

    const warnings: string[] = isMock
      ? [
          'This is a mock readiness check. No real network call was made.',
          'Real writeback is not implemented.',
          'Secret resolution is not implemented.',
        ]
      : [
          'Real network mode is configured.',
          sandboxWritebackReady
            ? 'Sandbox internal-note writeback is enabled; no public reply; no production writeback.'
            : 'Sandbox writeback is not ready (missing credentials, disabled, or missing write_notes capability).',
          openbaoEnabled ? 'OpenBao sandbox resolver is active.' : 'Secret resolution is not implemented — env vars will be used.',
        ];

    if (linkedCount === 0) {
      warnings.push('No credential references are linked to this installation.');
    }

    if (!installation.enabled) {
      warnings.push('Connector installation is not enabled.');
    }

    if (factory) {
      warnings.push(`Adapter '${factory.adapterType}' is registered with capabilities: ${factory.capabilities.join(', ')}.`);
    } else {
      warnings.push(`Adapter '${installation.adapterType}' is not registered in the adapter registry.`);
    }

    const result: ConnectorRuntimeReadinessResult = {
      mockReady: isMock && installation.enabled === true,
      realReady: !isMock && installation.enabled === true,
      sandboxWritebackReady,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      realNetwork: !isMock,
      writebackEnabled: sandboxWritebackReady,
      externalWriteAttempted: false,
      warnings,
      credentialReferencesLinked: linkedCount > 0,
      linkedCredentialReferenceCount: linkedCount,
      timestamp: new Date().toISOString(),
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_readiness_checked, 'connector_installation', installationId, {
      mockReady: result.mockReady,
      realReady: result.realReady,
      credentialReferencesLinked: result.credentialReferencesLinked,
      mockMode: isMock,
      registryPattern: Boolean(factory),
    });

    return { installationId, result };
  }

  async resolveRuntime(
    identity: DevIdentity,
    connectorType: string
  ): Promise<ConnectorRuntimeResolverResult> {
    requirePermission(identity, 'connector_installation:read');
    const installations = await this.store.listConnectorInstallations(identity.tenantId);
    const installation = installations.find(
      (i) => i.adapterType === connectorType && i.enabled
    ) ?? installations.find((i) => i.adapterType === connectorType);

    if (!installation) {
      throw new NotFoundException(`No connector installation found for type ${connectorType}`);
    }

    const credentialRefs = await this.resolveCredentialReferences(identity.tenantId, installation);
    const isMock = installation.mockMode !== false;

    // Registry-driven runtime resolution
    const factory = getTicketingAdapterFactory(connectorType);
    const hasWriteNotes = factory?.capabilities.includes('write_notes') ?? false;
    const sandboxEnabled = process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true';
    const openbaoEnabled = process.env['OPENBAO_RESOLVER_ENABLED'] === 'true';
    const sandboxWritebackReady = !isMock && installation.enabled === true && hasWriteNotes && credentialRefs.length > 0 && openbaoEnabled && sandboxEnabled;
    const mode = isMock ? 'mock' : (sandboxWritebackReady ? 'sandbox' : 'zammad');

    const readiness: ConnectorRuntimeReadinessResult = {
      mockReady: isMock && installation.enabled === true,
      realReady: !isMock && installation.enabled === true,
      sandboxWritebackReady,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      realNetwork: !isMock,
      writebackEnabled: sandboxWritebackReady,
      externalWriteAttempted: false,
      warnings: isMock
        ? [
            'Runtime resolver operates in mock-only mode.',
            'No real network calls will be made.',
            'Secret resolution is not implemented.',
          ]
        : [
            'Runtime resolver operates in real Zammad mode.',
            'Actual network calls will be made for read operations.',
            sandboxWritebackReady
              ? 'Sandbox internal-note writeback is enabled; no public reply; no production writeback.'
              : 'Writeback is not ready (missing credentials, capability, or sandbox gates).',
            openbaoEnabled ? 'OpenBao sandbox resolver is active.' : 'Secret resolution is not implemented — env vars will be used.',
          ],
      credentialReferencesLinked: credentialRefs.length > 0,
      linkedCredentialReferenceCount: credentialRefs.length,
      timestamp: new Date().toISOString(),
    };

    const result: ConnectorRuntimeResolverResult = {
      tenantId: identity.tenantId,
      connectorType,
      installationId: installation.id,
      installationDisplayName: installation.displayName ?? installation.name,
      capabilities: installation.capabilities,
      credentialReferences: credentialRefs,
      mode,
      realNetwork: !isMock,
      writebackEnabled: sandboxWritebackReady,
      sandboxWritebackReady,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      externalWriteAttempted: false,
      readiness,
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_runtime_resolved, 'connector_installation', installation.id, {
      connectorType,
      mode: result.mode,
      realNetwork: result.realNetwork,
      credentialReferenceCount: credentialRefs.length,
      mockMode: isMock,
      registryPattern: Boolean(factory),
      registeredCapabilities: factory?.capabilities ?? [],
    });

    return result;
  }

  async listRegisteredAdapters(identity: DevIdentity) {
    requirePermission(identity, 'connector_installation:read');
    const adapters = listTicketingAdapters();
    return {
      adapters: adapters.map((a: { adapterType: string; capabilities: string[] }) => ({
        adapterType: a.adapterType,
        capabilities: a.capabilities,
        registryPattern: true,
      })),
    };
  }

  async getAdapterSchema(identity: DevIdentity, adapterType: string) {
    requirePermission(identity, 'connector_installation:read');
    const factory = getTicketingAdapterFactory(adapterType);
    if (!factory) {
      throw new NotFoundException(`Adapter type ${adapterType} is not registered.`);
    }
    return {
      adapterType: factory.adapterType,
      capabilities: factory.capabilities,
      configSchema: factory.getConfigSchema(),
      registryPattern: true,
    };
  }

  private async resolveCredentialReferences(
    tenantId: string,
    installation: ConnectorInstallationShape
  ): Promise<ConnectorRuntimeCredentialReferenceMetadata[]> {
    const refs: ConnectorRuntimeCredentialReferenceMetadata[] = [];
    for (const credId of installation.secretReferenceIds ?? []) {
      const cred = await this.store.getCredentialReference(tenantId, credId);
      if (cred) {
        refs.push({
          id: cred.id,
          displayName: cred.displayName,
          kind: cred.secretKind,
          status: cred.status,
          lastValidatedAt: cred.lastValidatedAt,
          secretResolutionImplemented: process.env['OPENBAO_RESOLVER_ENABLED'] === 'true',
          resolver: process.env['OPENBAO_RESOLVER_ENABLED'] === 'true' ? 'openbao' : 'disabled',
          resolverMode: process.env['OPENBAO_RESOLVER_ENABLED'] === 'true' ? 'local-sandbox' : 'disabled',
          resolved: process.env['OPENBAO_RESOLVER_ENABLED'] === 'true' && cred.status === 'active',
          secretExposed: false,
        });
      }
    }
    return refs;
  }

  private async appendAuditEvent(
    identity: DevIdentity,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const now = new Date().toISOString();
    const event: AuditEventShape = {
      id: randomUUID() as AuditEventShape['id'],
      tenantId: identity.tenantId as AuditEventShape['tenantId'],
      sessionId: undefined,
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
}
