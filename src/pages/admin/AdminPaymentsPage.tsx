import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  PaymentTransaction,
  PaymentSettings,
  AdminQrCode,
  Order,
  PaymentAttempt,
  PaymentWebhook,
  RefundRecord,
} from '../../types';
import {
  CreditCard,
  RotateCcw,
  Search,
  CheckCircle2,
  X,
  QrCode,
  Upload,
  Trash2,
  Power,
  PowerOff,
  ShieldAlert,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  RefreshCw,
  Building2,
  Check,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

type TabType = 'transactions' | 'qr_codes' | 'methods' | 'pending' | 'webhooks';

export const AdminPaymentsPage: React.FC<Props> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('qr_codes');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transactions State
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [search, setSearch] = useState('');

  // Refund Modal State
  const [targetPayment, setTargetPayment] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // QR Code & Payment Settings State (Payment Settings -> QR Code Management)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [newQrName, setNewQrName] = useState('');
  const [newQrImage, setNewQrImage] = useState('');
  const [newQrIsActive, setNewQrIsActive] = useState(true);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Preview & Replace QR Modals
  const [previewQrModal, setPreviewQrModal] = useState<AdminQrCode | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<AdminQrCode | null>(null);
  const [replaceName, setReplaceName] = useState('');
  const [replaceImage, setReplaceImage] = useState('');
  const [replaceIsActive, setReplaceIsActive] = useState(false);
  const [isReplacingQr, setIsReplacingQr] = useState(false);

  // Bank Registered Merchant Name
  const [merchantNameInput, setMerchantNameInput] = useState('');
  const [isSavingMerchant, setIsSavingMerchant] = useState(false);

  // Pending Payments State
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);

  // Webhooks & Attempts State
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [webhooks, setWebhooks] = useState<PaymentWebhook[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [payRes, setRes, pendRes, attRes, whkRes] = await Promise.all([
        api.getAdminPayments().catch(() => ({ payments: [] })),
        api.getAdminPaymentSettings().catch(() => ({ settings: null })),
        api.getAdminPendingPayments().catch(() => ({ pendingOrders: [] })),
        api.getAdminPaymentAttempts().catch(() => ({ attempts: [] })),
        api.getAdminPaymentWebhooks().catch(() => ({ webhooks: [] })),
      ]);

      setPayments(payRes.payments || []);
      if (setRes.settings) {
        setPaymentSettings(setRes.settings);
        setMerchantNameInput(setRes.settings.merchantName || 'Nexora Cloud Technologies Pvt Ltd');
      }
      setPendingOrders(pendRes.pendingOrders || []);
      setAttempts(attRes.attempts || []);
      setWebhooks(whkRes.webhooks || []);
    } catch (err) {
      console.error('Error loading admin payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  // QR Code Operations
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewQrImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrName.trim() || !newQrImage.trim()) {
      alert('Please provide both QR code name and image data.');
      return;
    }

    setIsUploadingQr(true);
    try {
      const res = await api.uploadAdminQrCode({
        name: newQrName.trim(),
        imageUrl: newQrImage.trim(),
        isActive: newQrIsActive,
      });
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
      setNewQrName('');
      setNewQrImage('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error uploading QR Code' });
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleActivateQr = async (id: string) => {
    try {
      const res = await api.activateAdminQrCode(id);
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error activating QR Code' });
    }
  };

  const handleDeactivateQr = async (id: string) => {
    try {
      const res = await api.deactivateAdminQrCode(id);
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deactivating QR Code' });
    }
  };

  const handleDeleteQr = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR Code record?')) return;
    try {
      const res = await api.deleteAdminQrCode(id);
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting QR Code' });
    }
  };

  const handleOpenReplace = (qr: AdminQrCode) => {
    setReplaceTarget(qr);
    setReplaceName(qr.name);
    setReplaceImage(qr.imageUrl);
    setReplaceIsActive(qr.isActive);
  };

  const handleReplaceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReplaceImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTarget || !replaceName.trim() || !replaceImage.trim()) {
      alert('Please provide a name and image for replacement.');
      return;
    }
    setIsReplacingQr(true);
    try {
      const res = await api.replaceAdminQrCode(replaceTarget.id, {
        name: replaceName.trim(),
        imageUrl: replaceImage.trim(),
        isActive: replaceIsActive,
      });
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
      setReplaceTarget(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error replacing QR Code' });
    } finally {
      setIsReplacingQr(false);
    }
  };

  const handleSaveMerchantName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantNameInput.trim()) return;
    setIsSavingMerchant(true);
    try {
      const res = await api.updateAdminMerchantName(merchantNameInput.trim());
      setMessage({ type: 'success', text: res.message });
      setPaymentSettings(res.settings);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating bank merchant name' });
    } finally {
      setIsSavingMerchant(false);
    }
  };

  // Payment Methods Toggle
  const handleToggleMethod = async (methodKey: keyof PaymentSettings['enabledMethods']) => {
    if (!paymentSettings) return;
    const nextMethods = {
      ...paymentSettings.enabledMethods,
      [methodKey]: !paymentSettings.enabledMethods[methodKey],
    };

    try {
      const res = await api.updateAdminPaymentMethods(nextMethods);
      setPaymentSettings(res.settings);
      setMessage({ type: 'success', text: `Payment method ${methodKey.toUpperCase()} status updated.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating payment methods' });
    }
  };

  // Refund Processor
  const handleOpenRefund = (p: PaymentTransaction) => {
    setTargetPayment(p);
    setRefundReason('');
    setRefundAmount(p.amount);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayment || !refundReason.trim()) return;

    try {
      const res = await api.processRefund({
        paymentId: targetPayment.id,
        reason: refundReason.trim(),
        refundAmount,
      });
      setMessage({ type: 'success', text: `Refund processed successfully via Gateway. Reference: ${res.refundTxId}` });
      setTargetPayment(null);
      loadAllData();
    } catch (err: any) {
      alert(`Refund error: ${err.message}`);
    }
  };

  const filteredPayments = payments.filter((p) =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.orderId.toLowerCase().includes(search.toLowerCase()) ||
    p.gatewayPaymentId.toLowerCase().includes(search.toLowerCase()) ||
    p.customerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Payment Operations & Merchant Gateway</h1>
          <p className="text-xs text-slate-400 mt-1">
            Admin controls for Merchant QR Codes, Payment Methods, Order Reconciliations, and Gateway Webhooks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('qr_codes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'qr_codes' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Payment Settings → QR Code Management ({paymentSettings?.qrCodeList?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'transactions' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transactions ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('methods')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'methods' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'webhooks' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit & Webhooks ({webhooks.length})
          </button>
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

      {/* ========================================================================= */}
      {/* TAB 1: RECONCILED TRANSACTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search payments by ID, order, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredPayments.length} of {payments.length} transactions
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Payment ID</th>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Method & Gateway</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-400">{p.id}</td>
                      <td className="py-3 px-4 text-slate-300">{p.orderId}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="text-slate-200 block truncate max-w-[150px]">{p.customerEmail}</span>
                        <span className="text-[10px] text-slate-500">{p.customerId}</span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="text-slate-200 block">{p.method}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                          {p.methodDetails || p.gateway}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-mono">₹{p.amount}</td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'successful'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : p.status === 'refunded'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        {p.status === 'successful' && (
                          <button
                            onClick={() => handleOpenRefund(p)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded border border-slate-700 hover:border-rose-800 text-[11px] transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADMIN MERCHANT QR CODE MANAGEMENT (Step 11) */}
      {/* ========================================================================= */}
      {activeTab === 'qr_codes' && (
        <div className="space-y-6">
          {/* Section 1: Bank Registered UPI Merchant Account Name */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bank Registered UPI Merchant Account Name
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              This official merchant name is registered with your bank/payment aggregator (e.g. HDFC Bank, ICICI, Razorpay, Cashfree).
              When customers scan your QR code in BHIM, Google Pay, PhonePe, or Paytm, the banking network displays this authentic merchant/payee identity.
            </p>
            <form onSubmit={handleSaveMerchantName} className="flex flex-col sm:flex-row gap-3 pt-1">
              <input
                type="text"
                required
                placeholder="e.g. Nexora Cloud Technologies Pvt Ltd"
                value={merchantNameInput}
                onChange={(e) => setMerchantNameInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSavingMerchant || !merchantNameInput.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSavingMerchant && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSavingMerchant ? 'Saving...' : 'Save Merchant Name'}</span>
              </button>
            </form>
          </div>

          {/* Section 2: Active Customer QR Code Spotlight Banner */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                  paymentSettings?.activeQrCode
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {paymentSettings?.activeQrCode ? 'Currently Active Customer QR Code' : 'No Active QR Code'}
                </span>
                {paymentSettings?.activeQrCode && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {paymentSettings.activeQrCode.id}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-white">
                {paymentSettings?.activeQrCode?.name || 'No Active QR Code Configured'}
              </h2>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                {paymentSettings?.activeQrCode
                  ? 'This exact high-resolution QR code is actively served to customers on Step 5 of the Domain Purchase Workflow. Customers cannot upload or modify QR codes.'
                  : 'Currently no QR code is active. Customers will see a notification on Step 5 and can proceed directly to checkout. Activate one of the QR codes below to serve it immediately.'}
              </p>

              {paymentSettings?.activeQrCode && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewQrModal(paymentSettings.activeQrCode)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Preview in High Resolution</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReplace(paymentSettings.activeQrCode!)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Replace Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivateQr(paymentSettings.activeQrCode!.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <PowerOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deactivate</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 border border-slate-700 cursor-pointer" onClick={() => paymentSettings?.activeQrCode && setPreviewQrModal(paymentSettings.activeQrCode)}>
              {paymentSettings?.activeQrCode ? (
                <img
                  src={paymentSettings.activeQrCode.imageUrl}
                  alt="Active QR"
                  className="w-36 h-36 object-contain rounded-lg hover:opacity-90 transition-opacity"
                  title="Click to expand high-resolution preview"
                />
              ) : (
                <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
                  <span>No Active QR Code</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Upload New QR Code Form */}
          <form onSubmit={handleUploadQrCode} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Upload New Merchant Payment QR Code (Mobile or Desktop)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Admin can upload merchant QR code images in PNG, JPG, or JPEG format from their mobile phone or computer.
              Saved securely into persistent backend database.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  QR Code Display Label / Merchant Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official HDFC Bank Merchant QR (Nexora Pay)"
                  value={newQrName}
                  onChange={(e) => setNewQrName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select QR Image File (PNG, JPG, JPEG) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleQrFileUpload}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
              </div>

              {/* Live Preview If Image Uploaded */}
              {newQrImage && (
                <div className="md:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shrink-0">
                    <img src={newQrImage} alt="Preview" className="w-16 h-16 object-contain" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">Image Loaded & Ready to Save</span>
                    <span className="text-[11px] text-slate-400">Format verified. Click Save QR Code to persist into database.</span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Or Paste Data URI / Image URL
                </label>
                <input
                  type="text"
                  placeholder="data:image/png;base64,... or https://..."
                  value={newQrImage}
                  onChange={(e) => setNewQrImage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setActive"
                  checked={newQrIsActive}
                  onChange={(e) => setNewQrIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="setActive" className="text-slate-300 font-semibold">
                  Set as Active QR Code immediately upon upload
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUploadingQr || !newQrName.trim() || !newQrImage.trim()}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isUploadingQr ? 'Saving QR...' : 'Save QR Code'}</span>
              </button>
            </div>
          </form>

          {/* Section 4: QR Code Repository Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Merchant QR Code Repository ({paymentSettings?.qrCodeList?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-500">
                Only 1 QR Code can be Active at any time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentSettings?.qrCodeList?.map((qr) => {
                const isActive = qr.isActive;
                return (
                  <div
                    key={qr.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-slate-900 border-emerald-500/80 shadow-lg ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isActive ? 'ACTIVE IN CHECKOUT' : 'INACTIVE'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{qr.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono block">ID: {qr.id}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Updated: {qr.updatedAt ? new Date(qr.updatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div
                        className="p-2 bg-white rounded-xl shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                        onClick={() => setPreviewQrModal(qr)}
                        title="Click to view full preview"
                      >
                        <img src={qr.imageUrl} alt={qr.name} className="w-18 h-18 object-contain rounded" />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewQrModal(qr)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                          title="Preview QR Code"
                        >
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReplace(qr)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                          title="Replace QR Image"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-400" />
                          <span>Replace</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivateQr(qr.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-400 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                            title="Deactivate QR Code"
                          >
                            <PowerOff className="w-3 h-3 text-amber-400" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateQr(qr.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
                            title="Activate as single primary QR code for checkout"
                          >
                            <Power className="w-3 h-3" />
                            <span>Activate</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteQr(qr.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete QR Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT METHODS TOGGLE (Step 11) */}
      {/* ========================================================================= */}
      {activeTab === 'methods' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-white">Customer Payment Methods Gateway Controls</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enable or disable customer checkout methods in real-time. Changes propagate immediately to Step 6 Checkout.
            </p>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {[
              {
                key: 'upi' as const,
                name: '1. UPI Payment (App / VPA Collect Request)',
                desc: 'Allows customers to enter their UPI ID and receive a collect request.',
              },
              {
                key: 'upi_qr' as const,
                name: '2. Dynamic UPI QR Code Scan',
                desc: 'Renders dynamic scan-and-pay QR code with exact itemized order total.',
              },
              {
                key: 'debit_card' as const,
                name: '3. Debit Card Processing',
                desc: 'Enables Visa, MasterCard, and RuPay debit card processing via secure gateway.',
              },
              {
                key: 'credit_card' as const,
                name: '4. Credit Card Processing',
                desc: 'Enables major credit card payments with 3D Secure OTP verification.',
              },
              {
                key: 'netbanking' as const,
                name: '5. NetBanking Instant Pay',
                desc: 'Direct retail internet banking integration across 50+ authorized Indian banks.',
              },
            ].map((m) => {
              const isEnabled = paymentSettings?.enabledMethods?.[m.key] ?? true;
              return (
                <div key={m.key} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-200">{m.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                  </div>

                  <button
                    onClick={() => handleToggleMethod(m.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENDING ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pending Orders Awaiting Payment Authorization ({pendingOrders.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time status</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No orders are currently pending payment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Item & Title</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pendingOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-400">{o.id}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="text-slate-200 block">{o.customerName}</span>
                        <span className="text-[10px] text-slate-500">{o.customerEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">{o.itemTitle}</td>
                      <td className="py-3 px-4 font-bold text-white">₹{o.totalAmount}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800">
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT LOGS & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* Payment Attempts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Payment Verification Attempts ({attempts.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">Security IP audit</span>
            </div>

            {attempts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No payment attempts logged yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-sans">
                    <tr>
                      <th className="py-3 px-4">Attempt ID</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attempts.slice(0, 15).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-300">{a.id}</td>
                        <td className="py-3 px-4 text-amber-400">{a.orderId}</td>
                        <td className="py-3 px-4 text-slate-200">{a.method}</td>
                        <td className="py-3 px-4 font-bold text-white">₹{a.amount}</td>
                        <td className="py-3 px-4 text-slate-400">{a.ipAddress}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Webhooks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Gateway Webhook Event Deliveries ({webhooks.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">Idempotent processing</span>
            </div>

            {webhooks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No gateway webhooks recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-sans">
                    <tr>
                      <th className="py-3 px-4">Webhook ID</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Order Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Received At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {webhooks.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-300">{w.id}</td>
                        <td className="py-3 px-4 text-blue-400">{w.event}</td>
                        <td className="py-3 px-4 text-amber-400">{w.orderId}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">
                          {new Date(w.receivedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {targetPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleProcessRefund}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Process Authoritative Gateway Refund</h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div>Payment ID: <span className="text-white font-bold">{targetPayment.id}</span></div>
              <div>Order ID: <span className="text-amber-400">{targetPayment.orderId}</span></div>
              <div>Customer: <span className="text-slate-300">{targetPayment.customerEmail}</span></div>
              <div>Original Amount: <span className="text-emerald-400 font-bold">₹{targetPayment.amount}</span></div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Refund Amount (INR)</label>
              <input
                type="number"
                max={targetPayment.amount}
                min="1"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Reason for Refund</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Domain registration failed, cancellation within 30-day policy, billing adjustment..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetPayment(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-md"
              >
                Issue Refund
              </button>
            </div>
          </form>
        </div>
      )}

      {/* High-Resolution QR Code Preview Modal */}
      {previewQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-left">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                  previewQrModal.isActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {previewQrModal.isActive ? 'ACTIVE IN CHECKOUT' : 'INACTIVE'}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{previewQrModal.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono">ID: {previewQrModal.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQrModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Image Display */}
            <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl border-4 border-slate-800 mx-auto">
              <img
                src={previewQrModal.imageUrl}
                alt={previewQrModal.name}
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto rounded-xl"
              />
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">
                Merchant Payee: {paymentSettings?.merchantName || 'Nexora Cloud Technologies Pvt Ltd'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Uploaded: {previewQrModal.uploadedAt ? new Date(previewQrModal.uploadedAt).toLocaleString() : 'N/A'} &bull; Updated: {previewQrModal.updatedAt ? new Date(previewQrModal.updatedAt).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {!previewQrModal.isActive && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleActivateQr(previewQrModal.id);
                    setPreviewQrModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Activate This QR</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewQrModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace QR Code Modal */}
      {replaceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleExecuteReplace}
            className="p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Replace QR Code Image & Label</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Target ID: {replaceTarget.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Updated Label / Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={replaceName}
                  onChange={(e) => setReplaceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Replacement Image File (PNG, JPG, JPEG) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleReplaceFileUpload}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
              </div>

              {/* Side by Side Image Comparison */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Original QR</span>
                  <div className="p-2 bg-white rounded-xl inline-block">
                    <img src={replaceTarget.imageUrl} alt="Current" className="w-24 h-24 object-contain" />
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">New Replacement QR</span>
                  <div className="p-2 bg-white rounded-xl inline-block">
                    <img src={replaceImage} alt="New" className="w-24 h-24 object-contain" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="replaceActive"
                  checked={replaceIsActive}
                  onChange={(e) => setReplaceIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="replaceActive" className="text-slate-300 font-semibold">
                  Make this QR Code Active in Checkout
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReplacingQr || !replaceName.trim() || !replaceImage.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {isReplacingQr && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isReplacingQr ? 'Replacing...' : 'Save & Replace QR'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
