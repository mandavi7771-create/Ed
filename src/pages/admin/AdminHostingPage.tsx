import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HostingAccount } from '../../types';
import { Server, Search, ExternalLink, ShieldAlert, X } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminHostingPage: React.FC<Props> = ({ navigate }) => {
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<HostingAccount | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadHosting = () => {
    setLoading(true);
    api.getAdminHosting().then((res) => setHosting(res.hosting || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHosting();
  }, []);

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendTarget || !suspendReason.trim()) return;
    try {
      await api.suspendHosting(suspendTarget.id, suspendReason.trim());
      setMessage(`Hosting account ${suspendTarget.domainName} suspended.`);
      setSuspendTarget(null);
      setSuspendReason('');
      loadHosting();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReactivate = async (acc: HostingAccount) => {
    try {
      await api.reactivateHosting(acc.id);
      setMessage(`Hosting account ${acc.domainName} reactivated.`);
      loadHosting();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filtered = hosting.filter((h) =>
    h.domainName.toLowerCase().includes(search.toLowerCase()) ||
    h.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
    h.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Active Hosting Server Containers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cluster instance monitoring, disk quotas, virtual host configurations, and suspension controls.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search hosting accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {message && (
        <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Instance ID</th>
                <th className="py-3 px-4 font-semibold">Domain</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Server Node & IP</th>
                <th className="py-3 px-4 font-semibold">Disk Usage</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading hosting instances...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No hosting accounts found.</td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{h.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{h.domainName}</span>
                        <a
                          href={`/sites/${h.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      <p>{h.customerEmail}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{h.customerId}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{h.planName}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <p className="text-slate-200">{h.serverIp}</p>
                      <p className="text-[10px] text-slate-500">{h.serverNode}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {h.storageUsedMB} MB / {(h.storageTotalMB / 1024).toFixed(0)} GB
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          h.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-rose-950 text-rose-400 border border-rose-900'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {h.status === 'active' ? (
                        <button
                          onClick={() => {
                            setSuspendTarget(h);
                            setSuspendReason('');
                          }}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-medium"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(h)}
                          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[11px] font-medium"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleSuspend}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Suspend Hosting Instance</span>
              <button type="button" onClick={() => setSuspendTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Suspend web traffic and execution for <strong>{suspendTarget.domainName}</strong> ({suspendTarget.id}).
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Recorded Reason for Suspension</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Exceeded CPU/RAM limits, malware detected, non-payment..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg"
              >
                Confirm Suspension
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
