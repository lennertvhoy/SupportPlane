import fs from 'fs/promises';
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

export async function collectDisk() {
  const roots = os.platform() === 'win32' ? ['C:\\'] : ['/', '/tmp'];
  const entries = [];
  for (const root of roots) {
    try {
      const statfs = await fs.statfs(root);
      entries.push({
        path: root,
        blockSize: statfs.bsize,
        blocks: statfs.blocks,
        availableBlocks: statfs.bavail,
        totalBytes: statfs.blocks * statfs.bsize,
        availableBytes: statfs.bavail * statfs.bsize,
      });
    } catch (err) {
      entries.push({ path: root, error: err instanceof Error ? err.message : 'unavailable' });
    }
  }
  return { volumes: entries, readOnly: true };
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

export async function collectServices() {
  if (os.platform() !== 'linux') {
    return {
      processes: [],
      note: 'Portable service listing is only implemented for Linux /proc in this local foundation.',
      readOnly: true,
    };
  }
  const procEntries = await fs.readdir('/proc').catch(() => []);
  const pids = procEntries.filter((entry) => /^\d+$/.test(entry)).slice(0, 30);
  const processes = [];
  for (const pid of pids) {
    const comm = await fs.readFile(`/proc/${pid}/comm`, 'utf8').then((v) => v.trim()).catch(() => undefined);
    const status = await fs.readFile(`/proc/${pid}/status`, 'utf8').catch(() => '');
    const state = status.match(/^State:\s+(.+)$/m)?.[1];
    if (comm) processes.push({ pid: Number(pid), name: comm, state });
  }
  return { processes, readOnly: true };
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

export async function runFixedDiagnostic(commandKind: string) {
  switch (commandKind) {
    case 'collect_inventory':
      return { kind: 'inventory', payload: await collectInventory() };
    case 'collect_disk':
      return { kind: 'disk', payload: await collectDisk() };
    case 'collect_network':
      return { kind: 'network', payload: await collectNetwork() };
    case 'collect_services':
      return { kind: 'services', payload: await collectServices() };
    case 'ping_self':
      return { kind: 'status', payload: await pingSelf() };
    default:
      throw new Error(`Unsupported fixed diagnostic command: ${commandKind}`);
  }
}
