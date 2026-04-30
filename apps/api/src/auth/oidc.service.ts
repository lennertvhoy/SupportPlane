import { Injectable, Logger } from '@nestjs/common';
import * as client from 'openid-client';
import { randomBytes, createHash } from 'crypto';
import type { CurrentIdentity, OidcConfig } from './auth.types.js';

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

interface OidcSessionState {
  state: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
  createdAt: number;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private configPromise?: Promise<client.Configuration>;
  private readonly sessionStates = new Map<string, OidcSessionState>();
  private readonly SESSION_TTL_MS = 1000 * 60 * 10; // 10 minutes for OAuth state

  constructor() {
    // Periodic cleanup of expired session states
    setInterval(() => this.cleanupExpiredStates(), 60000);
  }

  getOidcConfig(): OidcConfig | null {
    const issuerUrl = process.env['OIDC_ISSUER_URL'];
    const clientId = process.env['OIDC_CLIENT_ID'];
    const clientSecret = process.env['OIDC_CLIENT_SECRET'];
    const redirectUri = process.env['OIDC_REDIRECT_URI'];
    if (!issuerUrl || !clientId || !redirectUri) {
      return null;
    }
    return {
      issuerUrl,
      clientId,
      clientSecret: clientSecret ?? '',
      redirectUri,
      scopes: process.env['OIDC_SCOPES'] ? process.env['OIDC_SCOPES'].split(',').map((s) => s.trim()) : ['openid', 'profile', 'email'],
    };
  }

  private getBrowserBaseUrl(): string {
    // For local sandbox: browser may use a different URL (e.g. localhost port-forward)
    // than the internal cluster DNS used by the API for discovery/token exchange.
    return process.env['OIDC_BROWSER_BASE_URL'] ?? this.getOidcConfig()?.issuerUrl ?? '';
  }

  isOidcEnabled(): boolean {
    return this.getOidcConfig() !== null;
  }

  private async getConfiguration(): Promise<client.Configuration | undefined> {
    const oidcConfig = this.getOidcConfig();
    if (!oidcConfig) return undefined;

    if (!this.configPromise) {
      this.configPromise = client.discovery(
        new URL(oidcConfig.issuerUrl),
        oidcConfig.clientId,
        { redirect_uris: [oidcConfig.redirectUri] },
        oidcConfig.clientSecret ? client.ClientSecretPost(oidcConfig.clientSecret) : client.None(),
        { execute: [client.allowInsecureRequests] }
      ).catch((err) => {
        this.logger.error(`OIDC discovery failed: ${err instanceof Error ? err.message : String(err)}`);
        this.configPromise = undefined;
        throw err;
      });
    }
    return this.configPromise;
  }

  async buildAuthorizationUrl(): Promise<{ url: string; sessionId: string } | undefined> {
    const configuration = await this.getConfiguration();
    if (!configuration) return undefined;

    const state = client.randomState();
    const codeVerifier = client.randomPKCECodeVerifier();
    const nonce = client.randomNonce();
    const oidcConfig = this.getOidcConfig()!;

    const sessionId = randomBytes(16).toString('hex');
    this.sessionStates.set(sessionId, {
      state,
      codeVerifier,
      nonce,
      redirectUri: oidcConfig.redirectUri,
      createdAt: Date.now(),
    });

    const browserBase = this.getBrowserBaseUrl();
    const authUrl = new URL(`${browserBase}/protocol/openid-connect/auth`);
    authUrl.searchParams.set('client_id', oidcConfig.clientId);
    authUrl.searchParams.set('redirect_uri', oidcConfig.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oidcConfig.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', await client.calculatePKCECodeChallenge(codeVerifier));
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('nonce', nonce);

    return { url: authUrl.toString(), sessionId };
  }

  async authorizationCodeGrant(
    sessionId: string,
    callbackUrl: string
  ): Promise<{ identity: CurrentIdentity; rawToken: string; expiresAt: Date } | undefined> {
    const sessionState = this.sessionStates.get(sessionId);
    if (!sessionState) {
      this.logger.warn('OIDC callback: session state not found');
      return undefined;
    }
    this.sessionStates.delete(sessionId);

    const configuration = await this.getConfiguration();
    if (!configuration) return undefined;

    let tokens;
    try {
      tokens = await client.authorizationCodeGrant(configuration, new URL(callbackUrl), {
        pkceCodeVerifier: sessionState.codeVerifier,
        expectedState: sessionState.state,
        expectedNonce: sessionState.nonce,
      });
    } catch (err) {
      this.logger.error(`OIDC authorizationCodeGrant failed: ${err instanceof Error ? err.message : String(err)}`);
      if (err instanceof Error && 'cause' in err && (err as unknown as { cause: unknown }).cause) {
        this.logger.error(`OIDC token endpoint error cause: ${JSON.stringify((err as unknown as { cause: unknown }).cause)}`);
      }
      return undefined;
    }

    const claims = tokens.claims();
    if (!claims) {
      this.logger.warn('OIDC callback: no ID token claims');
      return undefined;
    }

    // Validate nonce if present in claims
    if (claims.nonce !== undefined && claims.nonce !== sessionState.nonce) {
      this.logger.warn('OIDC callback: nonce mismatch');
      return undefined;
    }

    const email = typeof claims.email === 'string' ? claims.email : '';
    const name = typeof claims.name === 'string' ? claims.name : email;
    const sub = claims.sub ?? '';

    // Map Keycloak realm roles to SupportPlane roles
    const realmRoles: string[] = [];
    const realmAccess = claims.realm_access as Record<string, unknown> | undefined;
    if (realmAccess && Array.isArray(realmAccess.roles)) {
      for (const role of realmAccess.roles) {
        if (typeof role === 'string') realmRoles.push(role);
      }
    }

    const role = realmRoles.find((r) => ['admin', 'operator', 'viewer'].includes(r)) ?? 'viewer';

    const identity: CurrentIdentity = {
      tenantId: 'dev-tenant', // deterministic mapping for local sandbox
      tenantName: 'Dev Tenant',
      tenantSlug: 'dev-tenant',
      userId: `oidc-${sub}`,
      userEmail: email,
      userName: name,
      userRole: role,
      roles: realmRoles.length > 0 ? realmRoles : [role],
      permissions: [],
      authMode: 'oidc',
    };

    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8); // 8 hours

    return { identity, rawToken, expiresAt };
  }

  getSessionCookieName(): string {
    return 'supportplane_oidc_session';
  }

  hashToken(rawToken: string): string {
    return tokenHash(rawToken);
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [id, state] of this.sessionStates.entries()) {
      if (now - state.createdAt > this.SESSION_TTL_MS) {
        this.sessionStates.delete(id);
      }
    }
  }
}
