import fs from 'fs/promises';

export async function collectDisk() {
  const roots = ['/', '/tmp'];
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

export async function collectServices() {
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

export async function flushDnsCache() {
  return {
    ok: false,
    note: 'Remediation is not implemented in this local foundation slice. Approval queue exists but execution is disabled.',
    unsupported: true,
    readOnly: false,
  };
}

export async function clearTempPreview() {
  return {
    ok: false,
    note: 'Remediation preview is not implemented in this local foundation slice.',
    unsupported: true,
    readOnly: true,
  };
}
