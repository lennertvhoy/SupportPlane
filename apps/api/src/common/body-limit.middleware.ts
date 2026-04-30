import { Injectable, NestMiddleware, Optional } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { getBodyLimitForPath } from './body-limit.config.js';
import { SecurityAuditService } from '../audit/security-audit.service.js';

/**
 * Express middleware that enforces path-specific body size limits.
 * Coordinator should apply this before the JSON body parser in main.ts/app.module.ts.
 */
@Injectable()
export class BodyLimitMiddleware implements NestMiddleware {
  constructor(@Optional() private readonly audit?: SecurityAuditService) {}

  use(req: Request, res: Response, next: NextFunction) {
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
      return;
    }

    next();
  }
}

/**
 * Standalone Express middleware function for coordinator integration.
 */
export function bodyLimitMiddleware(
  audit?: SecurityAuditService
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const limit = getBodyLimitForPath(req.path);
    const contentLength = req.headers['content-length'];
    const limitBytes = parseLimit(limit);

    if (contentLength && Number(contentLength) > limitBytes) {
      audit?.logBodyLimitDenied(req, limit);
      res.status(413).json({
        error: 'body_limit_exceeded',
        limit,
        path: req.path,
      });
      return;
    }

    next();
  };
}

function parseLimit(limit: string): number {
  const match = limit.match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i);
  if (!match) return 1024 * 1024; // fallback 1mb
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  return value * (multipliers[unit] || 1);
}
