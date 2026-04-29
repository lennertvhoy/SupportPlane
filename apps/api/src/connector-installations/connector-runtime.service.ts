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

    const isMock = installation.mockMode !== false;

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

    const warnings: string[] = isMock
      ? [
          'This is a mock readiness check. No real network call was made.',
          'Real writeback is not implemented.',
          'Secret resolution is not implemented.',
        ]
      : [
          'Real network mode is configured.',
          'Real writeback is not implemented (read-only for BL-107).',
          'Secret resolution is not implemented — env vars will be used.',
        ];

    if (linkedCount === 0) {
      warnings.push('No credential references are linked to this installation.');
    }

    if (!installation.enabled) {
      warnings.push('Connector installation is not enabled.');
    }

    const result: ConnectorRuntimeReadinessResult = {
      mockReady: isMock && installation.enabled === true,
      realReady: !isMock && installation.enabled === true,
      realNetwork: !isMock,
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
      mockMode: isMock,
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

    const readiness: ConnectorRuntimeReadinessResult = {
      mockReady: isMock && installation.enabled === true,
      realReady: !isMock && installation.enabled === true,
      realNetwork: !isMock,
      writebackEnabled: false,
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
            'Writeback is not implemented (BL-107 read-only).',
            'Secret resolution is not implemented — env vars will be used.',
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
      mode: isMock ? 'mock' : 'zammad',
      realNetwork: !isMock,
      writebackEnabled: false,
      externalWriteAttempted: false,
      readiness,
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_runtime_resolved, 'connector_installation', installation.id, {
      connectorType,
      mode: result.mode,
      realNetwork: result.realNetwork,
      credentialReferenceCount: credentialRefs.length,
      mockMode: isMock,
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
