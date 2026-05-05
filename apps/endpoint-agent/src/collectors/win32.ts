import fs from 'fs/promises';
import {
  executeFixedTemplate,
  WINDOWS_FLUSH_DNS_TEMPLATE,
  type CommandRunner,
} from './remediation.js';
import { runWindowsReadonlyCommand } from './windows-command-runner.js';

export type WindowsServiceSummary = {
  serviceName: string;
  displayName?: string;
  type?: string;
  state?: string;
};

export type WindowsInstalledSoftware = {
  name: string;
  version?: string;
  publisher?: string;
  installDate?: string;
  uninstallKey?: string;
};

export async function collectDisk() {
  const roots = ['C:\\'];
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
  if (process.platform !== 'win32') {
    return {
      services: [],
      note: 'Windows service enumeration requires a real Windows host. Linux/macOS fixture tests only validate the parser and fixed command template.',
      unsupported: true,
      readOnly: true,
    };
  }

  try {
    const output = await runWindowsReadonlyCommand('services');
    return {
      services: parseScQueryOutput(output),
      readOnly: true,
      source: 'sc.exe query type= service state= all',
    };
  } catch (err) {
    return {
      services: [],
      error: err instanceof Error ? err.message : 'Windows service enumeration failed',
      readOnly: true,
    };
  }
}

export async function collectSoftware() {
  if (process.platform !== 'win32') {
    return {
      software: [],
      note: 'Windows installed software inventory requires a real Windows host. Linux/macOS fixture tests only validate the registry parser and fixed command templates.',
      unsupported: true,
      readOnly: true,
    };
  }

  const outputs: string[] = [];
  const errors: string[] = [];
  for (const command of ['installedSoftwareHklm64', 'installedSoftwareHklm32'] as const) {
    try {
      outputs.push(await runWindowsReadonlyCommand(command));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${command} failed`);
    }
  }

  const software = dedupeSoftware(outputs.flatMap(parseRegistryUninstallOutput)).slice(0, 500);
  return {
    software,
    errors,
    readOnly: true,
    source: 'reg.exe query HKLM uninstall registry keys',
  };
}

export function parseScQueryOutput(output: string): WindowsServiceSummary[] {
  const services: WindowsServiceSummary[] = [];
  let current: Partial<WindowsServiceSummary> = {};

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const serviceName = line.match(/^SERVICE_NAME:\s*(.+)$/i)?.[1]?.trim();
    if (serviceName) {
      if (current.serviceName) services.push(current as WindowsServiceSummary);
      current = { serviceName };
      continue;
    }

    const displayName = line.match(/^DISPLAY_NAME:\s*(.+)$/i)?.[1]?.trim();
    if (displayName) {
      current.displayName = displayName;
      continue;
    }

    const type = line.match(/^TYPE\s*:\s*(.+)$/i)?.[1]?.trim();
    if (type) {
      current.type = type;
      continue;
    }

    const state = line.match(/^STATE\s*:\s*\d+\s+(.+)$/i)?.[1]?.trim();
    if (state) {
      current.state = state;
    }
  }

  if (current.serviceName) services.push(current as WindowsServiceSummary);
  return services;
}

export function parseRegistryUninstallOutput(output: string): WindowsInstalledSoftware[] {
  const entries: WindowsInstalledSoftware[] = [];
  let currentKey: string | undefined;
  let current: Partial<WindowsInstalledSoftware> = {};

  const flush = () => {
    if (current.name) {
      entries.push({
        name: current.name,
        version: current.version,
        publisher: current.publisher,
        installDate: current.installDate,
        uninstallKey: currentKey,
      });
    }
    current = {};
  };

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    if (/^HKEY_LOCAL_MACHINE\\/i.test(line.trim())) {
      flush();
      currentKey = line.trim();
      continue;
    }

    const value = line.match(/^\s{2,}([^\s].*?)\s+REG_\w+\s+(.+)$/);
    if (!value) continue;

    const [, name, data] = value;
    switch (name.trim().toLowerCase()) {
      case 'displayname':
        current.name = data.trim();
        break;
      case 'displayversion':
        current.version = data.trim();
        break;
      case 'publisher':
        current.publisher = data.trim();
        break;
      case 'installdate':
        current.installDate = data.trim();
        break;
    }
  }
  flush();

  return entries.filter((entry) => entry.name.length > 0);
}

function dedupeSoftware(entries: WindowsInstalledSoftware[]): WindowsInstalledSoftware[] {
  const seen = new Set<string>();
  const deduped: WindowsInstalledSoftware[] = [];
  for (const entry of entries) {
    const key = `${entry.name.toLowerCase()}|${entry.version ?? ''}|${entry.publisher ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

export async function flushDnsCache(runner?: CommandRunner) {
  return executeFixedTemplate(WINDOWS_FLUSH_DNS_TEMPLATE, runner);
}

export async function clearTempPreview() {
  return {
    ok: false,
    note: 'Windows remediation preview is not implemented in this local foundation slice.',
    unsupported: true,
    readOnly: true,
  };
}
