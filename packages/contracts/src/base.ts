import { z } from 'zod';

/**
 * Base contract primitives shared across all domains.
 */

export const EntityId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'EntityId must be URL-safe alphanumeric',
  });

export type EntityId = z.infer<typeof EntityId>;

export const Timestamp = z.string().datetime({ offset: true });
export type Timestamp = z.infer<typeof Timestamp>;

export const TenantId = EntityId.brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantId>;

export const TenantScopedBase = z.object({
  tenantId: TenantId,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type TenantScopedBase = z.infer<typeof TenantScopedBase>;

/**
 * Strict JSON scalar types for metadata fields.
 */
export const JsonScalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type JsonScalar = z.infer<typeof JsonScalar>;

export const JsonValue: z.ZodType = z.lazy(() =>
  z.union([JsonScalar, z.array(JsonValue), z.record(JsonValue)]),
);

export type JsonValue = z.infer<typeof JsonValue>;
