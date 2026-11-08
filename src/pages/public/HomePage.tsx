import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PaymentModal } from '../../components/checkout/PaymentModal';
import { DomainCheckoutModal } from '../../components/domain/DomainCheckoutModal';
import {
  Search,
  Server,
  Globe,
  UploadCloud,
  ShieldCheck,
  Check,
  ArrowRight,
  Zap,
  HardDrive,
  Cpu,
  Lock,
  ChevronRight,
  Sparkles,
  Tag,
} from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [domainQuery, setDomainQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [domainResults, setDomainResults] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [promoOffer, setPromoOffer] = useState<any | null>(null);
  const [selectedDomainForCheckout, setSelectedDomainForCheckout] = useState<any | null>(null);

  // Quick Purchase Checkout State (for hosting)
  const [checkoutModal, setCheckoutModal] = useState<{
    order: any;
    gatewayOrderId: string;
    upiUri: string;
  } | null>(null);

  useEffect(() => {
    api.getPromoDomainOffer()
      .then((res) => {
        if (res.isActive) setPromoOffer(res.offer);
      })
      .catch(console.error);
  }, []);

  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await api.checkDomain(domainQuery.trim());
      setDomainResults(res);
    } catch (err: any) {
      setSearchError(err.message || 'Error checking domain availability');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickBuyPlan = async (plan: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const orderRes = await api.createOrder({
        customerId: user.id,
        type: 'hosting',
        itemId: plan.id,
        itemTitle: `${plan.name} (1 Year NVMe Hosting)`,
        subtotal: plan.price,
      });

      setCheckoutModal({
        order: orderRes.order,
        gatewayOrderId: orderRes.gatewayOrderId,
        upiUri: orderRes.upiUri,
      });
    } catch (err: any) {
      alert(`Order error: ${err.message}`);
    }
  };

  const handleQuickBuyDomain = (item: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedDomainForCheckout(item);
  };

  const handlePaymentSuccess = async (payment: any, order: any) => {
    if (!user) return;
    // Automatically trigger provisioning on backend
    if (order.type === 'hosting') {
      await api.purchaseHosting({
        customerId: user.id,
        planId: order.itemId,
        domainName: `${user.id.toLowerCase()}-app.nexoracloud.net`,
        paymentId: payment.id,
      }).catch(console.error);
      setCheckoutModal(null);
      navigate('/dashboard/deploy');
    } else {
      await api.purchaseDomain({
        customerId: user.id,
        domainName: order.itemId,
        periodYears: 1,
        registrationPrice: order.subtotal,
        renewalPrice: order.subtotal + 150,
        paymentId: payment.id,
        registrantDetails: {
          firstName: user.fullName.split(' ')[0],
          lastName: user.fullName.split(' ')[1] || 'Customer',
          email: user.email,
          mobile: user.mobile,
          address: user.address || 'MG Road',
          city: user.city || 'Bengaluru',
          state: user.state || 'Karnataka',
          postalCode: user.postalCode || '560001',
          country: user.country || 'India',
        },
      }).catch(console.error);
      setCheckoutModal(null);
      navigate('/dashboard/domains');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Promotional Banner */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-full text-xs text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Limited Promotional Offer: 1-Year Cloud Hosting at just ₹1</span>
            <button
              onClick={() => navigate('/hosting-pricing')}
              className="font-semibold text-white underline hover:text-blue-200 ml-1"
            >
              Claim Plan
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            High-Performance Cloud Hosting & Direct Domain Registry
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Bring your own website. Upload your existing files as a ZIP archive, configure your document root, and launch in seconds with free SSL, custom DNS, and unmetered bandwidth.
          </p>

          {/* Real Domain Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form onSubmit={handleDomainSearch} className="relative">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl focus-within:border-blue-500 transition-colors gap-2">
                <div className="flex items-center flex-1 px-3 gap-2">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your brand, company, or dream domain name..."
                    value={domainQuery}
                    onChange={(e) => setDomainQuery(e.target.value)}
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isSearching ? (
                    <span>Querying Registries...</span>
                  ) : (
                    <>
                      <span>Check Availability</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Extension Tickers */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
              {promoOffer ? (
                <>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">.com</span>
                    <strong className="text-emerald-400 font-mono">₹1</strong>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Promo</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">.in</span>
                    <strong className="text-emerald-400 font-mono">₹1</strong>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Promo</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">.online</span>
                    <strong className="text-emerald-400 font-mono">₹1</strong>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Promo</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">.store</span>
                    <strong className="text-emerald-400 font-mono">₹1</strong>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Promo</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">.net</span>
                    <strong className="text-white font-mono">₹949</strong>
                  </span>
                </>
              ) : (
                <>
                  <span>.com <strong className="text-white">₹849</strong></span>
                  <span className="text-slate-600">·</span>
                  <span>.in <strong className="text-white">₹499</strong></span>
                  <span className="text-slate-600">·</span>
                  <span>.net <strong className="text-white">₹949</strong></span>
                  <span className="text-slate-600">·</span>
                  <span>.online <strong className="text-white">₹199</strong></span>
                  <span className="text-slate-600">·</span>
                  <span>.store <strong className="text-white">₹249</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Search Results Modal / Card */}
        {domainResults && (
          <div className="mt-8 max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-400">Search Results for:</span>
                <h3 className="text-lg font-bold text-white font-mono">{domainResults.primaryDomain}</h3>
              </div>
              <button
                onClick={() => setDomainResults(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Primary Result Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                domainResults.primaryAvailable
                  ? domainResults.primaryPricing?.isPromo1Rupee
                    ? 'bg-amber-950/20 border-amber-600/50'
                    : 'bg-emerald-950/40 border-emerald-800/80'
                  : 'bg-rose-950/30 border-rose-900/60'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{domainResults.primaryDomain}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      domainResults.primaryAvailable
                        ? domainResults.primaryPricing?.isPromo1Rupee
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-900 text-emerald-200'
                        : 'bg-rose-900 text-rose-200'
                    }`}
                  >
                    {domainResults.primaryAvailable
                      ? domainResults.primaryPricing?.isPromo1Rupee
                        ? 'Available (₹1 Promo)'
                        : 'Available'
                      : 'Unavailable (Taken)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {domainResults.primaryAvailable
                    ? domainResults.primaryPricing?.isPromo1Rupee
                      ? `Eligible for ₹1 promotional registration. Standard renewal at ₹${domainResults.primaryPricing.renewalPrice}/yr.`
                      : `Official registry verification confirmed. Ready for immediate registration. Renewal at ₹${domainResults.primaryPricing?.renewalPrice || 999}/yr.`
                    : 'This domain name is already registered on the global internet.'}
                </p>
              </div>

              {domainResults.primaryAvailable && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-lg block">
                      ₹{domainResults.primaryPricing?.firstYearPrice || 849}
                    </span>
                    <span className="text-[10px] text-slate-500">1st Year + 18% GST</span>
                  </div>
                  <button
                    onClick={() => handleQuickBuyDomain(domainResults.primaryPricing || { domainName: domainResults.primaryDomain, registrationPrice: 849, renewalPrice: 999 })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    Register Now
                  </button>
                </div>
              )}
            </div>

            {/* Other Extensions Available */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Other Available Extensions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {domainResults.results
                  .filter((r: any) => r.domainName !== domainResults.primaryDomain && r.isAvailable)
                  .slice(0, 6)
                  .map((r: any) => (
                    <div
                      key={r.domainName}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{r.domainName}</span>
                          {r.isPromo1Rupee && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                              ₹1 Promo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">Renews at ₹{r.renewalPrice}/yr</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-semibold">₹{r.firstYearPrice || r.registrationPrice}</span>
                        <button
                          onClick={() => handleQuickBuyDomain(r)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Featured Hosting Plans Section (Highlighting ₹1 Promo, ₹499 Basic, ₹899 Business, ₹1,000 Professional) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Predictable Cloud Hosting Plans
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Guaranteed NVMe compute quotas, isolated RAM containers, and automated website ZIP deployments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Special Offer ₹1 Plan */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500 flex flex-col justify-between relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Special Offer
            </div>
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-white">Special Promotional</h3>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">1 Year Validity</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Promotional 1-year hosting package for startups and new creators.</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white font-mono">₹1</span>
                <span className="text-slate-400 text-xs"> / 1st Year</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Renews at ₹499/yr · 18% GST itemized</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-6 border-t border-slate-800 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 1 Website Hosted</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 10 GB NVMe Storage</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Unmetered Bandwidth</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Free SSL Certificate</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Instant ZIP Deployment</li>
              </ul>
            </div>
            <button
              onClick={() => handleQuickBuyPlan({ id: 'plan-special', name: 'Special Offer', price: 1 })}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md shadow-blue-600/30"
            >
              Claim ₹1 Offer
            </button>
          </div>

          {/* 2. Basic Hosting ₹499 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-white">Basic Hosting</h3>
                <span className="text-[10px] text-slate-500 font-mono">Personal</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Essential hosting for blogs, personal portfolios, and single projects.</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white font-mono">₹499</span>
                <span className="text-slate-400 text-xs"> / Year</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Renews at ₹599/yr</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-6 border-t border-slate-800 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 1 Website</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 25 GB NVMe Storage</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100 GB Bandwidth</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Free Let's Encrypt SSL</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Web File Manager</li>
              </ul>
            </div>
            <button
              onClick={() => handleQuickBuyPlan({ id: 'plan-basic', name: 'Basic Hosting', price: 499 })}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Choose Basic
            </button>
          </div>

          {/* 3. Business Hosting ₹899 */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 flex flex-col justify-between relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-white">Business Hosting</h3>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">High Traffic</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Engineered for e-commerce, commercial portfolios, and growing traffic.</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white font-mono">₹899</span>
                <span className="text-slate-400 text-xs"> / Year</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Renews at ₹1,199/yr</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-6 border-t border-slate-800 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 50 Websites</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 150 GB Ultra NVMe</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Free Domain Included</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 4 CPU Cores & 6 GB RAM</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Daily Automated Backups</li>
              </ul>
            </div>
            <button
              onClick={() => handleQuickBuyPlan({ id: 'plan-business', name: 'Business Hosting', price: 899 })}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md shadow-emerald-600/30"
            >
              Choose Business
            </button>
          </div>

          {/* 4. Professional Hosting ₹1,000 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-white">Professional</h3>
                <span className="text-[10px] text-slate-500 font-mono">Dedicated Power</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Dedicated cloud compute for agencies, client portals, and intensive web applications.</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white font-mono">₹1,000</span>
                <span className="text-slate-400 text-xs"> / Year</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Renews at ₹1,499/yr</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-6 border-t border-slate-800 pt-4">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100 Websites</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 200 GB NVMe Storage</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Dedicated IP Option</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Free Domain & SSL</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 24/7 Priority Hotline</li>
              </ul>
            </div>
            <button
              onClick={() => handleQuickBuyPlan({ id: 'plan-professional', name: 'Professional Hosting', price: 1000 })}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Choose Professional
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/hosting-pricing')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5"
          >
            <span>View all 11 hosting tiers (Including Enterprise ₹10k - ₹40k)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Website ZIP Deployment Workflow Step Strip (Part 7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <UploadCloud className="w-4 h-4" />
              <span>Direct Customer File Publishing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Already have your website files? Deploy instantly.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              No complicated control panels or AI templates. Simply upload your ZIP file, and our platform validates, extracts, inspects your document root, and deploys it live on high-speed NVMe storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="font-mono text-xs font-bold text-blue-400">01. Compress</span>
              <h4 className="text-sm font-semibold text-white">ZIP Your Website</h4>
              <p className="text-xs text-slate-400">Export your HTML/CSS/JS or production build as a standard .zip archive.</p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="font-mono text-xs font-bold text-blue-400">02. Upload & Validate</span>
              <h4 className="text-sm font-semibold text-white">Automated Inspection</h4>
              <p className="text-xs text-slate-400">Our engine scans for path traversal threats, enforces quotas, and verifies file integrity.</p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="font-mono text-xs font-bold text-blue-400">03. Safe Extraction</span>
              <h4 className="text-sm font-semibold text-white">Document Root Setup</h4>
              <p className="text-xs text-slate-400">Files extract into your isolated /public_html container with zero system leakage.</p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="font-mono text-xs font-bold text-emerald-400">04. Live Verification</span>
              <h4 className="text-sm font-semibold text-white">SSL & Health Check</h4>
              <p className="text-xs text-slate-400">Auto-issues Let's Encrypt TLS 1.3 certificate, runs HTTP/200 probe, and serves your site live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal for Hosting */}
      {checkoutModal && (
        <PaymentModal
          order={checkoutModal.order}
          gatewayOrderId={checkoutModal.gatewayOrderId}
          upiUri={checkoutModal.upiUri}
          onSuccess={handlePaymentSuccess}
          onClose={() => setCheckoutModal(null)}
        />
      )}

      {/* Domain Checkout Modal */}
      {selectedDomainForCheckout && (
        <DomainCheckoutModal
          domainItem={selectedDomainForCheckout}
          onSuccess={() => {
            setSelectedDomainForCheckout(null);
            navigate('/dashboard/domains');
          }}
          onClose={() => setSelectedDomainForCheckout(null)}
        />
      )}
    </div>
  );
};
