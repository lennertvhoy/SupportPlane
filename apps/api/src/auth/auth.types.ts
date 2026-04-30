export type AuthMode = 'dev' | 'local' | 'service' | 'oidc';

export interface CurrentIdentity {
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  roles: string[];
  permissions: string[];
  authMode: AuthMode;
  serviceActor?: string;
}

export type DevIdentity = CurrentIdentity;

export interface AuthenticatedRequest {
  currentIdentity?: CurrentIdentity;
}

export interface OidcConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface ServiceAccount {
  id: string;
  tenantId: string;
  name: string;
  roles: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface MfaHookStatus {
  mfaRequired: boolean;
  mfaEnforced: boolean;
  mfaMethod?: 'totp' | 'webauthn';
  mfaHookAvailable: boolean;
}

export interface ShortLivedToken {
  tokenHash: string;
  expiresAt: string;
  scope: string[];
  serviceAccountId?: string;
}
