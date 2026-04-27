import { ForbiddenException } from '@nestjs/common';
import type { CurrentIdentity } from './auth.types.js';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  owner: ['*'],
  operator: [
    'support_session:read',
    'support_session:create',
    'support_session:update',
    'ticket:write',
    'ticket_context:load',
    'context_packet:create',
    'ai:generate',
    'call:read',
    'call:write',
    'recording:read',
    'recording:write',
    'telephony:read',
    'telephony:control',
    'screen_observation:create',
    'screen_observation:review',
    'evidence_bundle:read',
    'audit:read',
    'connector:read',
    'telephony:webhook',
  ],
  viewer: [
    'support_session:read',
    'call:read',
    'screen_observation:read',
    'evidence_bundle:read',
    'audit:read',
    'connector:read',
  ],
  support_agent: [
    'support_session:read',
    'support_session:create',
    'support_session:update',
    'ticket:write',
    'ticket_context:load',
    'context_packet:create',
    'ai:generate',
    'call:read',
    'call:write',
    'recording:read',
    'recording:write',
    'telephony:read',
    'telephony:control',
    'screen_observation:create',
    'screen_observation:review',
    'evidence_bundle:read',
    'audit:read',
    'connector:read',
    'telephony:webhook',
  ],
};

export function permissionsForRoles(roles: string[]): string[] {
  return Array.from(new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? [])));
}

export function hasPermission(identity: CurrentIdentity, permission: string): boolean {
  return identity.permissions.includes('*') || identity.permissions.includes(permission);
}

export function requirePermission(identity: CurrentIdentity, permission: string): void {
  if (!hasPermission(identity, permission)) {
    throw new ForbiddenException(`Forbidden: ${permission} requires a higher role`);
  }
}
