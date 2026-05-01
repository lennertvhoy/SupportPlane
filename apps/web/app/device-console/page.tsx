'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Database, HardDrive, Loader2, Network, RefreshCw, Server, ShieldCheck, TerminalSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthGate, IdentityPill } from '@/components/AuthGate';
import { Badge } from '@/components/Badge';
import { Panel } from '@/components/Panel';
import { api, ApiClientError, type AuthIdentity, type EndpointCommand, type EndpointDevice, type EndpointDeviceDetail } from '@/lib/api';

const commandOptions = [
  { kind: 'collect_inventory', label: 'Inventory', icon: Database },
  { kind: 'collect_disk', label: 'Disk', icon: HardDrive },
  { kind: 'collect_network', label: 'Network', icon: Network },
  { kind: 'collect_services', label: 'Services', icon: Server },
  { kind: 'ping_self', label: 'Status', icon: ShieldCheck },
];

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="max-h-72 overflow-auto rounded border border-cockpit-700 bg-cockpit-950/70 p-3 text-xs text-cockpit-300">{JSON.stringify(value, null, 2)}</pre>;
}

function DeviceConsoleContent({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  const router = useRouter();
  const [devices, setDevices] = useState<EndpointDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [detail, setDetail] = useState<EndpointDeviceDetail | undefined>();
  const [loading, setLoading] = useState(false);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRequest = identity.permissions.includes('*') || identity.permissions.includes('endpoint_command:create');
  const selectedDevice = useMemo(() => detail?.device ?? devices.find((d) => d.id === selectedId), [detail, devices, selectedId]);

  const refresh = useCallback(async (target?: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listEndpointDevices();
      setDevices(list.devices);
      const targetId = target ?? selectedId ?? list.devices[0]?.id;
      setSelectedId(targetId);
      setDetail(targetId ? await api.getEndpointDevice(targetId) : undefined);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load endpoint devices');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestDiagnostic = async (commandKind: string) => {
    if (!selectedDevice) return;
    setCommandLoading(commandKind);
    setError(null);
    try {
      await api.requestEndpointDiagnostic(selectedDevice.id, commandKind);
      await refresh(selectedDevice.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to request read-only diagnostic');
    } finally {
      setCommandLoading(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-cockpit-950 text-cockpit-100">
      <header className="flex items-center justify-between border-b border-cockpit-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/')} className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500" title="Back to cockpit">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Device Console</h1>
            <p className="text-xs text-cockpit-500">Read-only diagnostics. No remediation executed.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdentityPill identity={identity} logout={logout} />
          <button type="button" onClick={() => refresh()} className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500" title="Refresh">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button type="button" onClick={logout} className="rounded border border-cockpit-700 px-3 py-2 text-xs text-cockpit-300 hover:border-cockpit-500">Logout</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr] gap-4 p-4">
        <aside className="min-h-0 overflow-auto">
          <Panel title="Registered Endpoints">
            {error && <div className="mb-3 rounded border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-300">{error}</div>}
            {devices.length === 0 ? (
              <div className="rounded border border-dashed border-cockpit-700 bg-cockpit-900/50 px-3 py-5 text-sm text-cockpit-400">
                No endpoints are registered. Start the local endpoint agent with a tenant enrollment token to register a device.
              </div>
            ) : (
              <ul className="space-y-2">
                {devices.map((device) => (
                  <li key={device.id}>
                    <button type="button" onClick={async () => { setSelectedId(device.id); setDetail(await api.getEndpointDevice(device.id)); }} className={`w-full rounded border px-3 py-3 text-left ${selectedId === device.id ? 'border-accent-500 bg-accent-950/30' : 'border-cockpit-700 bg-cockpit-900/50 hover:border-cockpit-500'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-cockpit-100">{device.displayName}</span>
                        <Badge variant={device.status === 'online' ? 'success' : 'muted'}>{device.status}</Badge>
                      </div>
                      <div className="mt-1 truncate text-xs text-cockpit-500">{device.platform}</div>
                      <div className="mt-2 text-[11px] text-cockpit-500">Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'never'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>

        <main className="min-h-0 overflow-auto">
          {!selectedDevice ? (
            <Panel title="Read-Only Diagnostics">
              <div className="rounded border border-cockpit-700 bg-cockpit-900/50 px-4 py-8 text-center text-sm text-cockpit-400">
                Device inventory and command history will appear after an endpoint agent registers.
              </div>
            </Panel>
          ) : (
            <div className="space-y-4">
              <Panel title="Device Identity" headerRight={<Badge variant="info">Tenant {selectedDevice.tenantId}</Badge>}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-cockpit-500">Hostname</span><div>{selectedDevice.hostname}</div></div>
                  <div><span className="text-cockpit-500">Agent</span><div>{selectedDevice.agentVersion}</div></div>
                  <div><span className="text-cockpit-500">Fingerprint</span><div className="break-all text-xs">{selectedDevice.fingerprint}</div></div>
                  <div><span className="text-cockpit-500">Enrollment</span><div>{new Date(selectedDevice.enrolledAt).toLocaleString()}</div></div>
                </div>
              </Panel>
              <Panel title="Diagnostic Request">
                <div className="mb-3 rounded border border-amber-700/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">Read-only diagnostics only. Arbitrary shell and remediation actions are blocked by the API and are not present in the agent.</div>
                <div className="flex flex-wrap gap-2">
                  {commandOptions.map(({ kind, label, icon: Icon }) => (
                    <button key={kind} type="button" disabled={!canRequest || commandLoading != null} onClick={() => requestDiagnostic(kind)} className="inline-flex items-center gap-2 rounded border border-cockpit-700 bg-cockpit-900 px-3 py-2 text-sm text-cockpit-200 hover:border-accent-500 disabled:cursor-not-allowed disabled:opacity-50" title={`Request ${label}`}>
                      {commandLoading === kind ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                      {label}
                    </button>
                  ))}
                </div>
                {!canRequest && <div className="mt-3 text-xs text-cockpit-500">Policy denied: your role can inspect devices but cannot request diagnostics.</div>}
              </Panel>
              <div className="grid grid-cols-2 gap-4">
                <Panel title="Inventory / Snapshot">
                  {detail?.snapshots[0] ? <JsonBlock value={detail.snapshots[0]} /> : <div className="text-sm text-cockpit-500">No diagnostic snapshots yet.</div>}
                </Panel>
                <Panel title="Command History" headerRight={<TerminalSquare size={15} className="text-cockpit-500" />}>
                  {detail?.commands.length ? (
                    <ul className="space-y-2">
                      {detail.commands.map((command: EndpointCommand) => (
                        <li key={command.id} className="rounded border border-cockpit-700 bg-cockpit-900/50 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-cockpit-200">{command.commandKind}</span>
                            <Badge variant={command.status === 'succeeded' ? 'success' : command.status === 'rejected' ? 'danger' : 'muted'}>{command.status}</Badge>
                          </div>
                          <div className="mt-1 text-cockpit-500">Actor {command.requestedByUserId} · {new Date(command.requestedAt).toLocaleString()}</div>
                          {command.result && <div className="mt-2"><JsonBlock value={command.result} /></div>}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-sm text-cockpit-500">No command requests yet.</div>}
                </Panel>
              </div>
              <Panel title="Last Heartbeat And Policy">
                <div className="grid grid-cols-2 gap-4">
                  <JsonBlock value={detail?.heartbeats[0] ?? { status: 'none' }} />
                  <JsonBlock value={detail?.commands[0]?.policyDecision ?? { decision: 'no_command_requested' }} />
                </div>
              </Panel>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DeviceConsolePage() {
  return <AuthGate>{(identity, logout) => <DeviceConsoleContent identity={identity} logout={logout} />}</AuthGate>;
}
