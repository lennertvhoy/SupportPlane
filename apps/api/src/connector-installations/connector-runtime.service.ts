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

const ALLOWED_CONFIG_KEYS = [
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

@Injectable()
export class ConnectorRuntimeService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
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

    return {
      installationId,
      schema: {
        type: 'object',
        properties: {
          baseUrlPlaceholder: { type: 'string', description: 'Mock endpoint label or placeholder' },
          timeoutMs: { type: 'integer', minimum: 1000, maximum: 60000, description: 'Request timeout in milliseconds' },
          capabilities: { type: 'array', items: { type: 'string' }, description: 'Connector capabilities' },
          validateBeforeWrite: { type: 'boolean', description: 'Require validation before write operations' },
          maxRetries: { type: 'integer', minimum: 0, maximum: 10, description: 'Maximum retry attempts' },
          mockMode: { type: 'boolean', const: true, description: 'Mock mode — must be true' },
          status: { type: 'string', enum: ['active', 'inactive', 'error'] },
          enabled: { type: 'boolean', description: 'Whether the connector is enabled' },
          linkedCredentialReferenceIds: { type: 'array', items: { type: 'string' }, description: 'Linked credential reference IDs' },
        },
        required: ['mockMode'],
        additionalProperties: false,
      },
      safeFields: ALLOWED_CONFIG_KEYS,
      rejectedFields: UNSAFE_CONFIG_KEYS,
      mockOnly: true,
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

    const issues: Array<{ field: string; severity: 'error' | 'warning'; message: string; code: string }> = [];
    const warnings: string[] = [];

    // Check mockMode
    if (config.mockMode !== true) {
      issues.push({
        field: 'mockMode',
        severity: 'error',
        message: 'mockMode must be true. Real network mode is not implemented.',
        code: 'MOCK_MODE_REQUIRED',
      });
    }

    // Check for unsafe keys
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
      if (!ALLOWED_CONFIG_KEYS.includes(key)) {
        issues.push({
          field: key,
          severity: 'warning',
          message: `Field '${key}' is not in the allowed config schema and may be ignored.`,
          code: 'UNKNOWN_FIELD',
        });
      }
    }

    // Check for real-network implication keys
    const realNetworkImplyingKeys = ['baseUrl', 'endpoint', 'url', 'host', 'proxy'];
    for (const key of Object.keys(config)) {
      const lowerKey = key.toLowerCase();
      if (realNetworkImplyingKeys.some((rk) => lowerKey.includes(rk) && lowerKey !== 'baseurlplaceholder')) {
        issues.push({
          field: key,
          severity: 'error',
          message: `Field '${key}' may imply real network usage. Only baseUrlPlaceholder is allowed.`,
          code: 'REAL_NETWORK_FIELD_REJECTED',
        });
      }
    }

    if (issues.length === 0) {
      warnings.push('Config is valid for mock-only mode. No real network call will be made.');
    }

    const result: ConnectorRuntimeConfigValidationResult = {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      mockMode: true,
      realNetwork: false,
      writebackEnabled: false,
      issues,
      warnings,
      timestamp: new Date().toISOString(),
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_config_validated, 'connector_installation', installationId, {
      valid: result.valid,
      issueCount: issues.length,
      warningCount: warnings.length,
      mockDevOnly: true,
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

    const warnings: string[] = [
      'This is a mock readiness check. No real network call was made.',
      'Real writeback is not implemented.',
      'Secret resolution is not implemented.',
    ];

    if (linkedCount === 0) {
      warnings.push('No credential references are linked to this installation.');
    }

    if (!installation.enabled) {
      warnings.push('Connector installation is not enabled.');
    }

    const result: ConnectorRuntimeReadinessResult = {
      mockReady: installation.mockMode === true && installation.enabled === true,
      realReady: false,
      realNetwork: false,
      writebackEnabled: false,
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
      mockDevOnly: true,
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

    const readiness: ConnectorRuntimeReadinessResult = {
      mockReady: installation.mockMode === true && installation.enabled === true,
      realReady: false,
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      warnings: [
        'Runtime resolver operates in mock-only mode.',
        'No real network calls will be made.',
        'Secret resolution is not implemented.',
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
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      readiness,
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_runtime_resolved, 'connector_installation', installation.id, {
      connectorType,
      mode: result.mode,
      realNetwork: result.realNetwork,
      credentialReferenceCount: credentialRefs.length,
      mockDevOnly: true,
    });

    return result;
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
          secretResolutionImplemented: false,
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
