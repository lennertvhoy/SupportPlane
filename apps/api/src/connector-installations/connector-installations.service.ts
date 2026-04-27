import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { AuditEventType, AuditActorType } from '@supportplane/contracts';
import type { AuditEvent as AuditEventShape } from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import type { DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

@Injectable()
export class ConnectorInstallationsService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  async updateInstallation(
    identity: DevIdentity,
    id: string,
    dto: { name?: string; config?: Record<string, unknown>; status?: string; safetyFlags?: Record<string, unknown> }
  ) {
    requirePermission(identity, 'connector_installation:write');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }

    const updated = {
      ...installation,
      name: dto.name ?? installation.name,
      config: dto.config ?? installation.config,
      status: (dto.status ?? installation.status) as 'active' | 'inactive' | 'error',
      safetyFlags: dto.safetyFlags ?? installation.safetyFlags,
      updatedAt: new Date().toISOString(),
    };

    await this.store.saveConnectorInstallation(updated);
    await this.appendAuditEvent(identity, AuditEventType.enum.connector_installation_updated, 'connector_installation', id, {
      previousStatus: installation.status,
      newStatus: updated.status,
    });

    return { installation: updated };
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
