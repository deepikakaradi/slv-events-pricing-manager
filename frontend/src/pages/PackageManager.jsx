import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';

export default function PackageManager() {
  const { packages, events, services, apiFetch, fetchPackages } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [eventId, setEventId] = useState('');
  const [tier, setTier] = useState('Silver');
  const [basePrice, setBasePrice] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Pricing Rules Slabs
  const [rules, setRules] = useState([
    { guest_min: 0, guest_max: 75, price_multiplier: 0.8, description: 'Small Gathering (<75 guests)' },
    { guest_min: 76, guest_max: 150, price_multiplier: 1.0, description: 'Standard Size (76-150 guests)' },
    { guest_min: 151, guest_max: 300, price_multiplier: 1.4, description: 'Large Gathering (151-300 guests)' },
    { guest_min: 301, guest_max: 9999, price_multiplier: 2.0, description: 'Grand Gala (300+ guests)' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto set package name when changing event and tier
  useEffect(() => {
    if (!editMode && eventId) {
      const selectedEventObj = events.find(e => e.id === parseInt(eventId));
      if (selectedEventObj) {
        setName(`${selectedEventObj.name} ${tier} Package`);
      }
    }
  }, [eventId, tier, events, editMode]);

  const handleServiceToggle = (svcId) => {
    if (selectedServices.includes(svcId)) {
      setSelectedServices(selectedServices.filter(id => id !== svcId));
    } else {
      setSelectedServices([...selectedServices, svcId]);
    }
  };

  const handleRuleMultiplierChange = (index, value) => {
    const updated = [...rules];
    updated[index].price_multiplier = parseFloat(value) || 0;
    setRules(updated);
  };

  const handleEditClick = (pkg) => {
    setError('');
    setTargetId(pkg.id);
    setName(pkg.name);
    setEventId(pkg.event_id.toString());
    setTier(pkg.tier);
    setBasePrice(pkg.base_price.toString());
    setSelectedServices(pkg.services.map(s => s.id));
    if (pkg.pricing_rules && pkg.pricing_rules.length > 0) {
      // Map correctly to ensure standard slabs are loaded
      setRules(pkg.pricing_rules.map(r => ({
        guest_min: r.guest_min,
        guest_max: r.guest_max,
        price_multiplier: r.price_multiplier,
        description: r.description
      })));
    }
    setEditMode(true);
    setShowForm(true);
  };

  const handleDeleteClick = async (pkgId) => {
    if (!confirm('Are you sure you want to delete this event package?')) return;
    try {
      await apiFetch(`/packages/${pkgId}`, { method: 'DELETE' });
      fetchPackages();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCloneClick = async (pkgId) => {
    try {
      await apiFetch(`/packages/${pkgId}/clone`, { method: 'POST' });
      fetchPackages();
    } catch (err) {
      alert('Clone failed: ' + err.message);
    }
  };

  const handlePublishToggle = async (pkg) => {
    try {
      await apiFetch(`/packages/${pkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: pkg.name,
          base_price: pkg.base_price,
          is_published: pkg.is_published === 1 ? 0 : 1,
          services: pkg.services.map(s => s.id),
          pricing_rules: pkg.pricing_rules
        })
      });
      fetchPackages();
    } catch (err) {
      alert('Failed to toggle publish: ' + err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setEventId('');
    setTier('Silver');
    setBasePrice('');
    setSelectedServices([]);
    setRules([
      { guest_min: 0, guest_max: 75, price_multiplier: 0.8, description: 'Small Gathering (<75 guests)' },
      { guest_min: 76, guest_max: 150, price_multiplier: 1.0, description: 'Standard Size (76-150 guests)' },
      { guest_min: 151, guest_max: 300, price_multiplier: 1.4, description: 'Large Gathering (151-300 guests)' },
      { guest_min: 301, guest_max: 9999, price_multiplier: 2.0, description: 'Grand Gala (300+ guests)' }
    ]);
    setEditMode(false);
    setTargetId(null);
    setShowForm(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!eventId || !basePrice || selectedServices.length === 0) {
      setError('Please select an event category, standard services, and provide base pricing.');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      event_id: parseInt(eventId),
      tier,
      base_price: parseFloat(basePrice),
      services: selectedServices,
      pricing_rules: rules
    };

    try {
      if (editMode) {
        await apiFetch(`/packages/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/packages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      fetchPackages();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save event package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Package Manager</h1>
          <p className="text-xs text-slate-400 mt-1">Configure baseline event bundles, connect standard catalogs, and set guest count slabs.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/10 hover:scale-[1.01] transition-transform"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Event Package</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 relative shadow-xl">
          <button onClick={resetForm} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>

          <h3 className="font-outfit font-bold text-lg mb-6">{editMode ? 'Edit Base Package' : 'Create Tiered Event Package'}</h3>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4.5 w-4.5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Event Category</label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                  required
                >
                  <option value="">Select Event...</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Package Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                  required
                >
                  <option value="Silver">Silver (Standard)</option>
                  <option value="Gold">Gold (Premium)</option>
                  <option value="Platinum">Platinum (Luxury/Royal)</option>
                </select>
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Base Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Package Name Display */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Autogenerated Package Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/40 text-sm font-semibold focus:outline-none"
                required
              />
            </div>

            {/* Standard Services Checklist */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 pl-1">Link Standard Catalog Services</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map(svc => {
                  const isChecked = selectedServices.includes(svc.id);
                  return (
                    <button
                      type="button"
                      key={svc.id}
                      onClick={() => handleServiceToggle(svc.id)}
                      className={`flex items-center space-x-3 p-3 rounded-xl text-left border transition-all ${
                        isChecked 
                          ? 'border-luxury-500 bg-luxury-500/10 text-luxury-500 dark:text-luxury-400' 
                          : 'border-slate-200 dark:border-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/30'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="h-4.5 w-4.5 flex-shrink-0" /> : <Square className="h-4.5 w-4.5 flex-shrink-0 text-slate-500" />}
                      <div className="leading-tight">
                        <div className="text-xs font-semibold">{svc.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">₹{svc.standard_price.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guest Slab pricing multiplier configurations */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 pl-1">Configure Guest Slab Multipliers</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rules.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-luxury-500">{rule.description}</span>
                    <div className="flex justify-between items-center space-x-2">
                      <span className="text-xs text-slate-400 font-mono">Multiplier:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={rule.price_multiplier}
                        onChange={(e) => handleRuleMultiplierChange(idx, e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900 text-xs font-mono text-center"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/10 hover:scale-[1.01] transition-transform"
              >
                {loading ? 'Saving package...' : 'Save Package'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages list dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isPublished = pkg.is_published === 1;
          return (
            <div key={pkg.id} className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl rounded-2xl border border-white/20 dark:border-slate-800/40 overflow-hidden shadow-sm flex flex-col justify-between">
              {/* Header color tier */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                pkg.tier === 'Platinum' ? 'from-luxury-400 via-luxury-500 to-luxury-600' :
                pkg.tier === 'Gold' ? 'from-amber-400 to-amber-600' :
                'from-slate-400 to-slate-500'
              }`} />

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-outfit font-extrabold text-lg text-slate-800 dark:text-white leading-tight">{pkg.name}</h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-400 uppercase font-mono font-bold tracking-wider mt-1 inline-block">
                      {pkg.event_name}
                    </span>
                  </div>
                  <button 
                    onClick={() => handlePublishToggle(pkg)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isPublished 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </button>
                </div>

                {/* Base price & service counts */}
                <div className="flex justify-between items-baseline font-mono text-sm">
                  <span className="text-slate-400 text-xs">Base price:</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-white">₹{pkg.base_price.toLocaleString()}</span>
                </div>

                {/* Services list snippet */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Bundled Services ({pkg.services ? pkg.services.length : 0})</h4>
                  <div className="flex flex-wrap gap-1">
                    {pkg.services && pkg.services.slice(0, 4).map((s) => (
                      <span key={s.id} className="px-2 py-0.5 text-[9px] font-medium rounded-md bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200/50 dark:border-slate-800/20">
                        {s.name}
                      </span>
                    ))}
                    {pkg.services && pkg.services.length > 4 && (
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-luxury-500/10 text-luxury-500">
                        +{pkg.services.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing rules slab info */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Pricing Multipliers</h4>
                  <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono text-center">
                    {pkg.pricing_rules && pkg.pricing_rules.slice(0, 4).map((rule) => (
                      <div key={rule.id} className="p-1 rounded bg-slate-100/50 dark:bg-slate-900/60 text-slate-400 leading-tight">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{rule.price_multiplier}x</div>
                        <span>&lt;{rule.guest_max === 9999 ? '500+' : rule.guest_max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-100/50 dark:bg-slate-950/40 border-t border-slate-200/40 dark:border-slate-800/10 flex justify-between">
                <button
                  onClick={() => handleCloneClick(pkg.id)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-luxury-500 transition-colors"
                  title="Clone package structure"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Clone</span>
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditClick(pkg)}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(pkg.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-rose-500/80 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
