import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'crypto';
import { SecurityAuditService } from '../audit/security-audit.service.js';

export class RateLimitExceeded extends HttpException {
  constructor(retryAfter: number) {
    super({ error: 'rate_limit_exceeded', retryAfter }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;

const LIMITS: Record<string, number> = {
  global: 100,
  'auth:login': 5,
  writeback: 10,
  connectorRuntime: 20,
  telephony: 30,
};

function getLimitForPath(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes('/auth/login')) return LIMITS['auth:login'];
  if (lower.includes('/writeback') || lower.includes('/sandbox')) return LIMITS.writeback;
  if (lower.includes('/connector') || lower.includes('/runtime')) return LIMITS.connectorRuntime;
  if (lower.includes('/telephony') || lower.includes('/ami') || lower.includes('/asterisk'))
    return LIMITS.telephony;
  return LIMITS.global;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(@Optional() private readonly audit?: SecurityAuditService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = this.extractIp(req);
    const path = req.path;
    const isAuthLogin = path.toLowerCase().includes('/auth/login');
    const limit = getLimitForPath(path);
    const key = isAuthLogin ? `ip:${hashIp(ip)}:auth:/auth/login` : `ip:${hashIp(ip)}:${path}`;

    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      this.audit?.logRateLimitDenied(req, key, limit);
      throw new RateLimitExceeded(retryAfter);
    }

    bucket.count++;
    return true;
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? 'unknown';
  }
}
