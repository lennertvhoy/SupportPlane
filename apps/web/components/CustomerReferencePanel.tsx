'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Users, Mail, Phone, Building, ExternalLink } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, type CustomerReference, ApiClientError } from '@/lib/api';

export function CustomerReferencePanel() {
  const [customers, setCustomers] = useState<CustomerReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCustomers() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <Panel
      title="Customers"
      headerRight={
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-[10px] font-medium text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
        >
          {loading && <Loader2 size={10} className="animate-spin" />}
          Refresh
        </button>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {customers.length === 0 && !loading && !error && (
          <div className="text-xs text-cockpit-500">
            No customer references found for this tenant.
          </div>
        )}

        <div className="space-y-2">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-accent" />
                  <span className="text-xs font-medium text-cockpit-100">
                    {customer.name ?? customer.externalCustomerId}
                  </span>
                </div>
                <Badge variant="muted" className="text-[10px]">
                  {customer.externalCustomerId}
                </Badge>
              </div>

              <div className="mt-1.5 grid grid-cols-1 gap-1 text-[10px]">
                {customer.email && (
                  <div className="flex items-center gap-1 text-cockpit-400">
                    <Mail size={10} />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-1 text-cockpit-400">
                    <Phone size={10} />
                    {customer.phone}
                  </div>
                )}
                {customer.company && (
                  <div className="flex items-center gap-1 text-cockpit-400">
                    <Building size={10} />
                    {customer.company}
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-cockpit-500">
                <span>Adapter: {customer.adapterId}</span>
                <span className="inline-flex items-center gap-1">
                  <ExternalLink size={8} />
                  {new Date(customer.lastSyncedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
