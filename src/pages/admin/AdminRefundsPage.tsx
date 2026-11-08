import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PaymentTransaction } from '../../types';
import { RotateCcw, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminRefundsPage: React.FC<Props> = ({ navigate }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminPayments().then((res) => {
      const all = res.payments || [];
      setPayments(all.filter((p: any) => p.status === 'refunded' || p.refundedAmount));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Gateway Refund Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">
          Authorized refunds processed through payment gateway APIs with reason codes and compliance references.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Refunded Amount</th>
                <th className="py-3 px-4 font-semibold">Gateway Refund Reference</th>
                <th className="py-3 px-4 font-semibold">Recorded Reason</th>
                <th className="py-3 px-4 font-semibold text-right">Refund Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading refunds...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No refunds have been processed yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{p.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{p.orderId}</td>
                    <td className="py-3 px-4 text-slate-300">{p.customerEmail}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      ₹{p.refundedAmount || p.amount}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{p.refundTxId || 'RFND-DIRECT'}</td>
                    <td className="py-3 px-4 text-slate-200">{p.refundReason || 'Customer requested'}</td>
                    <td className="py-3 px-4 text-slate-500 text-right">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
