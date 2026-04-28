import { ForbiddenException } from '@nestjs/common';
import type { CurrentIdentity } from './auth.types.js';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  owner: ['*'],
  operator: [
    'support_session:read',
    'support_session:create',
    'support_session:update',
    'ticket:read',
    'ticket:write',
    'ticket_context:load',
    'ticket:link',
    'ticket:unlink',
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
    'customer:read',
    'connector_installation:read',
    'connector_installation:write',
    'connector_installation:test',
    'credential_reference:read',
    'credential_reference:write',
    'delivery_policy:read',
    'action:read',
    'action:create',
    'action:submit',
    'action:cancel',
    'outbox:read',
    'outbox:retry',
    'outbox:mock_deliver',
    'worker:read',
    'telephony:webhook',
  ],
  viewer: [
    'support_session:read',
    'call:read',
    'screen_observation:read',
    'evidence_bundle:read',
    'audit:read',
    'connector:read',
    'customer:read',
    'connector_installation:read',
    'credential_reference:read',
    'ticket:read',
    'action:read',
    'outbox:read',
    'worker:read',
    'delivery_policy:read',
  ],
  support_agent: [
    'support_session:read',
    'support_session:create',
    'support_session:update',
    'ticket:read',
    'ticket:write',
    'ticket_context:load',
    'ticket:link',
    'ticket:unlink',
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
    'customer:read',
    'connector_installation:read',
    'connector_installation:write',
    'connector_installation:test',
    'credential_reference:read',
    'credential_reference:write',
    'action:read',
    'action:create',
    'action:submit',
    'action:cancel',
    'outbox:read',
    'outbox:retry',
    'outbox:mock_deliver',
    'worker:read',
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
