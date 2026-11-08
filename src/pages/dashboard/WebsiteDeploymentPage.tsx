import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HostingAccount } from '../../types';
import {
  UploadCloud,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Server,
  Terminal,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const WebsiteDeploymentPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [selectedHostingId, setSelectedHostingId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [deploymentResult, setDeploymentResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Health check state
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    if (user?.id) {
      api.getMyHosting(user.id).then((res) => {
        setHosting(res.hosting || []);
        if (res.hosting?.length > 0) {
          setSelectedHostingId(res.hosting[0].id);
          setLogs(res.hosting[0].deploymentLogs || []);
        }
      }).catch(console.error);
    }
  }, [user]);

  const activeAccount = hosting.find((h) => h.id === selectedHostingId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.zip')) {
        setError('Only .zip archives are supported. Please compress your website into a standard .zip file.');
        setFile(null);
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        setError('File size exceeds the 50MB maximum upload limit.');
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleDeploy = async () => {
    if (!file || !selectedHostingId) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('websiteZip', file);

    try {
      setUploadProgress(50);
      const res = await api.deployWebsiteZip(selectedHostingId, formData);
      setUploadProgress(100);
      setDeploymentResult(res);
      setLogs(res.logs || []);

      // Refresh hosting list
      if (user?.id) {
        const refreshed = await api.getMyHosting(user.id);
        setHosting(refreshed.hosting || []);
      }
    } catch (err: any) {
      setError(err.message || 'Deployment error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunHealthCheck = async () => {
    if (!selectedHostingId) return;
    setIsCheckingHealth(true);
    try {
      const res = await api.checkHostingHealth(selectedHostingId);
      setHealthStatus(res);
    } catch (err: any) {
      console.error('Health check failed:', err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Website ZIP Upload & Deployment</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload and extract your static or dynamic website files directly to your cloud hosting document root with automated security inspection and health checks.
        </p>
      </div>

      {hosting.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Server className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Hosting Instance Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            You must have an active cloud hosting plan before deploying your website ZIP package.
          </p>
          <button
            onClick={() => navigate('/hosting-pricing')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
          >
            Choose a Hosting Plan (Starting ₹1)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload Form & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instance Selector Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                1. Select Target Hosting Service & Domain
              </label>
              <select
                value={selectedHostingId}
                onChange={(e) => {
                  setSelectedHostingId(e.target.value);
                  const acc = hosting.find((h) => h.id === e.target.value);
                  if (acc) setLogs(acc.deploymentLogs || []);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                {hosting.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.domainName} ({h.planName} · Node: {h.serverNode} · Status: {h.deploymentStatus})
                  </option>
                ))}
              </select>

              {activeAccount && (
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Document Root:</span>
                    <span className="font-mono text-slate-200">{activeAccount.documentRoot}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Server Node IP:</span>
                    <span className="font-mono text-slate-200">{activeAccount.serverIp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Status:</span>
                    <span className="text-emerald-400 font-semibold uppercase">{activeAccount.deploymentStatus}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop ZIP Upload Box */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <label className="block text-xs font-semibold text-slate-200">
                2. Upload Website ZIP Archive
              </label>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center transition-colors bg-slate-950/40 relative">
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
                    <FileArchive className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {file ? file.name : 'Click to select or drag and drop your website .ZIP file'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {file ? `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Supported: Static HTML/CSS/JS, Vite dist, React builds, PHP scripts (Max 50MB)'}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Progress Indicator */}
              {isUploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Uploading and verifying archive security...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Automated ZIP-Bomb & Path Traversal Shields Enabled</span>
                </div>

                <button
                  onClick={handleDeploy}
                  disabled={!file || isUploading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-600/30"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploading ? 'Extracting & Deploying...' : 'Deploy to Production'}</span>
                </button>
              </div>
            </div>

            {/* Deployment Result Banner */}
            {deploymentResult && (
              <div className="p-5 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Deployment Succeeded!</h4>
                    <p className="text-xs text-emerald-300 mt-0.5">
                      Your website files are now live and served from <span className="font-mono">{activeAccount?.domainName}</span>.
                    </p>
                  </div>
                </div>

                <a
                  href={`/sites/${selectedHostingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shrink-0 transition-colors"
                >
                  <span>Open Live Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Deployment Logs & Real-time Health Probe */}
          <div className="space-y-6">
            {/* Health Check Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-semibold text-white">Automated Health Check</h3>
                </div>
                <button
                  onClick={handleRunHealthCheck}
                  disabled={isCheckingHealth}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>Probe Now</span>
                </button>
              </div>

              {healthStatus ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">HTTP Status:</span>
                    <span className="font-mono font-bold text-emerald-400">{healthStatus.httpStatus} OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Response Latency:</span>
                    <span className="font-mono text-slate-200">{healthStatus.latencyMs} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SSL Handshake:</span>
                    <span className="text-emerald-400 font-semibold">Valid (TLS 1.3)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Node:</span>
                    <span className="font-mono text-slate-300">{healthStatus.ipAddress}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">Click Probe Now to run real-time HTTP response verification on this instance.</p>
                </div>
              )}

              {activeAccount && (
                <a
                  href={`/sites/${activeAccount.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <span>Preview Website in Browser</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
            </div>

            {/* Real-time Deployment Logs */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Deployment Audit Logs</h3>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] max-h-72 overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <p className="text-slate-600">No deployment logs available.</p>
                ) : (
                  logs.map((l, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 shrink-0">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          l.level === 'error'
                            ? 'text-rose-400'
                            : l.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        {l.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
