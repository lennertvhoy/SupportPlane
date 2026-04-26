import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Development-only mock identity context.
 *
 * Extracts x-tenant-id, x-user-id, and optional x-user-role from headers.
 * Every tenant-scoped endpoint must include these headers.
 *
 * In production this middleware would be replaced by OIDC/JWT validation
 * and real RBAC enforcement.
 */
export interface DevIdentity {
  tenantId: string;
  userId: string;
  userRole?: string;
}

@Injectable()
export class DevIdentityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'];
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!tenantId || typeof tenantId !== 'string') {
      res.status(400).json({
        statusCode: 400,
        error: 'Missing required header: x-tenant-id',
        message: 'Tenant scoping is required for this endpoint.',
      });
      return;
    }

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        statusCode: 400,
        error: 'Missing required header: x-user-id',
        message: 'User identity is required for this endpoint.',
      });
      return;
    }

    (req as Request & { devIdentity: DevIdentity }).devIdentity = {
      tenantId,
      userId,
      userRole: typeof userRole === 'string' ? userRole : undefined,
    };

    next();
  }
}

export function getDevIdentity(req: Request): DevIdentity {
  const identity = (req as Request & { devIdentity?: DevIdentity }).devIdentity;
  if (!identity) {
    throw new Error('DevIdentity not set on request');
  }
  return identity;
}
