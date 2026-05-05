'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Lock, AlertTriangle, Eye, FileText } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import {
  api,
  type DeliveryPolicy,
  type ConnectorPolicy,
  type AiPolicy,
  type RetentionPolicy,
  type PolicySummary,
  type PolicyAuditPreview,
  type AuthIdentity,
  ApiClientError,
} from '@/lib/api';

type PolicyTab = 'delivery' | 'connector' | 'ai' | 'retention';

export function AdminPolicyPanel({ identity }: { identity: AuthIdentity }) {
  const [activeTab, setActiveTab] = useState<PolicyTab>('delivery');
  const [summaries, setSummaries] = useState<PolicySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setDeliveryPolicies] = useState<DeliveryPolicy[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryPolicy | null>(null);

  const [connectorPolicy, setConnectorPolicy] = useState<ConnectorPolicy | null>(null);
  const [connectorInstallationId, setConnectorInstallationId] = useState<string>('');

  const [aiPolicy, setAiPolicy] = useState<AiPolicy | null>(null);
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy | null>(null);

  const [auditPreview, setAuditPreview] = useState<PolicyAuditPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canWrite =
    identity.permissions.includes('*') || identity.permissions.includes('delivery_policy:write');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAdminPolicies();
      setSummaries(data.policies);

      // Fetch delivery policies separately for detail editing
      const dp = await api.listDeliveryPolicies();
      setDeliveryPolicies(dp.policies);
      if (dp.policies.length > 0 && !selectedDelivery) {
        setSelectedDelivery(dp.policies[0]);
      }

      // Fetch connector installations to get first ID
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
        const list = (await res.json()) as { installations?: Array<{ id: string; name: string }> };
        const first = list.installations?.[0];
        if (first) {
          setConnectorInstallationId(first.id);
          const cp = await api.getAdminConnectorPolicy(first.id);
          setConnectorPolicy(cp.policy);
        }
      }

      const aip = await api.getAdminAiPolicy();
      setAiPolicy(aip.policy);

      const rp = await api.getAdminRetentionPolicy();
      setRetentionPolicy(rp.policy);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [identity, selectedDelivery]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAuditPreview = async () => {
    try {
      const data = await api.getAdminPolicyAuditPreview();
      setAuditPreview(data);
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to load audit preview');
    }
  };

  const updateDelivery = async (updates: Partial<DeliveryPolicy>) => {
    if (!selectedDelivery) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateAdminDeliveryPolicy(selectedDelivery.id, updates);
      setSelectedDelivery(data.policy);
      setDeliveryPolicies((prev) => prev.map((p) => (p.id === data.policy.id ? data.policy : p)));
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to update delivery policy');
    } finally {
      setSaving(false);
    }
  };

  const updateConnector = async (updates: Partial<ConnectorPolicy>) => {
    if (!connectorPolicy) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateAdminConnectorPolicy(
        connectorPolicy.connectorInstallationId,
        updates,
      );
      setConnectorPolicy(data.policy);
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to update connector policy');
    } finally {
      setSaving(false);
    }
  };

  const updateAi = async (updates: Partial<AiPolicy>) => {
    if (!aiPolicy) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateAdminAiPolicy(updates);
      setAiPolicy(data.policy);
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to update AI policy');
    } finally {
      setSaving(false);
    }
  };

  const updateRetention = async (updates: Partial<RetentionPolicy>) => {
    if (!retentionPolicy) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateAdminRetentionPolicy(updates);
      setRetentionPolicy(data.policy);
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'Failed to update retention policy');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: PolicyTab; label: string }[] = [
    { key: 'delivery', label: 'Delivery' },
    { key: 'connector', label: 'Connector' },
    { key: 'ai', label: 'AI' },
    { key: 'retention', label: 'Retention' },
  ];

  return (
    <Panel
      title="Policy Editor (BL-076)"
      headerRight={<Shield size={14} className="text-cockpit-400" />}
    >
      <div className="space-y-3">
        {loading && <p className="text-xs text-cockpit-400">Loading policies...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Summary badges */}
        <div className="flex flex-wrap gap-1">
          {summaries.map((s) => (
            <Badge
              key={`${s.policyType}-${s.id}`}
              variant={s.enabled ? (s.killSwitch ? 'danger' : 'success') : 'warning'}
            >
              {s.policyType} v{s.version}
            </Badge>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-cockpit-700 pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setAuditPreview(null);
                setSaveError(null);
              }}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === t.key
                  ? 'bg-cockpit-600 text-white'
                  : 'text-cockpit-400 hover:text-cockpit-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Delivery Tab */}
        {activeTab === 'delivery' && selectedDelivery && (
          <div className="space-y-2 rounded border border-cockpit-700 bg-cockpit-800/40 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-cockpit-100">{selectedDelivery.name}</div>
              <Badge
                variant={
                  selectedDelivery.killSwitch
                    ? 'danger'
                    : selectedDelivery.enabled
                      ? 'success'
                      : 'warning'
                }
              >
                {selectedDelivery.killSwitch
                  ? 'Kill Switch'
                  : selectedDelivery.enabled
                    ? 'Enabled'
                    : 'Disabled'}
              </Badge>
            </div>

            <ToggleRow
              label="Kill switch"
              value={selectedDelivery.killSwitch}
              onChange={(v) => updateDelivery({ killSwitch: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Approval required"
              value={selectedDelivery.approvalRequired}
              onChange={(v) => updateDelivery({ approvalRequired: v })}
              disabled={!canWrite || saving}
            />
            <SelectRow
              label="Min. approver role"
              value={selectedDelivery.minimumApproverRole}
              options={['operator', 'admin', 'owner']}
              onChange={(v) =>
                updateDelivery({ minimumApproverRole: v as DeliveryPolicy['minimumApproverRole'] })
              }
              disabled={!canWrite || saving}
            />
            <LockedRow label="Mock-only enforced" status="Locked ON" color="amber" />
            <LockedRow label="Real network calls" status="Locked OFF" color="red" />
            <NumberRow
              label="Max attempts"
              value={selectedDelivery.retryPolicy.maxAttempts}
              min={1}
              max={10}
              onChange={(v) =>
                updateDelivery({ retryPolicy: { ...selectedDelivery.retryPolicy, maxAttempts: v } })
              }
              disabled={!canWrite || saving}
            />
          </div>
        )}

        {/* Connector Tab */}
        {activeTab === 'connector' && connectorPolicy && (
          <div className="space-y-2 rounded border border-cockpit-700 bg-cockpit-800/40 p-3">
            <div className="text-xs font-semibold text-cockpit-100">{connectorPolicy.name}</div>
            <div className="text-[10px] text-cockpit-400">
              Installation: {connectorInstallationId.slice(0, 8)}...
            </div>
            <ToggleRow
              label="Enabled"
              value={connectorPolicy.enabled}
              onChange={(v) => updateConnector({ enabled: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Kill switch"
              value={connectorPolicy.killSwitch}
              onChange={(v) => updateConnector({ killSwitch: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Approval required"
              value={connectorPolicy.approvalRequired}
              onChange={(v) => updateConnector({ approvalRequired: v })}
              disabled={!canWrite || saving}
            />
            <SelectRow
              label="Min. approver role"
              value={connectorPolicy.minimumApproverRole}
              options={['operator', 'admin', 'owner']}
              onChange={(v) =>
                updateConnector({
                  minimumApproverRole: v as ConnectorPolicy['minimumApproverRole'],
                })
              }
              disabled={!canWrite || saving}
            />
            <LockedRow label="Real network" status="Locked OFF" color="red" />
            <LockedRow label="Writeback" status="Locked OFF" color="red" />
            <NumberRow
              label="Max retries"
              value={connectorPolicy.maxRetries}
              min={0}
              max={10}
              onChange={(v) => updateConnector({ maxRetries: v })}
              disabled={!canWrite || saving}
            />
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && aiPolicy && (
          <div className="space-y-2 rounded border border-cockpit-700 bg-cockpit-800/40 p-3">
            <div className="text-xs font-semibold text-cockpit-100">{aiPolicy.name}</div>
            <ToggleRow
              label="Enabled"
              value={aiPolicy.enabled}
              onChange={(v) => updateAi({ enabled: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Kill switch"
              value={aiPolicy.killSwitch}
              onChange={(v) => updateAi({ killSwitch: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Require human review"
              value={aiPolicy.requireHumanReview}
              onChange={(v) => updateAi({ requireHumanReview: v })}
              disabled={!canWrite || saving}
            />
            <ToggleRow
              label="Draft generation"
              value={aiPolicy.allowDraftGeneration}
              onChange={(v) => updateAi({ allowDraftGeneration: v })}
              disabled={!canWrite || saving}
            />
            <LockedRow label="Autonomous send" status="Locked OFF" color="red" />
            <LockedRow label="Cloud providers" status="Locked OFF" color="red" />
            <LockedRow label="Mock-only mode" status="Locked ON" color="amber" />
            <NumberRow
              label="Max tokens/request"
              value={aiPolicy.maxTokensPerRequest}
              min={1}
              max={100000}
              onChange={(v) => updateAi({ maxTokensPerRequest: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Max cost/day ($)"
              value={aiPolicy.maxCostPerDayUsd}
              min={0}
              max={1000}
              step={0.01}
              onChange={(v) => updateAi({ maxCostPerDayUsd: v })}
              disabled={!canWrite || saving}
            />
          </div>
        )}

        {/* Retention Tab */}
        {activeTab === 'retention' && retentionPolicy && (
          <div className="space-y-2 rounded border border-cockpit-700 bg-cockpit-800/40 p-3">
            <div className="text-xs font-semibold text-cockpit-100">{retentionPolicy.name}</div>
            <ToggleRow
              label="Enabled"
              value={retentionPolicy.enabled}
              onChange={(v) => updateRetention({ enabled: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Session retention (days)"
              value={retentionPolicy.sessionRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ sessionRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Audit log retention (days)"
              value={retentionPolicy.auditLogRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ auditLogRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Call recording retention (days)"
              value={retentionPolicy.callRecordingRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ callRecordingRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Screen observation retention (days)"
              value={retentionPolicy.screenObservationRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ screenObservationRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <SelectRow
              label="Prompt retention mode"
              value={retentionPolicy.promptRetentionMode}
              options={['none', 'metadata_only', 'full']}
              onChange={(v) =>
                updateRetention({
                  promptRetentionMode: v as RetentionPolicy['promptRetentionMode'],
                })
              }
              disabled={!canWrite || saving}
            />
            <SelectRow
              label="Output retention mode"
              value={retentionPolicy.outputRetentionMode}
              options={['none', 'metadata_only', 'full']}
              onChange={(v) =>
                updateRetention({
                  outputRetentionMode: v as RetentionPolicy['outputRetentionMode'],
                })
              }
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Prompt retention (days)"
              value={retentionPolicy.promptRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ promptRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <NumberRow
              label="Output retention (days)"
              value={retentionPolicy.outputRetentionDays}
              min={1}
              max={3650}
              onChange={(v) => updateRetention({ outputRetentionDays: v })}
              disabled={!canWrite || saving}
            />
            <LockedRow label="Auto-purge" status="Locked OFF" color="red" />
          </div>
        )}

        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        {saving && <p className="text-xs text-cockpit-400">Saving...</p>}

        {!canWrite && (
          <p className="text-[10px] text-cockpit-400">
            <Eye size={10} className="inline mr-1" />
            View-only. Admin role required to modify policy.
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-cockpit-700">
          <button
            onClick={handleAuditPreview}
            className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-300 hover:bg-cockpit-800"
          >
            <FileText size={10} />
            Audit Preview
          </button>
        </div>

        {auditPreview && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2 text-[10px] space-y-1">
            <div className="flex items-center gap-1 font-semibold text-cockpit-100">
              <AlertTriangle size={10} />
              Policy Audit Preview
            </div>
            <div className="space-y-1">
              {auditPreview.policies.map((p) => (
                <div
                  key={`${p.policyType}-${p.policyId}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-cockpit-300">{p.policyName}</span>
                  <span className="text-cockpit-400">
                    v{p.version} • {p.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
            {auditPreview.disclaimers.map((d, i) => (
              <div key={i} className="text-cockpit-400">
                {d}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cockpit-300">{label}</span>
      <button
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-emerald-600' : 'bg-cockpit-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={label}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

function LockedRow({
  label,
  status,
  color,
}: {
  label: string;
  status: string;
  color: 'amber' | 'red';
}) {
  const bg = color === 'amber' ? 'bg-amber-900/30 text-amber-300' : 'bg-red-900/30 text-red-300';
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cockpit-300">{label}</span>
      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] ${bg}`}>
        <Lock size={10} /> {status}
      </span>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cockpit-300">{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 disabled:opacity-50"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cockpit-300">{label}</span>
      <input
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100 text-center disabled:opacity-50"
        aria-label={label}
      />
    </div>
  );
}
