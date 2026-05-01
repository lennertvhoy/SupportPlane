import { getAgentPlatform, type AgentPlatform } from '../platform.js';
import * as shared from './shared.js';
import * as linux from './linux.js';
import * as win32 from './win32.js';
import * as darwin from './darwin.js';

export { AGENT_VERSION, collectInventory, collectNetwork, pingSelf } from './shared.js';

const platformCollectors: Record<
  AgentPlatform,
  {
    collectDisk: () => Promise<Record<string, unknown>>;
    collectServices: () => Promise<Record<string, unknown>>;
    collectSoftware: () => Promise<Record<string, unknown>>;
    flushDnsCache: () => Promise<Record<string, unknown>>;
    clearTempPreview: () => Promise<Record<string, unknown>>;
  }
> = {
  linux,
  win32,
  darwin,
  unknown: {
    collectDisk: async () => ({ volumes: [], error: 'Unknown platform', readOnly: true }),
    collectServices: async () => ({ processes: [], error: 'Unknown platform', readOnly: true }),
    collectSoftware: async () => ({ software: [], error: 'Unknown platform', unsupported: true, readOnly: true }),
    flushDnsCache: async () => ({ ok: false, error: 'Unknown platform', unsupported: true, readOnly: false }),
    clearTempPreview: async () => ({ ok: false, error: 'Unknown platform', unsupported: true, readOnly: true }),
  },
};

export async function runFixedDiagnostic(commandKind: string) {
  const platform = getAgentPlatform();
  const collectors = platformCollectors[platform] ?? platformCollectors.unknown;

  switch (commandKind) {
    case 'collect_inventory':
      return { kind: 'inventory', payload: await shared.collectInventory() };
    case 'collect_disk':
      return { kind: 'disk', payload: await collectors.collectDisk() };
    case 'collect_network':
      return { kind: 'network', payload: await shared.collectNetwork() };
    case 'collect_services':
      return { kind: 'services', payload: await collectors.collectServices() };
    case 'collect_software':
      return { kind: 'software', payload: await collectors.collectSoftware() };
    case 'ping_self':
      return { kind: 'status', payload: await shared.pingSelf() };
    case 'flush_dns_cache':
      return { kind: 'remediation', payload: await collectors.flushDnsCache() };
    case 'clear_temp_preview':
      return { kind: 'remediation', payload: await collectors.clearTempPreview() };
    default:
      throw new Error(`Unsupported fixed diagnostic command: ${commandKind}`);
  }
}
