import { db } from './db.js';

async function testDb() {
  try {
    // Try a simple query (change table name if needed)
    const result = await db.execute('SELECT 1 as test_value');
    console.log('Turso DB connection successful:', result);
    process.exit(0);
  } catch (err) {
    console.error('Turso DB connection failed:', err);
    process.exit(1);
  }
}

testDb();
