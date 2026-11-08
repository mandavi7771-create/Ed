import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HostingPlan } from '../../types';
import { PaymentModal } from '../../components/checkout/PaymentModal';
import { Server, Check, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const HostingPricingPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [checkoutModal, setCheckoutModal] = useState<{
    order: any;
    gatewayOrderId: string;
    upiUri: string;
  } | null>(null);

  useEffect(() => {
    api.getPlans().then((res) => setPlans(res.plans || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleBuyPlan = async (plan: HostingPlan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const orderRes = await api.createOrder({
        customerId: user.id,
        type: 'hosting',
        itemId: plan.id,
        itemTitle: `${plan.name} (${plan.validity} NVMe Cloud)`,
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

  const handlePaymentSuccess = async (payment: any, order: any) => {
    if (!user) return;
    await api.purchaseHosting({
      customerId: user.id,
      planId: order.itemId,
      domainName: `${user.id.toLowerCase()}-app.nexoracloud.net`,
      paymentId: payment.id,
    }).catch(console.error);

    setCheckoutModal(null);
    navigate('/dashboard/deploy');
  };

  const filteredPlans = selectedCategory === 'all'
    ? plans
    : plans.filter((p) => p.category === selectedCategory || (selectedCategory === 'promotional' && p.isPromotional));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Authoritative Cloud Hosting Plans & Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Transparent pricing with zero hidden surcharges. All plans include 18% GST itemization, Let's Encrypt TLS 1.3, NVMe Gen4 arrays, and direct ZIP file deployment.
        </p>

        {/* Filter categories */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto text-xs">
          {[
            { id: 'all', label: 'All 11 Plans' },
            { id: 'promotional', label: '₹1 Special' },
            { id: 'shared', label: 'Shared / Basic' },
            { id: 'business', label: 'Business' },
            { id: 'enterprise', label: 'Enterprise (₹10k - ₹40k)' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-slate-900 border flex flex-col justify-between transition-all ${
                plan.isPromotional
                  ? 'border-blue-500 shadow-xl shadow-blue-950/40 relative'
                  : plan.price >= 30000
                  ? 'border-amber-500/80'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                    {plan.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{plan.description}</p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">₹{plan.price}</span>
                    <span className="text-slate-400 text-xs font-sans"> / {plan.validity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                    <span>Renewal Rate:</span>
                    <span className="font-mono text-slate-200">₹{plan.renewalPrice} / year</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">+ 18% GST itemized on invoice</p>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{plan.websitesAllowed === 999 ? 'Unlimited Websites' : `${plan.websitesAllowed} Website${plan.websitesAllowed > 1 ? 's' : ''}`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{plan.storageGB} GB NVMe Enterprise Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{plan.bandwidthGB === -1 ? 'Unmetered Bandwidth' : `${plan.bandwidthGB} GB Monthly Bandwidth`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{plan.cpuCores} CPU Cores · {(plan.ramMB / 1024).toFixed(0)} GB RAM Quota</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Free Let's Encrypt TLS 1.3 Certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>1-Click ZIP Website Extraction</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuyPlan(plan)}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                  plan.isPromotional
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <span>Purchase {plan.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {checkoutModal && (
        <PaymentModal
          order={checkoutModal.order}
          gatewayOrderId={checkoutModal.gatewayOrderId}
          upiUri={checkoutModal.upiUri}
          onSuccess={handlePaymentSuccess}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  );
};
