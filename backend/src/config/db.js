const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/001_init.sql'),
    'utf8'
  );
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migrations applied successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, runMigrations };
