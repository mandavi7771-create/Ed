import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HostingPlan } from '../../types';
import { Sliders, Edit3, CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminPlansPage: React.FC<Props> = ({ navigate }) => {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<HostingPlan | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [renewalPrice, setRenewalPrice] = useState<number>(0);
  const [storageGB, setStorageGB] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPromotional, setIsPromotional] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = () => {
    api.getPlans().then((res) => setPlans(res.plans || [])).catch(console.error);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenEdit = (plan: HostingPlan) => {
    setEditingPlan(plan);
    setPrice(plan.price);
    setRenewalPrice(plan.renewalPrice);
    setStorageGB(plan.storageGB);
    setIsActive(plan.isActive);
    setIsPromotional(plan.isPromotional);
    setError(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setError(null);

    // Enforce prompt non-negotiable instruction:
    if (price === 49) {
      setError('The ₹49 plan is prohibited by system specifications and cannot be configured.');
      return;
    }

    try {
      await api.updateHostingPlan(editingPlan.id, {
        price,
        renewalPrice,
        storageGB,
        isActive,
        isPromotional,
      });
      setMessage(`Hosting plan "${editingPlan.name}" updated successfully.`);
      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Error updating plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hosting Plan Architecture (11 Plans)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure active cloud packages, promotional allocations (including the ₹1/year offer), renewal price schedules, and storage limits.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-amber-400 font-mono">
          ₹49 Decommissioned · ₹1 Promo Maintained
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plans Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Plan Name</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">1st Year Price</th>
                <th className="py-3 px-4 font-semibold">Renewal Price</th>
                <th className="py-3 px-4 font-semibold">Storage</th>
                <th className="py-3 px-4 font-semibold">Bandwidth</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{p.name}</p>
                    {p.isPromotional && (
                      <span className="text-[10px] text-amber-400 font-semibold">
                        Promotional Offer (Remaining: {p.quotaRemaining || 'Unlimited'})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-400 capitalize">{p.category}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    ₹{p.price} <span className="text-slate-500 font-normal">/ {p.validity}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    ₹{p.renewalPrice} <span className="text-slate-500 font-normal">/ yr</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {p.storageGB} GB NVMe
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {p.bandwidthGB === -1 ? 'Unmetered' : `${p.bandwidthGB} GB`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-[11px] font-medium flex items-center gap-1 ml-auto"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleSavePlan}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Edit Plan: {editingPlan.name}</span>
              <button type="button" onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Price (₹ / 1 Year)</label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Renewal Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={renewalPrice}
                  onChange={(e) => setRenewalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Storage Quota (GB NVMe)</label>
              <input
                type="number"
                min="1"
                value={storageGB}
                onChange={(e) => setStorageGB(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <span>Active & Visible to Customers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPromotional}
                  onChange={(e) => setIsPromotional(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <span>Mark as Promotional Offer</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
