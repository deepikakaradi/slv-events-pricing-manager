const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'slv_events.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('UPDATE services SET standard_price = standard_price * 83', function(err) {
    if (err) return console.error('Error updating services:', err.message);
    console.log(`Updated ${this.changes} services to INR.`);
  });
  
  db.run('UPDATE packages SET base_price = base_price * 83', function(err) {
    if (err) return console.error('Error updating packages:', err.message);
    console.log(`Updated ${this.changes} packages to INR.`);
  });
});

db.close();
