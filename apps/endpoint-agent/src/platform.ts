import os from 'os';

export type AgentPlatform = 'linux' | 'win32' | 'darwin' | 'unknown';

export function getAgentPlatform(): AgentPlatform {
  const p = os.platform();
  if (p === 'linux') return 'linux';
  if (p === 'win32') return 'win32';
  if (p === 'darwin') return 'darwin';
  return 'unknown';
}

export function platformDisplayLabel(platform: AgentPlatform): string {
  switch (platform) {
    case 'linux': return 'Linux';
    case 'win32': return 'Windows';
    case 'darwin': return 'macOS';
    case 'unknown': return 'Unknown';
  }
}

export interface PlatformProvider {
  readonly platform: AgentPlatform;
  readonly displayLabel: string;
  isSupported(): boolean;
}

export function normalizePlatform(input: string): AgentPlatform {
  const lower = input.toLowerCase().trim();
  if (lower === 'linux' || lower.startsWith('linux')) return 'linux';
  if (lower === 'win32' || lower === 'windows' || lower.startsWith('win')) return 'win32';
  if (lower === 'darwin' || lower === 'macos' || lower.startsWith('mac')) return 'darwin';
  return 'unknown';
}

export function createPlatformProvider(): PlatformProvider {
  const platform = getAgentPlatform();
  return {
    platform,
    displayLabel: platformDisplayLabel(platform),
    isSupported() {
      return platform === 'linux' || platform === 'win32' || platform === 'darwin';
    },
  };
}
