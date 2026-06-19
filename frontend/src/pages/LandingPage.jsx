import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Calculator,
  ChevronRight,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const { setPage, theme, toggleTheme } = useApp();
  const [calcGuests, setCalcGuests] = useState(100);
  const [calcEvent, setCalcEvent] = useState('wedding');
  const [calcBase, setCalcBase] = useState(12000);

  // Quick estimator formula: Base * guest_multiplier + (catering_cost * guests)
  const getEstimate = () => {
    let multiplier = 1.0;
    if (calcGuests < 75) multiplier = 0.8;
    else if (calcGuests <= 150) multiplier = 1.0;
    else if (calcGuests <= 300) multiplier = 1.4;
    else multiplier = 2.0;

    const cateringCost = calcEvent === 'wedding' ? 45 : 25;
    const subtotal = (calcBase * multiplier) + (cateringCost * calcGuests);
    return Math.round(subtotal * 1.18); // inclusive of GST
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-luxury-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-luxury-400 to-luxury-600 flex items-center justify-center shadow-md shadow-luxury-500/10">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-outfit font-bold text-lg tracking-wide">SLV Events</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setPage('login')} 
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-luxury-500 dark:hover:text-luxury-400 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => setPage('register')} 
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/20 hover:scale-[1.02] transition-all"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-10 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-luxury-500/10 text-luxury-500 dark:text-luxury-400 text-xs font-semibold tracking-wide mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Intelligent Tiered Event Packaging Engine</span>
        </div>

        <h1 className="font-outfit text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto mb-6 leading-[1.15]">
          Standardize Profitability for <br />
          <span className="bg-gradient-to-r from-luxury-400 via-luxury-500 to-luxury-600 bg-clip-text text-transparent">
            Luxury Event Quotations
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Create, manage, and clone tiered event packages. Instantly calculate quotations with guest-count slabs, margin validations, and AIupsell pitches that secure sales.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <button 
            onClick={() => setPage('register')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-xl shadow-luxury-500/20 hover:scale-[1.02] transition-all"
          >
            <span>Launch pricing dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#calculator"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-semibold bg-white/10 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <span>Try estimator</span>
          </a>
        </div>

        {/* Dash/Mockup Preview */}
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden glass-card border border-white/20 dark:border-slate-800/40 p-4 shadow-2xl relative">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/40">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 pl-4 font-mono">SLV Pricing Manager v1.2</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left p-2">
            <div className="p-5 rounded-xl bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-slate-800/20">
              <span className="text-xs uppercase font-bold text-luxury-500 tracking-wider">Tiered Packages</span>
              <h3 className="text-lg font-bold mt-1">Silver, Gold, Platinum</h3>
              <p className="text-xs text-slate-400 mt-2">Publish pre-bundled standard service catalogs. Manage base markups easily.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-slate-800/20">
              <span className="text-xs uppercase font-bold text-emerald-500 tracking-wider">Dynamic slabs</span>
              <h3 className="text-lg font-bold mt-1">50 - 500+ Guest Multipliers</h3>
              <p className="text-xs text-slate-400 mt-2">Adjust prices dynamically based on slabs to protect vendor coordinator costs.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-slate-800/20">
              <span className="text-xs uppercase font-bold text-indigo-500 tracking-wider">Cost validation</span>
              <h3 className="text-lg font-bold mt-1">&gt; 15% Safe Margin Check</h3>
              <p className="text-xs text-slate-400 mt-2">Automated system warning if discounts drop package margins below threshold.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl font-bold tracking-tight mb-4">Engineered to drive sales conversions</h2>
            <p className="text-slate-400 text-sm">Everything your sales and event coordination team needs in one luxury portal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Layers, title: "Tiered Pricing", desc: "Easily design packages ranging from Silver for family gatherings to Platinum royal weddings." },
              { icon: Calculator, title: "Pricing Engine Slabs", desc: "Automatic rate adjustments for guest counts (50, 100, 200, 500) based on resource costs." },
              { icon: TrendingUp, title: "Margin Safeguards", desc: "Validate that discounts don't erode profits, maintaining a healthy 15% business margin." },
              { icon: ShieldCheck, title: "AI-Powered Upselling", desc: "Generate smart recommendations to upgrade packages based on user budget and custom add-ons." }
            ].map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="p-6 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-luxury-500/10 flex items-center justify-center text-luxury-500 dark:text-luxury-400 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-outfit text-lg font-bold mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calculator Estimator Section */}
      <section id="calculator" className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold mb-6">
              Test the Pricing Engine. <br />
              <span className="gold-text">See rates instantly.</span>
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Slide guest counts and choose packages to watch the pricing rule slabs in action. Standard pricing rules apply multiplier weights: 0.8x for small parties, 1.0x standard, 1.4x for large crowds, and 2.0x for grand galas.
            </p>

            <div className="space-y-6">
              {/* Select Package */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Base Package tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Silver (Basic)', base: 5000 },
                    { name: 'Gold (Standard)', base: 12000 },
                    { name: 'Platinum (Premium)', base: 22000 }
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setCalcBase(p.base)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                        calcBase === p.base
                          ? 'border-luxury-500 bg-luxury-500/10 text-luxury-500 dark:text-luxury-400'
                          : 'border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-200/25 dark:hover:bg-slate-900/30'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  <span>Guest count slab</span>
                  <span className="text-luxury-500 font-bold">{calcGuests} Guests</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  value={calcGuests}
                  onChange={(e) => setCalcGuests(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-luxury-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                  <span>20 (Small - 0.8x)</span>
                  <span>150 (Std - 1.0x)</span>
                  <span>300 (Large - 1.4x)</span>
                  <span>600 (Grand - 2.0x)</span>
                </div>
              </div>

              {/* Event Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Event category</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="calcEvent" 
                      checked={calcEvent === 'wedding'} 
                      onChange={() => setCalcEvent('wedding')} 
                      className="accent-luxury-500"
                    />
                    <span>Wedding (Premium Catering: $45/head)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="calcEvent" 
                      checked={calcEvent === 'birthday'} 
                      onChange={() => setCalcEvent('birthday')} 
                      className="accent-luxury-500"
                    />
                    <span>Birthday (Standard Catering: $25/head)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="p-8 rounded-2xl glass-card border border-white/20 dark:border-slate-800/40 relative shadow-2xl">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-luxury-500/10 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-luxury-500" />
            </div>
            <h3 className="font-outfit text-xl font-bold mb-4">Estimated Quote</h3>
            <div className="space-y-4 font-mono text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-6 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Base Package Cost:</span>
                <span>${calcBase.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Guest Slab Multiplier:</span>
                <span>
                  {calcGuests < 75 ? '0.8x' : calcGuests <= 150 ? '1.0x' : calcGuests <= 300 ? '1.4x' : '2.0x'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Catering:</span>
                <span>${(calcGuests * (calcEvent === 'wedding' ? 45 : 25)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Luxury GST Tax (18%):</span>
                <span>
                  ${Math.round(((calcBase * (calcGuests < 75 ? 0.8 : calcGuests <= 150 ? 1.0 : calcGuests <= 300 ? 1.4 : 2.0)) + (calcGuests * (calcEvent === 'wedding' ? 45 : 25))) * 0.18).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mb-8">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Price:</span>
              <span className="text-3xl font-extrabold gold-text">${getEstimate().toLocaleString()}</span>
            </div>

            <button
              onClick={() => setPage('register')}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-luxury-400 to-luxury-600 text-white shadow-lg shadow-luxury-500/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
            >
              <span>Build Professional Quote</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10 border-t border-slate-200/30 dark:border-slate-800/20">
        <h2 className="font-outfit text-3xl font-bold mb-4">Empower your sales operations today</h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8">
          Join SLV Events coordinators in standardizing pricing matrices, ensuring minimum profit margins, and designing quotes that close.
        </p>
        <button
          onClick={() => setPage('register')}
          className="px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/20"
        >
          Create Employee Account
        </button>
        <div className="mt-12 text-xs text-slate-500">
          © 2026 SLV Events Inc. All rights reserved. Built with Antigravity Premium SaaS guidelines.
        </div>
      </section>
    </div>
  );
}
