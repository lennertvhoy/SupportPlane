'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, TerminalSquare, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthGate, UserMenu } from '@/components/AuthGate';
import { Badge } from '@/components/Badge';
import { Panel } from '@/components/Panel';
import {
  api,
  ApiClientError,
  type AuthIdentity,
  type EndpointDevice,
  type EndpointDeviceDetail,
  type ToolDefinition,
  type ToolInvocation,
  type ToolResultNoteDraft,
} from '@/lib/api';
import { platformDisplayLabel } from '@supportplane/contracts';

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded border border-cockpit-700 bg-cockpit-950/70 p-3 text-xs text-cockpit-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DeviceConsoleContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const [devices, setDevices] = useState<EndpointDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [detail, setDetail] = useState<EndpointDeviceDetail | undefined>();
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [invocations, setInvocations] = useState<ToolInvocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ToolResultNoteDraft>>({});
  const canRequest =
    identity.permissions.includes('*') || identity.permissions.includes('endpoint_command:create');
  const selectedDevice = useMemo(
    () => detail?.device ?? devices.find((d) => d.id === selectedId),
    [detail, devices, selectedId],
  );

  const refresh = useCallback(
    async (target?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [list, toolList, invList] = await Promise.all([
          api.listEndpointDevices(),
          api.listTools(),
          api.listToolInvocations(),
        ]);
        setDevices(list.devices);
        setTools(toolList.tools);
        setInvocations(invList.invocations);
        const targetId = target ?? selectedId ?? list.devices[0]?.id;
        setSelectedId(targetId);
        setDetail(targetId ? await api.getEndpointDevice(targetId) : undefined);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load endpoint devices');
      } finally {
        setLoading(false);
      }
    },
    [selectedId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const invokeTool = async (toolKey: string) => {
    if (!selectedDevice) return;
    setCommandLoading(toolKey);
    setError(null);
    try {
      const result = await api.invokeTool(selectedDevice.id, toolKey, {});
      if (result.policyDecision.approvalRequired) {
        setError(`Tool ${toolKey} requires approval. Check the Approval Queue.`);
      }
      await refresh(selectedDevice.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to invoke tool');
    } finally {
      setCommandLoading(null);
    }
  };

  const createNoteDraft = async (invocationId: string) => {
    setDraftLoading(invocationId);
    try {
      const res = await api.createToolNoteDraft(invocationId, {
        title: `Result: ${invocationId.slice(0, 8)}`,
      });
      setDrafts((prev) => ({ ...prev, [invocationId]: res.draft }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create note draft');
    } finally {
      setDraftLoading(null);
    }
  };

  const deviceInvocations = useMemo(() => {
    return invocations
      .filter((i) => i.deviceId === selectedId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [invocations, selectedId]);

  return (
    <div className="flex h-screen flex-col bg-cockpit-950 text-cockpit-100">
      <header className="flex items-center justify-between border-b border-cockpit-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            title="Back to cockpit"
            aria-label="Back to cockpit"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Device Console</h1>
            <p className="text-xs text-cockpit-400">
              Read-only diagnostics and approval-gated low-risk remediation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            title="Refresh"
            aria-label="Refresh device console"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <UserMenu identity={identity} logout={logout} />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr] gap-4 p-4">
        <aside className="min-h-0 overflow-auto">
          <Panel title="Registered Endpoints">
            {error && (
              <div className="mb-3 rounded border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            {devices.length === 0 ? (
              <div className="rounded border border-dashed border-cockpit-700 bg-cockpit-900/50 px-3 py-5 text-sm text-cockpit-400">
                No endpoints are registered. Start the local endpoint agent with a tenant enrollment
                token to register a device.
              </div>
            ) : (
              <ul className="space-y-2">
                {devices.map((device) => (
                  <li key={device.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedId(device.id);
                        setDetail(await api.getEndpointDevice(device.id));
                      }}
                      className={`w-full rounded border px-3 py-3 text-left ${selectedId === device.id ? 'border-accent-500 bg-accent-950/30' : 'border-cockpit-700 bg-cockpit-900/50 hover:border-cockpit-500'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-cockpit-100">
                          {device.displayName}
                        </span>
                        <Badge variant={device.status === 'online' ? 'success' : 'muted'}>
                          {device.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1 truncate text-xs text-cockpit-400">
                        <Badge variant="info">
                          {platformDisplayLabel(
                            device.platform as 'linux' | 'win32' | 'darwin' | 'unknown',
                          )}
                        </Badge>
                        <span>{device.platform}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-cockpit-400">
                        Last seen{' '}
                        {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'never'}
                      </div>
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
              <Panel
                title="Device Identity"
                headerRight={<Badge variant="info">Tenant {selectedDevice.tenantId}</Badge>}
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-cockpit-400">Hostname</span>
                    <div>{selectedDevice.hostname}</div>
                  </div>
                  <div>
                    <span className="text-cockpit-400">Platform</span>
                    <div>
                      <Badge variant="info">
                        {platformDisplayLabel(
                          selectedDevice.platform as 'linux' | 'win32' | 'darwin' | 'unknown',
                        )}
                      </Badge>{' '}
                      <span className="text-xs text-cockpit-400">{selectedDevice.platform}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-cockpit-400">Agent</span>
                    <div>{selectedDevice.agentVersion}</div>
                  </div>
                  <div>
                    <span className="text-cockpit-400">Fingerprint</span>
                    <div className="break-all text-xs">{selectedDevice.fingerprint}</div>
                  </div>
                  <div>
                    <span className="text-cockpit-400">Enrollment</span>
                    <div>{new Date(selectedDevice.enrolledAt).toLocaleString()}</div>
                  </div>
                </div>
              </Panel>
              <Panel title="Tool Invocation">
                <div className="mb-3 rounded border border-amber-700/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                  Fixed implementation only. Arbitrary shell is blocked. Remediation tools require
                  policy allowance, platform support, and approval before dispatch.
                </div>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => {
                    const supported =
                      tool.supportedPlatforms.length === 0 ||
                      tool.supportedPlatforms.includes(
                        selectedDevice.platform as 'linux' | 'win32' | 'darwin' | 'unknown',
                      );
                    const isEnabled = tool.enabled && supported;
                    const unsupportedLabel = !supported
                      ? tool.supportedPlatforms.length === 1
                        ? `${platformDisplayLabel(tool.supportedPlatforms[0] as 'linux' | 'win32' | 'darwin' | 'unknown')}-only`
                        : 'unsupported'
                      : null;
                    return (
                      <button
                        key={tool.toolKey}
                        type="button"
                        disabled={!canRequest || commandLoading != null || !isEnabled}
                        onClick={() => isEnabled && invokeTool(tool.toolKey)}
                        className="inline-flex items-center gap-2 rounded border border-cockpit-700 bg-cockpit-900 px-3 py-2 text-sm text-cockpit-200 hover:border-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
                        title={`${tool.displayName}${unsupportedLabel ? ` — ${unsupportedLabel}` : ''}${!tool.enabled ? ' — Disabled in registry' : ''}`}
                      >
                        {commandLoading === tool.toolKey ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Wrench size={15} />
                        )}
                        {tool.displayName}
                        {tool.approvalRequired && (
                          <span className="ml-1 text-[10px] text-amber-300">(approval)</span>
                        )}
                        {unsupportedLabel && (
                          <span className="ml-1 text-[10px] text-red-300">
                            ({unsupportedLabel})
                          </span>
                        )}
                        {!tool.enabled && (
                          <span className="ml-1 text-[10px] text-cockpit-400">(disabled)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!canRequest && (
                  <div className="mt-3 text-xs text-cockpit-400">
                    Policy denied: your role can inspect devices but cannot invoke tools.
                  </div>
                )}
              </Panel>
              <div className="grid grid-cols-2 gap-4">
                <Panel title="Inventory / Snapshot">
                  {detail?.snapshots[0] ? (
                    <JsonBlock value={detail.snapshots[0]} />
                  ) : (
                    <div className="text-sm text-cockpit-400">No diagnostic snapshots yet.</div>
                  )}
                </Panel>
                <Panel
                  title="Invocation History"
                  headerRight={<TerminalSquare size={15} className="text-cockpit-400" />}
                >
                  {deviceInvocations.length ? (
                    <ul className="space-y-2">
                      {deviceInvocations.map((inv: ToolInvocation) => (
                        <li
                          key={inv.id}
                          className="rounded border border-cockpit-700 bg-cockpit-900/50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-cockpit-200">{inv.toolKey}</span>
                            <Badge
                              variant={
                                inv.status === 'succeeded'
                                  ? 'success'
                                  : inv.status === 'failed'
                                    ? 'danger'
                                    : inv.status === 'policy_denied'
                                      ? 'danger'
                                      : inv.status === 'approval_required'
                                        ? 'warning'
                                        : 'muted'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-cockpit-400">
                            Actor {inv.requestedByUserId} ·{' '}
                            {new Date(inv.createdAt).toLocaleString()}
                          </div>
                          {inv.policyDecision && (
                            <div className="mt-1 text-[10px] text-cockpit-400">
                              Policy:{' '}
                              {(inv.policyDecision as Record<string, unknown>).decision as string}
                            </div>
                          )}
                          {inv.normalizedResult && Object.keys(inv.normalizedResult).length > 0 && (
                            <div className="mt-2">
                              <JsonBlock value={inv.normalizedResult} />
                            </div>
                          )}
                          {inv.status === 'succeeded' && (
                            <div className="mt-2">
                              {drafts[inv.id] ? (
                                <div className="rounded border border-cockpit-700 bg-cockpit-900/50 px-2 py-1 text-[11px] text-cockpit-300">
                                  Draft created: {drafts[inv.id].title}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={draftLoading === inv.id}
                                  onClick={() => createNoteDraft(inv.id)}
                                  className="inline-flex items-center gap-1 rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-[11px] text-cockpit-200 hover:border-accent-500 disabled:opacity-50"
                                >
                                  {draftLoading === inv.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    'Create note draft'
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-cockpit-400">No tool invocations yet.</div>
                  )}
                </Panel>
              </div>
              <Panel title="Last Heartbeat And Policy">
                <div className="grid grid-cols-2 gap-4">
                  <JsonBlock value={detail?.heartbeats[0] ?? { status: 'none' }} />
                  <JsonBlock
                    value={
                      detail?.commands[0]?.policyDecision ?? { decision: 'no_command_requested' }
                    }
                  />
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
  return (
    <AuthGate>
      {(identity, logout) => <DeviceConsoleContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
