import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HostingAccount, DomainRecord, Order, SupportTicket } from '../../types';
import {
  Server,
  Globe,
  UploadCloud,
  FolderTree,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Plus,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const CustomerDashboardPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        api.getMyHosting(user.id),
        api.getMyDomains(user.id),
        api.getMyOrders(user.id),
        api.getTickets(user.id),
      ])
        .then(([hRes, dRes, oRes, tRes]) => {
          setHosting(hRes.hosting || []);
          setDomains(dRes.domains || []);
          setOrders(oRes.orders || []);
          setTickets(tRes.tickets || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeHosting = hosting.filter((h) => h.status === 'active');
  const activeDomains = domains.filter((d) => d.status === 'active');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customer ID: <span className="font-mono text-blue-400">{user?.id}</span> · Connected to Bengaluru Node Cluster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/deploy')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Deploy Website ZIP</span>
          </button>
          <button
            onClick={() => navigate('/domain-search')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Register Domain</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Hosting</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{activeHosting.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Cloud containers running</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Domains</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{activeDomains.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Authoritative registrations</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>SSL Status</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">100%</p>
          <p className="text-[11px] text-slate-500 mt-1">Let's Encrypt TLS 1.3</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Support Tickets</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{tickets.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">24/7 SLA coverage</p>
        </div>
      </div>

      {/* Main Services Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Hosting Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Your Hosting Services</h2>
            </div>
            <button
              onClick={() => navigate('/dashboard/hosting')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {hosting.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p className="text-xs text-slate-400 mb-3">You don't have any hosting accounts provisioned yet.</p>
              <button
                onClick={() => navigate('/hosting-pricing')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg"
              >
                Explore Hosting Plans (From ₹1)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {hosting.map((h) => (
                <div key={h.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{h.domainName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold uppercase">
                          {h.deploymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{h.planName} · Node: {h.serverNode}</p>
                    </div>
                    <a
                      href={`/sites/${h.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 border border-slate-700"
                    >
                      <span>Open Site</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  {/* Resource Gauges */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>NVMe Storage</span>
                        <span className="font-mono">{h.storageUsedMB} MB / {(h.storageTotalMB / 1024).toFixed(0)} GB</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, (h.storageUsedMB / h.storageTotalMB) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>SSL Certificate</span>
                        <span className="text-emerald-400">Let's Encrypt TLS 1.3</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <span className="text-slate-500">Expires: {new Date(h.expiryDate).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/dashboard/deploy')}
                        className="text-emerald-400 hover:underline font-medium"
                      >
                        Deploy ZIP
                      </button>
                      <span className="text-slate-700">·</span>
                      <button
                        onClick={() => navigate('/dashboard/filemanager')}
                        className="text-blue-400 hover:underline font-medium"
                      >
                        File Manager
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Domains */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Your Domains</h2>
            </div>
            <button
              onClick={() => navigate('/dashboard/domains')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {domains.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p className="text-xs text-slate-400 mb-3">No domains registered under this account.</p>
              <button
                onClick={() => navigate('/domain-search')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg"
              >
                Search & Register Domain
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{d.domainName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Registrar: {d.registrar} · Status: <span className="text-emerald-400 font-semibold">{d.status}</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">₹{d.renewalPrice}/yr</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <span className="text-slate-500">Renews on {new Date(d.renewalDate).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/dashboard/dns')}
                        className="text-blue-400 hover:underline"
                      >
                        Manage DNS
                      </button>
                      <span className="text-slate-700">·</span>
                      <button
                        onClick={() => navigate('/dashboard/domains')}
                        className="text-slate-300 hover:text-white"
                      >
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
