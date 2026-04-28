import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { AuditEventType, AuditActorType } from '@supportplane/contracts';
import type { AuditEvent as AuditEventShape, ConnectorCredentialReference as ConnectorCredentialReferenceShape } from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import type { DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

@Injectable()
export class CredentialReferencesService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  async createCredentialReference(
    identity: DevIdentity,
    dto: {
      connectorType: string;
      displayName: string;
      description?: string;
      status?: string;
      secretKind?: string;
    }
  ) {
    requirePermission(identity, 'credential_reference:write');
    const now = new Date().toISOString();
    const ref: ConnectorCredentialReferenceShape = {
      id: randomUUID() as ConnectorCredentialReferenceShape['id'],
      tenantId: identity.tenantId as ConnectorCredentialReferenceShape['tenantId'],
      connectorType: dto.connectorType,
      displayName: dto.displayName,
      description: dto.description,
      status: (dto.status ?? 'active') as ConnectorCredentialReferenceShape['status'],
      secretKind: (dto.secretKind ?? 'api_token_placeholder') as ConnectorCredentialReferenceShape['secretKind'],
      secretRef: 'local-dev-placeholder',
      createdAt: now,
      updatedAt: now,
      createdByUserId: identity.userId,
    };
    await this.store.saveCredentialReference(ref);
    await this.appendAuditEvent(identity, AuditEventType.enum.credential_reference_created, 'credential_reference', ref.id, {
      connectorType: ref.connectorType,
      displayName: ref.displayName,
      secretKind: ref.secretKind,
      mockDevOnly: true,
    });
    return { credentialReference: this.redactCredentialReference(ref) };
  }

  async getCredentialReference(identity: DevIdentity, id: string) {
    requirePermission(identity, 'credential_reference:read');
    const ref = await this.store.getCredentialReference(identity.tenantId, id);
    if (!ref) {
      throw new NotFoundException(`Credential reference ${id} not found`);
    }
    return { credentialReference: this.redactCredentialReference(ref) };
  }

  async listCredentialReferences(identity: DevIdentity, options?: { connectorType?: string }) {
    requirePermission(identity, 'credential_reference:read');
    const refs = await this.store.listCredentialReferences(identity.tenantId, options);
    return { credentialReferences: refs.map((r) => this.redactCredentialReference(r)) };
  }

  async updateCredentialReference(
    identity: DevIdentity,
    id: string,
    dto: {
      displayName?: string;
      description?: string;
      status?: string;
      secretKind?: string;
    }
  ) {
    requirePermission(identity, 'credential_reference:write');
    const ref = await this.store.getCredentialReference(identity.tenantId, id);
    if (!ref) {
      throw new NotFoundException(`Credential reference ${id} not found`);
    }

    const updated: ConnectorCredentialReferenceShape = {
      ...ref,
      displayName: dto.displayName ?? ref.displayName,
      description: dto.description !== undefined ? dto.description : ref.description,
      status: (dto.status ?? ref.status) as ConnectorCredentialReferenceShape['status'],
      secretKind: (dto.secretKind ?? ref.secretKind) as ConnectorCredentialReferenceShape['secretKind'],
      updatedAt: new Date().toISOString(),
      updatedByUserId: identity.userId,
    };

    await this.store.saveCredentialReference(updated);
    await this.appendAuditEvent(identity, AuditEventType.enum.credential_reference_updated, 'credential_reference', id, {
      previousStatus: ref.status,
      newStatus: updated.status,
      previousSecretKind: ref.secretKind,
      newSecretKind: updated.secretKind,
      updatedBy: identity.userId,
      mockDevOnly: true,
    });

    return { credentialReference: this.redactCredentialReference(updated) };
  }

  private redactCredentialReference(ref: ConnectorCredentialReferenceShape): ConnectorCredentialReferenceShape {
    return {
      ...ref,
      secretRef: '[REDACTED]',
    };
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
