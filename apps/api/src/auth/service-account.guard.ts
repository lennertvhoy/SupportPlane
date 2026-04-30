import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { CurrentIdentity } from './auth.types.js';

@Injectable()
export class ServiceAccountGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { currentIdentity?: CurrentIdentity }>();
    const token = req.headers['x-service-token'];

    // Reject missing, suspicious, or short tokens
    if (typeof token !== 'string' || token === 'undefined' || token.length <= 10) {
      throw new UnauthorizedException({
        error: 'invalid_service_token',
        message: 'Service token invalid or expired',
      });
    }

    // Persisted DB-backed token resolution with hashing, expiry, and revocation checks
    const identity = await this.authService.resolveServiceAccountToken(token);
    if (!identity) {
      throw new UnauthorizedException({
        error: 'invalid_service_token',
        message: 'Service token invalid, expired, or revoked',
      });
    }

    req.currentIdentity = identity;
    return true;
  }
}
