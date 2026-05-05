import { execFile } from 'node:child_process';

export type WindowsReadonlyCommandName =
  | 'services'
  | 'installedSoftwareHklm64'
  | 'installedSoftwareHklm32';

export type WindowsReadonlyCommandTemplate = {
  executable: 'sc.exe' | 'reg.exe';
  args: readonly string[];
  timeoutMs: number;
  maxBufferBytes: number;
};

export const WINDOWS_READONLY_COMMANDS: Record<
  WindowsReadonlyCommandName,
  WindowsReadonlyCommandTemplate
> = {
  services: {
    executable: 'sc.exe',
    args: ['query', 'type=', 'service', 'state=', 'all'],
    timeoutMs: 15_000,
    maxBufferBytes: 2 * 1024 * 1024,
  },
  installedSoftwareHklm64: {
    executable: 'reg.exe',
    args: ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '/s'],
    timeoutMs: 20_000,
    maxBufferBytes: 5 * 1024 * 1024,
  },
  installedSoftwareHklm32: {
    executable: 'reg.exe',
    args: [
      'query',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      '/s',
    ],
    timeoutMs: 20_000,
    maxBufferBytes: 5 * 1024 * 1024,
  },
};

export function getWindowsReadonlyCommandTemplate(
  name: WindowsReadonlyCommandName,
): WindowsReadonlyCommandTemplate {
  return WINDOWS_READONLY_COMMANDS[name];
}

export async function runWindowsReadonlyCommand(
  name: WindowsReadonlyCommandName,
  platform: NodeJS.Platform = process.platform,
): Promise<string> {
  if (platform !== 'win32') {
    throw new Error(`Windows command ${name} is only available on win32.`);
  }

  const template = getWindowsReadonlyCommandTemplate(name);
  return new Promise((resolve, reject) => {
    execFile(
      template.executable,
      [...template.args],
      {
        windowsHide: true,
        timeout: template.timeoutMs,
        maxBuffer: template.maxBufferBytes,
        shell: false,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr.trim() || error.message;
          reject(new Error(detail));
          return;
        }
        resolve(stdout);
      },
    );
  });
}
