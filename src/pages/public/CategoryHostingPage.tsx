import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HostingPlan } from '../../types';
import { PaymentModal } from '../../components/checkout/PaymentModal';
import { Server, Check, ArrowRight, ShieldCheck, Cpu, HardDrive, Zap } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
  category: 'web' | 'shared' | 'business' | 'professional' | 'enterprise';
  title: string;
  subtitle: string;
}

export const CategoryHostingPage: React.FC<Props> = ({ navigate, category, title, subtitle }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutModal, setCheckoutModal] = useState<{
    order: any;
    gatewayOrderId: string;
    upiUri: string;
  } | null>(null);

  useEffect(() => {
    api.getPlans().then((res) => {
      const all = res.plans || [];
      if (category === 'web') {
        setPlans(all.slice(0, 4));
      } else if (category === 'shared') {
        setPlans(all.filter((p) => p.category === 'shared' || p.category === 'special'));
      } else if (category === 'business') {
        setPlans(all.filter((p) => p.category === 'business' || p.slug === 'business-hosting' || p.slug === 'pro-business'));
      } else if (category === 'professional') {
        setPlans(all.filter((p) => p.category === 'professional' || p.slug === 'professional-hosting' || p.slug === 'advanced-hosting'));
      } else if (category === 'enterprise') {
        setPlans(all.filter((p) => p.category === 'enterprise'));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [category]);

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
        itemTitle: `${plan.name} (${plan.validity})`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-blue-400">
          <Server className="w-3.5 h-3.5" />
          <span>Tier-3 Infrastructure · Dedicated NVMe Isolation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {plan.validity}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{plan.description}</p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">₹{plan.price}</span>
                    <span className="text-slate-400 text-xs font-sans"> / 1st Year</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Renews at ₹{plan.renewalPrice}/yr · GST itemized</p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleBuyPlan(plan)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <span>Select {plan.name}</span>
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
