import type { ConnectorInstallation } from '@supportplane/contracts';
import {
  type FortinetClient,
  MockFortinetClient,
  type FortinetFirewallStatus,
  type FortinetInterface,
} from './fortinet-client.js';

export interface FortinetService {
  getFirewallStatus(): Promise<FortinetFirewallStatus>;
  getInterfaceSummary(): Promise<FortinetInterface[]>;
  health(): Promise<{ status: 'healthy' | 'unconfigured' | 'unhealthy'; connected: boolean }>;
}

export class FortinetConnectorService implements FortinetService {
  private client?: FortinetClient;
  private config?: { baseUrl: string; apiToken: string; timeoutMs: number };
  private readonly mockMode: boolean;

  constructor(installation: ConnectorInstallation) {
    this.mockMode = installation.mockMode ?? true;
    const cfg = installation.config as Record<string, unknown>;
    if (typeof cfg.baseUrl === 'string' && typeof cfg.apiToken === 'string') {
      this.config = {
        baseUrl: cfg.baseUrl,
        apiToken: cfg.apiToken,
        timeoutMs: typeof cfg.timeoutMs === 'number' ? cfg.timeoutMs : 10000,
      };
    }
    if (this.mockMode) {
      this.client = new MockFortinetClient();
    }
  }

  private ensureClient(): FortinetClient {
    if (!this.client) {
      throw new Error('Fortinet service is unconfigured: missing credentials');
    }
    return this.client;
  }

  async getFirewallStatus(): Promise<FortinetFirewallStatus> {
    return this.ensureClient().getFirewallStatus();
  }

  async getInterfaceSummary(): Promise<FortinetInterface[]> {
    return this.ensureClient().getInterfaceSummary();
  }

  async health(): Promise<{
    status: 'healthy' | 'unconfigured' | 'unhealthy';
    connected: boolean;
  }> {
    if (!this.client) {
      return { status: 'unconfigured', connected: false };
    }
    return { status: 'healthy', connected: true };
  }
}

export function createFortinetService(installation: ConnectorInstallation): FortinetService {
  return new FortinetConnectorService(installation);
}
