import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { createCorrelationId, normalizeCorrelationId, runWithCorrelationId } from './correlation.js';
import { telemetry } from './telemetry.service.js';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    const incoming = normalizeCorrelationId(req.headers['x-correlation-id']);
    const correlationId = incoming ?? createCorrelationId();
    res.setHeader('X-Correlation-Id', correlationId);
    runWithCorrelationId(correlationId, () => {
      res.on('finish', () => {
        const latencyMs = Date.now() - started;
        telemetry.increment('supportplane_api_requests_total', {
          method: req.method,
          route: req.path,
          status: res.statusCode,
        });
        telemetry.observe('supportplane_api_request_latency_ms', latencyMs, {
          method: req.method,
          route: req.path,
        });
        telemetry.log({
          event: 'api_request_completed',
          correlationId,
          tenantId: typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined,
          result: String(res.statusCode),
          metadata: {
            method: req.method,
            route: req.path,
            latencyMs,
          },
        });
      });
      next();
    });
  }
}
