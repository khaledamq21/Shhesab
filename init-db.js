// ساخت جدول‌ها از schema.sql — یک‌بار اجرا کن:  npm run init-db
const fs = require('fs');
const path = require('path');
const pool = require('./db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✓ جدول‌های دیتابیس با موفقیت ساخته شدند.');
  } catch (e) {
    console.error('✗ خطا در ساخت جدول‌ها:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
