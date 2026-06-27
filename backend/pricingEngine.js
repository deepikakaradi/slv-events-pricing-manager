const db = require('./db');

/**
 * Calculates the quote details, margins, tax, and generates upselling/AI recommendations.
 * @param {Object} params
 * @param {number} params.packageId - Base package ID
 * @param {number} params.guestCount - Total guest count
 * @param {Array} params.additionalServices - Array of custom services { id, custom_price, quantity }
 * @param {number} params.discountPercent - Percentage discount (0 to 100)
 * @param {number} params.budget - Client budget if provided (for recommendations)
 */
async function calculateQuote({ packageId, guestCount, additionalServices = [], discountPercent = 0, budget = 0 }) {
  // 1. Fetch package details
  const packageRes = await db.query(
    `SELECT p.*, e.name as event_name, e.id as event_id 
     FROM packages p 
     JOIN events e ON p.event_id = e.id 
     WHERE p.id = $1`, 
    [packageId]
  );

  if (packageRes.rows.length === 0) {
    throw new Error('Selected package not found');
  }
  const pkg = packageRes.rows[0];

  // Check for guest count above 500 -> Custom Quote
  if (guestCount > 500) {
    return {
      package: {
        id: pkg.id,
        name: pkg.name,
        tier: pkg.tier,
        base_price: pkg.base_price,
        adjusted_base_price: 0,
        multiplier: 0,
        rule_description: 'Above 500 Guests (Custom Quote Required)'
      },
      guest_count: guestCount,
      items: [],
      subtotal: 0,
      discount: 0,
      discount_percent: discountPercent,
      tax: 0,
      final_price: 0,
      cost_basis: 0,
      profit_margin: 0,
      is_margin_valid: true,
      custom_quote_required: true,
      advance_payment: 0,
      remaining_balance: 0,
      ai_recommendations: {
        upsell: null,
        summary: `This event has ${guestCount} guests (above 500 limit). Standard pricing packages do not apply. A custom quotation must be created manually by the Admin or Sales Manager.`
      }
    };
  }

  // 2. Fetch standard services included in the package
  const bundledServicesRes = await db.query(
    `SELECT s.* FROM services s
     JOIN package_services ps ON s.id = ps.service_id
     WHERE ps.package_id = $1`,
    [packageId]
  );
  const bundledServices = bundledServicesRes.rows;

  // 3. Find pricing rule multiplier for guest count
  const rulesRes = await db.query(
    `SELECT * FROM pricing_rules 
     WHERE package_id = $1 AND guest_min <= $2 AND guest_max >= $3`,
    [packageId, guestCount, guestCount]
  );
  
  let multiplier = 1.0;
  let ruleDescription = 'Standard pricing';
  if (rulesRes.rows.length > 0) {
    multiplier = rulesRes.rows[0].price_multiplier;
    ruleDescription = rulesRes.rows[0].description;
  }

  // 4. Calculate Costs
  // Base package price adjusted by the guest count slab multiplier
  const adjustedBasePrice = pkg.base_price * multiplier;

  let baseCateringCost = 0;
  let fixedServicesCost = 0;
  const items = [];

  // GST rates by category: Catering -> 5%, Decoration/Venue Support -> 12%, Others -> 18%
  // Package itself gets 18% (Event Management Services)
  const pkgGstRate = 18.0;
  let totalGst = 0;

  // Package base price discount & GST calculation
  const pkgDiscounted = adjustedBasePrice * (1 - parseFloat(discountPercent) / 100);
  const pkgGst = pkgDiscounted * (pkgGstRate / 100);
  totalGst += pkgGst;

  // Calculate costs of standard bundled services
  for (const service of bundledServices) {
    const isCatering = service.name.toLowerCase().includes('catering') || service.name.toLowerCase().includes('per guest');
    const serviceGstRate = service.gst_rate || (service.category === 'Catering' ? 5.0 : (service.category === 'Decoration' || service.category === 'Venue Support' ? 12.0 : 18.0));
    
    if (isCatering) {
      // Per guest service cost (Catering scales with guestCount)
      const itemCost = service.standard_price * guestCount;
      baseCateringCost += itemCost;
      
      // Calculate specific item GST
      const itemDiscounted = itemCost * (1 - parseFloat(discountPercent) / 100);
      const itemGst = itemDiscounted * (serviceGstRate / 100);
      totalGst += itemGst;

      items.push({
        service_id: service.id,
        name: service.name,
        standard_price: service.standard_price,
        custom_price: service.standard_price,
        quantity: guestCount,
        category: service.category,
        total: itemCost,
        gst_rate: serviceGstRate
      });
    } else {
      // Fixed bundled service cost is covered under package base price (so we display total as 0 / "Included")
      fixedServicesCost += service.standard_price;
      items.push({
        service_id: service.id,
        name: service.name,
        standard_price: service.standard_price,
        custom_price: service.standard_price,
        quantity: 1,
        category: service.category,
        total: 0, // Bundled inside package base price
        gst_rate: 0 // Tax is calculated on the package base price
      });
    }
  }

  // Calculate additional (custom) services costs
  let additionalServicesCost = 0;
  for (const addSvc of additionalServices) {
    const svcRes = await db.query('SELECT * FROM services WHERE id = $1', [addSvc.id]);
    if (svcRes.rows.length > 0) {
      const service = svcRes.rows[0];
      const customPrice = addSvc.custom_price !== undefined ? parseFloat(addSvc.custom_price) : service.standard_price;
      const serviceGstRate = service.gst_rate || (service.category === 'Catering' ? 5.0 : (service.category === 'Decoration' || service.category === 'Venue Support' ? 12.0 : 18.0));
      
      let qty = parseInt(addSvc.quantity) || 1;
      if (service.name.toLowerCase().includes('catering') || service.name.toLowerCase().includes('per guest')) {
        qty = guestCount; // Force matching guest count for catering type
      }

      const totalItemPrice = customPrice * qty;
      additionalServicesCost += totalItemPrice;
      
      // Calculate specific item GST
      const itemDiscounted = totalItemPrice * (1 - parseFloat(discountPercent) / 100);
      const itemGst = itemDiscounted * (serviceGstRate / 100);
      totalGst += itemGst;

      items.push({
        service_id: service.id,
        name: `${service.name} (Add-on)`,
        standard_price: service.standard_price,
        custom_price: customPrice,
        quantity: qty,
        category: service.category,
        total: totalItemPrice,
        gst_rate: serviceGstRate
      });
    }
  }

  // 5. Total Calculations
  const subtotal = adjustedBasePrice + baseCateringCost + additionalServicesCost;
  const discountAmount = subtotal * (parseFloat(discountPercent) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  
  // Total calculated GST
  const tax = totalGst;
  const finalPrice = discountedSubtotal + tax;

  // Booking Advance (30%) and Remaining Due
  const advancePayment = Math.round(finalPrice * 0.30);
  const remainingBalance = finalPrice - advancePayment;

  // Margin Check Validation (Margin = (Charged - Cost) / Charged)
  const estimatedCostBasis = (pkg.base_price * 0.7) + (baseCateringCost * 0.75) + (additionalServicesCost * 0.75);
  const profitMargin = discountedSubtotal > 0 
    ? ((discountedSubtotal - estimatedCostBasis) / discountedSubtotal) * 100 
    : 0;

  const isMarginValid = profitMargin >= 15;

  // 6. AI Recommendations & Upselling Opportunities
  const upsellOpportunity = await getUpsellOpportunity(pkg, guestCount, budget);
  const aiSummary = generateAISummary({
    eventName: pkg.event_name,
    tier: pkg.tier,
    guestCount,
    finalPrice,
    discountPercent,
    isMarginValid,
    profitMargin,
    upsellOpportunity
  });

  return {
    package: {
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      base_price: pkg.base_price,
      adjusted_base_price: adjustedBasePrice,
      multiplier,
      rule_description: ruleDescription
    },
    guest_count: guestCount,
    items,
    subtotal,
    discount: discountAmount,
    discount_percent: discountPercent,
    tax,
    final_price: finalPrice,
    advance_payment: advancePayment,
    remaining_balance: remainingBalance,
    cost_basis: estimatedCostBasis,
    profit_margin: parseFloat(profitMargin.toFixed(2)),
    is_margin_valid: isMarginValid,
    ai_recommendations: {
      upsell: upsellOpportunity,
      summary: aiSummary
    }
  };
}

/**
 * AI-style recommendation module checks if the client can upgrade to a higher tier package.
 */
async function getUpsellOpportunity(currentPkg, guestCount, clientBudget) {
  // Query all other packages for the same event type
  const pkgRes = await db.query(
    'SELECT * FROM packages WHERE event_id = $1 AND is_published = 1 AND tier != $2', 
    [currentPkg.event_id, currentPkg.tier]
  );
  
  if (pkgRes.rows.length === 0) return null;

  let targetTier = 'Gold';
  if (currentPkg.tier === 'Silver') {
    targetTier = 'Gold';
  } else if (currentPkg.tier === 'Gold') {
    targetTier = 'Platinum';
  } else {
    return null; // Already at Platinum
  }

  const nextTierPkg = pkgRes.rows.find(p => p.tier === targetTier);
  if (!nextTierPkg) return null;

  // Estimate the cost of next tier package
  // Find pricing rule multiplier for guest count of next package
  const nextRulesRes = await db.query(
    `SELECT * FROM pricing_rules WHERE package_id = $1 AND guest_min <= $2 AND guest_max >= $3`,
    [nextTierPkg.id, guestCount, guestCount]
  );
  let nextMultiplier = 1.0;
  if (nextRulesRes.rows.length > 0) {
    nextMultiplier = nextRulesRes.rows[0].price_multiplier;
  }

  const nextEstimatedSubtotal = (nextTierPkg.base_price * nextMultiplier) * 1.35; // Rough scale with catering services
  
  let upsellPitch = '';
  if (targetTier === 'Gold') {
    upsellPitch = 'Unlock premium table decorations, full-day photography, and an on-site coordinator. Gold packages drive 35% higher guest satisfaction reviews.';
  } else {
    upsellPitch = 'Provide the ultimate royal wedding experience with a live 4-piece musical band, premium groom suite amenities, and a double-tier catering buffet menu.';
  }

  return {
    target_package_id: nextTierPkg.id,
    target_name: nextTierPkg.name,
    target_tier: targetTier,
    estimated_price: Math.round(nextEstimatedSubtotal * 1.18), // includes standard GST
    pitch: upsellPitch,
    budget_fit: clientBudget > 0 ? (clientBudget >= nextEstimatedSubtotal * 1.18 ? 'Within budget' : 'Slightly above budget') : 'Contact for budget alignment'
  };
}

/**
 * Dynamically generates structured client summaries.
 */
function generateAISummary({ eventName, tier, guestCount, finalPrice, discountPercent, isMarginValid, profitMargin, upsellOpportunity }) {
  let summary = `This quotation represents a tailored ${tier} package layout for a ${eventName} hosting ${guestCount} guests. `;
  
  summary += `At a final price of ₹${finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (inclusive of GST tax)`;
  
  if (discountPercent > 0) {
    summary += ` and including a preferred ${discountPercent}% discount, `;
  } else {
    summary += `, `;
  }

  summary += `the proposal achieves a strong estimated company margin of ${profitMargin.toFixed(1)}%. `;

  if (isMarginValid) {
    summary += `The quote satisfies executive profitability rules. `;
  } else {
    summary += `⚠️ WARNING: This discount breaches the recommended 15% margin rule. Admin validation or discount revision recommended. `;
  }

  if (upsellOpportunity) {
    summary += `Upselling Recommendation: Recommend upgrading to the ${upsellOpportunity.target_tier} tier (${upsellOpportunity.target_name}) for an estimated ₹${upsellOpportunity.estimated_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })} to include luxury catering and entertainment features.`;
  }

  return summary;
}

module.exports = {
  calculateQuote
};
