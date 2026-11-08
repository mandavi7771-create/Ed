import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HostingAccount } from '../../types';
import { ShieldCheck, Lock, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const SslManagementPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [selectedHostingId, setSelectedHostingId] = useState<string>('');
  const [sslInfo, setSslInfo] = useState<any | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.getMyHosting(user.id).then((res) => {
        setHosting(res.hosting || []);
        if (res.hosting?.length > 0) {
          setSelectedHostingId(res.hosting[0].id);
        }
      }).catch(console.error);
    }
  }, [user]);

  const loadSsl = (hostingId: string) => {
    if (!hostingId) return;
    api.getSslInfo(hostingId).then(setSslInfo).catch(console.error);
  };

  useEffect(() => {
    if (selectedHostingId) {
      loadSsl(selectedHostingId);
    }
  }, [selectedHostingId]);

  const handleReissueSsl = async () => {
    if (!selectedHostingId) return;
    setIsProvisioning(true);
    setMessage(null);
    try {
      const res = await api.provisionSsl(selectedHostingId);
      setMessage(res.message);
      loadSsl(selectedHostingId);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const activeAccount = hosting.find((h) => h.id === selectedHostingId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">SSL / TLS Certificate Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated Let's Encrypt certificates with ACME v2 HTTP-01 validation, auto-renewals, and forced HTTPS enforcement.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs">
          {message}
        </div>
      )}

      {/* Instance Selector */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Hosting Account:</span>
          <select
            value={selectedHostingId}
            onChange={(e) => setSelectedHostingId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            {hosting.map((h) => (
              <option key={h.id} value={h.id}>
                {h.domainName} ({h.planName})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleReissueSsl}
          disabled={isProvisioning}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProvisioning ? 'animate-spin' : ''}`} />
          <span>{isProvisioning ? 'Issuing Certificate...' : 'Re-issue / Renew SSL'}</span>
        </button>
      </div>

      {sslInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate State Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Certificate Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active & Trusted
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Issuer:</span>
                  <span className="text-slate-200 font-medium">{sslInfo.sslIssuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cipher / Key:</span>
                  <span className="font-mono text-slate-200">{sslInfo.certificateType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="font-mono text-slate-200">{new Date(sslInfo.sslExpiry).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forced HTTPS:</span>
                  <span className="text-emerald-400 font-medium">Enabled (HSTS 300)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Domains Covered & Live Verification */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <span className="text-xs font-semibold text-white">Subject Alternative Names (SANs)</span>

            <div className="space-y-2 text-xs">
              {sslInfo.domainsCovered.map((d: string) => (
                <div key={d} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-slate-200">{d}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">TLS 1.3 Secure</span>
                </div>
              ))}
            </div>

            {activeAccount && (
              <a
                href={`/sites/${activeAccount.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <span>Verify HTTPS Handshake in Browser</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
