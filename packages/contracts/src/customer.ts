import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const CustomerReferenceId = EntityId.brand<'CustomerReferenceId'>();
export type CustomerReferenceId = z.infer<typeof CustomerReferenceId>;

export const CustomerReference = z.object({
  id: CustomerReferenceId,
  tenantId: TenantId,
  adapterId: EntityId,
  externalCustomerId: z.string().min(1).max(256),
  name: z.string().max(512).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(64).optional(),
  company: z.string().max(512).optional(),
  rawData: z.record(JsonValue).optional(),
  lastSyncedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type CustomerReference = z.infer<typeof CustomerReference>;
