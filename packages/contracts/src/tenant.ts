import { z } from 'zod';
import { Timestamp, TenantId } from './base.js';

export const TenantStatus = z.enum([
  'active',
  'suspended',
  'pending_deletion',
]);

export type TenantStatus = z.infer<typeof TenantStatus>;

export const Tenant = z.object({
  id: TenantId,
  name: z.string().min(1).max(256),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Tenant slug must be lowercase kebab-case',
    }),
  status: TenantStatus,
  settings: z.record(z.unknown()).default({}),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type Tenant = z.infer<typeof Tenant>;
