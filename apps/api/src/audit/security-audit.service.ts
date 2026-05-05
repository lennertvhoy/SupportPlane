import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { telemetry } from '../telemetry/telemetry.service.js';
import { getCorrelationId } from '../telemetry/correlation.js';

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function safeLabel(value: unknown): string {
  if (value === undefined || value === null) return 'unknown';
  return String(value)
    .replace(/[^A-Za-z0-9_.:-]/g, '_')
    .slice(0, 96);
}

function tenantIdFromReq(req: Request): string | undefined {
  const identity = (req as Request & { currentIdentity?: { tenantId?: string } }).currentIdentity;
  if (identity?.tenantId) return identity.tenantId;
  const header = req.headers['x-tenant-id'];
  return typeof header === 'string' ? header : undefined;
}

@Injectable()
export class SecurityAuditService {
  logRateLimitDenied(req: Request, key: string, limit: number): void {
    const correlationId = getCorrelationId();
    const ip = hashIp(req.socket?.remoteAddress ?? 'unknown');
    telemetry.log({
      event: 'rate_limit_denied',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'denied',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        ipHash: ip,
        keyHash: createHash('sha256').update(key).digest('hex').slice(0, 16),
        limit,
      },
    });
  }

  logBodyLimitDenied(req: Request, limit: string): void {
    const correlationId = getCorrelationId();
    const ip = hashIp(req.socket?.remoteAddress ?? 'unknown');
    telemetry.log({
      event: 'body_limit_denied',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'denied',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        ipHash: ip,
        limit: safeLabel(limit),
        contentLength: safeLabel(req.headers['content-length']),
      },
    });
  }

  logInvalidServiceToken(req: Request, reason: string): void {
    const correlationId = getCorrelationId();
    const ip = hashIp(req.socket?.remoteAddress ?? 'unknown');
    telemetry.log({
      event: 'invalid_service_token',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'denied',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        ipHash: ip,
        reason: safeLabel(reason),
      },
    });
  }

  logInvalidConnectorConfig(req: Request, reason: string): void {
    const correlationId = getCorrelationId();
    telemetry.log({
      event: 'invalid_connector_config',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'denied',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        reason: safeLabel(reason),
      },
    });
  }

  logBlockedEgress(req: Request, url: string, decision: string): void {
    const correlationId = getCorrelationId();
    telemetry.log({
      event: 'blocked_egress',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'blocked',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        url: safeLabel(url),
        decision: safeLabel(decision),
      },
    });
  }

  logBlockedWriteback(req: Request, reason: string): void {
    const correlationId = getCorrelationId();
    telemetry.log({
      event: 'blocked_writeback',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'blocked',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        reason: safeLabel(reason),
      },
    });
  }

  logBlockedTelephonyControl(req: Request, callId: string, reason: string): void {
    const correlationId = getCorrelationId();
    telemetry.log({
      event: 'blocked_telephony_control',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'blocked',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        callId: safeLabel(callId),
        reason: safeLabel(reason),
      },
    });
  }

  logValidationFailed(req: Request, field: string, reason: string): void {
    const correlationId = getCorrelationId();
    telemetry.log({
      event: 'validation_failed',
      correlationId,
      tenantId: tenantIdFromReq(req),
      result: 'denied',
      metadata: {
        path: safeLabel(req.path),
        method: safeLabel(req.method),
        field: safeLabel(field),
        reason: safeLabel(reason),
      },
    });
  }
}
