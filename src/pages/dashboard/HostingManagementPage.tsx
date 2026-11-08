import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HostingAccount } from '../../types';
import { Server, Globe, UploadCloud, FolderTree, ShieldCheck, ExternalLink, RefreshCw, Plus } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const HostingManagementPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = () => {
    if (user?.id) {
      setLoading(true);
      api.getMyHosting(user.id)
        .then((res) => setHosting(res.hosting || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hosting Accounts Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your dedicated NVMe cloud hosting containers, document roots, and deployment states.
          </p>
        </div>
        <button
          onClick={() => navigate('/hosting-pricing')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Hosting Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hosting.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Server className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Hosting Services</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">You have not purchased any cloud hosting plans yet.</p>
          <button
            onClick={() => navigate('/hosting-pricing')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
          >
            Browse Hosting Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {hosting.map((acc) => (
            <div key={acc.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-white">{acc.domainName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                      {acc.deploymentStatus}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">({acc.id})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {acc.planName} · Server IP: <span className="font-mono text-slate-200">{acc.serverIp}</span> · Document Root: <span className="font-mono text-slate-300">{acc.documentRoot}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/sites/${acc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700"
                  >
                    <span>View Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => navigate('/dashboard/deploy')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload ZIP</span>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/filemanager')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Files</span>
                  </button>
                </div>
              </div>

              {/* Resource specifications grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Storage Consumption</span>
                  <p className="text-slate-200 font-mono font-bold mt-0.5">
                    {acc.storageUsedMB} MB / {(acc.storageTotalMB / 1024).toFixed(0)} GB
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">SSL Status</span>
                  <p className="text-emerald-400 font-semibold mt-0.5">Active (TLS 1.3)</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">FTP / SFTP Access</span>
                  <p className="text-slate-300 font-mono text-[11px] mt-0.5 truncate">{acc.ftpUsername}@{acc.ftpHost}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[11px] block">Expiry Date</span>
                  <p className="text-slate-300 font-mono text-xs mt-0.5">
                    {new Date(acc.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
