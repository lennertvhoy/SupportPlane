import { Injectable } from '@nestjs/common';
import {
  ConnectorMode,
  ConnectorHealthStatus,
  ConnectorStatus,
  ConnectorTestResult,
  type ConnectorStatus as ConnectorStatusShape,
  type ConnectorTestResult as ConnectorTestResultShape,
  type TicketingAdapterId,
} from '@supportplane/contracts';
import {
  createZammadAdapter,
  type TicketingAdapterDriver,
} from '@supportplane/connectors';

function env(name: string): string | undefined {
  return process.env[name];
}

@Injectable()
export class ConnectorsService {
  private readonly mode: ConnectorMode;
  private readonly zammadAdapter: TicketingAdapterDriver;

  constructor() {
    const modeRaw = env('ZAMMAD_CONNECTOR_MODE') ?? 'mock';
    this.mode = modeRaw === 'zammad' ? ConnectorMode.enum.zammad : ConnectorMode.enum.mock;

    const adapterId = 'zammad-adapter-001' as TicketingAdapterId;
    this.zammadAdapter = createZammadAdapter(this.mode, adapterId);

    if (this.mode === 'zammad') {
      const baseUrl = env('ZAMMAD_BASE_URL');
      const apiToken = env('ZAMMAD_API_TOKEN');
      if (baseUrl && apiToken) {
        this.zammadAdapter
          .connect({ baseUrl, apiToken, timeoutMs: 10000 })
          .catch(() => {
            // Connection failure is recorded in status; do not crash startup
          });
      }
    }
  }

  getZammadStatus(): ConnectorStatusShape {
    const isMock = this.mode === 'mock';
    const meta = this.zammadAdapter.getAdapterMetadata?.() as
      | { capabilities: string[]; status: string }
      | undefined;

    return ConnectorStatus.parse({
      mode: this.mode,
      health: isMock ? ConnectorHealthStatus.enum.healthy : ConnectorHealthStatus.enum.unknown,
      adapterType: 'zammad',
      capabilities: meta?.capabilities ?? ['read_tickets', 'read_customers', 'write_notes'],
      connected: isMock ? true : meta?.status === 'active',
      metadata: {
        startupMode: this.mode,
        configured: isMock ? false : !!(env('ZAMMAD_BASE_URL') && env('ZAMMAD_API_TOKEN')),
      },
    });
  }

  async testZammadConnection(): Promise<ConnectorTestResultShape> {
    const start = Date.now();

    if (this.mode === 'mock') {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: true,
        latencyMs: Date.now() - start,
        metadata: { note: 'Mock mode — no real network call was made' },
      });
    }

    const baseUrl = env('ZAMMAD_BASE_URL');
    const apiToken = env('ZAMMAD_API_TOKEN');

    if (!baseUrl || !apiToken) {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: false,
        error: 'Zammad is not configured. Set ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN.',
        metadata: {},
      });
    }

    try {
      await this.zammadAdapter.connect({ baseUrl, apiToken, timeoutMs: 10000 });
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: true,
        latencyMs: Date.now() - start,
        metadata: { baseUrl },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: false,
        error: message,
        metadata: {},
      });
    }
  }

  getZammadAdapter(): TicketingAdapterDriver {
    return this.zammadAdapter;
  }

  getMode(): ConnectorMode {
    return this.mode;
  }
}
