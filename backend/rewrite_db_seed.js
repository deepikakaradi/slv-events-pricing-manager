const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.js');
let dbContent = fs.readFileSync(dbPath, 'utf8');

// The replacement content for the events and services seeding
const newSeedingLogic = `    // 2. Seed Events if empty
    const eventCheck = await query('SELECT count(*) as count FROM events');
    if (parseInt(eventCheck.rows[0].count) === 0) {
      console.log('Seeding default events...');
      const defaultEvents = [
        ['Wedding', 'Elegant wedding ceremony and grand reception package services'],
        ['Birthday', 'Vibrant decorations, catering, and audio-visual setups for birthdays'],
        ['Corporate', 'Professional business seminars, conferences, and formal corporate functions'],
        ['Anniversary', 'Sophisticated anniversary celebration packages']
      ];
      for (const e of defaultEvents) {
        await query('INSERT INTO events (name, description) VALUES ($1, $2)', e);
      }
    }

    // 3. Seed Services if empty
    const serviceCheck = await query('SELECT count(*) as count FROM services');
    if (parseInt(serviceCheck.rows[0].count) === 0) {
      console.log('Seeding default service catalog...');
      const defaultServices = [
        ['Wedding Catering (Per Guest)', 'Catering', 1500.0, 5.0, 'Premium multicourse buffet options'],
        ['Birthday Catering (Per Guest)', 'Catering', 800.0, 5.0, 'Classic buffet service with essential food'],
        ['Corporate Catering (Per Guest)', 'Catering', 1200.0, 5.0, 'Professional catering for business events'],
        ['Anniversary Catering (Per Guest)', 'Catering', 1000.0, 5.0, 'Elegant catering for anniversaries'],
        ['Royal Stage Decoration', 'Decoration', 150000.0, 12.0, 'Handcrafted floral stage arrangements'],
        ['Minimalist Decoration', 'Decoration', 30000.0, 12.0, 'Simple floral accents and clean styling'],
        ['Premium Sound & DJ Set', 'Audio/Visual', 45000.0, 18.0, 'Top-tier sound systems and professional DJ'],
        ['Standard Sound System', 'Audio/Visual', 10000.0, 18.0, 'Microphones and ambient music setup'],
        ['HD Photography & Video', 'Photography', 100000.0, 18.0, 'Full-day event coverage and highlight video'],
        ['Basic Photography', 'Photography', 35000.0, 18.0, '4-hour event photoshoot'],
        ['Luxury Suite Room', 'Venue Support', 15000.0, 12.0, 'Air-conditioned room with vanity mirrors'],
        ['Live Musical Band', 'Entertainment', 120000.0, 18.0, '4-piece live band performance'],
        ['Event Coordinator Services', 'Management', 25000.0, 18.0, 'On-site supervisor to manage timelines'],
        ['Professional Anchor/Host', 'Entertainment', 20000.0, 18.0, 'Dynamic event host/anchor'],
        ['Bridal/Groom Makeup', 'Venue Support', 25000.0, 12.0, 'Premium makeup and styling'],
        ['Custom Invitation Cards', 'Management', 10000.0, 18.0, 'Custom invitation cards design and printing'],
        ['Venue Lighting Setup', 'Audio/Visual', 35000.0, 18.0, 'Thematic event lighting arrangements'],
        ['Thematic Flower Decoration', 'Decoration', 75000.0, 12.0, 'Exotic floral setup and entryways'],
        ['Security Staff (Per Person)', 'Venue Support', 1800.0, 12.0, 'Security staff members per day'],
        ['Housekeeping Staff (Per Person)', 'Venue Support', 1200.0, 12.0, 'Housekeeping staff members per day'],
        ['Event Transportation', 'Venue Support', 25000.0, 12.0, 'Passenger transport and logistics coordination'],
        ['Generator Power Backup', 'Venue Support', 15000.0, 12.0, 'Uninterrupted power supply support'],
        ['Premium Event Venue Charges', 'Venue Support', 300000.0, 12.0, 'Premium venue booking and charges']
      ];
      for (const s of defaultServices) {
        await query('INSERT INTO services (name, category, standard_price, gst_rate, description) VALUES ($1, $2, $3, $4, $5)', s);
      }
    }

    // 4. Seed default packages if empty
    const packageCheck = await query('SELECT count(*) as count FROM packages');
    if (parseInt(packageCheck.rows[0].count) === 0) {
      console.log('Seeding initial packages and guest count pricing rules...');
      const eventsList = await query('SELECT id, name FROM events');
      const servicesList = await query('SELECT id, name FROM services');
      
      const getSvcId = (name) => servicesList.rows.find(s => s.name === name)?.id;

      for (const evt of eventsList.rows) {
        // Find matching catering for the event
        const cateringName = \`\${evt.name} Catering (Per Guest)\`;
        const cateringId = getSvcId(cateringName);

        let baseSilver = 50000.0;
        let baseGold = 120000.0;
        let basePlatinum = 250000.0;

        if (evt.name === 'Wedding') {
          baseSilver = 350000.0;
          baseGold = 800000.0;
          basePlatinum = 2000000.0;
        } else if (evt.name === 'Corporate') {
          baseSilver = 150000.0;
          baseGold = 400000.0;
          basePlatinum = 1000000.0;
        } else if (evt.name === 'Anniversary') {
          baseSilver = 80000.0;
          baseGold = 150000.0;
          basePlatinum = 300000.0;
        }

        // Silver Package
        const resSilver = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Silver Package\`, evt.id, 'Silver', baseSilver]);
        const pSilverId = resSilver.insertId || resSilver.rows?.[0]?.id;
        
        const silverServices = [cateringId, getSvcId('Minimalist Decoration'), getSvcId('Standard Sound System')].filter(Boolean);
        for (const sId of silverServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pSilverId, sId]);
        }

        // Gold Package
        const resGold = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Gold Package\`, evt.id, 'Gold', baseGold]);
        const pGoldId = resGold.insertId || resGold.rows?.[0]?.id;
        
        const goldServices = [cateringId, getSvcId('Royal Stage Decoration'), getSvcId('Premium Sound & DJ Set'), getSvcId('Basic Photography')].filter(Boolean);
        for (const sId of goldServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pGoldId, sId]);
        }

        // Platinum Package
        const resPlatinum = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Platinum Package\`, evt.id, 'Platinum', basePlatinum]);
        const pPlatId = resPlatinum.insertId || resPlatinum.rows?.[0]?.id;
        
        const platServices = [cateringId, getSvcId('Royal Stage Decoration'), getSvcId('Premium Sound & DJ Set'), getSvcId('HD Photography & Video'), getSvcId('Event Coordinator Services')].filter(Boolean);
        for (const sId of platServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pPlatId, sId]);
        }

        // Pricing Rules
        const pkgs = [pSilverId, pGoldId, pPlatId];
        for (const pkgId of pkgs) {
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 0, 100, 1.0, $2)', [pkgId, 'Small/Standard (0-100 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 101, 250, 1.25, $2)', [pkgId, 'Mid-size (101-250 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 251, 500, 1.50, $2)', [pkgId, 'Large (251-500 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 501, 999999, 0.0, $2)', [pkgId, 'Above 500 guests (Custom Quote)']);
        }
      }
    }`;

const regex = /\/\/ 2\. Seed Events if empty[\s\S]+?\} catch \(seedErr\)/;
dbContent = dbContent.replace(regex, newSeedingLogic + '\n  } catch (seedErr)');

fs.writeFileSync(dbPath, dbContent, 'utf8');
console.log('Successfully updated db.js seed logic');
