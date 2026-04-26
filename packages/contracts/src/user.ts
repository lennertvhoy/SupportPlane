import { z } from 'zod';
import { EntityId, Timestamp, TenantId } from './base.js';

export const UserStatus = z.enum(['active', 'inactive', 'suspended']);
export type UserStatus = z.infer<typeof UserStatus>;

export const UserId = EntityId.brand<'UserId'>();
export type UserId = z.infer<typeof UserId>;

export const Permission = z.enum([
  'session:read',
  'session:write',
  'session:delete',
  'ticket:read',
  'ticket:write',
  'audit:read',
  'audit:write',
  'policy:read',
  'policy:write',
  'adapter:read',
  'adapter:write',
  'admin:tenant',
  'admin:users',
  'admin:connectors',
  'ai:context:read',
  'ai:context:write',
  'screen:observe',
]);

export type Permission = z.infer<typeof Permission>;

export const RoleId = EntityId.brand<'RoleId'>();
export type RoleId = z.infer<typeof RoleId>;

export const Role = z.object({
  id: RoleId,
  tenantId: TenantId,
  name: z.string().min(1).max(128),
  permissions: z.array(Permission).default([]),
  description: z.string().max(512).optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type Role = z.infer<typeof Role>;

export const User = z.object({
  id: UserId,
  tenantId: TenantId,
  email: z.string().email().max(320),
  name: z.string().min(1).max(256),
  status: UserStatus,
  roleIds: z.array(RoleId).default([]),
  lastLoginAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type User = z.infer<typeof User>;
