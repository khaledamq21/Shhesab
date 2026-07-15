-- ══════════════════════════════════════════════════════════
--  دفتر حساب — ساختار دیتابیس PostgreSQL
--  هر کاربر یک ردیف در users و یک ردیف دیتا در ledgers دارد
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- دیتای هر کاربر به صورت JSONB نگه داشته می‌شود؛
-- دقیقاً همان ساختاری که اپ در localStorage داشت: { txs:[...], card:{...} }
CREATE TABLE IF NOT EXISTS ledgers (
  user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{"txs":[],"card":{"name":"کارت محصولات","init":0}}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جستجوی سریع نام کاربری (نام کاربری همیشه با حروف کوچک ذخیره می‌شود)
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
