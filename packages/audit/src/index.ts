export {
  AuditEvent,
  AuditEventType,
  AuditActorType,
  AuditEventId,
  type AuditEvent as AuditEventShape,
} from '@supportplane/contracts';

/**
 * Compute a simple integrity hash placeholder for an audit event.
 * In production this should use a cryptographic hash (e.g., SHA-256)
 * over a canonical JSON serialization of the event payload.
 */
export function computeIntegrityHash(payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys(payload as object).sort());
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    const char = canonical.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
