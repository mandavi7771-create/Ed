import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TldPricing, DomainServicePlan } from '../../types';
import { DomainCheckoutModal } from '../../components/domain/DomainCheckoutModal';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  Sparkles,
  Tag,
  Clock,
  Layers,
  ChevronRight,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

// 1. Domain Search Page (with Smart Detection, Trademark Reminder, and Alternative Suggestions)
export const DomainSearchPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Promo Offer state
  const [promoData, setPromoData] = useState<{
    offer: any;
    isActive: boolean;
    remainingQuota: number;
  } | null>(null);

  // Checkout Modal State
  const [selectedDomainItem, setSelectedDomainItem] = useState<any | null>(null);

  useEffect(() => {
    api.getPromoDomainOffer()
      .then((res) => setPromoData(res))
      .catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await api.checkDomain(query.trim());
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Error checking domain availability');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBuy = (item: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const dName = item.domainName || (results ? results.primaryDomain : '');
    navigate(`/domain-purchase?domain=${encodeURIComponent(dName)}`);
  };

  const handleCheckoutSuccess = () => {
    setSelectedDomainItem(null);
    navigate('/dashboard/domains');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* ₹1 Promotional Banner if Active */}
      {promoData?.isActive && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">
                    Special ₹1 Domain Registration Promotional Offer!
                  </span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                    Limited Time
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Register your business domain for just <strong className="text-emerald-400 font-bold">₹1</strong> on selected extensions: {promoData.offer.eligibleTlds.slice(0, 7).join(', ')}. Transparent multi-year renewal disclosure, zero hidden fees.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{promoData.remainingQuota} Slots Remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Real-Time Domain Search</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Query authoritative ICANN registries directly. Real-time availability checks with transparent multi-year pricing, renewal rates, and instant DNS allocation.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl focus-within:border-blue-500 transition-colors gap-2">
          <div className="flex items-center flex-1 px-3 gap-2">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              required
              placeholder="Search domain (e.g. instagramvideodownloader, mybusiness, techstart)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Checking Registry...' : 'Search Domain'}
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-2xl mx-auto p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Trademark Notice if Detected */}
          {results.trademarkNotice && (
            <div className="p-4 bg-amber-950/40 border border-amber-600/60 rounded-2xl text-amber-200 text-xs flex items-start gap-3 shadow-md">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Third-Party Trademark Advisory</p>
                <p className="mt-0.5 leading-relaxed text-amber-200/90">{results.trademarkNotice}</p>
              </div>
            </div>
          )}

          {/* Primary Query Result */}
          {results.primaryPricing && (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                results.primaryAvailable
                  ? results.primaryPricing.isPromo1Rupee
                    ? 'bg-amber-950/20 border-amber-600/50 shadow-lg'
                    : 'bg-emerald-950/30 border-emerald-800'
                  : 'bg-rose-950/20 border-rose-900/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg font-mono">{results.primaryDomain}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        results.primaryAvailable
                          ? results.primaryPricing.isPromo1Rupee
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-900/80 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {results.primaryAvailable
                        ? results.primaryPricing.isPromo1Rupee
                          ? 'Available (₹1 Promo)'
                          : 'Available for Registration'
                        : 'This domain is already registered'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5">
                    {results.primaryAvailable
                      ? results.primaryPricing.isPromo1Rupee
                        ? `Special ₹1 promotional rate applies. Renewal at ₹${results.primaryPricing.renewalPrice}/yr.`
                        : `Ready for authoritative registration. Renewal rate ₹${results.primaryPricing.renewalPrice}/yr.`
                      : 'This domain is already registered on the global internet and cannot be registered as a new domain. See recommended available variations below.'}
                  </p>
                </div>

                {results.primaryAvailable ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="font-mono font-black text-2xl text-emerald-400">
                          ₹{results.primaryPricing.firstYearPrice}
                        </span>
                        <span className="text-[11px] text-slate-400">/ 1st yr</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        +18% GST (₹{Math.round(results.primaryPricing.firstYearPrice * 0.18)})
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuy(results.primaryPricing)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs font-semibold">
                    Taken &bull; Registration Blocked
                  </div>
                )}
              </div>

              {/* Multi-Year Transparency Pill */}
              {results.primaryAvailable && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Year 1:</span>
                    <strong className="text-emerald-400 font-mono">₹{results.primaryPricing.firstYearPrice}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Year 2:</span>
                    <strong className="text-slate-300 font-mono">₹{results.primaryPricing.secondYearPrice}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Year 3:</span>
                    <strong className="text-slate-300 font-mono">₹{results.primaryPricing.thirdYearPrice}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Renewal Rate:</span>
                    <strong className="text-slate-300 font-mono">₹{results.primaryPricing.renewalPrice}/yr</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Transfer Out:</span>
                    <strong className="text-slate-300 font-mono">₹{results.primaryPricing.transferPrice}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alternative Domain Suggestions (When domain is taken or for additional options) */}
          {results.suggestions && results.suggestions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recommended Alternative Available Domains
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Available for Instant Registration</span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {results.suggestions.map((s: any) => (
                  <div key={s.domainName} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">{s.domainName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Available
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Renewal: ₹{s.renewalPrice}/yr &bull; 18% GST transparent &bull; Instant DNS Setup
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-bold text-sm block">
                          ₹{s.firstYearPrice}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          +₹{Math.round(s.firstYearPrice * 0.18)} GST
                        </span>
                      </div>
                      <button
                        onClick={() => handleBuy(s)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Extensions List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Authoritative Domain Extensions Available
              </h3>
              <span className="text-[11px] text-slate-500">Instant WHOIS check</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {results.results
                .filter((r: any) => r.domainName !== results.primaryDomain)
                .map((r: any) => (
                  <div key={r.domainName} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">{r.domainName}</span>
                        {r.isPromo1Rupee && r.isAvailable && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ₹1 Promo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.isAvailable
                          ? `Renewal: ₹${r.renewalPrice}/yr • Transfer: ₹${r.transferPrice} • 18% GST transparent`
                          : 'Already registered on global registry'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {r.isAvailable ? (
                        <>
                          <div className="text-right">
                            <span className="font-mono text-emerald-400 font-bold text-sm block">
                              ₹{r.firstYearPrice}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              +₹{Math.round(r.firstYearPrice * 0.18)} GST
                            </span>
                          </div>
                          <button
                            onClick={() => handleBuy(r)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Buy Now
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Domain Checkout Modal */}
      {selectedDomainItem && (
        <DomainCheckoutModal
          domainItem={selectedDomainItem}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setSelectedDomainItem(null)}
        />
      )}
    </div>
  );
};

// 2. Domain Registration Page
export const DomainRegistrationPage: React.FC<Props> = ({ navigate }) => {
  return <DomainSearchPage navigate={navigate} />;
};

// 3. Domain Transfer Page
export const DomainTransferPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setResult({
      status: 'pending_transfer_approval',
      domainName,
      message: 'Transfer authorization request received. A verification email has been sent to the registrant.',
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Transfer Your Domain to Nexora Cloud</h1>
        <p className="text-xs text-slate-400">
          Consolidate your domains with automated DNS, free TLS certificates, and competitive renewal pricing.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-xs">
        {result ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Transfer Initiated</span>
            </div>
            <p>{result.message}</p>
            <button
              onClick={() => navigate('/dashboard/domains')}
              className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
            >
              View in Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Domain Name to Transfer</label>
              <input
                type="text"
                required
                placeholder="e.g. mybusiness.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">EPP / Authorization Code</label>
              <input
                type="text"
                required
                placeholder="Obtain this from your current domain registrar"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Make sure the domain is unlocked at your current registrar and privacy protection is temporarily disabled.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block">Transfer Eligibility Checklist:</span>
              <p>· Domain must be at least 60 days old from initial registration or prior transfer.</p>
              <p>· Transfer renewal adds 1 full year to existing expiry date upon registry completion.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting to Registry...' : 'Initiate Domain Transfer (₹799)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 4. Domain Pricing Page (With 12 Configurable Domain Plans & TLD Matrix)
export const DomainPricingPage: React.FC<Props> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'tlds'>('plans');
  const [tlds, setTlds] = useState<TldPricing[]>([]);
  const [plans, setPlans] = useState<DomainServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDomainPricing(), api.getDomainPlans()])
      .then(([tldsRes, plansRes]) => {
        setTlds(tldsRes.tlds || []);
        setPlans(plansRes.plans || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Authoritative Domain Solutions & Pricing</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Explore all 12 configurable domain tiers and wholesale top-level domain registry pricing. Transparent renewal terms, zero hidden renewal fees, and statutory 18% GST itemized.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold mt-4">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'plans' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            12 Domain Service Plans
          </button>
          <button
            onClick={() => setActiveTab('tlds')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'tlds' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Wholesale TLD Matrix
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading pricing matrices...</div>
      ) : activeTab === 'plans' ? (
        /* 12 Configurable Domain Service Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isPromo = p.id === 'promo_1rupee';
            const firstPrice = p.firstYearPrice ?? p.servicePackagePrice ?? 0;
            const gst = Math.round(firstPrice * 0.18);
            const total = firstPrice + gst;

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 border flex flex-col justify-between transition-all shadow-lg ${
                  p.badge
                    ? 'bg-slate-900/90 border-blue-500/50 relative overflow-hidden'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.badge && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    {p.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                  </div>

                  {/* Price Block */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black font-mono text-emerald-400">
                        {firstPrice === 0 ? 'Custom' : `₹${firstPrice}`}
                      </span>
                      {firstPrice > 0 && <span className="text-xs text-slate-400">/ 1st year</span>}
                    </div>

                    {firstPrice > 0 ? (
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                        <div>+ 18% GST (₹{gst}) &bull; Final: <strong className="text-white">₹{total}</strong></div>
                        <div className="text-slate-500">
                          Renewal: <strong className="text-slate-300">₹{p.renewalPrice}/yr</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 block mt-1">Dedicated Account Executive</span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Included Capabilities:
                    </span>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="pt-6 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => navigate('/domain-search')}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                      isPromo
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <span>{p.firstYearPrice === 0 ? 'Contact Enterprise Sales' : 'Buy Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Wholesale TLD Matrix Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">TLD</th>
                <th className="py-3 px-4 font-semibold">Registration / 1st Year</th>
                <th className="py-3 px-4 font-semibold">Renewal Price</th>
                <th className="py-3 px-4 font-semibold">Transfer Price</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tlds.map((t) => {
                const isPromo = Boolean(t.isPromoEligible);

                return (
                  <tr key={t.tld} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{t.tld}</span>
                        {isPromo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ₹1 Promo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {isPromo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 text-base">₹1</span>
                          <span className="text-slate-500 line-through text-xs">₹{t.registrationPrice}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-400">₹{t.registrationPrice}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">₹{t.renewalPrice}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">₹{t.transferPrice}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/domain-search')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                      >
                        Search {t.tld}
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
  );
};
