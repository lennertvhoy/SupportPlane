import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const TicketingAdapterType = z.enum([
  'zammad',
  'glpi',
  'osticket',
  'custom',
]);

export type TicketingAdapterType = z.infer<typeof TicketingAdapterType>;

export const TicketingAdapterStatus = z.enum([
  'active',
  'inactive',
  'error',
]);

export type TicketingAdapterStatus = z.infer<typeof TicketingAdapterStatus>;

export const TicketingAdapterCapability = z.enum([
  'read_tickets',
  'write_notes',
  'read_customers',
  'write_tickets',
  'search',
]);

export type TicketingAdapterCapability = z.infer<
  typeof TicketingAdapterCapability
>;

export const TicketingAdapterId = EntityId.brand<'TicketingAdapterId'>();
export type TicketingAdapterId = z.infer<typeof TicketingAdapterId>;

export const TicketingAdapter = z.object({
  id: TicketingAdapterId,
  tenantId: TenantId,
  name: z.string().min(1).max(256),
  adapterType: TicketingAdapterType,
  capabilities: z.array(TicketingAdapterCapability).default([]),
  status: TicketingAdapterStatus,
  config: z.record(JsonValue).default({}),
  secretReferenceIds: z.array(z.string()).default([]),
  lastSyncAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type TicketingAdapter = z.infer<typeof TicketingAdapter>;

export const TicketReferenceId = EntityId.brand<'TicketReferenceId'>();
export type TicketReferenceId = z.infer<typeof TicketReferenceId>;

export const TicketPriority = z.enum([
  'low',
  'normal',
  'high',
  'critical',
]);

export type TicketPriority = z.infer<typeof TicketPriority>;

export const TicketStatus = z.enum([
  'new',
  'open',
  'pending',
  'closed',
  'merged',
  'unknown',
]);

export type TicketStatus = z.infer<typeof TicketStatus>;

export const TicketReference = z.object({
  id: TicketReferenceId,
  tenantId: TenantId,
  adapterId: TicketingAdapterId,
  externalTicketId: z.string().min(1).max(256),
  subject: z.string().min(1).max(1024),
  status: TicketStatus,
  priority: TicketPriority.default('normal'),
  customerId: EntityId.optional(),
  customerEmail: z.string().email().max(320).optional(),
  customerName: z.string().max(512).optional(),
  rawData: z.record(JsonValue).optional(),
  lastSyncedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type TicketReference = z.infer<typeof TicketReference>;
