'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  Plug,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  Settings,
  Wrench,
  TestTube,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  FileCode,
  Activity,
} from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import {
  api,
  type ConnectorStatus,
  type ConnectorTestResult,
  type ConnectorInstallation,
  type ConnectorCredentialReference,
  type AuthIdentity,
  ApiClientError,
} from '@/lib/api';

export function ConnectorPanel({ identity }: { identity?: AuthIdentity }) {
  const [status, setStatus] = useState<ConnectorStatus | undefined>(undefined);
  const [testResult, setTestResult] = useState<ConnectorTestResult | undefined>(undefined);
  const [installations, setInstallations] = useState<ConnectorInstallation[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installationResults, setInstallationResults] = useState<
    Record<string, { type: string; result: unknown }>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<ConnectorInstallation>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [credentialReferences, setCredentialReferences] = useState<ConnectorCredentialReference[]>(
    [],
  );
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [configValidationResults, setConfigValidationResults] = useState<
    Record<string, { type: string; result: unknown }>
  >({});
  const [runtimeReadinessResults, setRuntimeReadinessResults] = useState<
    Record<string, { type: string; result: unknown }>
  >({});

  const canTest =
    identity?.permissions.includes('*') ||
    identity?.permissions.includes('connector_installation:test');
  const canEdit =
    identity?.permissions.includes('*') ||
    identity?.permissions.includes('connector_installation:write');
  const canManageCredentials =
    identity?.permissions.includes('*') ||
    identity?.permissions.includes('credential_reference:write');
  const canViewCredentials =
    identity?.permissions.includes('*') ||
    identity?.permissions.includes('credential_reference:read');

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const [s, inst, creds] = await Promise.all([
        api.getConnectorStatus(),
        api.listConnectorInstallations(),
        canViewCredentials ? api.listCredentialReferences() : Promise.resolve([]),
      ]);
      setStatus(s);
      setInstallations(inst);
      setCredentialReferences(creds);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load connector status');
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    try {
      const r = await api.testConnector();
      setTestResult(r);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  async function handleValidateInstallation(id: string) {
    if (!canTest) {
      setError('Viewer role cannot validate connectors');
      return;
    }
    setInstallationResults((prev) => ({
      ...prev,
      [id]: { type: 'validating', result: undefined },
    }));
    try {
      const r = await api.validateConnectorInstallation(id);
      setInstallationResults((prev) => ({ ...prev, [id]: { type: 'validate', result: r } }));
    } catch (err) {
      setInstallationResults((prev) => ({
        ...prev,
        [id]: {
          type: 'validate',
          result: { error: err instanceof ApiClientError ? err.message : 'Validation failed' },
        },
      }));
    }
  }

  async function handleTestInstallation(id: string) {
    if (!canTest) {
      setError('Viewer role cannot test connectors');
      return;
    }
    setInstallationResults((prev) => ({ ...prev, [id]: { type: 'testing', result: undefined } }));
    try {
      const r = await api.testConnectorInstallation(id);
      setInstallationResults((prev) => ({ ...prev, [id]: { type: 'test', result: r } }));
    } catch (err) {
      setInstallationResults((prev) => ({
        ...prev,
        [id]: {
          type: 'test',
          result: { error: err instanceof ApiClientError ? err.message : 'Test failed' },
        },
      }));
    }
  }

  async function handleSave(id: string) {
    if (!canEdit) {
      setSaveError('Viewer role cannot modify connector settings');
      return;
    }
    const updates = editing[id];
    if (!updates) return;
    setSavingId(id);
    setSaveError(null);
    try {
      const updated = await api.updateConnectorInstallation(id, updates);
      setInstallations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setSaveError(err instanceof ApiClientError ? err.message : 'Failed to save settings');
    } finally {
      setSavingId(null);
    }
  }

  function handleCancel(id: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSaveError(null);
  }

  function toggleField(id: string, field: keyof ConnectorInstallation, value: boolean) {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }));
  }

  function setField(
    id: string,
    field: keyof ConnectorInstallation,
    value: string | number | string[] | Record<string, unknown> | undefined,
  ) {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }));
  }

  async function handleLinkCredential(installationId: string, credentialReferenceId: string) {
    if (!canManageCredentials) {
      setLinkError('Insufficient permissions to link credentials');
      return;
    }
    setLinkingId(installationId);
    setLinkError(null);
    try {
      const result = await api.linkCredentialReference(installationId, credentialReferenceId);
      setInstallations((prev) =>
        prev.map((i) => (i.id === result.installation.id ? result.installation : i)),
      );
    } catch (err) {
      setLinkError(err instanceof ApiClientError ? err.message : 'Failed to link credential');
    } finally {
      setLinkingId(null);
    }
  }

  async function handleUnlinkCredential(installationId: string, credentialReferenceId: string) {
    if (!canManageCredentials) {
      setLinkError('Insufficient permissions to unlink credentials');
      return;
    }
    setLinkingId(installationId);
    setLinkError(null);
    try {
      const result = await api.unlinkCredentialReference(installationId, credentialReferenceId);
      setInstallations((prev) =>
        prev.map((i) => (i.id === result.installation.id ? result.installation : i)),
      );
    } catch (err) {
      setLinkError(err instanceof ApiClientError ? err.message : 'Failed to unlink credential');
    } finally {
      setLinkingId(null);
    }
  }

  async function handleValidateConfig(id: string) {
    if (!canTest) {
      setError('Viewer role cannot validate connector config');
      return;
    }
    setConfigValidationResults((prev) => ({
      ...prev,
      [id]: { type: 'validating', result: undefined },
    }));
    try {
      const config = installations.find((i) => i.id === id)?.config ?? {};
      const r = await api.validateConnectorConfig(id, config);
      setConfigValidationResults((prev) => ({
        ...prev,
        [id]: { type: 'validate-config', result: r },
      }));
    } catch (err) {
      setConfigValidationResults((prev) => ({
        ...prev,
        [id]: {
          type: 'validate-config',
          result: {
            error: err instanceof ApiClientError ? err.message : 'Config validation failed',
          },
        },
      }));
    }
  }

  async function handleRuntimeReadiness(id: string) {
    if (!canTest) {
      setError('Viewer role cannot check runtime readiness');
      return;
    }
    setRuntimeReadinessResults((prev) => ({
      ...prev,
      [id]: { type: 'checking', result: undefined },
    }));
    try {
      const r = await api.checkConnectorRuntimeReadiness(id);
      setRuntimeReadinessResults((prev) => ({
        ...prev,
        [id]: { type: 'runtime-readiness', result: r },
      }));
    } catch (err) {
      setRuntimeReadinessResults((prev) => ({
        ...prev,
        [id]: {
          type: 'runtime-readiness',
          result: {
            error: err instanceof ApiClientError ? err.message : 'Runtime readiness check failed',
          },
        },
      }));
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  const isMock = status?.mode === 'mock';

  return (
    <Panel
      title="Connector"
      headerRight={
        status ? (
          <Badge variant={isMock ? 'warning' : 'success'}>
            {isMock ? 'Mock mode' : 'Zammad mode'}
          </Badge>
        ) : null
      }
    >
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-cockpit-400">
            <Loader2 size={14} className="animate-spin" />
            Loading connector status...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Type</span>
              <span className="font-medium text-cockpit-100">{status.adapterType}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Health</span>
              <span className="inline-flex items-center gap-1 font-medium text-cockpit-100">
                {status.health === 'healthy' ? (
                  <CheckCircle size={12} className="text-emerald-400" />
                ) : status.health === 'unhealthy' ? (
                  <XCircle size={12} className="text-danger" />
                ) : (
                  <AlertCircle size={12} className="text-amber-400" />
                )}
                {status.health}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Connected</span>
              <span className={status.connected ? 'text-emerald-400' : 'text-danger'}>
                {status.connected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="text-xs text-cockpit-400">
              Capabilities:{' '}
              <span className="text-cockpit-200">{status.capabilities.join(', ')}</span>
            </div>
            {isMock && (
              <div className="rounded border border-amber-700/30 bg-amber-950/20 px-2 py-1.5 text-[10px] text-amber-300">
                No real writeback unless configured. Credentials not stored in browser.
              </div>
            )}
            {!isMock && (
              <div className="rounded border border-emerald-700/30 bg-emerald-950/20 px-2 py-1.5 text-[10px] text-emerald-200">
                Egress policy: sandbox allowlist only. Allowed destination: local Zammad sandbox.
                OpenBao sandbox resolver; secrets resolved server-side. Writeback blocked.
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-[10px] font-medium text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
              >
                <RefreshCw size={10} />
                Refresh
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {testing && <Loader2 size={10} className="animate-spin" />}
                <Plug size={10} />
                Test
              </button>
            </div>

            {testResult && (
              <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cockpit-400">Test result</span>
                  <Badge variant={testResult.success ? 'success' : 'danger'}>
                    {testResult.success ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                {testResult.latencyMs !== undefined && (
                  <div className="mt-1 text-cockpit-400">Latency: {testResult.latencyMs}ms</div>
                )}
                {testResult.error && <div className="mt-1 text-danger">{testResult.error}</div>}
                {typeof testResult.metadata?.note === 'string' && (
                  <div className="mt-1 text-cockpit-400">{testResult.metadata.note}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connector Installations */}
        <div className="border-t border-cockpit-700 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-cockpit-300">
            <Settings size={12} />
            Installations
          </div>

          {installations.length === 0 && !loading && (
            <div className="text-[10px] text-cockpit-400">
              No connector installations configured.
            </div>
          )}

          <div className="space-y-2">
            {installations.map((inst) => {
              const isExpanded = expandedId === inst.id;
              const edit = editing[inst.id] ?? {};
              const display = inst.displayName || inst.name;
              const isSaving = savingId === inst.id;

              return (
                <div
                  key={inst.id}
                  className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cockpit-100">{display}</span>
                    <div className="flex items-center gap-1.5">
                      {!inst.enabled && (
                        <Badge variant="warning" className="text-[10px]">
                          Disabled
                        </Badge>
                      )}
                      <Badge
                        variant={
                          inst.status === 'active'
                            ? 'success'
                            : inst.status === 'error'
                              ? 'danger'
                              : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {inst.status}
                      </Badge>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : inst.id)}
                        className="text-cockpit-400 hover:text-cockpit-200"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-cockpit-400">
                    Type: <span className="text-cockpit-200">{inst.adapterType}</span>
                    {inst.capabilities.length > 0 && (
                      <span className="ml-2 text-cockpit-400">
                        ({inst.capabilities.join(', ')})
                      </span>
                    )}
                    {inst.adapterType === 'osticket' && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-900/30 px-1.5 py-0.5 text-[9px] text-amber-300">
                        <Lock size={8} /> Fixture-only
                      </span>
                    )}
                  </div>
                  {inst.description && (
                    <div className="mt-0.5 text-[10px] text-cockpit-400">{inst.description}</div>
                  )}
                  {Object.keys(inst.safetyFlags).length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cockpit-400">
                      <Shield size={10} className="text-accent" />
                      Safety:{' '}
                      {Object.entries(inst.safetyFlags)
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join(', ')}
                    </div>
                  )}
                  {inst.lastError && (
                    <div className="mt-1 text-[10px] text-danger">{inst.lastError}</div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleValidateInstallation(inst.id)}
                      disabled={!canTest || installationResults[inst.id]?.type === 'validating'}
                      className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                    >
                      {installationResults[inst.id]?.type === 'validating' ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Wrench size={10} />
                      )}
                      Validate
                    </button>
                    <button
                      onClick={() => handleTestInstallation(inst.id)}
                      disabled={!canTest || installationResults[inst.id]?.type === 'testing'}
                      className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                    >
                      {installationResults[inst.id]?.type === 'testing' ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <TestTube size={10} />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => handleValidateConfig(inst.id)}
                      disabled={!canTest || configValidationResults[inst.id]?.type === 'validating'}
                      className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                    >
                      {configValidationResults[inst.id]?.type === 'validating' ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <FileCode size={10} />
                      )}
                      Config
                    </button>
                    <button
                      onClick={() => handleRuntimeReadiness(inst.id)}
                      disabled={!canTest || runtimeReadinessResults[inst.id]?.type === 'checking'}
                      className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                    >
                      {runtimeReadinessResults[inst.id]?.type === 'checking' ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Activity size={10} />
                      )}
                      Readiness
                    </button>
                  </div>

                  {(() => {
                    const res = installationResults[inst.id]?.result;
                    if (!res) return null;
                    return (
                      <div className="mt-1 rounded border border-cockpit-700 bg-cockpit-900/50 p-1.5 text-[10px] text-cockpit-300">
                        {JSON.stringify(res as Record<string, unknown>, null, 2)}
                      </div>
                    );
                  })()}

                  {(() => {
                    const res = configValidationResults[inst.id]?.result;
                    if (!res) return null;
                    const result = res as Record<string, unknown>;
                    const hasError =
                      result.error ||
                      (result.result && (result.result as Record<string, unknown>).valid === false);
                    return (
                      <div
                        className={`mt-1 rounded border p-1.5 text-[10px] ${hasError ? 'border-amber-700/40 bg-amber-950/20 text-amber-200' : 'border-cockpit-700 bg-cockpit-900/50 text-cockpit-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Config validation</span>
                          {hasError ? (
                            <Badge variant="warning" className="text-[9px]">
                              Issues found
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[9px]">
                              Valid
                            </Badge>
                          )}
                        </div>
                        {result.error ? (
                          <div className="text-danger">{String(result.error)}</div>
                        ) : (
                          <div className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(result.result ?? result, null, 2)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const res = runtimeReadinessResults[inst.id]?.result;
                    if (!res) return null;
                    const result = res as Record<string, unknown>;
                    const readiness = result.result as Record<string, unknown> | undefined;
                    return (
                      <div className="mt-1 rounded border border-cockpit-700 bg-cockpit-900/50 p-1.5 text-[10px] text-cockpit-300">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Runtime readiness</span>
                          <Badge
                            variant={
                              readiness?.mockReady || readiness?.realReady ? 'success' : 'warning'
                            }
                            className="text-[9px]"
                          >
                            {readiness?.realReady
                              ? 'Real ready'
                              : readiness?.mockReady
                                ? 'Mock ready'
                                : 'Not ready'}
                          </Badge>
                        </div>
                        {result.error ? (
                          <div className="text-danger">{String(result.error)}</div>
                        ) : (
                          <div className="mt-1 space-y-0.5">
                            <div>realNetwork: {String(readiness?.realNetwork ?? false)}</div>
                            <div>
                              writebackEnabled: {String(readiness?.writebackEnabled ?? false)}
                            </div>
                            <div>
                              externalWriteAttempted:{' '}
                              {String(readiness?.externalWriteAttempted ?? false)}
                            </div>
                            <div>
                              linkedCredentials:{' '}
                              {String(readiness?.linkedCredentialReferenceCount ?? 0)}
                            </div>
                            <div>
                              Secrets resolved server-side:{' '}
                              {String(Number(readiness?.linkedCredentialReferenceCount ?? 0) > 0)}
                            </div>
                            {(() => {
                              const warnings = readiness?.warnings;
                              if (!Array.isArray(warnings)) return null;
                              return (
                                <div className="text-cockpit-400">
                                  {warnings.map((w: string, i: number) => (
                                    <div key={i}>• {w}</div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isExpanded && (
                    <div className="mt-2 space-y-2 rounded border border-cockpit-700 bg-cockpit-800/30 p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-semibold text-cockpit-300">
                          Installation Settings
                        </div>
                        {inst.adapterType === 'osticket' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-900/30 px-1.5 py-0.5 text-[9px] text-amber-300">
                            <Lock size={8} /> Fixture-only — not a real service
                          </span>
                        ) : inst.mockMode ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-900/30 px-1.5 py-0.5 text-[9px] text-amber-300">
                            <Lock size={8} /> Mock-only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-900/30 px-1.5 py-0.5 text-[9px] text-emerald-300">
                            <Plug size={8} /> Real mode
                          </span>
                        )}
                      </div>

                      {/* Display name */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-cockpit-400">Display name</label>
                        <input
                          type="text"
                          disabled={!canEdit || isSaving}
                          value={
                            edit.displayName !== undefined
                              ? (edit.displayName ?? '')
                              : (inst.displayName ?? '')
                          }
                          onChange={(e) =>
                            setField(inst.id, 'displayName', e.target.value || undefined)
                          }
                          className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-cockpit-400">Description</label>
                        <textarea
                          disabled={!canEdit || isSaving}
                          value={
                            edit.description !== undefined
                              ? (edit.description ?? '')
                              : (inst.description ?? '')
                          }
                          onChange={(e) =>
                            setField(inst.id, 'description', e.target.value || undefined)
                          }
                          rows={2}
                          className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
                        />
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cockpit-400">Status</span>
                        <select
                          disabled={!canEdit || isSaving}
                          value={edit.status ?? inst.status}
                          onChange={(e) => setField(inst.id, 'status', e.target.value)}
                          className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="error">error</option>
                        </select>
                      </div>

                      {/* Enabled toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cockpit-400">Enabled</span>
                        <button
                          disabled={!canEdit || isSaving}
                          onClick={() =>
                            toggleField(
                              inst.id,
                              'enabled',
                              !(edit.enabled !== undefined ? edit.enabled : inst.enabled),
                            )
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (edit.enabled !== undefined ? edit.enabled : inst.enabled)
                              ? 'bg-emerald-600'
                              : 'bg-cockpit-600'
                          } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              (edit.enabled !== undefined ? edit.enabled : inst.enabled)
                                ? 'translate-x-5'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mock mode */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cockpit-400">Mock mode</span>
                        {inst.mockMode ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-900/30 px-2 py-0.5 text-[10px] text-amber-300">
                            <Lock size={10} /> ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-300">
                            <Plug size={10} /> OFF
                          </span>
                        )}
                      </div>

                      {/* Validate before write toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cockpit-400">Validate before write</span>
                        <button
                          disabled={!canEdit || isSaving}
                          onClick={() => {
                            const currentFlags = edit.safetyFlags ?? inst.safetyFlags;
                            const nextFlags = {
                              ...currentFlags,
                              validateBeforeWrite: !currentFlags.validateBeforeWrite,
                            };
                            setField(inst.id, 'safetyFlags', nextFlags);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (edit.safetyFlags ?? inst.safetyFlags).validateBeforeWrite
                              ? 'bg-emerald-600'
                              : 'bg-cockpit-600'
                          } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              (edit.safetyFlags ?? inst.safetyFlags).validateBeforeWrite
                                ? 'translate-x-5'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Timeout */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cockpit-400">Timeout (ms)</span>
                        <input
                          type="number"
                          disabled={!canEdit || isSaving}
                          min={1000}
                          max={60000}
                          value={
                            edit.timeoutMs !== undefined
                              ? (edit.timeoutMs ?? '')
                              : (inst.timeoutMs ?? '')
                          }
                          onChange={(e) =>
                            setField(
                              inst.id,
                              'timeoutMs',
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          className="w-20 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 text-center disabled:opacity-50"
                        />
                      </div>

                      {/* Capabilities - read only */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-cockpit-400">Capabilities</span>
                        <div className="flex flex-wrap gap-1">
                          {inst.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="rounded bg-cockpit-700 px-1.5 py-0.5 text-[10px] text-cockpit-200"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Credential references */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cockpit-400">
                            Credential References
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-cockpit-400">
                            <Lock size={10} />
                            Secret values hidden
                          </span>
                        </div>

                        {inst.secretReferenceIds.length === 0 ? (
                          <div className="text-[10px] text-cockpit-400 italic">
                            No credential references linked.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {inst.secretReferenceIds.map((credId) => {
                              const cred = credentialReferences.find((c) => c.id === credId);
                              return (
                                <span
                                  key={credId}
                                  className="inline-flex items-center gap-1 rounded bg-cockpit-700 px-1.5 py-0.5 text-[10px] text-cockpit-200"
                                >
                                  {cred?.displayName ?? credId}
                                  {canManageCredentials && (
                                    <button
                                      onClick={() => handleUnlinkCredential(inst.id, credId)}
                                      disabled={linkingId === inst.id}
                                      className="ml-0.5 text-cockpit-400 hover:text-danger disabled:opacity-50"
                                      title="Unlink credential"
                                    >
                                      <XCircle size={10} />
                                    </button>
                                  )}
                                  <Badge
                                    variant={
                                      cred?.status === 'active'
                                        ? 'success'
                                        : cred?.status === 'error'
                                          ? 'danger'
                                          : 'warning'
                                    }
                                    className="text-[9px] ml-0.5"
                                  >
                                    {cred?.status ?? 'unknown'}
                                  </Badge>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {canManageCredentials && credentialReferences.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <select
                              disabled={linkingId === inst.id}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  handleLinkCredential(inst.id, value);
                                  e.target.value = '';
                                }
                              }}
                              className="flex-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Link a credential reference...
                              </option>
                              {credentialReferences
                                .filter(
                                  (c) =>
                                    c.connectorType === inst.adapterType ||
                                    c.connectorType === 'mock',
                                )
                                .filter((c) => !inst.secretReferenceIds.includes(c.id))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.displayName} ({c.status})
                                  </option>
                                ))}
                            </select>
                            {linkingId === inst.id && (
                              <Loader2 size={12} className="animate-spin text-cockpit-400" />
                            )}
                          </div>
                        )}

                        {linkError && <div className="text-[10px] text-danger">{linkError}</div>}
                      </div>

                      {saveError && isExpanded && (
                        <div className="text-[10px] text-danger">{saveError}</div>
                      )}

                      {canEdit ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSave(inst.id)}
                            disabled={isSaving || !editing[inst.id]}
                            className="inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-[10px] font-medium text-white hover:bg-accent-dark disabled:opacity-50"
                          >
                            {isSaving && <Loader2 size={10} className="animate-spin" />}
                            <Save size={10} />
                            Save
                          </button>
                          <button
                            onClick={() => handleCancel(inst.id)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                          >
                            <RotateCcw size={10} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-cockpit-400">
                          <Eye size={10} className="inline mr-1" />
                          View-only. Admin role required to modify installation settings.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
