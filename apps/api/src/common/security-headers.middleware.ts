import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

function authMode(): 'dev' | 'local' | 'oidc' | 'service' {
  const mode = process.env['SUPPORTPLANE_AUTH_MODE'];
  if (mode === 'local') return 'local';
  if (mode === 'oidc') return 'oidc';
  if (mode === 'service') return 'service';
  return 'dev';
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Strict-Transport-Security is intentionally omitted because the local sandbox uses HTTP.
    res.setHeader('X-SupportPlane-Auth-Mode', authMode());
    next();
  }
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-SupportPlane-Auth-Mode', authMode());
  next();
}
