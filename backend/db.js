const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

// Choose DB Connection
if (process.env.DATABASE_URL || process.env.DB_HOST) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') 
        ? { rejectUnauthorized: false } 
        : false
    });
    dbType = 'postgres';
    console.log('Database configuration detected. Using PostgreSQL.');
  } catch (err) {
    console.warn('Failed to initialize PostgreSQL pool. Falling back to SQLite.', err.message);
    dbType = 'sqlite';
  }
} else {
  console.log('No PostgreSQL configuration found. Using SQLite database locally.');
  dbType = 'sqlite';
}

// Initialize SQLite if selected
if (dbType === 'sqlite') {
  const dbPath = path.join(__dirname, 'slv_events.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
    }
  });
}

/**
 * Executes an SQL query with parameters.
 * Translates PostgreSQL placeholders ($1, $2, etc.) to SQLite placeholders (?) automatically when using SQLite.
 * Returns an object with { rows } containing the array of results to match pg.
 */
function query(sqlText, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pgPool.query(sqlText, params, (err, res) => {
        if (err) {
          console.error('PostgreSQL Query Error:', err, 'SQL:', sqlText);
          reject(err);
        } else {
          resolve(res);
        }
      });
    } else {
      // Translate PostgreSQL placeholder syntax ($1, $2) to SQLite (?)
      let translatedSql = sqlText.replace(/\$\d+/g, '?');
      const upperSql = translatedSql.trim().toUpperCase();

      if (upperSql.startsWith('SELECT')) {
        sqliteDb.all(translatedSql, params, function (err, rows) {
          if (err) {
            console.error('SQLite SELECT Error:', err, 'SQL:', translatedSql);
            reject(err);
          } else {
            resolve({ rows: rows || [] });
          }
        });
      } else if (upperSql.startsWith('INSERT')) {
        // Strip RETURNING clause for SQLite
        let cleanSql = translatedSql;
        if (upperSql.includes('RETURNING')) {
          cleanSql = translatedSql.replace(/RETURNING\s+[\w\s,.*"]+$/i, '').trim();
        }
        sqliteDb.run(cleanSql, params, function (err) {
          if (err) {
            console.error('SQLite INSERT Error:', err, 'SQL:', cleanSql);
            reject(err);
          } else {
            resolve({ 
              rows: [{ id: this.lastID }],
              insertId: this.lastID,
              affectedRows: 1
            });
          }
        });
      } else {
        sqliteDb.run(translatedSql, params, function (err) {
          if (err) {
            console.error('SQLite Command Error:', err, 'SQL:', translatedSql);
            reject(err);
          } else {
            resolve({ 
              rows: [{ id: this.lastID, changes: this.changes }],
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      }
    }
  });
}

/**
 * Initializes the database schema and seeds initial data.
 */
async function initializeDatabase() {
  const isPostgres = (dbType === 'postgres');
  
  // Define DDL query blocks using SQL compatible with both databases
  const tableQueries = [
    // Users
    `CREATE TABLE IF NOT EXISTS users (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Events
    `CREATE TABLE IF NOT EXISTS events (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Services
    `CREATE TABLE IF NOT EXISTS services (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      standard_price REAL NOT NULL,
      gst_rate REAL DEFAULT 18.0,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Packages
    `CREATE TABLE IF NOT EXISTS packages (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      tier TEXT NOT NULL,
      base_price REAL NOT NULL,
      is_published INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // PackageServices
    `CREATE TABLE IF NOT EXISTS package_services (
      package_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      PRIMARY KEY (package_id, service_id)
    )`,

    // PricingRules
    `CREATE TABLE IF NOT EXISTS pricing_rules (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      package_id INTEGER NOT NULL,
      guest_min INTEGER NOT NULL,
      guest_max INTEGER NOT NULL,
      price_multiplier REAL DEFAULT 1.0,
      description TEXT
    )`,

    // Clients
    `CREATE TABLE IF NOT EXISTS clients (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Quotes
    `CREATE TABLE IF NOT EXISTS quotes (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      client_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      guest_count INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0.0,
      tax REAL DEFAULT 0.0,
      final_price REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      summary TEXT,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // QuoteItems
    `CREATE TABLE IF NOT EXISTS quote_items (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      quote_id INTEGER NOT NULL,
      service_id INTEGER,
      name TEXT NOT NULL,
      custom_price REAL NOT NULL,
      quantity INTEGER DEFAULT 1
    )`,

    // Notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id INTEGER,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // ActivityLogs
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id INTEGER,
      action TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Execute DDLs
  for (const q of tableQueries) {
    await query(q);
  }
  console.log('Database tables verified/created.');

  // Programmatic Seeding
  try {
    // 1. Seed Users if empty
    const userCheck = await query('SELECT count(*) as count FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    if (userCount === 0) {
      console.log('Seeding default users...');
      const adminHash = await bcrypt.hash('admin123', 10);
      const salesHash = await bcrypt.hash('sales123', 10);
      
      await query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', 
        ['SLV Admin', 'admin@slvevents.com', adminHash, 'admin']);
      await query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', 
        ['SLV Sales Team', 'sales@slvevents.com', salesHash, 'sales']);
      console.log('Default users seeded: admin@slvevents.com/admin123 & sales@slvevents.com/sales123');
    }

            // 2. Seed Events if empty
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
        const cateringName = `${evt.name} Catering (Per Guest)`;
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
          [`${evt.name} Silver Package`, evt.id, 'Silver', baseSilver]);
        const pSilverId = resSilver.insertId || resSilver.rows?.[0]?.id;
        
        const silverServices = [cateringId, getSvcId('Minimalist Decoration'), getSvcId('Standard Sound System')].filter(Boolean);
        for (const sId of silverServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pSilverId, sId]);
        }

        // Gold Package
        const resGold = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [`${evt.name} Gold Package`, evt.id, 'Gold', baseGold]);
        const pGoldId = resGold.insertId || resGold.rows?.[0]?.id;
        
        const goldServices = [cateringId, getSvcId('Royal Stage Decoration'), getSvcId('Premium Sound & DJ Set'), getSvcId('Basic Photography')].filter(Boolean);
        for (const sId of goldServices) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pGoldId, sId]);
        }

        // Platinum Package
        const resPlatinum = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          [`${evt.name} Platinum Package`, evt.id, 'Platinum', basePlatinum]);
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
    }
  } catch (seedErr) {
    console.error('Error seeding data:', seedErr.message);
  }
}

module.exports = {
  query,
  initializeDatabase,
  getDbType: () => dbType
};
