import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DomainRecord, HostingAccount } from '../../types';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Server,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { PaymentModal } from '../../components/checkout/PaymentModal';

interface Props {
  navigate: (path: string) => void;
}

export const RenewalsPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Renewal Checkout Modal state
  const [checkoutModal, setCheckoutModal] = useState<{
    order: any;
    gatewayOrderId: string;
    upiUri: string;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [domRes, hostRes] = await Promise.all([
        api.getMyDomains(user?.id || ''),
        api.getMyHosting(user?.id || ''),
      ]);
      setDomains(domRes.domains || []);
      setHosting(hostRes.hosting || (hostRes as any).accounts || []);
    } catch (err) {
      console.error('Error loading renewals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDomainAutoRenew = async (domain: DomainRecord) => {
    setTogglingId(`dom-${domain.id}`);
    try {
      const nextState = !domain.autoRenew;
      await api.updateDomain(domain.id, { autoRenew: nextState });
      setDomains((prev) => prev.map((d) => (d.id === domain.id ? { ...d, autoRenew: nextState } : d)));
    } catch (err) {
      console.error('Failed to toggle auto renew:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const calculateDaysLeft = (dateString?: string) => {
    if (!dateString) return 365;
    const diffMs = new Date(dateString).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 1) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Critical: 1 Day Left</span>
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>7 Days Notice</span>
        </span>
      );
    }
    if (days <= 15) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
          15 Days Notice
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold">
          30 Days Notice
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
        Active & Healthy
      </span>
    );
  };

  const handleInitiateRenewal = async (type: 'domain' | 'hosting', item: any) => {
    if (!user?.id) return;
    const isDomain = type === 'domain';
    const amount = isDomain ? (item.renewalPrice || 999) : (item.monthlyFee ? item.monthlyFee * 12 : 1999);
    const title = isDomain ? `Domain Renewal: ${item.domainName}` : `Hosting Renewal: ${item.domainName} (${item.planName})`;

    try {
      const res = await api.createOrder({
        customerId: user.id,
        type,
        itemId: item.id,
        itemTitle: title,
        subtotal: amount,
      });
      setCheckoutModal({
        order: res.order,
        gatewayOrderId: res.gatewayOrderId,
        upiUri: res.upiUri,
      });
    } catch (err: any) {
      alert(err.message || 'Error generating renewal order');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <RefreshCw className="w-4 h-4" />
            <span>Lifecycle & Continuity</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Renewal Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated notifications sent at 30 days, 15 days, 7 days, and 1 day prior to term expiry.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Expiries</span>
        </button>
      </div>

      {/* Auto-Renewal Guarantee Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Zero Downtime Protection Guarantee</h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              Enable Auto-Renew to ensure your mission-critical websites and DNS records never suspend. Payments are charged 48 hours prior to term expiration.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
          Statutory GST: <span className="text-white font-semibold">18% Itemized</span>
        </div>
      </div>

      {/* 1. Domains Renewal Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Registered Domains Approaching Renewal</span>
          <span className="text-xs font-normal text-slate-400">({domains.length} total)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No registered domains found. Register a new domain to view renewal schedules.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Domain Name</th>
                    <th className="py-3 px-4">Status & Notice</th>
                    <th className="py-3 px-4">Expires On</th>
                    <th className="py-3 px-4">Renewal Price</th>
                    <th className="py-3 px-4">Auto-Renew</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {domains.map((dom) => {
                    const exp = dom.expiryDate || (dom as any).expiresAt;
                    const daysLeft = calculateDaysLeft(exp);
                    const expiresDate = exp ? new Date(exp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) : 'N/A';

                    return (
                      <tr key={dom.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white text-sm">{dom.domainName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">ID: {dom.id}</span>
                        </td>
                        <td className="py-3 px-4">{getUrgencyBadge(daysLeft)}</td>
                        <td className="py-3 px-4 text-slate-300 flex items-center gap-1.5 pt-4">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{expiresDate} ({daysLeft} days)</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white">₹{dom.renewalPrice || 999}</span>
                          <span className="text-[10px] text-slate-400 block">+ 18% GST</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleDomainAutoRenew(dom)}
                            disabled={togglingId === `dom-${dom.id}`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              dom.autoRenew
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {dom.autoRenew ? 'Enabled (Auto)' : 'Disabled (Manual)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleInitiateRenewal('domain', dom)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm inline-flex items-center gap-1"
                          >
                            <span>Renew Now</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 2. Hosting Renewal Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Cloud Hosting Services Approaching Renewal</span>
          <span className="text-xs font-normal text-slate-400">({hosting.length} active)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading hosting accounts...</div>
          ) : hosting.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No active hosting services found. Deploy an instance to monitor uptime and renewals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Hosting Instance</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Notice Status</th>
                    <th className="py-3 px-4">Expires On</th>
                    <th className="py-3 px-4">Renewal Fee</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {hosting.map((h) => {
                    const exp = h.expiryDate || (h as any).expiresAt;
                    const daysLeft = calculateDaysLeft(exp);
                    const expiresDate = exp ? new Date(exp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) : 'N/A';
                    const renewalFee = (h as any).monthlyFee ? (h as any).monthlyFee * 12 : 1999;

                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white text-sm">{h.domainName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{h.id} • IP: {h.serverIp || (h as any).ipAddress || '198.51.100.10'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                            {h.planName}
                          </span>
                        </td>
                        <td className="py-3 px-4">{getUrgencyBadge(daysLeft)}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {expiresDate} ({daysLeft} days)
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white">₹{renewalFee}</span>
                          <span className="text-[10px] text-slate-400 block">per year + 18% GST</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleInitiateRenewal('hosting', h)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm inline-flex items-center gap-1"
                          >
                            <span>Renew Term</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal for Renewal */}
      {checkoutModal && (
        <PaymentModal
          order={checkoutModal.order}
          gatewayOrderId={checkoutModal.gatewayOrderId}
          upiUri={checkoutModal.upiUri}
          onSuccess={() => {
            setCheckoutModal(null);
            loadData();
          }}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  );
};
