import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const ScreenObservationId = EntityId.brand<'ScreenObservationId'>();
export type ScreenObservationId = z.infer<typeof ScreenObservationId>;

export const ScreenObservationType = z.enum([
  'window_title',
  'url',
  'application',
  'manual_trigger',
  'clipboard_text',
]);

export type ScreenObservationType = z.infer<typeof ScreenObservationType>;

export const ScreenObservation = z.object({
  id: ScreenObservationId,
  tenantId: TenantId,
  sessionId: EntityId,
  observationType: ScreenObservationType,
  metadata: z.record(JsonValue),
  operatorCompanionId: EntityId.optional(),
  operatorUserId: EntityId.optional(),
  privacyConsentGiven: z.boolean().default(false),
  rawImageStored: z.boolean().default(false),
  rawImageRetentionSeconds: z.number().int().min(0).optional(),
  createdAt: Timestamp,
});

export type ScreenObservation = z.infer<typeof ScreenObservation>;
