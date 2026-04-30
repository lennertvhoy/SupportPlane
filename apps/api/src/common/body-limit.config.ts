export const BODY_LIMITS = {
  global: '1mb',
  actions: '512kb',
  writeback: '256kb',
  telephony: '256kb',
  connectorRuntime: '512kb',
} as const;

export type BodyLimitCategory = keyof typeof BODY_LIMITS;

export function getBodyLimitForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes('/actions') || lower.includes('/outbox')) {
    return BODY_LIMITS.actions;
  }
  if (lower.includes('/writeback') || lower.includes('/sandbox')) {
    return BODY_LIMITS.writeback;
  }
  if (lower.includes('/telephony') || lower.includes('/ami') || lower.includes('/asterisk')) {
    return BODY_LIMITS.telephony;
  }
  if (lower.includes('/connector') || lower.includes('/runtime')) {
    return BODY_LIMITS.connectorRuntime;
  }
  return BODY_LIMITS.global;
}
