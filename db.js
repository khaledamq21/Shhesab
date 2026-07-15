// اتصال مشترک به PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL تنظیم نشده. فایل .env را بساز (از .env.example کپی کن).');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: String(process.env.PGSSL).toLowerCase() === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('خطای غیرمنتظره در Pool:', err));

module.exports = pool;
