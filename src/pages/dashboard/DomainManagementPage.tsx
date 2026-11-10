import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DomainRecord, GlobalDnsCheckResult } from '../../types';
import {
  Globe,
  Lock,
  Unlock,
  KeyRound,
  Network,
  RotateCw,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  Radio,
  Clock,
  ArrowRight,
  Server,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

const NS_PRESETS = [
  { name: 'Nexora Default (Included)', ns1: 'ns1.nexoracloud.com', ns2: 'ns2.nexoracloud.com', category: 'Default' },
  { name: 'Cloudflare Anycast DNS', ns1: 'cloe.ns.cloudflare.com', ns2: 'walt.ns.cloudflare.com', category: 'External' },
  { name: 'AWS Route 53', ns1: 'ns-1.awsdns.com', ns2: 'ns-2.awsdns.net', category: 'External' },
  { name: 'Google Cloud DNS', ns1: 'ns-cloud-a1.googledomains.com', ns2: 'ns-cloud-a2.googledomains.com', category: 'External' },
  { name: 'Vercel Edge DNS', ns1: 'ns1.vercel-dns.com', ns2: 'ns2.vercel-dns.com', category: 'External' },
];

export const DomainManagementPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeModalDomain, setActiveModalDomain] = useState<DomainRecord | null>(null);
  const [modalType, setModalType] = useState<'nameservers' | 'epp' | 'propagation' | 'renew' | null>(null);
  const [ns1, setNs1] = useState('');
  const [ns2, setNs2] = useState('');
  const [eppCode, setEppCode] = useState<string | null>(null);
  const [copiedEpp, setCopiedEpp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Propagation modal state
  const [checkingPropagation, setCheckingPropagation] = useState(false);
  const [propagationResult, setPropagationResult] = useState<GlobalDnsCheckResult | null>(null);

  // Renewal modal state
  const [renewYears, setRenewYears] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);

  const loadDomains = () => {
    if (user?.id) {
      setLoading(true);
      api.getMyDomains(user.id)
        .then((res) => setDomains(res.domains || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadDomains();
  }, [user]);

  const handleToggleLock = async (domain: DomainRecord) => {
    try {
      const res = await api.setDomainLock(domain.id, !domain.locked);
      setMessage({ type: 'success', text: res.message });
      loadDomains();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating domain lock' });
    }
  };

  const handleToggleAutoRenew = async (domain: DomainRecord) => {
    try {
      const res = await api.setDomainAutoRenew(domain.id, !domain.autoRenew);
      setMessage({ type: 'success', text: res.message });
      loadDomains();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating auto-renew' });
    }
  };

  const openNameserverModal = (domain: DomainRecord) => {
    setActiveModalDomain(domain);
    setNs1(domain.nameservers[0] || 'ns1.nexoracloud.com');
    setNs2(domain.nameservers[1] || 'ns2.nexoracloud.com');
    setModalType('nameservers');
  };

  const handleApplyPreset = (preset: typeof NS_PRESETS[0]) => {
    setNs1(preset.ns1);
    setNs2(preset.ns2);
  };

  const handleSaveNameservers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalDomain) return;
    try {
      await api.updateNameservers(activeModalDomain.id, [ns1.trim(), ns2.trim()]);
      setMessage({
        type: 'success',
        text: `Nameservers updated to ${ns1} and ${ns2}. Fully portable: point to Cloudflare, AWS, Hostinger, Vercel, or any host.`,
      });
      setModalType(null);
      loadDomains();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update nameservers' });
    }
  };

  const handleRequestEpp = async (domain: DomainRecord) => {
    setActiveModalDomain(domain);
    setEppCode(null);
    setCopiedEpp(false);
    try {
      const res = await api.getEppCode(domain.id);
      setEppCode(res.eppCode);
      setModalType('epp');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to retrieve EPP code. Ensure domain is unlocked first.' });
    }
  };

  const handleCopyEpp = () => {
    if (eppCode) {
      navigator.clipboard.writeText(eppCode);
      setCopiedEpp(true);
      setTimeout(() => setCopiedEpp(false), 2000);
    }
  };

  const handleCheckPropagation = async (domain: DomainRecord) => {
    setActiveModalDomain(domain);
    setCheckingPropagation(true);
    setPropagationResult(null);
    setModalType('propagation');

    try {
      const res = await api.verifyDomainPropagation(domain.id);
      setPropagationResult(res.result);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error checking DNS propagation' });
    } finally {
      setCheckingPropagation(false);
    }
  };

  const openRenewModal = (domain: DomainRecord) => {
    setActiveModalDomain(domain);
    setRenewYears(1);
    setModalType('renew');
  };

  const handleConfirmRenewal = async () => {
    if (!activeModalDomain || !user) return;
    setIsRenewing(true);
    try {
      const res = await api.renewDomain(activeModalDomain.id, user.id, renewYears);
      setMessage({ type: 'success', text: res.message });
      setModalType(null);
      loadDomains();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to renew domain' });
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Domain Registry Management & Portability</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative ICANN ownership, unrestricted domain portability, global Anycast DNS propagation, and EPP auth controls.
          </p>
        </div>
        <button
          onClick={() => navigate('/domain-search')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Domain</span>
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

      {/* Portability Notice Banner */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="text-slate-200 font-semibold">100% Unrestricted Domain Portability Guaranteed</p>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            Every domain purchased here is registered under your legal WHOIS registrant ownership with zero proprietary lock-in. You can freely point nameservers to Cloudflare, AWS, Hostinger, Vercel, or Netlify, or retrieve your cryptographic EPP authorization code for outbound registry transfers anytime.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Registered Domains Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">You have not registered any domains under your account.</p>
          <button
            onClick={() => navigate('/domain-search')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
          >
            Search Available Domains
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((dom) => (
            <div key={dom.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-bold text-white font-mono">{dom.domainName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                      {dom.status}
                    </span>
                    {dom.locked ? (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                        <Lock className="w-3 h-3" />
                        Transfer Locked (ICANN 60-day security)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        Unlocked for Transfer-Out
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Registrar: <span className="text-slate-200">{dom.registrar}</span> · Registry Tx: <span className="font-mono text-slate-300">{dom.registrarTxId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate('/dashboard/dns')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    title="Manage A, CNAME, MX, TXT records"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>DNS Records</span>
                  </button>

                  <button
                    onClick={() => openNameserverModal(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
                  >
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nameservers / Portability</span>
                  </button>

                  <button
                    onClick={() => handleCheckPropagation(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Check Anycast DNS</span>
                  </button>

                  <button
                    onClick={() => openRenewModal(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Renew</span>
                  </button>

                  <button
                    onClick={() => handleToggleLock(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
                  >
                    {dom.locked ? 'Unlock' : 'Lock'}
                  </button>

                  <button
                    onClick={() => handleRequestEpp(dom)}
                    disabled={dom.locked}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={dom.locked ? 'Unlock domain first to retrieve EPP code' : 'Retrieve transfer authorization code'}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>EPP Code</span>
                  </button>
                </div>
              </div>

              {/* Domain Metadata Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Registrant Owner</span>
                  <p className="text-slate-200 font-medium mt-0.5 truncate">
                    {dom.registrantDetails?.firstName} {dom.registrantDetails?.lastName}
                  </p>
                  <span className="text-[10px] text-slate-400 block truncate">{dom.registrantDetails?.email}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Auto-Renewal</span>
                  <button
                    onClick={() => handleToggleAutoRenew(dom)}
                    className={`font-semibold mt-0.5 text-xs ${dom.autoRenew ? 'text-emerald-400' : 'text-slate-400'}`}
                  >
                    {dom.autoRenew ? 'Enabled (Automatic)' : 'Disabled'}
                  </button>
                  <span className="text-[10px] text-slate-500 block">Click to toggle</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Current Nameservers</span>
                  <p className="text-slate-300 font-mono text-[11px] mt-0.5 truncate">
                    {dom.nameservers[0] || 'ns1.nexoracloud.com'}
                  </p>
                  <p className="text-slate-400 font-mono text-[10px] truncate">
                    {dom.nameservers[1] || 'ns2.nexoracloud.com'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Registration Expiry</span>
                  <p className="text-slate-200 font-mono mt-0.5 font-semibold">
                    {new Date(dom.expiryDate).toLocaleDateString()}
                  </p>
                  <span className="text-[10px] text-slate-400 block">Renewal rate: ₹{dom.renewalPrice}/yr</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nameservers & Portability Modal */}
      {modalType === 'nameservers' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveNameservers}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-white text-sm">Authoritative Nameservers & Portability</span>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{activeModalDomain.domainName}</p>
              </div>
              <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              You have full ownership of this domain. Point nameservers to any hosting or DNS provider worldwide with zero artificial restrictions.
            </p>

            {/* Quick 1-Click Portability Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1-Click External DNS Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {NS_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    <span className="font-semibold block text-slate-200">{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block">{preset.ns1}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Primary Nameserver (NS1)</label>
                <input
                  type="text"
                  value={ns1}
                  required
                  onChange={(e) => setNs1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  placeholder="ns1.example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Secondary Nameserver (NS2)</label>
                <input
                  type="text"
                  value={ns2}
                  required
                  onChange={(e) => setNs2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  placeholder="ns2.example.com"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Nameserver delegation changes propagate across global internet root servers within 1–2 hours.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Nameservers</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Anycast DNS Propagation Modal */}
      {modalType === 'propagation' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-white text-sm">Global DNS Propagation Check</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{activeModalDomain.domainName}</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkingPropagation ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Querying Cloudflare (1.1.1.1) and Google (8.8.8.8) Anycast resolvers...</p>
              </div>
            ) : propagationResult ? (
              <div className="space-y-4 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  propagationResult.nameservers.isPropagated
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                }`}>
                  {propagationResult.nameservers.isPropagated ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  )}
                  <span>
                    {propagationResult.nameservers.isPropagated
                      ? 'DNS Records Confirmed Live across global Anycast networks.'
                      : 'Propagation in progress. New records usually reflect globally within 30-90 minutes.'}
                  </span>
                </div>

                {/* Cloudflare Resolver Card */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Cloudflare Anycast Resolver (1.1.1.1)</span>
                    <span className="text-[10px] text-slate-500 font-mono">RFC 8484 DoH</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">NS Records:</span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {propagationResult.nameservers.cloudflare.length > 0
                        ? propagationResult.nameservers.cloudflare.join(', ')
                        : 'No NS delegation records returned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">A Records:</span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {propagationResult.aRecords.cloudflare.length > 0
                        ? propagationResult.aRecords.cloudflare.join(', ')
                        : 'No direct A records resolved'}
                    </p>
                  </div>
                </div>

                {/* Google Public DNS Resolver Card */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Google Public DNS Resolver (8.8.8.8)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Google DoH</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">NS Records:</span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {propagationResult.nameservers.google.length > 0
                        ? propagationResult.nameservers.google.join(', ')
                        : 'No NS delegation records returned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">A Records:</span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {propagationResult.aRecords.google.length > 0
                        ? propagationResult.aRecords.google.join(', ')
                        : 'No direct A records resolved'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleCheckPropagation(activeModalDomain)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Re-test Now</span>
                  </button>
                  <button
                    onClick={() => setModalType(null)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Domain Renewal Modal */}
      {modalType === 'renew' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-white text-sm">Renew Domain Registration</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{activeModalDomain.domainName}</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Current expiration date: <strong className="text-white">{new Date(activeModalDomain.expiryDate).toLocaleDateString()}</strong>.
              Extend your registration with central registry.
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Select Renewal Period</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((yr) => {
                  const sub = activeModalDomain.renewalPrice * yr;
                  const gst = Math.round(sub * 0.18);
                  const total = sub + gst;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setRenewYears(yr)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        renewYears === yr
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs block">{yr} Year{yr > 1 ? 's' : ''}</span>
                      <span className="text-sm font-bold text-white block mt-1">₹{total}</span>
                      <span className="text-[10px] text-slate-500 block">incl. GST</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Renewal Subtotal ({renewYears} yr):</span>
                <span className="font-mono text-slate-200">₹{activeModalDomain.renewalPrice * renewYears}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="font-mono text-slate-200">₹{Math.round(activeModalDomain.renewalPrice * renewYears * 0.18)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800/80">
                <span>Total Payable:</span>
                <span className="font-mono text-emerald-400">₹{Math.round(activeModalDomain.renewalPrice * renewYears * 1.18)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                disabled={isRenewing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRenewing ? 'Processing Renewal...' : `Confirm Renewal (₹${Math.round(activeModalDomain.renewalPrice * renewYears * 1.18)})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EPP Code Modal */}
      {modalType === 'epp' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-white text-sm">Domain EPP / Auth Code</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{activeModalDomain.domainName}</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use this secret authorization code to transfer <strong>{activeModalDomain.domainName}</strong> to another ICANN-accredited registrar (e.g. Cloudflare, AWS, GoDaddy, Hostinger).
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-amber-400 select-all tracking-wider">
                {eppCode}
              </span>
              <button
                onClick={handleCopyEpp}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 border border-slate-700"
              >
                {copiedEpp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEpp ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Outbound Transfer Steps:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Keep the domain <strong>Unlocked</strong> in this dashboard.</li>
                <li>Submit the EPP / Auth code at your destination registrar.</li>
                <li>Approve the registry confirmation email sent to <strong className="text-slate-300">{activeModalDomain.registrantDetails?.email}</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setModalType(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
