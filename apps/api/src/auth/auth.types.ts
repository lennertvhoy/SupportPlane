export type AuthMode = 'dev' | 'local' | 'service';

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
