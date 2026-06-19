const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'slv_events.db');

try {
  fs.unlinkSync(dbPath);
  console.log('Successfully deleted the database file.');
} catch (err) {
  console.error('Error deleting the database file:', err.message);
}
