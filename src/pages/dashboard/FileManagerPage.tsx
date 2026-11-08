import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HostingAccount } from '../../types';
import {
  Folder,
  File,
  FileCode,
  FileText,
  FileImage,
  Upload,
  FolderPlus,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Search,
  HardDrive,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const FileManagerPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [selectedHostingId, setSelectedHostingId] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [items, setItems] = useState<any[]>([]);
  const [totalMB, setTotalMB] = useState(0);
  const [storageLimitMB, setStorageLimitMB] = useState(10240);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing file state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New folder modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Upload file state
  const [isUploading, setIsUploading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const loadDirectory = async (hostingId: string, path: string) => {
    if (!hostingId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.listFiles(hostingId, path);
      setCurrentPath(res.currentPath);
      setItems(res.items || []);
      setTotalMB(res.totalMB);
      setStorageLimitMB(res.storageLimitMB);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error loading directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHostingId) {
      loadDirectory(selectedHostingId, currentPath);
    }
  }, [selectedHostingId]);

  const handleOpenFolder = (folderName: string) => {
    const nextPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    loadDirectory(selectedHostingId, nextPath);
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    loadDirectory(selectedHostingId, parentPath);
  };

  const handleOpenFile = async (item: any) => {
    const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    try {
      const res = await api.readFile(selectedHostingId, filePath);
      setEditingFile({ path: filePath, name: item.name, content: res.content });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cannot open file for editing' });
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    try {
      await api.writeFile(selectedHostingId, editingFile.path, editingFile.content);
      setMessage({ type: 'success', text: `Saved ${editingFile.name} successfully.` });
      setEditingFile(null);
      loadDirectory(selectedHostingId, currentPath);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save file' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(selectedHostingId, newFolderName.trim(), currentPath);
      setShowFolderModal(false);
      setNewFolderName('');
      loadDirectory(selectedHostingId, currentPath);
      setMessage({ type: 'success', text: 'Folder created successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating folder' });
    }
  };

  const handleDeleteItem = async (itemName: string) => {
    const itemPath = currentPath === '/' ? `/${itemName}` : `${currentPath}/${itemName}`;
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action is irreversible.`)) return;
    try {
      await api.deleteFile(selectedHostingId, itemPath);
      setMessage({ type: 'success', text: `Deleted "${itemName}".` });
      loadDirectory(selectedHostingId, currentPath);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete item' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('currentPath', currentPath);

    try {
      const token = localStorage.getItem('nexora_token');
      const res = await fetch(`/api/filemanager/${selectedHostingId}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: `Uploaded "${file.name}" successfully.` });
      loadDirectory(selectedHostingId, currentPath);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'File upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (item: any) => {
    if (item.isDirectory) return <Folder className="w-4 h-4 text-amber-400" />;
    const ext = item.extension;
    if (['.html', '.htm', '.php', '.js', '.ts', '.jsx', '.tsx', '.json', '.css'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-blue-400" />;
    }
    if (['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'].includes(ext)) {
      return <FileImage className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer File Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, upload, edit, and organize files inside your document root with complete directory isolation.
          </p>
        </div>

        {/* Storage quota pill */}
        <div className="flex items-center gap-3 p-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Disk Usage:</span>
              <span className="font-mono text-slate-200 font-semibold">{totalMB} MB</span>
              <span>/</span>
              <span className="font-mono text-slate-400">{(storageLimitMB / 1024).toFixed(0)} GB</span>
            </div>
            <div className="w-36 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, (totalMB / storageLimitMB) * 100))}%` }}
              />
            </div>
          </div>
        </div>
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

      {/* Instance Selector & Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Hosting Instance:</span>
            <select
              value={selectedHostingId}
              onChange={(e) => {
                setSelectedHostingId(e.target.value);
                setCurrentPath('/');
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              {hosting.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.domainName} ({h.planName})
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowFolderModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Folder</span>
            </button>

            <button
              onClick={() => loadDirectory(selectedHostingId, currentPath)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Path Breadcrumbs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-slate-300 overflow-x-auto py-1">
            <button
              onClick={() => loadDirectory(selectedHostingId, '/')}
              className="hover:text-blue-400 font-semibold"
            >
              /public_html
            </button>
            {currentPath !== '/' &&
              currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
                <React.Fragment key={idx}>
                  <span className="text-slate-600">/</span>
                  <button
                    onClick={() => {
                      const target = '/' + arr.slice(0, idx + 1).join('/');
                      loadDirectory(selectedHostingId, target);
                    }}
                    className="hover:text-blue-400"
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Directory Browser View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold w-28">Size</th>
                <th className="py-3 px-4 font-semibold w-40">Modified</th>
                <th className="py-3 px-4 font-semibold text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currentPath !== '/' && (
                <tr
                  onClick={handleGoUp}
                  className="hover:bg-slate-800/40 cursor-pointer text-slate-400"
                >
                  <td colSpan={4} className="py-2.5 px-4 flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                    <span>.. (Parent Directory)</span>
                  </td>
                </tr>
              )}

              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    This directory is empty. Use the buttons above to upload files or create folders.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4">
                      {item.isDirectory ? (
                        <button
                          onClick={() => handleOpenFolder(item.name)}
                          className="flex items-center gap-2.5 text-slate-200 hover:text-blue-400 font-medium"
                        >
                          {getFileIcon(item)}
                          <span>{item.name}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenFile(item)}
                          className="flex items-center gap-2.5 text-slate-300 hover:text-white"
                        >
                          {getFileIcon(item)}
                          <span>{item.name}</span>
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {item.isDirectory ? '—' : `${(item.size / 1024).toFixed(1)} KB`}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!item.isDirectory && (
                          <button
                            onClick={() => handleOpenFile(item)}
                            className="p-1 text-slate-400 hover:text-blue-400"
                            title="Edit File"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!item.isDirectory && (
                          <a
                            href={`/api/filemanager/${selectedHostingId}/download?path=${encodeURIComponent(
                              currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`
                            )}`}
                            download
                            className="p-1 text-slate-400 hover:text-emerald-400"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.name)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Code/Text File Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs text-white font-semibold">{editingFile.path}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFile}
                  disabled={isSaving}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 bg-slate-950">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 border-0 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleCreateFolder}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm">Create New Folder</span>
              <button type="button" onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Folder Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. assets, css, uploads"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
