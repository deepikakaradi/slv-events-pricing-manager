const db = require('../backend/db');
const pricingEngine = require('../backend/pricingEngine');

async function runTests() {
  console.log('----------------------------------------------------');
  console.log('Running Pricing Engine Automated Calculations Test');
  console.log('----------------------------------------------------');

  try {
    // 1. Initialize Database Tables & Default seeds
    await db.initializeDatabase();
    
    // Give SQLite a brief moment to complete serialization if needed
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Fetch seeded packages
    const packagesRes = await db.query("SELECT * FROM packages WHERE name = 'Wedding Silver Package'");
    if (packagesRes.rows.length === 0) {
      throw new Error('Wedding Silver Package was not seeded in the database');
    }
    const pkg = packagesRes.rows[0];

    // 3. Test Calculation Case A: Silver Package with 50 Guests (should trigger 0.8x multiplier)
    console.log(`\nTest Case 1: Package "${pkg.name}" for 50 Guests`);
    const quote50 = await pricingEngine.calculateQuote({
      packageId: pkg.id,
      guestCount: 50,
      additionalServices: [],
      discountPercent: 0
    });

    console.log(`- Base Package Price: $${quote50.package.base_price}`);
    console.log(`- Guest Multiplier: ${quote50.package.multiplier}x (Expected: 0.8x)`);
    console.log(`- Adjusted Base: $${quote50.package.adjusted_base_price}`);
    console.log(`- Final calculated price (incl tax): $${quote50.final_price}`);
    console.log(`- Calculated Margin: ${quote50.profit_margin}%`);
    console.log(`- Is Margin Compliant: ${quote50.is_margin_valid}`);

    if (quote50.package.multiplier !== 0.8) {
      throw new Error(`Expected guest count multiplier to be 0.8 but got ${quote50.package.multiplier}`);
    }

    // 4. Test Calculation Case B: Silver Package with 150 Guests & 10% discount
    console.log(`\nTest Case 2: Package "${pkg.name}" for 150 Guests with 10% discount`);
    const quote150 = await pricingEngine.calculateQuote({
      packageId: pkg.id,
      guestCount: 150,
      additionalServices: [],
      discountPercent: 10
    });

    console.log(`- Guest Multiplier: ${quote150.package.multiplier}x (Expected: 1.0x)`);
    console.log(`- Subtotal: $${quote150.subtotal}`);
    console.log(`- Discount amount: $${quote150.discount}`);
    console.log(`- Final calculated price (incl tax): $${quote150.final_price}`);
    console.log(`- Calculated Margin: ${quote150.profit_margin}%`);
    console.log(`- Is Margin Compliant: ${quote150.is_margin_valid}`);

    // 5. Test Calculation Case C: High discount trigger warning
    console.log(`\nTest Case 3: Silver Package with 150 Guests and 35% discount (Should fail margin check)`);
    const quoteFailedMargin = await pricingEngine.calculateQuote({
      packageId: pkg.id,
      guestCount: 150,
      additionalServices: [],
      discountPercent: 35
    });
    console.log(`- Calculated Margin: ${quoteFailedMargin.profit_margin}%`);
    console.log(`- Is Margin Compliant: ${quoteFailedMargin.is_margin_valid} (Expected: false)`);

    if (quoteFailedMargin.is_margin_valid) {
      throw new Error('Expected margin to be invalid under high 35% discount but it was reported as valid');
    }

    console.log('\n✓ ALL AUTOMATED CALCULATION TEST CASES PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
