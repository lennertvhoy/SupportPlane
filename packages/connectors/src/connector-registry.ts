const registry = new Map<string, unknown>();

export function registerConnector(adapterType: string, instance: unknown): void {
  if (registry.has(adapterType)) {
    throw new Error(`Connector '${adapterType}' is already registered.`);
  }
  registry.set(adapterType, instance);
}

export function getConnector(adapterType: string): unknown | undefined {
  return registry.get(adapterType);
}

export function listConnectorTypes(): string[] {
  return Array.from(registry.keys());
}

export function clearConnectorRegistry(): void {
  registry.clear();
}
