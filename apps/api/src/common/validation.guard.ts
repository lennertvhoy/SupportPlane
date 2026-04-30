import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';

const REGISTERED_ADAPTERS = new Set([
  'zammad',
  'osticket',
  'mock',
  'asterisk-ami',
  'mock-telephony',
]);

const TELEPHONY_EVENT_TYPES = new Set([
  'newchannel',
  'newstate',
  'hangup',
  'bridgeenter',
  'bridgeleave',
  'dial',
  'originate',
  'cdr',
]);

function isPrivateIp(host: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];
  return privateRanges.some((r) => r.test(host));
}

@Injectable()
export class ValidateUrlGuard implements CanActivate {
  constructor(private readonly allowPrivate: boolean = false) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body as Record<string, unknown> | undefined;
    const url = body?.url ?? body?.baseUrl ?? body?.endpoint;

    if (typeof url !== 'string') {
      return true; // no URL to validate
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'url',
        reason: 'URL must start with http:// or https://',
      });
    }

    if (!this.allowPrivate) {
      try {
        const parsed = new URL(url);
        if (isPrivateIp(parsed.hostname)) {
          throw new BadRequestException({
            error: 'validation_failed',
            field: 'url',
            reason: 'Private IP ranges are not allowed',
          });
        }
      } catch {
        throw new BadRequestException({
          error: 'validation_failed',
          field: 'url',
          reason: 'Invalid URL',
        });
      }
    }

    return true;
  }
}

@Injectable()
export class ValidateAdapterTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body as Record<string, unknown> | undefined;
    const adapterType = body?.adapterType ?? body?.adapter;

    if (typeof adapterType !== 'string') {
      return true; // no adapter to validate
    }

    if (!REGISTERED_ADAPTERS.has(adapterType)) {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'adapterType',
        reason: `Unknown adapter type: ${adapterType}. Allowed: ${Array.from(REGISTERED_ADAPTERS).join(', ')}`,
      });
    }

    return true;
  }
}

@Injectable()
export class ValidateTenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    try {
      const identity = getCurrentIdentity(req);
      if (!identity.tenantId) {
        throw new BadRequestException({
          error: 'validation_failed',
          field: 'tenantId',
          reason: 'Tenant context is required',
        });
      }
      return true;
    } catch {
      const tenantId = req.headers['x-tenant-id'];
      if (!tenantId || typeof tenantId !== 'string') {
        throw new BadRequestException({
          error: 'validation_failed',
          field: 'tenantId',
          reason: 'Tenant context is required',
        });
      }
      return true;
    }
  }
}

@Injectable()
export class ValidateTelephonyEventGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body as Record<string, unknown> | undefined;

    if (!body || typeof body !== 'object') {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'body',
        reason: 'Telephony event body is required',
      });
    }

    const callerNumber = body.callerNumber;
    const calleeNumber = body.calleeNumber;
    const eventType = body.eventType;

    if (typeof callerNumber !== 'string' || callerNumber.length < 1) {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'callerNumber',
        reason: 'callerNumber is required and must be a non-empty string',
      });
    }

    if (calleeNumber !== undefined && typeof calleeNumber !== 'string') {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'calleeNumber',
        reason: 'calleeNumber must be a string when provided',
      });
    }

    if (typeof eventType !== 'string' || eventType.length < 1) {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'eventType',
        reason: 'eventType is required and must be a non-empty string',
      });
    }

    // Canonical call event shape check: callerNumber, calleeNumber (optional), eventType
    // Additional: externalCallId is strongly recommended
    const externalCallId = body.externalCallId;
    if (externalCallId !== undefined && typeof externalCallId !== 'string') {
      throw new BadRequestException({
        error: 'validation_failed',
        field: 'externalCallId',
        reason: 'externalCallId must be a string when provided',
      });
    }

    return true;
  }
}
