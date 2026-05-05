'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Lock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import {
  api,
  type DeliveryPolicy,
  type DeliveryPolicyDecision,
  type ConnectorReadinessResult,
  type AuthIdentity,
  ApiClientError,
} from '@/lib/api';

export function DeliveryPolicyPanel({ identity }: { identity: AuthIdentity }) {
  const [policies, setPolicies] = useState<DeliveryPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<DeliveryPolicy | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ConnectorReadinessResult | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [validation, setValidation] = useState<{
    policy: DeliveryPolicy;
    decision: DeliveryPolicyDecision;
  } | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  const canWrite =
    identity.permissions.includes('*') || identity.permissions.includes('delivery_policy:write');

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listDeliveryPolicies();
      setPolicies(data.policies);
      if (data.policies.length > 0 && !selectedPolicy) {
        setSelectedPolicy(data.policies[0]);
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [selectedPolicy]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleUpdate = async (updates: Partial<DeliveryPolicy>) => {
    const current = selectedPolicy;
    if (!current) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateDeliveryPolicy(current.id, updates);
      setSelectedPolicy(data.policy);
      setPolicies((prev) => prev.map((p) => (p.id === data.policy.id ? data.policy : p)));
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    const current = selectedPolicy;
    if (!current) return;
    setValidationLoading(true);
    try {
      const data = await api.validateDeliveryPolicy(current.id);
      setValidation(data);
    } catch {
      // ignore
    } finally {
      setValidationLoading(false);
    }
  };

  const handleReadiness = async () => {
    const current = selectedPolicy;
    if (!current) return;
    if (!current.connectorInstallationId) {
      setReadinessLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4110'}/connector-installations`,
          {
            headers: {
              'x-tenant-id': identity.tenantId,
              'x-user-id': identity.userId,
              ...(identity.userRole ? { 'x-user-role': identity.userRole } : {}),
            },
            credentials: 'include',
          },
        );
        if (res.ok) {
          const list = (await res.json()) as { installations?: Array<{ id: string }> };
          const first = list.installations?.[0];
          if (first) {
            const result = await api.checkConnectorReadiness(first.id);
            setReadiness(result);
            return;
          }
        }
        setReadiness({
          mode: 'mock',
          readyForMockDelivery: false,
          readyForRealWriteback: false,
          sandboxWritebackReady: false,
          productionWritebackReady: false,
          publicReplyEnabled: false,
          realNetwork: false,
          writebackEnabled: false,
          externalWriteAttempted: false,
          policyDecision: 'no_connector_installed',
          connectorInstalled: false,
          connectorActive: false,
          connectorSupportsActionType: false,
          connectorValidationStatus: 'not_run',
          credentialsAbsentOrRedacted: true,
          policyVersion: current.policyVersion,
          lastValidationResult: null,
          safetyFlags: current.safetyFlags,
          registryPattern: false,
        });
      } catch {
        // ignore
      } finally {
        setReadinessLoading(false);
      }
      return;
    }
    setReadinessLoading(true);
    try {
      const result = await api.checkConnectorReadiness(current.connectorInstallationId);
      setReadiness(result);
    } catch {
      // ignore
    } finally {
      setReadinessLoading(false);
    }
  };

  const toggleSwitch = (field: keyof DeliveryPolicy, value: boolean) => {
    handleUpdate({ [field]: value } as Partial<DeliveryPolicy>);
  };

  return (
    <Panel title="Delivery Policy" headerRight={<Shield size={14} className="text-cockpit-400" />}>
      <div className="space-y-3">
        {loading && <p className="text-xs text-cockpit-500">Loading policies...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {policies.length === 0 && !loading && (
          <p className="text-xs text-cockpit-500">No delivery policies configured.</p>
        )}

        {policies.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {policies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPolicy(p);
                    setValidation(null);
                    setReadiness(null);
                  }}
                  className={`rounded px-2 py-1 text-[10px] font-medium border ${
                    selectedPolicy?.id === p.id
                      ? 'bg-cockpit-600 text-white border-cockpit-500'
                      : 'bg-cockpit-800 text-cockpit-300 border-cockpit-700 hover:bg-cockpit-700'
                  }`}
                >
                  {p.name} v{p.policyVersion}
                </button>
              ))}
            </div>

            {selectedPolicy && (
              <div className="space-y-3 rounded border border-cockpit-700 bg-cockpit-800/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-cockpit-100">
                    {selectedPolicy.name}
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedPolicy.killSwitch ? (
                      <Badge variant="danger">Kill Switch ON</Badge>
                    ) : selectedPolicy.enabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="warning">Disabled</Badge>
                    )}
                    <span className="text-[10px] text-cockpit-500">
                      v{selectedPolicy.policyVersion}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Kill Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Kill switch</span>
                    <button
                      disabled={!canWrite || saving}
                      onClick={() => toggleSwitch('killSwitch', !selectedPolicy.killSwitch)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        selectedPolicy.killSwitch ? 'bg-red-600' : 'bg-cockpit-600'
                      } ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          selectedPolicy.killSwitch ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Approval Required */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Approval required</span>
                    <button
                      disabled={!canWrite || saving}
                      onClick={() =>
                        toggleSwitch('approvalRequired', !selectedPolicy.approvalRequired)
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        selectedPolicy.approvalRequired ? 'bg-emerald-600' : 'bg-cockpit-600'
                      } ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          selectedPolicy.approvalRequired ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Minimum Approver Role */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Min. approver role</span>
                    <select
                      disabled={!canWrite || saving}
                      value={selectedPolicy.minimumApproverRole}
                      onChange={(e) =>
                        handleUpdate({
                          minimumApproverRole: e.target
                            .value as DeliveryPolicy['minimumApproverRole'],
                        })
                      }
                      className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  {/* Mock Only - Locked */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Mock-only enforced</span>
                    <span className="inline-flex items-center gap-1 rounded bg-amber-900/30 px-2 py-0.5 text-[10px] text-amber-300">
                      <Lock size={10} /> Locked ON
                    </span>
                  </div>

                  {/* Real Network - Locked */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Real network calls</span>
                    <span className="inline-flex items-center gap-1 rounded bg-red-900/30 px-2 py-0.5 text-[10px] text-red-300">
                      <Lock size={10} /> Locked OFF
                    </span>
                  </div>
                  <div className="rounded border border-cockpit-700 bg-cockpit-900/50 px-2 py-1.5 text-[10px] text-cockpit-300">
                    Sandbox allowlist permits local Zammad sandbox read and approved internal-note
                    writeback only. Uncontrolled egress is denied. This is not production writeback.
                  </div>

                  {/* Allowed Action Types */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Allowed actions</span>
                    <span className="text-[10px] text-cockpit-400">
                      {selectedPolicy.allowedActionTypes.join(', ')}
                    </span>
                  </div>

                  {/* Max Attempts */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cockpit-300">Max attempts</span>
                    <input
                      type="number"
                      disabled={!canWrite || saving}
                      min={1}
                      max={10}
                      value={selectedPolicy.retryPolicy.maxAttempts}
                      onChange={(e) =>
                        handleUpdate({
                          retryPolicy: {
                            ...selectedPolicy.retryPolicy,
                            maxAttempts: Number(e.target.value),
                          },
                        })
                      }
                      className="w-16 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 text-center disabled:opacity-50"
                    />
                  </div>
                </div>

                {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                {saving && <p className="text-xs text-cockpit-500">Saving...</p>}

                {!canWrite && (
                  <p className="text-[10px] text-cockpit-500">
                    <Eye size={10} className="inline mr-1" />
                    View-only. Admin role required to modify policy.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-cockpit-700">
                  <button
                    onClick={handleValidate}
                    disabled={validationLoading}
                    className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-300 hover:bg-cockpit-800 disabled:opacity-50"
                  >
                    <CheckCircle size={10} />
                    {validationLoading ? 'Validating...' : 'Validate Policy'}
                  </button>
                  <button
                    onClick={handleReadiness}
                    disabled={readinessLoading}
                    className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-300 hover:bg-cockpit-800 disabled:opacity-50"
                  >
                    <RefreshCw size={10} />
                    {readinessLoading ? 'Checking...' : 'Connector Readiness'}
                  </button>
                </div>

                {validation && (
                  <div
                    className={`rounded border p-2 text-[10px] ${
                      validation.decision.allowed
                        ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-300'
                        : 'border-red-700/40 bg-red-900/20 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      {validation.decision.allowed ? (
                        <CheckCircle size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {validation.decision.decision}
                    </div>
                    <div className="mt-1 text-cockpit-400">{validation.decision.reason}</div>
                    <div className="mt-1 text-cockpit-500">
                      Mode: {validation.decision.mode} • Version:{' '}
                      {validation.decision.policyVersion}
                    </div>
                  </div>
                )}

                {readiness && (
                  <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2 text-[10px] space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-cockpit-100">
                      <AlertTriangle size={10} />
                      Connector Readiness
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-cockpit-300">
                      <div>Mode: {readiness.mode}</div>
                      <div>Mock ready: {readiness.readyForMockDelivery ? 'Yes' : 'No'}</div>
                      <div>Sandbox writeback: {readiness.sandboxWritebackReady ? 'Yes' : 'No'}</div>
                      <div>
                        Production writeback: {readiness.productionWritebackReady ? 'Yes' : 'No'}
                      </div>
                      <div>Public reply: {readiness.publicReplyEnabled ? 'Yes' : 'No'}</div>
                      <div>Active: {readiness.connectorActive ? 'Yes' : 'No'}</div>
                      <div>
                        Supports type: {readiness.connectorSupportsActionType ? 'Yes' : 'No'}
                      </div>
                      {readiness.registryPattern && <div>Registry pattern: true</div>}
                      {readiness.adapterFactoryId && (
                        <div>Factory: {readiness.adapterFactoryId}</div>
                      )}
                    </div>
                    <div className="text-amber-300">
                      <Lock size={10} className="inline mr-1" />
                      {readiness.sandboxWritebackReady
                        ? 'Sandbox internal-note writeback enabled; no public reply; no production writeback.'
                        : !readiness.connectorSupportsActionType
                          ? 'Action type not supported by this connector. Sandbox writeback disabled for this action.'
                          : 'Sandbox writeback disabled; production writeback blocked.'}
                    </div>
                    <div className="text-cockpit-500">Policy: {readiness.policyDecision}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
