import React, { useState } from 'react';
import { Sparkles, Save, Check } from 'lucide-react';

export default function Settings() {
  const [compName, setCompName] = useState('SLV Events Management');
  const [tax, setTax] = useState('18');
  const [emailTemplate, setEmailTemplate] = useState('Hi {{client_name}}, Please find attached your customized proposal quotation...');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl">
      <div>
        <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure company profiles, default tax systems, and communication templates.</p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 space-y-6 shadow-sm">
        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-center space-x-2">
            <Check className="h-4.5 w-4.5" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Company Profile Name</label>
            <input
              type="text"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Luxury Event GST Tax (%)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Email Template Payload</label>
          <textarea
            rows="4"
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none font-mono"
            required
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/20">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/10 hover:scale-[1.01] transition-transform"
          >
            <Save className="h-4.5 w-4.5" />
            <span>Save Settings Config</span>
          </button>
        </div>
      </form>
    </div>
  );
}
