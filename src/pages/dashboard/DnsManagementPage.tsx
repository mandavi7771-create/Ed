import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DomainRecord, DnsEntry } from '../../types';
import { Network, Plus, Trash2, Edit3, CheckCircle2, RefreshCw, X, Globe } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const DnsManagementPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [records, setRecords] = useState<DnsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record state
  const [recType, setRecType] = useState<string>('A');
  const [recName, setRecName] = useState<string>('@');
  const [recContent, setRecContent] = useState<string>('');
  const [recTtl, setRecTtl] = useState<number>(3600);
  const [recPriority, setRecPriority] = useState<number>(10);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.getMyDomains(user.id).then((res) => {
        setDomains(res.domains || []);
        if (res.domains?.length > 0) {
          setSelectedDomainId(res.domains[0].id);
        }
      }).catch(console.error);
    }
  }, [user]);

  const loadRecords = async (domainId: string) => {
    if (!domainId) return;
    setLoading(true);
    try {
      const res = await api.getDnsRecords(domainId);
      setRecords(res.records || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error fetching DNS records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDomainId) {
      loadRecords(selectedDomainId);
    }
  }, [selectedDomainId]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recName || !recContent) return;
    try {
      await api.addDnsRecord(selectedDomainId, {
        type: recType as any,
        name: recName.trim(),
        content: recContent.trim(),
        ttl: Number(recTtl),
        priority: ['MX', 'SRV'].includes(recType) ? Number(recPriority) : undefined,
      });
      setMessage({ type: 'success', text: `DNS ${recType} record added successfully` });
      setShowAddModal(false);
      setRecName('@');
      setRecContent('');
      loadRecords(selectedDomainId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add DNS record' });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this DNS record?')) return;
    try {
      await api.deleteDnsRecord(selectedDomainId, recordId);
      setMessage({ type: 'success', text: 'DNS record deleted successfully' });
      loadRecords(selectedDomainId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete record' });
    }
  };

  const activeDomain = domains.find((d) => d.id === selectedDomainId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">DNS Zone Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure A, AAAA, CNAME, MX, TXT, SRV, and CAA resource records with authoritative nameservers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={!selectedDomainId}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add DNS Record</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-900/60 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Domain Selector Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">Selected Domain:</span>
          <select
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.domainName}
              </option>
            ))}
          </select>
        </div>

        {activeDomain && (
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>Authoritative Nameservers:</span>
            <span className="font-mono text-slate-300">{activeDomain.nameservers.join(', ')}</span>
          </div>
        )}
      </div>

      {/* DNS Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold w-24">Type</th>
                <th className="py-3 px-4 font-semibold w-40">Host / Name</th>
                <th className="py-3 px-4 font-semibold">Value / Target Content</th>
                <th className="py-3 px-4 font-semibold w-24">TTL</th>
                <th className="py-3 px-4 font-semibold w-20">Priority</th>
                <th className="py-3 px-4 font-semibold text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading DNS records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No custom DNS records found for this domain.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold font-mono">
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">{rec.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300 break-all">{rec.content}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{rec.ttl}s</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{rec.priority !== undefined ? rec.priority : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add DNS Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleAddRecord}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Add New DNS Record</span>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Record Type</label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Host / Name (@ for root)</label>
                <input
                  type="text"
                  placeholder="@, www, mail"
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Value / Content / Target</label>
              <input
                type="text"
                placeholder={recType === 'A' ? '159.65.132.88' : recType === 'CNAME' ? 'example.com' : 'target content'}
                value={recContent}
                onChange={(e) => setRecContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">TTL (Seconds)</label>
                <select
                  value={recTtl}
                  onChange={(e) => setRecTtl(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value={300}>300 (5 mins)</option>
                  <option value={3600}>3600 (1 hour - Default)</option>
                  <option value={86400}>86400 (24 hours)</option>
                </select>
              </div>

              {['MX', 'SRV'].includes(recType) && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Priority</label>
                  <input
                    type="number"
                    value={recPriority}
                    onChange={(e) => setRecPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
