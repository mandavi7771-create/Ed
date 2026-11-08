import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BackupRecord, HostingAccount } from '../../types';
import {
  Archive,
  Download,
  RotateCcw,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const BackupsPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [hostingAccounts, setHostingAccounts] = useState<HostingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Backup Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState('');
  const [backupDescription, setBackupDescription] = useState('');

  // Restore Modal state
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<BackupRecord | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupsRes, hostingRes] = await Promise.all([
        api.getBackups(user?.id),
        api.getMyHosting(user?.id || ''),
      ]);
      setBackups(backupsRes.backups || []);
      const accountsList = hostingRes.hosting || [];
      setHostingAccounts(accountsList);
      if (accountsList.length > 0) {
        setSelectedHostId(accountsList[0].id);
      }
    } catch (err: any) {
      console.error('Error loading backups data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostId) return;
    setActionLoading('creating');
    try {
      const res = await api.createBackup({
        hostingId: selectedHostId,
        type: 'manual',
        description: backupDescription || 'Manual user-requested snapshot',
      });
      setFeedback({ message: res.message, type: 'success' });
      setModalOpen(false);
      setBackupDescription('');
      await loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to create snapshot', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (backup: BackupRecord) => {
    setActionLoading(`restore-${backup.id}`);
    try {
      const res = await api.restoreBackup(backup.id);
      setFeedback({
        message: `Restore complete: Website files for ${backup.domainName} rolled back to snapshot ${backup.id}.`,
        type: 'success',
      });
      setRestoreConfirmBackup(null);
    } catch (err: any) {
      setFeedback({ message: err.message || 'Restore failed', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup snapshot?')) return;
    setActionLoading(`delete-${backupId}`);
    try {
      await api.deleteBackup(backupId);
      setFeedback({ message: 'Backup snapshot deleted successfully.', type: 'success' });
      setBackups((prev) => prev.filter((b) => b.id !== backupId));
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to delete backup', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = (backup: BackupRecord) => {
    // Generate simulated download trigger
    const blob = new Blob([`Nexora Cloud Backup Archive: ${backup.id} for ${backup.domainName}`], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.domainName}-${backup.id}.tar.gz`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Archive className="w-4 h-4" />
            <span>Disaster Recovery & Snapshots</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Backup Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated daily backups, point-in-time file recovery, and 1-click snapshot restoration.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={hostingAccounts.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Take Manual Snapshot</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Snapshot Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Snapshots</p>
            <p className="text-lg font-bold text-white">{backups.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Backup Retention Policy</p>
            <p className="text-lg font-bold text-white">30 Days Automated</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Recovery RPO / RTO</p>
            <p className="text-lg font-bold text-white">Near-Instant (~10s)</p>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Stored Backup Snapshots</h3>
          <button
            onClick={loadData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No backup snapshots currently found for your account. Automated nightly backups will populate automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Snapshot ID</th>
                  <th className="py-3 px-4">Domain / Hosting</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Expires In</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {backups.map((b) => {
                  const createdDate = new Date(b.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const anyB = b as any;
                  const daysLeft = anyB.expiresAt
                    ? Math.max(0, Math.ceil((new Date(anyB.expiresAt).getTime() - Date.now()) / 86400000))
                    : 30;
                  const sizeFormatted = b.sizeMB ? `${b.sizeMB} MB` : anyB.sizeBytes ? formatBytes(anyB.sizeBytes) : '45.0 MB';
                  const isAutomated = b.type === 'automated_daily' || (b.type as any) === 'automated';

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                        {b.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{b.domainName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.hostingId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isAutomated
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {isAutomated ? 'Automated' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{sizeFormatted}</td>
                      <td className="py-3 px-4 text-slate-400">{createdDate}</td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{daysLeft} days</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setRestoreConfirmBackup(b)}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition-colors font-medium text-[11px] inline-flex items-center gap-1 border border-amber-500/30"
                          title="Restore website files"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handleDownload(b)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-[11px] inline-flex items-center gap-1"
                          title="Download archive"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>

                        <button
                          onClick={() => handleDelete(b.id)}
                          className="px-2 py-1 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Manual Snapshot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-400" />
                <span>Create Manual Snapshot</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Hosting Instance</label>
                <select
                  value={selectedHostId}
                  onChange={(e) => setSelectedHostId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {hostingAccounts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.domainName} ({h.planName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Snapshot Label / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-migration backup or before core theme update"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-[11px] text-blue-300">
                Snapshots encompass all web files, databases, and configuration settings in <span className="font-mono text-white">public_html</span>. Retained for 30 calendar days.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === 'creating' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compressing Files...</span>
                    </>
                  ) : (
                    <span>Create Snapshot Now</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Snapshot Restoration</h3>
                <p className="text-xs text-slate-400">Domain: {restoreConfirmBackup.domainName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Restoring snapshot <span className="font-mono text-white font-semibold">{restoreConfirmBackup.id}</span> will replace the current contents of your <span className="font-mono text-white">public_html</span> document root with this point-in-time version.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRestore(restoreConfirmBackup)}
                disabled={actionLoading === `restore-${restoreConfirmBackup.id}`}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
              >
                {actionLoading === `restore-${restoreConfirmBackup.id}` ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring Files...</span>
                  </>
                ) : (
                  <span>Yes, Rollback to this Snapshot</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
