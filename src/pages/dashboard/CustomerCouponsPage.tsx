import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Coupon } from '../../types';
import { Tag, Copy, Check, Sparkles, Clock, AlertCircle, ArrowRight, ShieldCheck, Percent } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const CustomerCouponsPage: React.FC<Props> = ({ navigate }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.getCoupons();
      setCoupons(res.coupons || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activeCoupons = coupons.filter((c) => c.isActive);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Monthly Discount Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Exclusive Coupons</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automatic monthly 20% & 30% savings applied instantly at domain & hosting checkout.
          </p>
        </div>

        <button
          onClick={() => navigate('/domain-search')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-md"
        >
          <span>Use Coupon on Domain Search</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Monthly Promotion Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Guaranteed Monthly Savings</span>
          </div>
          <h3 className="text-lg font-bold text-white">Save Up to 30% OFF This Month</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Nexora Cloud automatically refreshes promotional discount codes at the start of each month. Applicable to domain registrations, cloud compute nodes, and hosting plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Next monthly coupon drop:</span>
          <span className="text-xs font-mono font-semibold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            1st of Next Month
          </span>
        </div>
      </div>

      {/* Active Coupons Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading coupons...</div>
      ) : activeCoupons.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          No active coupons available currently. Check back on the 1st of the month.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {activeCoupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            const anyC = coupon as any;
            const validDate = new Date(coupon.expiryDate || anyC.validUntil || Date.now()).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const services = coupon.eligibleServices || anyC.applicableServices || ['domain', 'hosting'];
            const minOrder = coupon.minOrderValue ?? anyC.minOrderAmount ?? 0;
            const stackable = coupon.allowCombineWithPromo1Rupee || anyC.stackableWithPromo;

            return (
              <div
                key={coupon.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 relative overflow-hidden transition-all shadow-lg flex flex-col justify-between"
              >
                {/* Decorative cutouts for ticket look */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-r border-slate-800" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-l border-slate-800" />

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                          {coupon.discountPercent}% OFF
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                          {services.join(', ')}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{coupon.description}</h4>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Percent className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Coupon Code Block */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-dashed border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Coupon Code</span>
                      <span className="text-lg font-mono font-extrabold text-blue-400 tracking-wider">
                        {coupon.code}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Conditions & Details */}
                  <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Valid Until:</span>
                      </span>
                      <span className="font-semibold text-slate-300">{validDate}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Minimum Order Amount:</span>
                      <span className="font-semibold text-slate-300">
                        {minOrder > 0 ? `₹${minOrder}` : 'No Minimum'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>₹1 Domain Offer Compatibility:</span>
                      <span className="text-slate-300">
                        {stackable ? 'Allowed' : 'Base Rate Only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 mt-2">
                  <button
                    onClick={() => {
                      copyToClipboard(coupon.code);
                      navigate('/domain-search');
                    }}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-blue-500/30 flex items-center justify-center gap-1.5"
                  >
                    <span>Apply at Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rules & Policy Note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Coupon Policy & Fair Usage</span>
        </div>
        <p>
          • Promotional coupons are limited to 1 redemption per customer per order.
          • Coupons automatically apply before statutory GST (18%).
          • System automatically refreshes coupon rotation on the 1st day of every month at 00:00 UTC.
        </p>
      </div>
    </div>
  );
};
