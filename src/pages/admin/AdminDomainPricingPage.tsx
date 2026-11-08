import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TldPricing } from '../../types';
import { DollarSign, Edit3, CheckCircle2, X } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminDomainPricingPage: React.FC<Props> = ({ navigate }) => {
  const [tlds, setTlds] = useState<TldPricing[]>([]);
  const [editingTld, setEditingTld] = useState<TldPricing | null>(null);
  const [regPrice, setRegPrice] = useState(0);
  const [renPrice, setRenPrice] = useState(0);
  const [trPrice, setTrPrice] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadTlds = () => {
    api.getDomainPricing().then((res) => setTlds(res.tlds || [])).catch(console.error);
  };

  useEffect(() => {
    loadTlds();
  }, []);

  const handleOpenEdit = (t: TldPricing) => {
    setEditingTld(t);
    setRegPrice(t.registrationPrice);
    setRenPrice(t.renewalPrice);
    setTrPrice(t.transferPrice);
    setIsSupported(t.isSupported);
  };

  const handleSaveTld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTld) return;
    try {
      await api.updateTldPricing(editingTld.tld, {
        registrationPrice: regPrice,
        renewalPrice: renPrice,
        transferPrice: trPrice,
        isSupported,
      });
      setMessage(`TLD pricing for ${editingTld.tld} updated successfully.`);
      setEditingTld(null);
      loadTlds();
    } catch (err: any) {
      alert(`Error updating TLD: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Domain Registry & TLD Pricing Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure wholesale registrar costs, retail margins, renewal rates, and enabled extensions.
          </p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Extension</th>
                <th className="py-3 px-4 font-semibold">Registrar Cost</th>
                <th className="py-3 px-4 font-semibold">Retail Price</th>
                <th className="py-3 px-4 font-semibold">Renewal Price</th>
                <th className="py-3 px-4 font-semibold">Transfer Price</th>
                <th className="py-3 px-4 font-semibold">Est. Margin</th>
                <th className="py-3 px-4 font-semibold">Supported</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tlds.map((t) => (
                <tr key={t.tld} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-white text-sm">{t.tld}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">₹{t.registrarCost}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{t.registrationPrice}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">₹{t.renewalPrice}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">₹{t.transferPrice}</td>
                  <td className="py-3 px-4 font-mono text-blue-400">{t.marginPercent}%</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.isSupported ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.isSupported ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-[11px] font-medium"
                    >
                      Edit Pricing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit TLD Modal */}
      {editingTld && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleSaveTld}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Configure TLD: {editingTld.tld}</span>
              <button type="button" onClick={() => setEditingTld(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registration (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={regPrice}
                  onChange={(e) => setRegPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Renewal (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={renPrice}
                  onChange={(e) => setRenPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transfer (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={trPrice}
                  onChange={(e) => setTrPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isSupported}
                  onChange={(e) => setIsSupported(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <span>Support and Offer {editingTld.tld} to Customers</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTld(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg"
              >
                Save TLD Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
