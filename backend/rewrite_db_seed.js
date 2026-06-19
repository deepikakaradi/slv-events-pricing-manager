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
        ['Wedding Catering (Per Guest)', 'Catering', 45.0, 'Premium multicourse buffet options'],
        ['Birthday Catering (Per Guest)', 'Catering', 25.0, 'Classic buffet service with essential food'],
        ['Corporate Catering (Per Guest)', 'Catering', 35.0, 'Professional catering for business events'],
        ['Anniversary Catering (Per Guest)', 'Catering', 30.0, 'Elegant catering for anniversaries'],
        ['Royal Stage Decoration', 'Decoration', 15000.0, 'Handcrafted floral stage arrangements'],
        ['Minimalist Decoration', 'Decoration', 5000.0, 'Simple floral accents and clean styling'],
        ['Premium Sound & DJ Set', 'Audio/Visual', 8000.0, 'Top-tier sound systems and DJ'],
        ['Standard Sound System', 'Audio/Visual', 3000.0, 'Microphones and ambient music setup'],
        ['HD Photography & Video', 'Photography', 12000.0, 'Full-day event coverage'],
        ['Basic Photography', 'Photography', 5000.0, '4-hour event photoshoot'],
        ['Luxury Suite Room', 'Venue Support', 4000.0, 'Air-conditioned room with vanity mirrors'],
        ['Live Musical Band', 'Entertainment', 20000.0, '4-piece live band performance'],
        ['Event Coordinator Services', 'Management', 6000.0, 'On-site supervisor to manage timelines']
      ];
      for (const s of defaultServices) {
        await query('INSERT INTO services (name, category, standard_price, description) VALUES ($1, $2, $3, $4)', s);
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

        // Silver Package (8000)
        const resSilver = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Silver Package\`, evt.id, 'Silver', 8000.0]);
        const pSilverId = resSilver.insertId || resSilver.rows?.[0]?.id;
        
        const silverServices = [cateringId, getSvcId('Minimalist Decoration'), getSvcId('Standard Sound System')].filter(Boolean);
        for (const sId of silverServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pSilverId, sId]);
        }

        // Gold Package (12000)
        const resGold = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Gold Package\`, evt.id, 'Gold', 12000.0]);
        const pGoldId = resGold.insertId || resGold.rows?.[0]?.id;
        
        const goldServices = [cateringId, getSvcId('Royal Stage Decoration'), getSvcId('Premium Sound & DJ Set'), getSvcId('Basic Photography')].filter(Boolean);
        for (const sId of goldServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pGoldId, sId]);
        }

        // Platinum Package (20000)
        const resPlatinum = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [\`\${evt.name} Platinum Package\`, evt.id, 'Platinum', 20000.0]);
        const pPlatId = resPlatinum.insertId || resPlatinum.rows?.[0]?.id;
        
        const platServices = [cateringId, getSvcId('Royal Stage Decoration'), getSvcId('Premium Sound & DJ Set'), getSvcId('HD Photography & Video'), getSvcId('Event Coordinator Services')].filter(Boolean);
        for (const sId of platServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pPlatId, sId]);
        }

        // Pricing Rules
        const pkgs = [pSilverId, pGoldId, pPlatId];
        for (const pkgId of pkgs) {
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 20, 99, 0.8, $2)', [pkgId, 'Small (20-99 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 100, 299, 1.0, $2)', [pkgId, 'Standard (100-299 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 300, 599, 1.4, $2)', [pkgId, 'Large (300-599 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 600, 9999, 2.0, $2)', [pkgId, 'Grand (600+ guests)']);
        }
      }
    }`;

const regex = /\/\/ 2\. Seed Events if empty[\s\S]+?\} catch \(seedErr\)/;
dbContent = dbContent.replace(regex, newSeedingLogic + '\n  } catch (seedErr)');

fs.writeFileSync(dbPath, dbContent, 'utf8');
console.log('Successfully updated db.js seed logic');
