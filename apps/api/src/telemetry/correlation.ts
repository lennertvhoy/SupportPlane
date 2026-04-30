import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

type CorrelationContext = {
  correlationId: string;
};

const storage = new AsyncLocalStorage<CorrelationContext>();

export function normalizeCorrelationId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const safe = trimmed.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 96);
  return safe || undefined;
}

export function createCorrelationId(): string {
  return `sp-${randomUUID()}`;
}

export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? createCorrelationId();
}

export function runWithCorrelationId<T>(correlationId: string, callback: () => T): T {
  return storage.run({ correlationId }, callback);
}
