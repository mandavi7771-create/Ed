import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PlatformSettings } from '../../types';
import { Settings, Save, Shield, Key, Mail, Server, DollarSign, CheckCircle2 } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminSettingsPage: React.FC<Props> = ({ navigate }) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminSettings().then((res) => setSettings(res.settings)).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await api.saveAdminSettings(settings);
      setSettings(res.settings);
      setMessage('Platform infrastructure settings saved successfully.');
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Configuration & API Connectors</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure global business credentials, payment gateway keys, registrar endpoints, and DNS defaults.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Business Info */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-white">General Brand Identity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tax Name & Rate</label>
                <input
                  type="text"
                  value={settings.taxName}
                  onChange={(e) => setSettings({ ...settings, taxName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Domain Registrar API Connector */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white">Domain Registrar API Configuration</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Registrar API Endpoint</label>
              <input
                type="text"
                value={settings.registrarEndpoint}
                onChange={(e) => setSettings({ ...settings, registrarEndpoint: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">API Key / Token (Masked for Security)</label>
              <input
                type="text"
                value={settings.registrarApiKeyMasked}
                onChange={(e) => setSettings({ ...settings, registrarApiKeyMasked: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.registrarApiConfigured}
                  onChange={(e) => setSettings({ ...settings, registrarApiConfigured: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span>Enable Live ResellerClub / Namecheap Registry Connector</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1">
                When disabled, transactions process via the Authoritative Sandbox Registry with real RDAP verification.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Gateway Settings */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-white">Payment Gateway Integration</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Razorpay / UPI Gateway Key ID</label>
              <input
                type="text"
                value={settings.paymentGatewayKeyId}
                onChange={(e) => setSettings({ ...settings, paymentGatewayKeyId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.paymentGatewayConfigured}
                  onChange={(e) => setSettings({ ...settings, paymentGatewayConfigured: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500"
                />
                <span>Live Multi-Gateway Processing Active (UPI, Cards, NetBanking)</span>
              </label>
            </div>
          </div>
        </div>

        {/* DNS & Server Defaults */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-white">DNS & Server Node Defaults</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Default Nameserver 1</label>
                <input
                  type="text"
                  value={settings.defaultNameserver1}
                  onChange={(e) => setSettings({ ...settings, defaultNameserver1: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Default Nameserver 2</label>
                <input
                  type="text"
                  value={settings.defaultNameserver2}
                  onChange={(e) => setSettings({ ...settings, defaultNameserver2: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Default Cluster Node IP</label>
              <input
                type="text"
                value={settings.defaultServerIp}
                onChange={(e) => setSettings({ ...settings, defaultServerIp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
