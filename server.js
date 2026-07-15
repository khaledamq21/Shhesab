// ══════════════════════════════════════════════════════════
//  دفتر حساب — سرور Express + PostgreSQL
//  مسیرها:
//    POST /api/register  { username, password, name }  → { token, user }
//    POST /api/login     { username, password }         → { token, user }
//    GET  /api/data                                     → { data }   (نیازمند توکن)
//    PUT  /api/data      { data:{ txs, card } }          → { ok }     (نیازمند توکن)
//    GET  /api/health                                    → { ok }
//  فایل اپ (HTML) هم از همین سرور سرو می‌شود (پوشه public).
// ══════════════════════════════════════════════════════════
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()) }));
app.use(express.json({ limit: '5mb' })); // دیتای دفتر حساب معمولاً کوچک است

// ── سرو کردن فایل اپ (اختیاری): هر چیزی در پوشه public ──
app.use(express.static(path.join(__dirname, 'public')));

// ── ابزارها ──
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '90d' });
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'وارد نشده‌اید' });
  try {
    req.user = jwt.verify(m[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'نشست منقضی شده؛ دوباره وارد شو' });
  }
}
const cleanUser = (v) => String(v || '').trim().toLowerCase();
const validUser = (u) => /^[a-z0-9_.]{3,20}$/.test(u);

// ── سلامت ──
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── ثبت‌نام ──
app.post('/api/register', async (req, res) => {
  try {
    const username = cleanUser(req.body.username);
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim() || username;
    if (!validUser(username)) return res.status(400).json({ error: 'نام کاربری باید ۳ تا ۲۰ حرف/عدد انگلیسی باشد' });
    if (password.length < 6) return res.status(400).json({ error: 'رمز عبور حداقل ۶ کاراکتر باشد' });

    const hash = await bcrypt.hash(password, 10);
    let row;
    try {
      const q = await pool.query(
        'INSERT INTO users (username, name, password_hash) VALUES ($1,$2,$3) RETURNING id, username, name',
        [username, name, hash]
      );
      row = q.rows[0];
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'این نام کاربری قبلاً ثبت شده' });
      throw e;
    }
    // ردیف دیتای خالی برای کاربر
    await pool.query('INSERT INTO ledgers (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [row.id]);

    res.json({ token: signToken(row), user: { id: row.id, username: row.username, name: row.name } });
  } catch (e) {
    console.error('register:', e);
    res.status(500).json({ error: 'خطای سرور در ثبت‌نام' });
  }
});

// ── ورود ──
app.post('/api/login', async (req, res) => {
  try {
    const username = cleanUser(req.body.username);
    const password = String(req.body.password || '');
    const q = await pool.query('SELECT id, username, name, password_hash FROM users WHERE username=$1', [username]);
    const u = q.rows[0];
    if (!u) return res.status(401).json({ error: 'نام کاربری یا رمز اشتباه است' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'نام کاربری یا رمز اشتباه است' });
    res.json({ token: signToken(u), user: { id: u.id, username: u.username, name: u.name } });
  } catch (e) {
    console.error('login:', e);
    res.status(500).json({ error: 'خطای سرور در ورود' });
  }
});

// ── دریافت دیتای کاربر ──
app.get('/api/data', auth, async (req, res) => {
  try {
    const q = await pool.query('SELECT data FROM ledgers WHERE user_id=$1', [req.user.id]);
    const data = q.rows[0] ? q.rows[0].data : { txs: [], card: { name: 'کارت محصولات', init: 0 } };
    res.json({ data });
  } catch (e) {
    console.error('get data:', e);
    res.status(500).json({ error: 'خطا در دریافت داده‌ها' });
  }
});

// ── ذخیره دیتای کاربر ──
app.put('/api/data', auth, async (req, res) => {
  try {
    const data = req.body.data;
    if (!data || !Array.isArray(data.txs)) return res.status(400).json({ error: 'ساختار داده نامعتبر است' });
    await pool.query(
      `INSERT INTO ledgers (user_id, data, updated_at) VALUES ($1,$2,now())
       ON CONFLICT (user_id) DO UPDATE SET data=$2, updated_at=now()`,
      [req.user.id, data]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('put data:', e);
    res.status(500).json({ error: 'خطا در ذخیره داده‌ها' });
  }
});

app.listen(PORT, () => console.log(`✓ سرور دفتر حساب روی پورت ${PORT} اجرا شد → http://localhost:${PORT}`));
