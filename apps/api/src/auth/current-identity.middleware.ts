import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { permissionsForRoles } from './rbac.js';
import type { AuthMode, CurrentIdentity } from './auth.types.js';

function authMode(): AuthMode {
  return process.env['SUPPORTPLANE_AUTH_MODE'] === 'local' ? 'local' : 'dev';
}

function readCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function readBearer(req: Request): string | undefined {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return undefined;
  return authorization.slice('Bearer '.length);
}

@Injectable()
export class CurrentIdentityMiddleware implements NestMiddleware {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (authMode() === 'dev') {
      const tenantId = req.headers['x-tenant-id'];
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      if (!tenantId || typeof tenantId !== 'string') {
        res.status(400).json({
          statusCode: 400,
          error: 'Missing required header: x-tenant-id',
          message: 'Tenant scoping is required for this dev-only endpoint.',
        });
        return;
      }

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          statusCode: 400,
          error: 'Missing required header: x-user-id',
          message: 'User identity is required for this dev-only endpoint.',
        });
        return;
      }

      const roles = [typeof userRole === 'string' ? userRole : 'support_agent'];
      (req as Request & { currentIdentity: CurrentIdentity }).currentIdentity = {
        tenantId,
        userId,
        userRole: roles[0],
        roles,
        permissions: permissionsForRoles(roles),
        authMode: 'dev',
      };
      next();
      return;
    }

    const token = readBearer(req) ?? readCookie(req, this.authService.getSessionCookieName());
    const identity = await this.authService.resolveSession(token);
    if (!identity) {
      next(new UnauthorizedException('Authentication required'));
      return;
    }
    (req as Request & { currentIdentity: CurrentIdentity }).currentIdentity = identity;
    next();
  }
}

export function getCurrentIdentity(req: Request): CurrentIdentity {
  const identity = (req as Request & { currentIdentity?: CurrentIdentity }).currentIdentity;
  if (!identity) {
    throw new UnauthorizedException('Authentication required');
  }
  return identity;
}
