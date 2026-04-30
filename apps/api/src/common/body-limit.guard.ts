import { Injectable, CanActivate, ExecutionContext, Optional } from '@nestjs/common';
import type { Request, Response } from 'express';
import { getBodyLimitForPath } from './body-limit.config.js';
import { SecurityAuditService } from '../audit/security-audit.service.js';

function parseLimit(limit: string): number {
  const match = limit.match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i);
  if (!match) return 1024 * 1024;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  const multipliers: Record<string, number> = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  return value * (multipliers[unit] || 1);
}

@Injectable()
export class BodyLimitGuard implements CanActivate {
  constructor(@Optional() private readonly audit?: SecurityAuditService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const limit = getBodyLimitForPath(req.path);
    const contentLength = req.headers['content-length'];
    const limitBytes = parseLimit(limit);

    if (contentLength && Number(contentLength) > limitBytes) {
      this.audit?.logBodyLimitDenied(req, limit);
      res.status(413).json({
        error: 'body_limit_exceeded',
        limit,
        path: req.path,
      });
      return false;
    }

    return true;
  }
}
