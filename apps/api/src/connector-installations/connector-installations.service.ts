import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { AuditEventType, AuditActorType } from '@supportplane/contracts';
import type { AuditEvent as AuditEventShape, ConnectorInstallation as ConnectorInstallationShape } from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import type { DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

const SECRET_KEYS = ['apiToken', 'apiKey', 'authToken', 'password', 'secret', 'token', 'privateKey', 'credential', 'bearer', 'ZAMMAD_API_TOKEN'];

function redactConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    const lowerKey = key.toLowerCase();
    if (SECRET_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

function redactInstallation(installation: ConnectorInstallationShape): ConnectorInstallationShape {
  return {
    ...installation,
    config: redactConfig(installation.config),
  };
}

@Injectable()
export class ConnectorInstallationsService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  async createInstallation(
    identity: DevIdentity,
    dto: {
      name: string;
      adapterType: string;
      config?: Record<string, unknown>;
      safetyFlags?: Record<string, unknown>;
    }
  ) {
    requirePermission(identity, 'connector_installation:write');
    const now = new Date().toISOString();
    const installation: ConnectorInstallationShape = {
      id: randomUUID() as ConnectorInstallationShape['id'],
      tenantId: identity.tenantId as ConnectorInstallationShape['tenantId'],
      name: dto.name,
      adapterType: dto.adapterType,
      capabilities: [],
      config: dto.config ?? {},
      secretReferenceIds: [],
      status: 'inactive',
      mockMode: true,
      enabled: false,
      safetyFlags: dto.safetyFlags ?? { validateBeforeWrite: true, allowRealCalls: false },
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveConnectorInstallation(installation);
    await this.appendAuditEvent(identity, AuditEventType.enum.connector_installation_updated, 'connector_installation', installation.id, {
      action: 'created',
      name: installation.name,
      mockDevOnly: true,
    });
    return { installation: redactInstallation(installation) };
  }

  async getConnectorInstallation(identity: DevIdentity, id: string) {
    requirePermission(identity, 'connector_installation:read');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }
    return redactInstallation(installation);
  }

  async listConnectorInstallations(identity: DevIdentity) {
    requirePermission(identity, 'connector_installation:read');
    const installations = await this.store.listConnectorInstallations(identity.tenantId);
    return installations.map(redactInstallation);
  }

  async updateInstallation(
    identity: DevIdentity,
    id: string,
    dto: {
      name?: string;
      displayName?: string;
      description?: string;
      config?: Record<string, unknown>;
      status?: string;
      mockMode?: boolean;
      enabled?: boolean;
      capabilities?: string[];
      safetyFlags?: Record<string, unknown>;
      timeoutMs?: number;
    }
  ) {
    requirePermission(identity, 'connector_installation:write');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }

    const updated: ConnectorInstallationShape = {
      ...installation,
      name: dto.name ?? installation.name,
      displayName: dto.displayName !== undefined ? dto.displayName : installation.displayName,
      description: dto.description !== undefined ? dto.description : installation.description,
      config: dto.config ?? installation.config,
      status: (dto.status ?? installation.status) as ConnectorInstallationShape['status'],
      mockMode: dto.mockMode !== undefined ? dto.mockMode : installation.mockMode,
      enabled: dto.enabled !== undefined ? dto.enabled : installation.enabled,
      capabilities: dto.capabilities ?? installation.capabilities,
      safetyFlags: dto.safetyFlags ?? installation.safetyFlags,
      timeoutMs: dto.timeoutMs !== undefined ? dto.timeoutMs : installation.timeoutMs,
      updatedAt: new Date().toISOString(),
    };

    await this.store.saveConnectorInstallation(updated);
    await this.appendAuditEvent(identity, AuditEventType.enum.connector_installation_updated, 'connector_installation', id, {
      previousStatus: installation.status,
      newStatus: updated.status,
      previousEnabled: installation.enabled,
      newEnabled: updated.enabled,
      previousMockMode: installation.mockMode,
      newMockMode: updated.mockMode,
      updatedBy: identity.userId,
    });

    return { installation: redactInstallation(updated) };
  }

  async validateInstallation(
    identity: DevIdentity,
    id: string
  ) {
    requirePermission(identity, 'connector_installation:test');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }

    const result = {
      valid: true,
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      errors: [] as string[],
      warnings: ['This is a mock validation. No real network call was made.'],
      timestamp: new Date().toISOString(),
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_config_validated, 'connector_installation', id, {
      mode: result.mode,
      realNetwork: result.realNetwork,
      writebackEnabled: result.writebackEnabled,
      mockDevOnly: true,
    });

    return { installationId: id, result };
  }

  async testInstallation(
    identity: DevIdentity,
    id: string
  ) {
    requirePermission(identity, 'connector_installation:test');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }

    const result = {
      success: true,
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      latencyMs: 0,
      responseSummary: 'Mock test succeeded. No real connector was contacted.',
      timestamp: new Date().toISOString(),
    };

    await this.appendAuditEvent(identity, AuditEventType.enum.connector_tested, 'connector_installation', id, {
      mode: result.mode,
      realNetwork: result.realNetwork,
      writebackEnabled: result.writebackEnabled,
      mockDevOnly: true,
    });

    return { installationId: id, result };
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
