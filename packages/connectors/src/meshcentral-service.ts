import type { ConnectorInstallation } from '@supportplane/contracts';
import {
  type MeshCentralClient,
  MockMeshCentralClient,
  type MeshDevice,
} from './meshcentral-client.js';

export interface MeshCentralService {
  getDeviceByName(name: string): Promise<MeshDevice | undefined>;
  getDeviceById(deviceId: string): Promise<MeshDevice | undefined>;
  listDevices(): Promise<MeshDevice[]>;
  health(): Promise<{ status: 'healthy' | 'unconfigured' | 'unhealthy'; connected: boolean }>;
}

export class MeshCentralConnectorService implements MeshCentralService {
  private client?: MeshCentralClient;
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
      this.client = new MockMeshCentralClient();
    }
  }

  private ensureClient(): MeshCentralClient {
    if (!this.client) {
      throw new Error('MeshCentral service is unconfigured: missing credentials');
    }
    return this.client;
  }

  async getDeviceByName(name: string): Promise<MeshDevice | undefined> {
    return this.ensureClient().getDeviceByName(name);
  }

  async getDeviceById(deviceId: string): Promise<MeshDevice | undefined> {
    return this.ensureClient().getDeviceById(deviceId);
  }

  async listDevices(): Promise<MeshDevice[]> {
    return this.ensureClient().listDevices();
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

export function createMeshCentralService(installation: ConnectorInstallation): MeshCentralService {
  return new MeshCentralConnectorService(installation);
}
