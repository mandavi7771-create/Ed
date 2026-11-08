import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { ShoppingCart, Search, FileText } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminOrdersPage: React.FC<Props> = ({ navigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminOrders().then((res) => setOrders(res.orders || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.itemTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Order Lifecycle & Reconciliations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative order pipeline, payment status verification, and automated provisioning timelines.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Product Title</th>
                <th className="py-3 px-4 font-semibold">Taxable</th>
                <th className="py-3 px-4 font-semibold">GST (18%)</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">No orders found.</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{o.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{o.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{o.customerId}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{o.itemTitle}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">₹{o.subtotal}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">₹{o.taxAmount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{o.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'successful'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-amber-950 text-amber-400 border border-amber-900'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-300">{o.serviceStatus}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
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
