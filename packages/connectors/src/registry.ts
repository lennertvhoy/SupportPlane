import type { TicketingAdapterFactory, RegisteredAdapterSummary } from './types.js';

const registry = new Map<string, TicketingAdapterFactory>();

export function registerTicketingAdapter(factory: TicketingAdapterFactory): void {
  if (registry.has(factory.adapterType)) {
    throw new Error(`Ticketing adapter '${factory.adapterType}' is already registered.`);
  }
  registry.set(factory.adapterType, factory);
}

export function getTicketingAdapterFactory(adapterType: string): TicketingAdapterFactory | undefined {
  return registry.get(adapterType);
}

export function listTicketingAdapters(): RegisteredAdapterSummary[] {
  return Array.from(registry.values()).map((f) => ({
    adapterType: f.adapterType,
    capabilities: f.capabilities,
  }));
}

export function clearTicketingAdapterRegistry(): void {
  registry.clear();
}

export function getRegisteredAdapterTypes(): string[] {
  return Array.from(registry.keys());
}
