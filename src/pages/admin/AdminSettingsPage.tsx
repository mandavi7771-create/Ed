import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  PlatformSettings,
  AcceptanceTestResult,
  ProductionReadinessReport,
} from '../../types';
import {
  Settings,
  Save,
  Shield,
  Key,
  Mail,
  Server,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminSettingsPage: React.FC<Props> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'acceptance_test' | 'readiness_report'>('settings');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Registrar Test Connection state
  const [isTestingRegistrar, setIsTestingRegistrar] = useState(false);
  const [registrarTestResult, setRegistrarTestResult] = useState<{
    success: boolean;
    message: string;
    endpoint: string;
    provider: string;
  } | null>(null);

  // Acceptance Test state (Requirement 15)
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [acceptanceTestResult, setAcceptanceTestResult] = useState<AcceptanceTestResult | null>(null);
  const [testDomainInput, setTestDomainInput] = useState('');

  // Production Readiness Report state (Requirement 17)
  const [readinessReport, setReadinessReport] = useState<ProductionReadinessReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    api.getAdminSettings().then((res) => setSettings(res.settings)).catch(console.error);
    loadReadinessReport();
  }, []);

  const loadReadinessReport = () => {
    setIsLoadingReport(true);
    api.getReadinessReport()
      .then((res) => setReadinessReport(res.report))
      .catch(console.error)
      .finally(() => setIsLoadingReport(false));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await api.saveAdminSettings(settings);
      setSettings(res.settings);
      setMessage('Platform infrastructure settings saved successfully.');
      loadReadinessReport(); // refresh report when settings change
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRegistrarConnection = async () => {
    setIsTestingRegistrar(true);
    setRegistrarTestResult(null);
    try {
      const res = await api.testRegistrarConnection('google.com');
      setRegistrarTestResult({
        success: res.success,
        message: res.message,
        endpoint: res.endpoint,
        provider: res.provider,
      });
    } catch (err: any) {
      setRegistrarTestResult({
        success: false,
        message: err.message || 'Connection test failed',
        endpoint: settings?.registrarEndpoint || 'Unknown',
        provider: 'Registrar Connector',
      });
    } finally {
      setIsTestingRegistrar(false);
    }
  };

  const handleRunAcceptanceTest = async () => {
    setIsRunningTest(true);
    setAcceptanceTestResult(null);
    try {
      const res = await api.runAcceptanceTest(testDomainInput.trim() || undefined);
      setAcceptanceTestResult(res.testResult);
    } catch (err: any) {
      alert(`Error running acceptance test: ${err.message}`);
    } finally {
      setIsRunningTest(false);
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
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Configuration & Registrar Controls</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative ICANN registrar connectors, 10-step real-world acceptance tests, and production readiness tracking.
          </p>
        </div>

        {activeTab === 'settings' && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Platform Settings & API Connectors</span>
        </button>

        <button
          onClick={() => setActiveTab('acceptance_test')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'acceptance_test'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Real-World Acceptance Test (Req 15)</span>
        </button>

        <button
          onClick={() => setActiveTab('readiness_report')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'readiness_report'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Production Readiness Report (Req 17)</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs">
          {message}
        </div>
      )}

      {/* TAB 1: Platform Settings */}
      {activeTab === 'settings' && (
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
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">ICANN Registrar API Connector</h3>
              </div>
              <button
                type="button"
                onClick={handleTestRegistrarConnection}
                disabled={isTestingRegistrar}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isTestingRegistrar ? 'animate-spin' : ''}`} />
                <span>{isTestingRegistrar ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {registrarTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  registrarTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {registrarTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{registrarTestResult.success ? 'Registrar Connection Verified' : 'Connection Test Failed'}</span>
                </div>
                <p className="mt-1 text-[11px] opacity-90">{registrarTestResult.message}</p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Registrar API Endpoint / Base URL</label>
                <input
                  type="text"
                  value={settings.registrarEndpoint}
                  onChange={(e) => setSettings({ ...settings, registrarEndpoint: e.target.value })}
                  placeholder="https://httpapi.com or https://api.namecheap.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Supports ResellerClub, Namecheap, Enom, or central registry RDAP</span>
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
                  <span>Enable Live Reseller Wholesale Registry Connector</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  When enabled, domain registrations dispatch directly to wholesale registrar account. When disabled, checks use RFC 7482 Authoritative RDAP with live Anycast DoH.
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
      )}

      {/* TAB 2: Real-World Acceptance Test (Requirement 15) */}
      {activeTab === 'acceptance_test' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-World 10-Step Domain Acceptance Test (Requirement 15)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Automated verification proving real ICANN registration, registry transaction confirmation, external nameserver delegation (Cloudflare/AWS), DNS zone resolution, and uninhibited outbound portability with EPP authorization codes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={testDomainInput}
                  onChange={(e) => setTestDomainInput(e.target.value)}
                  placeholder="Optional: custom-test.com"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 w-52"
                />
                <button
                  onClick={handleRunAcceptanceTest}
                  disabled={isRunningTest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
                  <span>{isRunningTest ? 'Executing 10 Steps...' : 'Run Acceptance Test'}</span>
                </button>
              </div>
            </div>

            {acceptanceTestResult ? (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  acceptanceTestResult.allPassed
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {acceptanceTestResult.allPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-sm block">
                        {acceptanceTestResult.allPassed
                          ? '10 / 10 Real-World Acceptance Verification Steps Passed!'
                          : 'Acceptance Verification Failed'}
                      </span>
                      <span className="text-xs opacity-80 block">
                        Test Domain: <span className="font-mono">{acceptanceTestResult.testDomain}</span> · Audit ID: {acceptanceTestResult.testId}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(acceptanceTestResult.executedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* 10 Detailed Step Audit */}
                <div className="space-y-2">
                  {acceptanceTestResult.steps.map((st) => (
                    <div
                      key={st.step}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-300 shrink-0 mt-0.5">
                        {st.step}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{st.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            st.status === 'passed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {st.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1 leading-relaxed">{st.description}</p>
                        {st.details && (
                          <div className="mt-1.5 p-2 bg-slate-900/80 rounded font-mono text-[10px] text-slate-400 overflow-x-auto">
                            {JSON.stringify(st.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Click &quot;Run Acceptance Test&quot; above to execute the 10-step ICANN registration and portability test live.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Production Readiness Report (Requirement 17) */}
      {activeTab === 'readiness_report' && (
        <div className="space-y-6">
          {readinessReport && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 bg-emerald-950/30 border border-emerald-900/60 rounded-xl text-center">
                  <span className="text-[11px] text-emerald-400 font-semibold block">Working and Verified</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {readinessReport.summary.workingAndVerified}
                  </span>
                </div>
                <div className="p-4 bg-amber-950/30 border border-amber-900/60 rounded-xl text-center">
                  <span className="text-[11px] text-amber-400 font-semibold block">Configuration Required</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {readinessReport.summary.configurationRequired}
                  </span>
                </div>
                <div className="p-4 bg-blue-950/30 border border-blue-900/60 rounded-xl text-center">
                  <span className="text-[11px] text-blue-400 font-semibold block">Provider Approval Req</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {readinessReport.summary.providerApprovalRequired}
                  </span>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block">Not Supported</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {readinessReport.summary.notSupported}
                  </span>
                </div>
                <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl text-center">
                  <span className="text-[11px] text-rose-400 font-semibold block">Failed Verification</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {readinessReport.summary.failedVerification}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Overall Architecture Status:</span>
                  <span className="font-bold text-white ml-2 text-sm">{readinessReport.overallStatus}</span>
                </div>
                <button
                  onClick={loadReadinessReport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingReport ? 'animate-spin' : ''}`} />
                  <span>Refresh Report</span>
                </button>
              </div>

              {/* Categorized Compliance Items */}
              <div className="space-y-3">
                {readinessReport.items.map((item) => {
                  let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (item.status === 'Working and Verified') {
                    badgeClass = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                  } else if (item.status === 'Configuration Required') {
                    badgeClass = 'bg-amber-950 text-amber-400 border-amber-800';
                  } else if (item.status === 'Provider Approval Required') {
                    badgeClass = 'bg-blue-950 text-blue-400 border-blue-800';
                  } else if (item.status === 'Failed Verification') {
                    badgeClass = 'bg-rose-950 text-rose-400 border-rose-800';
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {item.category}
                          </span>
                          <span className="font-bold text-white text-sm">{item.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${badgeClass}`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{item.details}</p>

                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-300">Authoritative Evidence / Requirement:</strong>{' '}
                          <span>{item.evidenceOrRequirement}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
