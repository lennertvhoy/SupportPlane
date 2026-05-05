export interface FortinetInterface {
  name: string;
  status: string;
  ip: string;
}

export interface FortinetFirewallStatus {
  deviceName: string;
  firmware: string;
  interfaces: FortinetInterface[];
  policies: number;
}

export interface FortinetClient {
  getFirewallStatus(): Promise<FortinetFirewallStatus>;
  getInterfaceSummary(): Promise<FortinetInterface[]>;
}

export class MockFortinetClient implements FortinetClient {
  private readonly fixtureStatus: FortinetFirewallStatus = {
    deviceName: 'FGT-ACME-01',
    firmware: '7.4.2',
    interfaces: [{ name: 'port1', status: 'up', ip: '192.168.1.1' }],
    policies: 42,
  };

  async getFirewallStatus(): Promise<FortinetFirewallStatus> {
    return { ...this.fixtureStatus };
  }

  async getInterfaceSummary(): Promise<FortinetInterface[]> {
    return [...this.fixtureStatus.interfaces];
  }
}
