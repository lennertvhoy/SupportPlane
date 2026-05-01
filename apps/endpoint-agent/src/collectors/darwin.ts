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
  return {
    processes: [],
    note: 'macOS service enumeration is not implemented in this local foundation slice. No arbitrary shell commands are used.',
    unsupported: true,
    readOnly: true,
  };
}

export async function collectSoftware() {
  return {
    software: [],
    note: 'macOS installed software inventory is not implemented in this slice. No package-manager shell commands are used.',
    unsupported: true,
    readOnly: true,
  };
}

export async function flushDnsCache() {
  return {
    ok: false,
    note: 'macOS remediation is not implemented in this local foundation slice.',
    unsupported: true,
    readOnly: false,
  };
}

export async function clearTempPreview() {
  return {
    ok: false,
    note: 'macOS remediation preview is not implemented in this local foundation slice.',
    unsupported: true,
    readOnly: true,
  };
}
