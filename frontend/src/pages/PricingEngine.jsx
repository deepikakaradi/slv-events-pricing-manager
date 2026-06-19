import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { Sliders, Plus, DollarSign, Tag, Info, AlertTriangle } from 'lucide-react';

export default function PricingEngine() {
  const { services, apiFetch, fetchServices } = useApp();
  const [showAddSvc, setShowAddSvc] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Catering');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setLoading(true);

    try {
      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category,
          standard_price: parseFloat(price),
          description: desc
        })
      });
      fetchServices();
      setName('');
      setPrice('');
      setDesc('');
      setShowAddSvc(false);
    } catch (err) {
      alert('Failed to save service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Pricing Engine & Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Manage global service pricing catalogs and review margin thresholds rules.</p>
        </div>
        {!showAddSvc && (
          <button
            onClick={() => setShowAddSvc(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Service to Catalog</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Catalog Services Table */}
        <div className="lg:col-span-2 space-y-6">
          {showAddSvc && (
            <form onSubmit={handleAddService} className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 space-y-4 shadow-md">
              <h3 className="font-outfit font-bold text-base">New Catalog Service</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Led Stage Wall"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none"
                  >
                    <option value="Catering">Catering</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Audio/Visual">Audio/Visual</option>
                    <option value="Photography">Photography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Management">Management</option>
                    <option value="Venue Support">Venue Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Standard Rate (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description / Spec Details</label>
                <input
                  type="text"
                  placeholder="Service description notes..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddSvc(false)} className="px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-850 text-slate-400">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white">Save Service</button>
              </div>
            </form>
          )}

          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl rounded-2xl border border-white/20 dark:border-slate-800/40 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30">
              <h3 className="font-outfit font-bold text-base">Standard Catalog Services</h3>
            </div>
            
            <table className="w-full text-left modern-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Standard Rate</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors">
                    <td>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{svc.name}</span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase">
                        {svc.category}
                      </span>
                    </td>
                    <td className="font-mono text-sm font-semibold text-slate-800 dark:text-white">
                      {formatCurrency(svc.standard_price)}
                    </td>
                    <td>
                      <span className="text-slate-400 text-xs truncate max-w-[200px] block">{svc.description || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Dynamic Slabs & Margin Info panel */}
        <div className="space-y-6">
          {/* Rules info */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-luxury-500">
              <Sliders className="h-5 w-5" />
              <h3 className="font-outfit font-bold text-base">Guest Slab Multipliers</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Standard pricing logic uses guest-count multipliers to scale baseline resource costs for large crowds. These are applied automatically in the quote engine:
            </p>
            <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/40 pt-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">&lt; 75 Guests:</span>
                <span className="font-bold text-emerald-500">0.8x (Discounts)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">76 - 150 Guests:</span>
                <span className="font-bold text-slate-300">1.0x (Standard)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">151 - 300 Guests:</span>
                <span className="font-bold text-luxury-500">1.4x (Large Crowd)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">300+ Guests:</span>
                <span className="font-bold text-luxury-400">2.0x (Grand Gala)</span>
              </div>
            </div>
            <div className="p-3 bg-slate-100/50 dark:bg-slate-900/60 rounded-xl flex items-start space-x-2 text-[10px] text-slate-400">
              <Info className="h-4.5 w-4.5 text-luxury-500 flex-shrink-0 mt-0.5" />
              <span>Multipliers scale the base package markup, reflecting additional logistical requirements, coordinator timings, and venue risks.</span>
            </div>
          </div>

          {/* Margin validation info */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-outfit font-bold text-base">Margin Validation rule</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              SLV Events maintains strict financial compliance guidelines:
            </p>
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <div className="text-xs font-bold text-rose-500">Minimum Net Margin: 15.00%</div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Quotations that offer custom discounts must not push package margins below this threshold. The pricing engine flags quotes that violate this constraint to prevent unprofitable sales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
