import { AiProviderReadiness } from '@supportplane/contracts';
import { listAiProviders, getRegisteredAiProviderIds } from './registry.js';

export function getProviderReadiness(): AiProviderReadiness[] {
  const registered = listAiProviders();
  const registeredIds = getRegisteredAiProviderIds();

  const allProviderIds = ['mock', 'ollama', 'lmstudio', 'openai', 'azure', 'anthropic'] as const;

  return allProviderIds.map((id): AiProviderReadiness => {
    const reg = registered.find((r) => r.id === id);

    if (id === 'openai' || id === 'azure' || id === 'anthropic') {
      return {
        id,
        configured: false,
        enabled: false,
        enabledByPolicy: false,
        classification: 'cloud',
        reason: 'No cloud AI provider configured',
      };
    }

    if (id === 'mock') {
      return {
        id,
        configured: true,
        enabled: true,
        enabledByPolicy: true,
        classification: 'mock',
        model: 'mock-support-note-v1',
        reason: 'Mock provider always available',
      };
    }

    // ollama or lmstudio
    const baseUrlEnv = id === 'ollama' ? 'OLLAMA_BASE_URL' : 'LMSTUDIO_BASE_URL';
    const modelEnv = id === 'ollama' ? 'OLLAMA_MODEL' : 'LMSTUDIO_MODEL';
    const defaultModel = id === 'ollama' ? 'llama3.1:8b' : 'local-model';
    const baseUrl = process.env[baseUrlEnv];
    const model = process.env[modelEnv] ?? defaultModel;
    const configured = !!baseUrl && registeredIds.includes(id);

    return {
      id,
      configured,
      enabled: configured,
      enabledByPolicy: configured,
      classification: 'local',
      model,
      reason: configured
        ? `${id} local provider configured (${model})`
        : `${id} not configured (missing ${baseUrlEnv})`,
    };
  });
}
