import type { AiProvider } from './index.js';

export interface AiProviderRegistration {
  readonly id: string;
  readonly provider: AiProvider;
  readonly metadata: {
    runtime: string;
    providerMode: 'mock' | 'local' | 'cloud';
    noCloudCall: boolean;
    fallbackEnabled: boolean;
  };
}

export interface AiProviderSummary {
  id: string;
  runtime: string;
  providerMode: 'mock' | 'local' | 'cloud';
  noCloudCall: boolean;
  fallbackEnabled: boolean;
}

const registry = new Map<string, AiProviderRegistration>();

export function registerAiProvider(registration: AiProviderRegistration): void {
  if (registry.has(registration.id)) {
    throw new Error(`AI provider '${registration.id}' is already registered.`);
  }
  registry.set(registration.id, registration);
}

export function getAiProvider(id: string): AiProvider | undefined {
  return registry.get(id)?.provider;
}

export function getAiProviderRegistration(id: string): AiProviderRegistration | undefined {
  return registry.get(id);
}

export function listAiProviders(): AiProviderSummary[] {
  return Array.from(registry.values()).map((r) => ({
    id: r.id,
    runtime: r.metadata.runtime,
    providerMode: r.metadata.providerMode,
    noCloudCall: r.metadata.noCloudCall,
    fallbackEnabled: r.metadata.fallbackEnabled,
  }));
}

export function clearAiProviderRegistry(): void {
  registry.clear();
}

export function getRegisteredAiProviderIds(): string[] {
  return Array.from(registry.keys());
}
