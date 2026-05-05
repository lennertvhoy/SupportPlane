import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import type {
  ConnectorCredentialReference,
  ConnectorInstallation,
  CredentialResolutionMetadata,
} from '@supportplane/contracts';

export interface ResolvedCredential {
  apiToken: string;
  metadata: CredentialResolutionMetadata & { secretRefHash?: string };
}

function env(name: string): string | undefined {
  return process.env[name];
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class CredentialResolverService {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async resolveZammadApiToken(
    tenantId: string,
    installation: ConnectorInstallation,
  ): Promise<ResolvedCredential> {
    const enabled = env('OPENBAO_RESOLVER_ENABLED') === 'true';
    const credentialReferenceId = installation.secretReferenceIds[0] ?? 'none';

    if (!enabled) {
      throw this.error(
        'disabled',
        tenantId,
        credentialReferenceId,
        'OpenBao sandbox resolver is disabled.',
      );
    }

    if (!credentialReferenceId || credentialReferenceId === 'none') {
      throw this.error(
        'missing',
        tenantId,
        credentialReferenceId,
        'No credential reference is linked to this connector installation.',
      );
    }

    const credential = await this.store.getCredentialReference(tenantId, credentialReferenceId);
    if (!credential) {
      throw this.error(
        'missing',
        tenantId,
        credentialReferenceId,
        'Credential reference is not currently locatable for this tenant.',
      );
    }

    const secretRef = credential.secretRef;
    if (!secretRef || secretRef === 'local-dev-placeholder' || secretRef === '[REDACTED]') {
      throw this.error(
        'missing',
        tenantId,
        credential.id,
        'Credential reference has no OpenBao sandbox path.',
      );
    }

    const addr = env('OPENBAO_ADDR');
    const token = env('OPENBAO_TOKEN');
    if (!addr || !token) {
      throw this.error(
        'disabled',
        tenantId,
        credential.id,
        'OpenBao address/token is not configured for the API runtime.',
      );
    }

    const apiToken = await this.fetchOpenBaoSecret(addr, token, secretRef);
    if (!apiToken) {
      throw this.error(
        'missing',
        tenantId,
        credential.id,
        'OpenBao secret did not contain a Zammad API token.',
      );
    }

    return {
      apiToken,
      metadata: {
        tenantId,
        credentialReferenceId: credential.id,
        resolver: 'openbao',
        resolverMode: 'local-sandbox',
        secretPath: this.safePathLabel(secretRef),
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        secretExposed: false,
        persistedRawSecret: false,
        safeLabel: 'OpenBao sandbox resolver',
        secretRefHash: sha256(secretRef),
      },
    };
  }

  async getResolutionMetadata(
    tenantId: string,
    credential: ConnectorCredentialReference,
  ): Promise<CredentialResolutionMetadata & { secretRefHash?: string }> {
    const enabled = env('OPENBAO_RESOLVER_ENABLED') === 'true';
    return {
      tenantId,
      credentialReferenceId: credential.id,
      resolver: enabled ? 'openbao' : 'disabled',
      resolverMode: enabled ? 'local-sandbox' : 'disabled',
      secretPath:
        credential.secretRef && credential.secretRef !== '[REDACTED]'
          ? this.safePathLabel(credential.secretRef)
          : undefined,
      status: enabled ? 'resolved' : 'disabled',
      resolvedAt: enabled ? new Date().toISOString() : undefined,
      secretExposed: false,
      persistedRawSecret: false,
      safeLabel: enabled ? 'OpenBao sandbox resolver' : 'Credential resolver disabled',
      secretRefHash: credential.secretRef ? sha256(credential.secretRef) : undefined,
    };
  }

  private async fetchOpenBaoSecret(
    addr: string,
    token: string,
    secretRef: string,
  ): Promise<string | undefined> {
    const url = `${addr.replace(/\/$/, '')}/v1/${secretRef.replace(/^\//, '')}`;
    const response = await fetch(url, {
      headers: {
        'X-Vault-Token': token,
      },
    });
    if (!response.ok) {
      throw new Error(`OpenBao resolver failed with HTTP ${response.status}`);
    }
    const body = (await response.json()) as {
      data?: { data?: Record<string, unknown> } & Record<string, unknown>;
    };
    const values = body.data?.data ?? body.data ?? {};
    const tokenValue = values['apiToken'] ?? values['api_token'] ?? values['token'];
    return typeof tokenValue === 'string' ? tokenValue : undefined;
  }

  private safePathLabel(secretRef: string): string {
    const parts = secretRef.split('/').filter(Boolean);
    return parts.length > 0 ? `.../${parts.slice(-2).join('/')}` : '[openbao-path-redacted]';
  }

  private error(
    status: CredentialResolutionMetadata['status'],
    tenantId: string,
    credentialReferenceId: string,
    message: string,
  ): Error & { metadata: CredentialResolutionMetadata } {
    const error = new Error(message) as Error & { metadata: CredentialResolutionMetadata };
    error.metadata = {
      tenantId,
      credentialReferenceId,
      resolver: status === 'disabled' ? 'disabled' : 'openbao',
      resolverMode: status === 'disabled' ? 'disabled' : 'local-sandbox',
      status,
      secretExposed: false,
      persistedRawSecret: false,
      safeLabel: message,
    };
    return error;
  }
}
