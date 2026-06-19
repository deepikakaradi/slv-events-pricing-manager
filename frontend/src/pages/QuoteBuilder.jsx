import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Users, 
  Check, 
  Sparkles, 
  Plus, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  FileText,
  FileCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function QuoteBuilder() {
  const { events, packages, services, apiFetch } = useApp();
  
  const [step, setStep] = useState(1);
  
  // Step 1: Client & Event Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [eventId, setEventId] = useState('');
  const [guestCount, setGuestCount] = useState(100);
  const [clientBudget, setClientBudget] = useState('');

  // Step 2: Package Selection
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  // Step 3: Additional Services
  const [selectedAddons, setSelectedAddons] = useState([]); // Array of { id, custom_price, quantity }

  // Step 4: Calculations, Discounts & AI Pitches
  const [discountPercent, setDiscountPercent] = useState(0);
  const [calcResult, setCalcResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState(null);
  const [error, setError] = useState('');

  // Auto-fetch calculations when inputs change in Step 4 or when selectedPackage changes
  useEffect(() => {
    if (selectedPackageId && guestCount) {
      triggerCalculation();
    }
  }, [selectedPackageId, guestCount, selectedAddons, discountPercent, clientBudget]);

  const triggerCalculation = async () => {
    setError('');
    try {
      const result = await apiFetch('/quotes/calculate', {
        method: 'POST',
        body: JSON.stringify({
          packageId: selectedPackageId,
          guestCount,
          additionalServices: selectedAddons,
          discountPercent,
          budget: parseFloat(clientBudget) || 0
        })
      });
      setCalcResult(result);
    } catch (err) {
      setError(err.message || 'Error executing pricing calculations');
    }
  };

  const handleAddonClick = (svc) => {
    const exists = selectedAddons.find(a => a.id === svc.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== svc.id));
    } else {
      setSelectedAddons([...selectedAddons, {
        id: svc.id,
        name: svc.name,
        custom_price: svc.standard_price,
        quantity: 1
      }]);
    }
  };

  const handleUpdateAddonPrice = (svcId, price) => {
    setSelectedAddons(selectedAddons.map(a => 
      a.id === svcId ? { ...a, custom_price: parseFloat(price) || 0 } : a
    ));
  };

  const handleUpdateAddonQty = (svcId, qty) => {
    setSelectedAddons(selectedAddons.map(a => 
      a.id === svcId ? { ...a, quantity: parseInt(qty) || 1 } : a
    ));
  };

  const handleSaveQuote = async () => {
    if (!calcResult) return;
    setSaveLoading(true);
    setError('');

    const payload = {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      eventId: parseInt(eventId),
      packageId: parseInt(selectedPackageId),
      guestCount: parseInt(guestCount),
      subtotal: calcResult.subtotal,
      discount: calcResult.discount,
      tax: calcResult.tax,
      finalPrice: calcResult.final_price,
      additionalServices: selectedAddons,
      summary: calcResult.ai_recommendations?.summary || ''
    };

    try {
      const data = await apiFetch('/quotes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSavedQuoteId(data.id);
      setStep(5); // Show success screen
    } catch (err) {
      setError(err.message || 'Failed to save quotation to server');
    } finally {
      setSaveLoading(false);
    }
  };

  // Generate Professional PDF Quote
  const exportPDF = () => {
    if (!calcResult) return;

    const doc = new jsPDF();
    const primaryColor = '#A4956C'; // Matte Gold
    const selectedEvent = events.find(e => e.id === parseInt(eventId))?.name || 'Event';
    
    // Title & Branding
    doc.setFillColor(15, 23, 42); // slate 950
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SLV EVENTS', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(primaryColor);
    doc.text('PREMIUM EVENT SERVICES & QUOTATIONS', 20, 31);
    
    // Metadata block
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 21);
    doc.text(`Status: Pending Approval`, 150, 27);
    doc.text(`Quote Ref: SLV-${Math.floor(1000 + Math.random() * 9000)}`, 150, 33);

    // Client Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('CLIENT DETAILS', 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Client Name: ${clientName}`, 20, 63);
    doc.text(`Email Address: ${clientEmail}`, 20, 69);
    doc.text(`Phone Contact: ${clientPhone || 'N/A'}`, 20, 75);
    doc.text(`Company Profile: ${clientCompany || 'N/A'}`, 20, 81);

    // Event Info (Right column)
    doc.setFont('Helvetica', 'bold');
    doc.text('EVENT SPECIFICATIONS', 120, 55);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Event Category: ${selectedEvent}`, 120, 63);
    doc.text(`Guest Count Slab: ${guestCount} guests`, 120, 69);
    doc.text(`Base package: ${calcResult.package.name}`, 120, 75);
    doc.text(`Client Budget: ${clientBudget ? 'Rs. ' + clientBudget : 'Not specified'}`, 120, 81);

    // Items table
    const tableHeaders = [['Service Line Item Description', 'Quantity', 'Rate', 'Total Cost']];
    const tableRows = [];

    // Add items from pricing result
    calcResult.items.forEach(item => {
      tableRows.push([
        item.name,
        item.quantity,
        `Rs. ${item.custom_price.toLocaleString()}`,
        `Rs. ${item.total.toLocaleString()}`
      ]);
    });

    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 92,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      }
    });

    // Summary math layout
    let finalY = doc.previousAutoTable.finalY + 10;

    doc.setFont('Helvetica', 'normal');
    doc.text('Subtotal:', 130, finalY);
    doc.text(`Rs. ${calcResult.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 175, finalY);

    if (calcResult.discount > 0) {
      finalY += 6;
      doc.text(`Discount (${calcResult.discount_percent}%):`, 130, finalY);
      doc.text(`-Rs. ${calcResult.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 175, finalY);
    }

    finalY += 6;
    doc.text('Luxury Tax GST (18%):', 130, finalY);
    doc.text(`Rs. ${calcResult.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 175, finalY);

    finalY += 8;
    doc.setFont('Helvetica', 'bold');
    doc.text('GRAND TOTAL:', 130, finalY);
    doc.text(`Rs. ${calcResult.final_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 175, finalY);

    // AI recommendation summaries
    finalY += 15;
    if (finalY > 260) {
      doc.addPage();
      finalY = 30;
    }
    
    doc.setFillColor(243, 241, 240);
    doc.rect(20, finalY, 170, 32, 'F');
    
    doc.setTextColor(164, 149, 108); // Gold accent
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('💡 SLV AI RECOMMENDATIONS & UPSYLLING OPTIONS', 25, finalY + 8);
    
    doc.setTextColor(100, 110, 120);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    
    const pitch = calcResult.ai_recommendations?.upsell 
      ? `Upsell Option: Upgrade to ${calcResult.ai_recommendations.upsell.target_name} (${calcResult.ai_recommendations.upsell.target_tier}) for an estimated Rs. ${calcResult.ai_recommendations.upsell.estimated_price.toLocaleString()}. ${calcResult.ai_recommendations.upsell.pitch}`
      : 'Currently at Platinum peak service layout level.';
    
    const splitPitch = doc.splitTextToSize(pitch, 160);
    doc.text(splitPitch, 25, finalY + 16);

    // Save pdf
    doc.save(`SLV_Quotation_${clientName.replace(/\s+/g, '_')}.pdf`);
  };

  // Filter packages for selected event type
  const activePackages = packages.filter(p => p.event_id === parseInt(eventId) && p.is_published === 1);

  return (
    <div className="space-y-8 font-sans max-w-5xl">
      <div>
        <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Quote Builder</h1>
        <p className="text-xs text-slate-400 mt-1">Sales wizard to capture customer requirements, map base packages, validate margins, and download PDFs.</p>
      </div>

      {/* Steps Header indicator */}
      <div className="flex justify-between items-center max-w-3xl mx-auto py-2">
        {[
          { num: 1, label: 'Client Specs' },
          { num: 2, label: 'Choose Tier' },
          { num: 3, label: 'Custom Addons' },
          { num: 4, label: 'Review & AI Pitches' }
        ].map(s => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s.num
                ? 'bg-luxury-500 text-white shadow-lg'
                : step > s.num
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
            }`}>
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={`text-xs hidden sm:inline ${step === s.num ? 'font-bold text-slate-700 dark:text-white' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Client specifications */}
      {step === 1 && (
        <div className="glass-card p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 space-y-6">
          <h3 className="font-outfit font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/40 pb-4">Client & Event Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Client Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Client Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Phone Contact</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Company / Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. SLV Corporates"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Event Category Type</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                >
                  <option value="">Select event category...</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Expected Guest Count</label>
              <div className="relative">
                <Users className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                />
              </div>
            </div>

            <div className="relative md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Client Overall Budget (₹) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={clientBudget}
                onChange={(e) => setClientBudget(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!clientName || !clientEmail || !eventId) {
                  alert('Please enter Client Name, Client Email, and Event Category.');
                  return;
                }
                setStep(2);
              }}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg"
            >
              <span>Choose base package</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Tier */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="font-outfit font-bold text-lg text-slate-700 dark:text-white">Choose Base Package Tier</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePackages.map(p => {
              const isSelected = selectedPackageId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPackageId(p.id)}
                  className={`glass-card p-6 rounded-2xl border text-left flex flex-col justify-between h-72 transition-all hover:scale-[1.01] ${
                    isSelected 
                      ? 'border-luxury-500 bg-luxury-500/10 ring-2 ring-luxury-500' 
                      : 'border-slate-200 dark:border-slate-800/40 hover:bg-slate-900/40'
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-luxury-500 font-mono tracking-wider">{p.tier} package</span>
                    <h4 className="font-outfit font-extrabold text-xl mt-1 text-slate-800 dark:text-white">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-wider font-bold">Standard Services Included:</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.services && p.services.map(s => (
                        <span key={s.id} className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900/60 text-slate-400 border border-slate-200/50 dark:border-slate-800/20">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-baseline mt-4 w-full font-mono">
                    <span className="text-[10px] text-slate-400">Base Price:</span>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-white">₹{p.base_price.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activePackages.length === 0 && (
            <div className="p-12 glass-card rounded-2xl border border-slate-250 dark:border-slate-850/50 text-center text-slate-400 text-sm">
              No packages have been published for this event category yet. Please ask an Administrator to create packages.
            </div>
          )}

          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                if (!selectedPackageId) {
                  alert('Please select a base package tier to continue.');
                  return;
                }
                setStep(3);
              }}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white"
            >
              <span>Add Custom Services</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Add Custom Services */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="font-outfit font-bold text-lg text-slate-700 dark:text-white">Link Custom Catalog Addons</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Catalog list */}
            <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/40 space-y-4">
              <h4 className="font-outfit font-bold text-sm">Available Addon Services</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {services.map(svc => {
                  const isChecked = selectedAddons.some(a => a.id === svc.id);
                  return (
                    <button
                      type="button"
                      key={svc.id}
                      onClick={() => handleAddonClick(svc)}
                      className={`flex items-center space-x-3 p-3 rounded-xl text-left border transition-all ${
                        isChecked 
                          ? 'border-luxury-500 bg-luxury-500/10 text-luxury-500' 
                          : 'border-slate-250 dark:border-slate-800/40 hover:bg-slate-900/40'
                      }`}
                    >
                      <Plus className={`h-4.5 w-4.5 flex-shrink-0 ${isChecked ? 'text-luxury-500' : 'text-slate-400'}`} />
                      <div className="leading-tight">
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{svc.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">₹{svc.standard_price.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected items overrides */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/40 space-y-4">
              <h4 className="font-outfit font-bold text-sm">Active Custom Overrides</h4>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {selectedAddons.map(addon => (
                  <div key={addon.id} className="p-3 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{addon.name}</span>
                      <button 
                        onClick={() => setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))}
                        className="text-rose-500 p-0.5 hover:bg-rose-500/10 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold uppercase tracking-wider">Unit Price (₹)</label>
                        <input
                          type="number"
                          value={addon.custom_price}
                          onChange={(e) => handleUpdateAddonPrice(addon.id, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold uppercase tracking-wider">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={addon.quantity}
                          onChange={(e) => handleUpdateAddonQty(addon.id, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {selectedAddons.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">No additional addons selected.</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white"
            >
              <span>Review calculations & AI Pitches</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Calculations & AI Pitches */}
      {step === 4 && calcResult && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cost Summary & Discounts panel */}
            <div className="lg:col-span-2 glass-card p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-xl space-y-6">
              <h3 className="font-outfit font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/40 pb-4">Quotation Cost Sheet</h3>
              
              {/* Items List */}
              <div className="space-y-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Included details:</span>
                {calcResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Adjust discount */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Apply Sales Discount (%)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-luxury-500"
                  />
                  <span className="font-mono text-sm font-bold text-luxury-500">{discountPercent}% Discount</span>
                </div>
              </div>

              {/* Calculations Math block */}
              <div className="space-y-4 font-mono text-sm border-t border-slate-200/50 dark:border-slate-800/40 pt-6">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span>₹{calcResult.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {calcResult.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount Deduction:</span>
                    <span>-${calcResult.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Luxury Tax GST (18%):</span>
                  <span>₹{calcResult.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-slate-100 dark:border-slate-900">
                  <span className="text-slate-400 font-sans text-xs uppercase font-bold tracking-wider">Final Customer Price:</span>
                  <span className="text-3xl font-extrabold gold-text">₹{calcResult.final_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* AI Recommendations & Margin safety controls */}
            <div className="space-y-6">
              {/* Margin checks */}
              <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm space-y-4">
                <h4 className="font-outfit font-bold text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4.5 w-4.5 text-luxury-500" />
                  <span>Margin Compliance check</span>
                </h4>
                <div className="flex justify-between items-baseline font-mono">
                  <span className="text-slate-400 text-xs">Estimated Margin:</span>
                  <span className={`text-xl font-bold ${calcResult.is_margin_valid ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {calcResult.profit_margin}%
                  </span>
                </div>
                
                {calcResult.is_margin_valid ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-600 dark:text-emerald-400 leading-normal">
                    ✓ Profit margin compliant. Standard quotation safe to export.
                  </div>
                ) : (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-500 leading-normal flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>⚠️ Warning: Safe margin rules breached (&lt;15%). Revise discount rate or submit to Admin for verification override.</span>
                  </div>
                )}
              </div>

              {/* AI recommend cards */}
              <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm space-y-4">
                <h4 className="font-outfit font-bold text-sm flex items-center space-x-2 text-luxury-500">
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Upselling Opportunity</span>
                </h4>
                
                {calcResult.ai_recommendations?.upsell ? (
                  <div className="space-y-3">
                    <div className="leading-tight">
                      <div className="text-xs font-bold text-slate-800 dark:text-white">Upgrade to {calcResult.ai_recommendations.upsell.target_name}</div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-luxury-500 font-mono">Estimated Price: ${calcResult.ai_recommendations.upsell.estimated_price.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal italic">
                      "{calcResult.ai_recommendations.upsell.pitch}"
                    </p>
                    <div className="p-2 bg-slate-100/50 dark:bg-slate-900/60 rounded-lg text-[9px] font-mono text-slate-400 flex justify-between">
                      <span>Budget fit:</span>
                      <span className="font-bold text-luxury-400">{calcResult.ai_recommendations.upsell.budget_fit}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs py-4">Currently at maximum package tier layout levels.</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Back</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={exportPDF}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-luxury-500 text-luxury-500 hover:bg-luxury-500/10 transition-colors font-bold text-sm"
              >
                <FileText className="h-4.5 w-4.5" />
                <span>Export PDF Quote</span>
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={saveLoading}
                className="flex items-center space-x-2 px-7 py-3 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg"
              >
                {saveLoading ? 'Saving...' : 'Save & Publish Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success Screen */}
      {step === 5 && (
        <div className="max-w-md mx-auto glass-card p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 text-center space-y-6 shadow-2xl mt-12">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
            <FileCheck className="h-8 w-8 animate-bounce" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-xl text-slate-800 dark:text-white">Quotation Generated Successfully!</h3>
            <p className="text-xs text-slate-400 mt-2">
              Quotation has been registered in the pipeline logs. The client proposal document is ready to download.
            </p>
          </div>

          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={exportPDF}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg"
            >
              Download Client PDF Quote
            </button>
            <button
              onClick={() => {
                // Reset Wizard
                setClientName('');
                setClientEmail('');
                setClientPhone('');
                setClientCompany('');
                setEventId('');
                setGuestCount(100);
                setSelectedPackageId(null);
                setSelectedAddons([]);
                setDiscountPercent(0);
                setCalcResult(null);
                setStep(1);
              }}
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-900 transition-colors text-xs font-semibold"
            >
              Build Another Quote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
