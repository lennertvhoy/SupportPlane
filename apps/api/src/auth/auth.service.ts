import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { computeIntegrityHash } from '@supportplane/audit';
import { AuditActorType, AuditEventType } from '@supportplane/contracts';
import { permissionsForRoles } from './rbac.js';
import { verifyLocalPassword } from './password.js';
import type { CurrentIdentity } from './auth.types.js';

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

    if (!user || user.tenant.status !== 'active' || !verifyLocalPassword(password, user.passwordHash)) {
      if (user) {
        await this.recordAudit(user.tenantId, user.id, undefined, AuditEventType.enum.user_login_failed, 'auth', user.id, {
          email: normalizedEmail,
          tenantSlug: user.tenant.slug,
          reason: 'invalid_credentials',
        });
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
    await this.recordAudit(user.tenantId, user.id, undefined, AuditEventType.enum.user_login, 'auth', user.id, {
      email: user.email,
      tenantSlug: user.tenant.slug,
      authMode: 'local',
    });

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
      await this.recordAudit(identity.tenantId, identity.userId, undefined, AuditEventType.enum.user_logout, 'auth', identity.userId, {
        authMode: 'local',
      });
    }
  }

  async resolveSession(token: string | undefined): Promise<CurrentIdentity | undefined> {
    if (!token) return undefined;
    const session = await this.prisma.localAuthSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: { include: { tenant: true, roles: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return undefined;
    if (session.user.status !== 'active' || session.user.tenant.status !== 'active') return undefined;
    return this.mapIdentity(session.user);
  }

  async recordAccessDenied(identity: CurrentIdentity, permission: string, resourceType: string, resourceId: string, reason: string) {
    await this.recordAudit(
      identity.tenantId,
      identity.userId,
      undefined,
      AuditEventType.enum.rbac_access_denied,
      resourceType,
      resourceId,
      { permission, reason, roles: identity.roles, authMode: identity.authMode }
    );
  }

  async recordTenantBoundaryDenied(identity: CurrentIdentity, resourceType: string, resourceId: string) {
    await this.recordAudit(
      identity.tenantId,
      identity.userId,
      undefined,
      AuditEventType.enum.tenant_boundary_denied,
      resourceType,
      resourceId,
      { reason: 'not_found_in_actor_tenant', authMode: identity.authMode }
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

  private async recordAudit(
    tenantId: string,
    actorId: string,
    sessionId: string | undefined,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>
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
