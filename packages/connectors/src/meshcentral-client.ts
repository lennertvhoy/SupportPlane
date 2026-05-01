export interface MeshDevice {
  id: string;
  name: string;
  platform: string;
  online: boolean;
  lastSeen: string;
  group: string;
}

export interface MeshCentralClient {
  getDeviceByName(name: string): Promise<MeshDevice | undefined>;
  getDeviceById(deviceId: string): Promise<MeshDevice | undefined>;
  listDevices(): Promise<MeshDevice[]>;
}

export class MockMeshCentralClient implements MeshCentralClient {
  private readonly fixtureDevice: MeshDevice = {
    id: 'mesh-device-001',
    name: 'ACME-WIN-001',
    platform: 'win32',
    online: true,
    lastSeen: new Date().toISOString(),
    group: 'acme-workstations',
  };

  async getDeviceByName(name: string): Promise<MeshDevice | undefined> {
    if (name === this.fixtureDevice.name) {
      return { ...this.fixtureDevice };
    }
    return undefined;
  }

  async getDeviceById(deviceId: string): Promise<MeshDevice | undefined> {
    if (deviceId === this.fixtureDevice.id) {
      return { ...this.fixtureDevice };
    }
    return undefined;
  }

  async listDevices(): Promise<MeshDevice[]> {
    return [{ ...this.fixtureDevice }];
  }
}
