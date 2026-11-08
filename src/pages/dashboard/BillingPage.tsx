import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Order, PaymentTransaction } from '../../types';
import { CreditCard, FileText, CheckCircle2, Clock, Download, ArrowUpRight, ShieldCheck, X } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const BillingPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        api.getMyOrders(user.id),
        api.getMyPayments(user.id),
      ])
        .then(([oRes, pRes]) => {
          setOrders(oRes.orders || []);
          setPayments(pRes.payments || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleViewInvoice = async (orderId: string) => {
    try {
      const inv = await api.getInvoice(orderId);
      setActiveInvoice(inv);
    } catch (err: any) {
      alert(`Invoice error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Billing & Tax Invoices</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your order history, GST-compliant tax invoices, payment transaction IDs, and renewal receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Order History</h2>
            <span className="text-xs text-slate-400">{orders.length} total orders</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No order records found.</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{o.itemTitle}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            o.paymentStatus === 'successful'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                              : 'bg-amber-950 text-amber-400 border border-amber-900'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{o.id} · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-white block">₹{o.totalAmount}</span>
                      <span className="text-[10px] text-slate-500">Incl. 18% GST</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-slate-500 text-[11px]">Subtotal: ₹{o.subtotal} + GST: ₹{o.taxAmount}</span>
                    <button
                      onClick={() => handleViewInvoice(o.id)}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-[11px]"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Tax Invoice</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Payment Transactions</h2>
            <span className="text-xs text-slate-400">{payments.length} verified receipts</span>
          </div>

          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No payment records found.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">{p.methodDetails || p.method}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Gateway Tx: {p.gatewayPaymentId}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-emerald-400 text-sm">₹{p.amount}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-500">
                    <span>Order: {p.orderId}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">TAX INVOICE</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{activeInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setActiveInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Issuer & Bill To */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Billed By:</span>
                <p className="font-bold text-white mt-1">{activeInvoice.issuer.name}</p>
                <p className="text-slate-400">{activeInvoice.issuer.address}</p>
                <p className="text-blue-400 font-mono mt-1">GSTIN: {activeInvoice.issuer.gstin}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Billed To:</span>
                <p className="font-bold text-white mt-1">{activeInvoice.customer?.fullName}</p>
                <p className="text-slate-400">{activeInvoice.customer?.companyName}</p>
                <p className="text-slate-400">{activeInvoice.customer?.address}, {activeInvoice.customer?.city}</p>
                <p className="text-slate-400">{activeInvoice.customer?.country} - {activeInvoice.customer?.postalCode}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 w-28 text-right">Taxable Value</th>
                    <th className="p-3 w-28 text-right">GST (18%)</th>
                    <th className="p-3 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="p-3 font-sans text-slate-200">{activeInvoice.order.itemTitle}</td>
                    <td className="p-3 text-right text-slate-300">₹{activeInvoice.order.subtotal}</td>
                    <td className="p-3 text-right text-slate-300">₹{activeInvoice.order.taxAmount}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">₹{activeInvoice.order.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Payment Status:</span>
                <span className="font-semibold text-emerald-400">Paid in Full via {activeInvoice.payment?.method || 'Gateway'}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
