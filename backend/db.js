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
        ['Engagement', 'Sophisticated family gatherings and ring ceremony celebrations'],
        ['Reception', 'Splendid post-wedding dining and entertainment evenings'],
        ['Custom Event', 'Tailored event management with custom selected services']
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
        ['Premium Catering (Per Guest)', 'Catering', 3735.0, 'Includes high-quality multicourse buffet options, beverages, and desserts'],
        ['Standard Catering (Per Guest)', 'Catering', 2075.0, 'Classic buffet service with essential food and soft drinks'],
        ['Royal Stage Decoration', 'Decoration', 124500.0, 'Handcrafted floral stage arrangements, thematic backdrops, and mood lighting'],
        ['Minimalist Decoration', 'Decoration', 41500.0, 'Simple floral accents, clean styling, and seating arrangements'],
        ['Premium Sound & DJ Set', 'Audio/Visual', 66400.0, 'Top-tier sound systems, party lighting rig, and professional event DJ'],
        ['Standard Sound System', 'Audio/Visual', 24900.0, 'Microphones, standard speakers, and ambient music setup'],
        ['HD Photography & Video', 'Photography', 99600.0, 'Full-day event coverage, edited high-resolution photos, and 5-min highlight video'],
        ['Basic Photography', 'Photography', 41500.0, '4-hour event photoshoot with digital photo delivery'],
        ['Luxury Suite Room', 'Venue Support', 33200.0, 'Air-conditioned room with vanity mirrors and refreshments'],
        ['Live Musical Band', 'Entertainment', 166000.0, '4-piece live band performance for cocktail hours or main show'],
        ['Event Coordinator Services', 'Management', 49800.0, 'On-site supervisor to manage timelines, vendors, and guest support']
      ];
      for (const s of defaultServices) {
        await query('INSERT INTO services (name, category, standard_price, description) VALUES ($1, $2, $3, $4)', s);
      }
    }

    // 4. Seed default packages if empty
    const packageCheck = await query('SELECT count(*) as count FROM packages');
    if (parseInt(packageCheck.rows[0].count) === 0) {
      console.log('Seeding initial packages and guest count pricing rules...');
      // Get Wedding and Birthday event IDs
      const eventsList = await query('SELECT id, name FROM events');
      const wedding = eventsList.rows.find(e => e.name === 'Wedding');
      const birthday = eventsList.rows.find(e => e.name === 'Birthday');

      if (wedding) {
        // Silver package: Wedding, Silver, base 415000
        const resSilver = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          ['Wedding Silver Package', wedding.id, 'Silver', 415000.0]);
        const pSilverId = isPostgres ? resSilver.rows[0].id : resSilver.insertId;
        
        // Link services to Silver (Standard Catering, Minimalist Deco, Standard Sound, Basic Photo)
        for (const sId of [2, 4, 6, 8]) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pSilverId, sId]);
        }

        // Gold package: Wedding, Gold, base 996000
        const resGold = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          ['Wedding Gold Deluxe', wedding.id, 'Gold', 996000.0]);
        const pGoldId = isPostgres ? resGold.rows[0].id : resGold.insertId;
        for (const sId of [1, 3, 5, 7, 11]) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pGoldId, sId]);
        }

        // Platinum package: Wedding, Platinum, base 1826000
        const resPlatinum = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id', 
          ['Wedding Royal Platinum', wedding.id, 'Platinum', 1826000.0]);
        const pPlatId = isPostgres ? resPlatinum.rows[0].id : resPlatinum.insertId;
        for (const sId of [1, 3, 5, 7, 9, 10, 11]) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [pPlatId, sId]);
        }

        // Pricing rules for Wedding packages
        // Guest slabs: 50 Guests (multiplier 0.8), 100 Guests (1.0), 200 Guests (1.3), 500 Guests (1.8)
        const pkgs = [pSilverId, pGoldId, pPlatId];
        for (const pkgId of pkgs) {
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 0, 75, 0.8, $2)', [pkgId, 'Small Gathering (<75 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 76, 150, 1.0, $2)', [pkgId, 'Standard Size (76-150 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 151, 300, 1.4, $2)', [pkgId, 'Large Gathering (151-300 guests)']);
          await query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, 301, 9999, 2.0, $2)', [pkgId, 'Grand Gala (300+ guests)']);
        }
      }

      if (birthday) {
        // Silver Birthday: 124500 base
        const resBdaySilver = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id',
          ['Birthday Silver Bash', birthday.id, 'Silver', 124500.0]);
        const bSilverId = isPostgres ? resBdaySilver.rows[0].id : resBdaySilver.insertId;
        for (const sId of [2, 4, 6]) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [bSilverId, sId]);
        }

        // Gold Birthday: 290500 base
        const resBdayGold = await query('INSERT INTO packages (name, event_id, tier, base_price) VALUES ($1, $2, $3, $4) RETURNING id',
          ['Birthday Golden Glow', birthday.id, 'Gold', 290500.0]);
        const bGoldId = isPostgres ? resBdayGold.rows[0].id : resBdayGold.insertId;
        for (const sId of [1, 3, 6, 8]) {
          await query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [bGoldId, sId]);
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
