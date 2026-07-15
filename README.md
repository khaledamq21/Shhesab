# دفتر حساب — نسخه آنلاین با حساب کاربری

هر کاربر با نام کاربری و رمز خودش وارد می‌شود و دیتای کاملاً جدا دارد.
دیتا در PostgreSQL روی سرور ذخیره می‌شود و از هر دستگاهی قابل دسترسی است.

> اپ در نبود سرور هم کار می‌کند: اگر `window.LEDGER_API` خالی باشد، ثبت‌نام/ورود
> به صورت **محلی روی همان مرورگر** انجام می‌شود (بدون همگام‌سازی ابری).

---

## پیش‌نیازها
- **Node.js 18+** — از nodejs.org نصب کن
- **PostgreSQL** — یکی از این دو:
  - محلی روی ویندوز از postgresql.org
  - یا رایگان روی ابر: **Neon** (neon.tech) / **Railway** / **Render**

---

## راه‌اندازی محلی (روی کامپیوتر خودت)

۱) در پوشه `server` ترمینال باز کن و بسته‌ها را نصب کن:
```
npm install
```

۲) فایل تنظیمات را بساز (کپی از نمونه):
```
copy .env.example .env
```
سپس `.env` را باز کن و پر کن:
- `DATABASE_URL` = رشته اتصال دیتابیس‌ات
  - محلی مثال: `postgresql://postgres:رمزت@localhost:5432/ledger`
  - قبلش دیتابیس را بساز: در psql بزن `CREATE DATABASE ledger;`
- `JWT_SECRET` = یک رشته تصادفی طولانی. برای ساختنش:
  ```
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- اگر دیتابیس ابری است `PGSSL=true` بگذار.

۳) جدول‌ها را بساز:
```
npm run init-db
```

۴) سرور را اجرا کن:
```
npm start
```
پیام «سرور روی پورت 3000 اجرا شد» را می‌بینی.

۵) فایل اپ را وصل کن. دو راه:
- **ساده:** فایل `ledger_v15_accounts_search_theme.html` را داخل پوشه‌ای به نام
  `server/public/` کپی کن و نامش را `index.html` بگذار. حالا اپ از خود سرور باز می‌شود:
  `http://localhost:3000` — و چون هم‌دامنه است، در HTML مقدار
  `window.LEDGER_API = '';` را همان خالی بگذار.
- **جدا:** اگر فایل HTML را جای دیگری باز می‌کنی، بالای فایل بگذار:
  `window.LEDGER_API = 'http://localhost:3000';`

---

## بردن روی اینترنت (هاستینگ)

سه گزینه، از ساده به حرفه‌ای:

### گزینه ۱ — Railway (ساده‌ترین، دیتابیس داخلش هست)
1. در railway.app پروژه بساز و «PostgreSQL» اضافه کن.
2. سرویس جدید از روی همین پوشه `server` بساز (از گیت‌هاب یا آپلود).
3. متغیر `DATABASE_URL` را Railway خودش می‌دهد؛ `JWT_SECRET` و `PGSSL=true` را اضافه کن.
4. یک‌بار در ترمینال Railway `npm run init-db` بزن.
5. آدرسی که می‌دهد (مثل `https://xxx.up.railway.app`) را در HTML بگذار:
   `window.LEDGER_API = 'https://xxx.up.railway.app';`

### گزینه ۲ — Render + Neon
1. دیتابیس رایگان از **neon.tech** بگیر → `DATABASE_URL` را کپی کن (`PGSSL=true`).
2. در **render.com** یک Web Service بساز، Build: `npm install`، Start: `npm start`.
3. متغیرها را ست کن، سپس در Shell رندر `npm run init-db` بزن.

### گزینه ۳ — VPS (سرور مجازی لینوکس)
1. Node و PostgreSQL نصب کن، پوشه `server` را آپلود کن.
2. `npm install` → `.env` بساز → `npm run init-db`.
3. با `pm2` اجرا کن: `npm i -g pm2 && pm2 start server.js --name ledger`.
4. جلوی آن Nginx بگذار و SSL (Let's Encrypt) بزن.

> نکته امنیتی: در پروداکشن `CORS_ORIGIN` را به دامنه واقعی‌ات محدود کن،
> نه `*`.

---

## نکات مهم

- **رمزها هرگز خام ذخیره نمی‌شوند** — با bcrypt هش می‌شوند.
- **هر کاربر فقط به دیتای خودش دسترسی دارد** (از طریق توکن JWT).
- **کش آفلاین:** اپ دیتا را در localStorage هم نگه می‌دارد؛ اگر نت قطع شود
  کار می‌کنی و بعد خودکار سینک می‌شود.
- **بکاپ:** دکمه «دانلود بکاپ» در تنظیمات همچنان کار می‌کند و مستقل از سرور است.

## ساختار فایل‌ها
```
server/
├── server.js        سرور اصلی و مسیرهای API
├── db.js            اتصال به PostgreSQL
├── init-db.js       ساخت جدول‌ها (npm run init-db)
├── schema.sql       ساختار جدول‌ها
├── package.json
├── .env.example     نمونه تنظیمات (کپی کن به .env)
└── public/          (اختیاری) فایل index.html اپ را اینجا بگذار
```
