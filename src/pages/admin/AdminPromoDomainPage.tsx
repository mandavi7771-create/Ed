import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PromoDomainOffer, TldPricing } from '../../types';
import {
  Tag,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Users,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminPromoDomainPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [offer, setOffer] = useState<PromoDomainOffer | null>(null);
  const [allTlds, setAllTlds] = useState<TldPricing[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [promotionalPrice, setPromotionalPrice] = useState(1);
  const [eligibleTlds, setEligibleTlds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxOrders, setMaxOrders] = useState(500);
  const [customerEligibility, setCustomerEligibility] = useState<'all' | 'new_customers_only' | 'existing_customers'>('all');
  const [minRegistrationPeriodYears, setMinRegistrationPeriodYears] = useState(1);
  const [allowPlatformSubsidy, setAllowPlatformSubsidy] = useState(true);
  const [customRenewalPrices, setCustomRenewalPrices] = useState<{ [tld: string]: number }>({});
  const [termsAndConditions, setTermsAndConditions] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getAdminPromoDomainOffer();
      const o: PromoDomainOffer = res.offer;
      setOffer(o);
      setAllTlds(res.allTlds || []);
      setStats(res.stats);
      setIsLive(res.isLive);

      // Populate form
      setIsEnabled(o.isEnabled);
      setPromotionalPrice(o.promotionalPrice);
      setEligibleTlds(o.eligibleTlds || []);
      setStartDate(o.startDate || '2026-01-01');
      setEndDate(o.endDate || '2026-12-31');
      setMaxOrders(o.maxOrders || 500);
      setCustomerEligibility(o.customerEligibility || 'all');
      setMinRegistrationPeriodYears(o.minRegistrationPeriodYears || 1);
      setAllowPlatformSubsidy(o.allowPlatformSubsidy ?? true);
      setCustomRenewalPrices(o.customRenewalPrices || {});
      setTermsAndConditions(o.termsAndConditions || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load promotional offer configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTld = (tld: string) => {
    if (eligibleTlds.includes(tld)) {
      setEligibleTlds(eligibleTlds.filter((t) => t !== tld));
    } else {
      setEligibleTlds([...eligibleTlds, tld]);
    }
  };

  const handleSelectAllTlds = () => {
    if (eligibleTlds.length === allTlds.length) {
      setEligibleTlds([]);
    } else {
      setEligibleTlds(allTlds.map((t) => t.tld));
    }
  };

  const handleRenewalPriceChange = (tld: string, val: string) => {
    const num = Number(val);
    setCustomRenewalPrices((prev) => ({
      ...prev,
      [tld]: num >= 0 ? num : 0,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.updateAdminPromoDomainOffer({
        isEnabled,
        promotionalPrice: Number(promotionalPrice),
        eligibleTlds,
        startDate,
        endDate,
        maxOrders: Number(maxOrders),
        customerEligibility,
        minRegistrationPeriodYears: Number(minRegistrationPeriodYears),
        allowPlatformSubsidy,
        customRenewalPrices,
        termsAndConditions,
        adminId: user?.id,
        adminEmail: user?.email,
      });

      setSuccessMsg('₹1 Promotional Domain Offer configuration has been successfully saved and activated in real time!');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving promotional offer settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">₹1 Domain Registration Offer Control</h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isLive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                  }`}
                >
                  {isLive ? '● Live & Claimable' : '○ Inactive / Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Configure promotional pricing, extension eligibility, multi-year term commitments, maximum order quotas, and wholesale registrar subsidy authorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/domain-search')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              Preview Public Search
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry & Quota Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Offer Status</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {isEnabled ? `₹${promotionalPrice}` : 'Disabled'}
            </span>
            <span className="text-[11px] text-slate-400">/ 1st Year</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isEnabled ? 'Promo price active on eligible TLDs' : 'Standard wholesale prices applied'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Orders Claimed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats?.ordersClaimed || 0}</span>
            <span className="text-[11px] text-slate-400">/ {stats?.maxOrders || maxOrders} Max</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.percentClaimed || 0)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Remaining Quota</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">{stats?.remainingQuota ?? maxOrders}</span>
            <span className="text-[11px] text-slate-400">Slots Available</span>
          </div>
          <p className="text-[11px] text-slate-500">Auto-expires once quota hits zero</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Term Commitment</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300">{minRegistrationPeriodYears} Year(s)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {minRegistrationPeriodYears > 1 ? 'Multi-year commitment enforced' : '1st year only commitment'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Admin Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Activation & Pricing Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Promotional Offer Status & Price Point
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">Offer Master Switch:</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
              />
              <span className={`text-xs font-bold ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Promotional First-Year Price (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={1}
                  max={9999}
                  value={promotionalPrice}
                  onChange={(e) => setPromotionalPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default is ₹1 for special promotional campaign.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Offer Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Offer unlocks at 00:00 on this date.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Offer End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Offer expires at 23:59:59 on this date.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Quota, Eligibility & Minimum Commitment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Order Quota, Customer Eligibility & Term Commitment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Order Quota (Total Units)
              </label>
              <input
                type="number"
                required
                min={1}
                max={50000}
                value={maxOrders}
                onChange={(e) => setMaxOrders(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Total registrations permitted under this promo before automatic shutoff.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Eligibility Group
              </label>
              <select
                value={customerEligibility}
                onChange={(e: any) => setCustomerEligibility(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Registered Customers (Open Campaign)</option>
                <option value="new_customers_only">New Customers Only (First Order Only)</option>
                <option value="existing_customers">Existing Customers Only (Loyalty Reward)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Controls which user accounts are authorized to claim the ₹1 rate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Registration Period (Commitment)
              </label>
              <select
                value={minRegistrationPeriodYears}
                onChange={(e) => setMinRegistrationPeriodYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={1}>1 Year (Year 1 @ ₹1, subsequent renewals optional)</option>
                <option value={2}>2 Years (Year 1 @ ₹1 + Year 2 @ Renewal rate commitment)</option>
                <option value={3}>3 Years (Year 1 @ ₹1 + Year 2 & 3 @ Renewal rate commitment)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {minRegistrationPeriodYears > 1
                  ? `Customers must purchase ${minRegistrationPeriodYears} years upfront. Checkout will show full total with 18% GST transparently.`
                  : 'Allows 1-year standalone purchase at ₹1.'}
              </p>
            </div>
          </div>

          {/* Platform Subsidy / Loss Absorption Control */}
          <div className="p-4 bg-slate-950 border border-amber-900/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Wholesale Registrar Platform Subsidy Authorization</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-2xl">
                Domain registries (e.g. ICANN, Verisign, NIXI) charge wholesale registry costs (e.g., ₹350–₹650). By checking this option, Administrator formally authorizes the platform to absorb the wholesale acquisition deficit as marketing expense. If unchecked, loss-making registrations will be automatically blocked.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={allowPlatformSubsidy}
                onChange={(e) => setAllowPlatformSubsidy(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
              />
              <span className={`text-xs font-bold ${allowPlatformSubsidy ? 'text-emerald-400' : 'text-rose-400'}`}>
                {allowPlatformSubsidy ? 'AUTHORIZED' : 'DECLINED'}
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Eligible Domain Extensions (TLDs) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Eligible Domain Extensions (TLD Selection & Renewal Matrix)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSelectAllTlds}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              {eligibleTlds.length === allTlds.length ? 'Deselect All' : 'Select All Extensions'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Select which TLDs display the ₹1 promotional rate. You can also specify custom renewal rates for Year 2 and Year 3 to guarantee total transparency for your customers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTlds.map((t) => {
              const isSelected = eligibleTlds.includes(t.tld);
              const customRenewal = customRenewalPrices[t.tld] ?? t.renewalPrice;

              return (
                <div
                  key={t.tld}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-600/50 shadow-sm'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTld(t.tld)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                      />
                      <span className="font-mono font-bold text-white text-sm">{t.tld}</span>
                    </label>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isSelected ? 'PROMO: ₹1' : `Std: ₹${t.registrationPrice}`}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Registrar Wholesale:</span>
                        <span className="font-mono text-slate-300">₹{t.registrarCost}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Year 2+ Renewal Price:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={customRenewal}
                            onChange={(e) => handleRenewalPriceChange(t.tld, e.target.value)}
                            className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-right font-mono text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Public Terms & Mandatory Transparency Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Mandatory Transparency Notice & Terms of Service
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Customer Disclosure & Price Guarantee Notice
            </label>
            <textarea
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              placeholder="Enter clear, transparent terms that will be displayed in domain checkout before payment..."
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Per ICANN rules and prompt guidelines: all GST (18%) and future renewal charges must be itemized and presented to the customer prior to order placement.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Discard Changes
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving & Publishing...' : 'Save & Publish ₹1 Offer'}
          </button>
        </div>
      </form>
    </div>
  );
};
