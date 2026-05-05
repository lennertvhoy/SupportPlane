import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { computeIntegrityHash } from '@supportplane/audit';
import { AuditActorType, AuditEventType } from '@supportplane/contracts';
import { permissionsForRoles } from './rbac.js';
import { verifyLocalPassword } from './password.js';
import type { CurrentIdentity, OidcConfig, MfaHookStatus } from './auth.types.js';

const SESSION_COOKIE = 'supportplane_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for local auth');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function json(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class AuthService {
  private prismaClient?: PrismaClient;

  private get prisma(): PrismaClient {
    this.prismaClient ??= createPrismaClient();
    return this.prismaClient;
  }

  getSessionCookieName(): string {
    return SESSION_COOKIE;
  }

  async login(email: string, password: string, tenantSlug?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        status: 'active',
        ...(tenantSlug ? { tenant: { slug: tenantSlug } } : {}),
      },
      include: { tenant: true, roles: true },
    });

    if (
      !user ||
      user.tenant.status !== 'active' ||
      !verifyLocalPassword(password, user.passwordHash)
    ) {
      if (user) {
        await this.recordAudit(
          user.tenantId,
          user.id,
          undefined,
          AuditEventType.enum.user_login_failed,
          'auth',
          user.id,
          {
            email: normalizedEmail,
            tenantSlug: user.tenant.slug,
            reason: 'invalid_credentials',
          },
        );
      }
      return undefined;
    }

    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.localAuthSession.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: tokenHash(rawToken),
        expiresAt,
      },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.recordAudit(
      user.tenantId,
      user.id,
      undefined,
      AuditEventType.enum.user_login,
      'auth',
      user.id,
      {
        email: user.email,
        tenantSlug: user.tenant.slug,
        authMode: 'local',
      },
    );

    return {
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      identity: this.mapIdentity(user),
    };
  }

  async logout(token: string | undefined, identity?: CurrentIdentity): Promise<void> {
    if (!token) return;
    await this.prisma.localAuthSession.updateMany({
      where: { tokenHash: tokenHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (identity) {
      await this.recordAudit(
        identity.tenantId,
        identity.userId,
        undefined,
        AuditEventType.enum.user_logout,
        'auth',
        identity.userId,
        {
          authMode: 'local',
        },
      );
    }
  }

  async resolveSession(token: string | undefined): Promise<CurrentIdentity | undefined> {
    if (!token) return undefined;
    const session = await this.prisma.localAuthSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: { include: { tenant: true, roles: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now())
      return undefined;
    if (session.user.status !== 'active' || session.user.tenant.status !== 'active')
      return undefined;
    return this.mapIdentity(session.user);
  }

  async recordAccessDenied(
    identity: CurrentIdentity,
    permission: string,
    resourceType: string,
    resourceId: string,
    reason: string,
  ) {
    await this.recordAudit(
      identity.tenantId,
      identity.userId,
      undefined,
      AuditEventType.enum.rbac_access_denied,
      resourceType,
      resourceId,
      { permission, reason, roles: identity.roles, authMode: identity.authMode },
    );
  }

  async recordTenantBoundaryDenied(
    identity: CurrentIdentity,
    resourceType: string,
    resourceId: string,
  ) {
    await this.recordAudit(
      identity.tenantId,
      identity.userId,
      undefined,
      AuditEventType.enum.tenant_boundary_denied,
      resourceType,
      resourceId,
      { reason: 'not_found_in_actor_tenant', authMode: identity.authMode },
    );
  }

  async listTenantAuditEvents(identity: CurrentIdentity) {
    const events = await this.prisma.auditEvent.findMany({
      where: { tenantId: identity.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return events.map((event) => ({
      id: event.id,
      tenantId: event.tenantId,
      sessionId: event.sessionId ?? undefined,
      eventType: event.eventType,
      actorType: event.actorType,
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      metadata: event.metadata,
      integrityHash: event.integrityHash ?? undefined,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  private mapIdentity(user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    tenant: { name: string; slug: string };
    roles: Array<{ name: string; permissions: string[] }>;
  }): CurrentIdentity {
    const roles = user.roles.map((role) => role.name);
    const rolePermissions = user.roles.flatMap((role) => role.permissions);
    const permissions = Array.from(new Set([...permissionsForRoles(roles), ...rolePermissions]));
    return {
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: roles[0],
      roles,
      permissions,
      authMode: 'local',
    };
  }

  getOidcConfig(): OidcConfig | null {
    const issuerUrl = process.env['OIDC_ISSUER_URL'];
    const clientId = process.env['OIDC_CLIENT_ID'];
    const clientSecret = process.env['OIDC_CLIENT_SECRET'];
    const redirectUri = process.env['OIDC_REDIRECT_URI'];
    const scopesEnv = process.env['OIDC_SCOPES'];
    if (!issuerUrl || !clientId || !redirectUri) {
      return null;
    }
    return {
      issuerUrl,
      clientId,
      clientSecret: clientSecret ?? '',
      redirectUri,
      scopes: scopesEnv
        ? scopesEnv.split(',').map((s) => s.trim())
        : ['openid', 'profile', 'email'],
    };
  }

  validateOidcConfig(): { valid: boolean; reason?: string } {
    const config = this.getOidcConfig();
    if (!config) {
      return { valid: false, reason: 'OIDC environment variables not configured' };
    }
    try {
      const url = new URL(config.issuerUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { valid: false, reason: 'Issuer URL must use http or https' };
      }
    } catch {
      return { valid: false, reason: 'Issuer URL is not a valid URL' };
    }
    if (config.clientId.length < 3) {
      return { valid: false, reason: 'Client ID is too short' };
    }
    return { valid: true };
  }

  // OIDC session persistence
  async createOidcSession(
    identity: CurrentIdentity,
    tokenHash: string,
    idTokenSub: string,
    idTokenIssuer: string,
    idTokenAud: string,
    expiresAt: Date,
    oidcRealmRoles?: string[],
  ) {
    // Auto-provision OIDC user if they don't exist yet
    const user = await this.prisma.user.upsert({
      where: { id: identity.userId },
      create: {
        id: identity.userId,
        tenantId: identity.tenantId,
        email: identity.userEmail || identity.userId,
        name: identity.userName || identity.userEmail || identity.userId,
        status: 'active',
      },
      update: {
        email: identity.userEmail || identity.userId,
        name: identity.userName || identity.userEmail || identity.userId,
        status: 'active',
      },
    });
    // Connect OIDC realm roles to SupportPlane Role records
    const effectiveRealmRoles = oidcRealmRoles?.length ? oidcRealmRoles : identity.roles;
    if (effectiveRealmRoles && effectiveRealmRoles.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: {
          tenantId: identity.tenantId,
          name: { in: effectiveRealmRoles },
        },
      });
      if (roles.length > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            roles: {
              connect: roles.map((r) => ({ id: r.id })),
            },
          },
        });
      }
    }
    await this.prisma.oidcAuthSession.create({
      data: {
        tenantId: identity.tenantId,
        userId: identity.userId,
        tokenHash,
        idTokenSub,
        idTokenIssuer,
        idTokenAud,
        expiresAt,
      },
    });
    await this.recordAudit(
      identity.tenantId,
      identity.userId,
      undefined,
      AuditEventType.enum.user_login,
      'auth',
      identity.userId,
      {
        email: identity.userEmail,
        tenantSlug: identity.tenantSlug,
        authMode: 'oidc',
      },
    );
  }

  async resolveOidcSession(token: string | undefined): Promise<CurrentIdentity | undefined> {
    if (!token) return undefined;
    const session = await this.prisma.oidcAuthSession.findUnique({
      where: { tokenHash: tokenHash(token) },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now())
      return undefined;
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { roles: true, tenant: true },
    });
    const roles = user?.roles.map((r) => r.name) ?? [];
    const userRole = roles.find((r) => ['admin', 'operator', 'viewer'].includes(r)) ?? 'viewer';
    const effectiveRoles = roles.length > 0 ? roles : [userRole];
    return {
      tenantId: session.tenantId,
      tenantName: user?.tenant?.name,
      tenantSlug: user?.tenant?.slug,
      userId: session.userId,
      userEmail: user?.email,
      userName: user?.name,
      userRole,
      roles: effectiveRoles,
      permissions: permissionsForRoles(effectiveRoles),
      authMode: 'oidc',
    };
  }

  async logoutOidcSession(token: string | undefined, identity?: CurrentIdentity): Promise<void> {
    if (!token) return;
    await this.prisma.oidcAuthSession.updateMany({
      where: { tokenHash: tokenHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (identity) {
      await this.recordAudit(
        identity.tenantId,
        identity.userId,
        undefined,
        AuditEventType.enum.user_logout,
        'auth',
        identity.userId,
        {
          authMode: 'oidc',
        },
      );
    }
  }

  // Service accounts
  async listServiceAccounts(tenantId: string) {
    return this.prisma.serviceAccount.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        roles: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createServiceAccount(
    tenantId: string,
    name: string,
    description?: string,
    roles?: string[],
  ) {
    return this.prisma.serviceAccount.create({
      data: {
        tenantId,
        name,
        description: description ?? '',
        roles: roles ?? ['viewer'],
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        roles: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createServiceAccountToken(
    serviceAccountId: string,
    tenantId: string,
    scopes?: string[],
    ttlHours = 168,
  ) {
    const rawToken = `spt_${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * ttlHours);
    const token = await this.prisma.serviceAccountToken.create({
      data: {
        tenantId,
        serviceAccountId,
        tokenHash: tokenHash(rawToken),
        scopes: scopes ?? ['support_session:read'],
        expiresAt,
      },
      select: {
        id: true,
        tenantId: true,
        serviceAccountId: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return { rawToken, token };
  }

  async resolveServiceAccountToken(
    token: string | undefined,
  ): Promise<CurrentIdentity | undefined> {
    if (!token || !token.startsWith('spt_')) return undefined;
    const record = await this.prisma.serviceAccountToken.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { serviceAccount: true },
    });
    if (!record || record.revokedAt || record.expiresAt.getTime() <= Date.now()) return undefined;
    if (record.serviceAccount.status !== 'active') return undefined;
    // Update last used timestamp
    await this.prisma.serviceAccountToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
    const roles =
      record.serviceAccount.roles.length > 0 ? record.serviceAccount.roles : ['service'];
    return {
      tenantId: record.tenantId,
      userId: record.serviceAccountId,
      userRole: roles[0],
      roles,
      permissions: permissionsForRoles(roles),
      authMode: 'service',
      serviceActor: record.serviceAccount.name,
    };
  }

  async revokeServiceAccountToken(serviceAccountId: string, tenantId: string) {
    await this.prisma.serviceAccountToken.updateMany({
      where: { serviceAccountId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  getServiceAccountHooks(): { note: string; available: boolean } {
    return {
      note: 'Service account and token persistence implemented with hashed storage and expiry.',
      available: true,
    };
  }

  getMfaHookStatus(): MfaHookStatus {
    return {
      mfaHookAvailable: true,
      mfaEnforced: false,
      mfaRequired: false,
    };
  }

  private async recordAudit(
    tenantId: string,
    actorId: string,
    sessionId: string | undefined,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    const now = new Date();
    await this.prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        tenantId,
        sessionId,
        eventType,
        actorType: AuditActorType.enum.user,
        actorId,
        action: eventType,
        resourceType,
        resourceId,
        metadata: json(metadata),
        integrityHash: computeIntegrityHash({
          eventType,
          actorId,
          resourceId,
          metadata,
          now: now.toISOString(),
        }),
        createdAt: now,
      },
    });
  }
}
