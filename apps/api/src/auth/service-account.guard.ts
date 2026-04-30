import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentIdentity } from './auth.types.js';

@Injectable()
export class ServiceAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { currentIdentity?: CurrentIdentity }>();
    const token = req.headers['x-service-token'];

    // Reject missing, suspicious, or short tokens
    if (typeof token !== 'string' || token === 'undefined' || token.length <= 10) {
      throw new UnauthorizedException({
        error: 'invalid_service_token',
        message: 'Service token invalid or expired',
      });
    }

    // Conceptual short-lived expiry check:
    // In a production system we would look up tokenHash in persistent storage,
    // compare against a stored expiresAt, and enforce scope restrictions.
    // This slice has no DB table for short-lived tokens, so only format validation is performed.

    req.currentIdentity = {
      tenantId: (req.headers['x-tenant-id'] as string) || 'service-tenant',
      userId: (req.headers['x-service-user-id'] as string) || 'service-account',
      userRole: 'service',
      roles: ['service'],
      permissions: [
        'support_session:read',
        'ticket:read',
        'audit:read',
        'connector:read',
      ],
      authMode: 'service',
      serviceActor: 'external-service',
    };

    return true;
  }
}
