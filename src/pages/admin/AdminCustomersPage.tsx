import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Search, ShieldAlert, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminCustomersPage: React.FC<Props> = ({ navigate }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Suspend modal state
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    api.getAdminCustomers(search)
      .then((res) => setCustomers(res.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendTarget || !suspendReason.trim()) return;
    try {
      await api.suspendCustomer(suspendTarget.id, suspendReason.trim());
      setMessage(`Customer ${suspendTarget.id} suspended.`);
      setSuspendTarget(null);
      setSuspendReason('');
      loadCustomers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReactivate = async (cust: any) => {
    try {
      await api.reactivateCustomer(cust.id);
      setMessage(`Customer ${cust.id} reactivated.`);
      loadCustomers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered customer database, service allocations, activity status, and compliance controls.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
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

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer ID</th>
                <th className="py-3 px-4 font-semibold">Name & Company</th>
                <th className="py-3 px-4 font-semibold">Email & Phone</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Services</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{c.fullName}</p>
                      {c.companyName && <p className="text-[11px] text-slate-400">{c.companyName}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <p>{c.email}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{c.mobile}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.city ? `${c.city}, ${c.country}` : c.country}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      <span>{c.hostingCount} Hosting</span> · <span>{c.domainCount} Domains</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-rose-950 text-rose-400 border border-rose-900'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.status === 'active' ? (
                        <button
                          onClick={() => setSuspendTarget(c)}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-medium"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(c)}
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

      {/* Suspend Customer Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleSuspend}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Suspend Customer Account</span>
              <button type="button" onClick={() => setSuspendTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Suspending <strong>{suspendTarget.fullName}</strong> ({suspendTarget.id}) will pause their login session and mark services. Please provide an authoritative compliance reason.
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reason for Suspension</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Terms of Service violation, suspicious payment activity, chargeback inquiry..."
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
