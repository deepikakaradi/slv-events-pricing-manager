const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'slv_events.db');
const db = new sqlite3.Database(dbPath);

const tables = ['activity_logs', 'notifications', 'quote_items', 'quotes', 'clients', 'pricing_rules', 'package_services', 'packages', 'services', 'events', 'users'];

db.serialize(() => {
  for (const table of tables) {
    db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
      if (err) console.error(`Error dropping ${table}:`, err.message);
    });
  }
  console.log('All tables dropped.');
});

db.close();
