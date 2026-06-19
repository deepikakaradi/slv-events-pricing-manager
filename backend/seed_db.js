const db = require('./db');

async function seed() {
  console.log('Initializing database...');
  await db.initializeDatabase();
  console.log('Database initialized successfully.');
  process.exit(0);
}

seed();
