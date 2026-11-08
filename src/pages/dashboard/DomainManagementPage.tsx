import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DomainRecord } from '../../types';
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
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const DomainManagementPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeModalDomain, setActiveModalDomain] = useState<DomainRecord | null>(null);
  const [modalType, setModalType] = useState<'nameservers' | 'epp' | 'registrant' | null>(null);
  const [ns1, setNs1] = useState('');
  const [ns2, setNs2] = useState('');
  const [eppCode, setEppCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSaveNameservers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalDomain) return;
    try {
      await api.updateNameservers(activeModalDomain.id, [ns1.trim(), ns2.trim()]);
      setMessage({ type: 'success', text: 'Nameservers updated successfully. Propagation takes 1-2 hours globally.' });
      setModalType(null);
      loadDomains();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update nameservers' });
    }
  };

  const handleRequestEpp = async (domain: DomainRecord) => {
    setActiveModalDomain(domain);
    setEppCode(null);
    try {
      const res = await api.getEppCode(domain.id);
      setEppCode(res.eppCode);
      setModalType('epp');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to retrieve EPP code' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Domain Registry Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative registrant controls, DNS routing, registrar locks, and ICANN compliance management.
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
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-white">{dom.domainName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                      {dom.status}
                    </span>
                    {dom.locked ? (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3" />
                        Transfer Locked
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Unlock className="w-3 h-3 text-slate-400" />
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Registrar: <span className="text-slate-200">{dom.registrar}</span> · Tx ID: <span className="font-mono text-slate-300">{dom.registrarTxId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate('/dashboard/dns')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>DNS Records</span>
                  </button>

                  <button
                    onClick={() => openNameserverModal(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
                  >
                    Nameservers
                  </button>

                  <button
                    onClick={() => handleToggleLock(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
                  >
                    {dom.locked ? 'Unlock Domain' : 'Lock Domain'}
                  </button>

                  <button
                    onClick={() => handleRequestEpp(dom)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>EPP / Auth Code</span>
                  </button>
                </div>
              </div>

              {/* Domain Metadata Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Registrant Owner</span>
                  <p className="text-slate-200 font-medium mt-0.5 truncate">
                    {dom.registrantDetails.firstName} {dom.registrantDetails.lastName}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Auto-Renewal</span>
                  <button
                    onClick={() => handleToggleAutoRenew(dom)}
                    className={`font-semibold mt-0.5 ${dom.autoRenew ? 'text-emerald-400' : 'text-slate-400'}`}
                  >
                    {dom.autoRenew ? 'Enabled (Automatic)' : 'Disabled'}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Renewal Fee</span>
                  <p className="text-slate-200 font-mono mt-0.5">₹{dom.renewalPrice}/yr</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Registration Expiry</span>
                  <p className="text-slate-200 font-mono mt-0.5">
                    {new Date(dom.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nameservers Modal */}
      {modalType === 'nameservers' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleSaveNameservers}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Nameserver Configuration</span>
              <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Configure authoritative nameservers for <strong>{activeModalDomain.domainName}</strong>.
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Nameserver</label>
              <input
                type="text"
                value={ns1}
                onChange={(e) => setNs1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Secondary Nameserver</label>
              <input
                type="text"
                value={ns2}
                onChange={(e) => setNs2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
              >
                Save Nameservers
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EPP Code Modal */}
      {modalType === 'epp' && activeModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Domain EPP / Auth Code</span>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use this secret authorization code to transfer <strong>{activeModalDomain.domainName}</strong> to another registrar.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono text-sm font-bold text-amber-400 select-all">
              {eppCode}
            </div>
            <p className="text-[11px] text-slate-500">
              Note: Transfers to another registrar are not instant. Standard Registry validation window applies (5-7 days).
            </p>
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
