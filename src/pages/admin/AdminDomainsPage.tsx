import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DomainRecord } from '../../types';
import { Globe, Search, Lock, Unlock, Shield } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminDomainsPage: React.FC<Props> = ({ navigate }) => {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDomains().then((res) => setDomains(res.domains || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = domains.filter((d) =>
    d.domainName.toLowerCase().includes(search.toLowerCase()) ||
    d.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
    d.registrarTxId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Authoritative Domain Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global TLD registry connections, ICANN WHOIS registrant validation, and transfer authorization status.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Domain Name</th>
                <th className="py-3 px-4 font-semibold">Customer / Registrant</th>
                <th className="py-3 px-4 font-semibold">Registrar Connector</th>
                <th className="py-3 px-4 font-semibold">Registrar Tx ID</th>
                <th className="py-3 px-4 font-semibold">Nameservers</th>
                <th className="py-3 px-4 font-semibold">Lock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading domains...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No domains registered.</td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">{d.domainName}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200 font-sans">
                        {d.registrantDetails.firstName} {d.registrantDetails.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{d.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.registrar}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{d.registrarTxId}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {d.nameservers.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      {d.locked ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-900">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-right">
                      {new Date(d.expiryDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
