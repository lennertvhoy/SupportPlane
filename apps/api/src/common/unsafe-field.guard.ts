import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

const UNSAFE_BODY_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const UNSAFE_CONFIG_PATTERNS = [/eval\b/, /exec\b/, /Function\b/];

function hasUnsafeKey(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);

  for (const key of Object.keys(value)) {
    if (UNSAFE_BODY_KEYS.has(key)) return true;
    const nested = (value as Record<string, unknown>)[key];
    if (nested && typeof nested === 'object') {
      if (hasUnsafeKey(nested, seen)) return true;
    }
  }
  return false;
}

function hasUnsafeConfigString(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);

  for (const key of Object.keys(value)) {
    const val = (value as Record<string, unknown>)[key];
    if (typeof val === 'string') {
      for (const pattern of UNSAFE_CONFIG_PATTERNS) {
        if (pattern.test(val)) return true;
      }
    }
    if (val && typeof val === 'object') {
      if (hasUnsafeConfigString(val, seen)) return true;
    }
  }
  return false;
}

@Injectable()
export class UnsafeFieldGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body as Record<string, unknown> | undefined;

    if (!body || typeof body !== 'object') {
      return true;
    }

    if (hasUnsafeKey(body)) {
      throw new BadRequestException({
        error: 'validation_failed',
        reason: 'Request body contains unsafe keys (__proto__, constructor, prototype)',
      });
    }

    const config = body.config ?? body.settings ?? body.connectorConfig;
    if (config && typeof config === 'object' && hasUnsafeConfigString(config)) {
      throw new BadRequestException({
        error: 'validation_failed',
        reason: 'Connector config contains unsafe strings (eval, exec, Function)',
      });
    }

    return true;
  }
}
