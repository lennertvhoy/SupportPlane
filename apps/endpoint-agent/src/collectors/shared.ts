import os from 'os';

export const AGENT_VERSION = '0.1.0-readonly';

export async function collectInventory() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptimeSeconds: Math.round(os.uptime()),
    cpu: {
      model: os.cpus()[0]?.model ?? 'unknown',
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    },
    memory: {
      totalBytes: os.totalmem(),
      freeBytes: os.freemem(),
    },
    networkInterfaceCount: Object.keys(os.networkInterfaces()).length,
    agentVersion: AGENT_VERSION,
    readOnly: true,
  };
}

export async function collectNetwork() {
  const interfaces = os.networkInterfaces();
  return {
    interfaces: Object.entries(interfaces).map(([name, addresses]) => ({
      name,
      addresses: (addresses ?? []).map((addr) => ({
        family: addr.family,
        address: addr.address,
        internal: addr.internal,
        mac: addr.mac,
        cidr: addr.cidr,
      })),
    })),
    readOnly: true,
  };
}

export async function pingSelf() {
  return {
    ok: true,
    hostname: os.hostname(),
    agentVersion: AGENT_VERSION,
    timestamp: new Date().toISOString(),
    readOnly: true,
  };
}
