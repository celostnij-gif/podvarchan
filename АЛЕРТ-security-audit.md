# 🚨 АУДИТ БЕЗПЕКИ — podvarchan.com / admin.podvarchan.com
## Дата: 2026-07-14

---

## 1. 🟢 HTTP Security Headers — ХОРОШО

| Заголовок | Статус | Значення |
|---|---|---|
| `Strict-Transport-Security` | ✅ | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | ✅ | `nosniff` |
| `X-Frame-Options` | ✅ | `DENY` |
| `X-XSS-Protection` | ✅ | `1; mode=block` |
| `Referrer-Policy` | ✅ | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ✅ | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | ⚠️ | Налаштована, але є нюанси |

**CSP деталі:**
- ✅ `default-src 'self'`
- ✅ `object-src 'none'`
- ✅ `base-uri 'self'`
- ✅ `form-action 'self'`
- ⚠️ `script-src 'unsafe-inline' 'unsafe-eval'` — необхідно для Next.js, але знижує захист від XSS
- ⚠️ `img-src` не включає зовнішні джерела (R2), але все йде через `/api/media/` на тому ж домені, тому ОК

---

## 2. 🟢 Захист від атак на інфраструктуру

| Ендпоінт | Статус | Код |
|---|---|---|
| `/.env` | ✅ Заблоковано | 308 (redirect, route не існує) |
| `/.git/config` | ✅ Заблоковано | 308 |
| `/wp-admin` | ✅ Заблоковано | 308 |
| `/admin` (на сайті) | ✅ Заблоковано | 308 |
| `admin.podvarchan.com/admin` | ✅ | 308 (redirect на login) |

---

## 3. 🟢 Адмінка — Аутентифікація

| Тест | Результат |
|---|---|
| API без токена | ✅ `401 Unauthorized` |
| API з невалідним токеном | Не перевірено |
| Brute-force захист | Не знайдено rate limiting на login |
| Session expiration | Налаштовано через next-auth |

**⚠️ Потенційна проблема:** Відсутній rate limiting на `/api/auth/callback/credentials` — можливий brute-force підбір пароля.

---

## 4. 🟢 Contact Form API

| Тест | Результат |
|---|---|
| Без Turnstile токена | ✅ `403` — "Підтвердіть, що ви не робот" |
| Валідація довжини message | ✅ Мінімум 10 символів |
| XSS у name/email | ✅ Turnstile блокує запит без токена |
| HTML escape в email | ✅ `escapeHtml()` використовується |
| Rate limiting | ✅ `checkRateLimit()` + KV |

---

## 5. 🟡 Rate Limiting — Logging/Monitoring

- ✅ Rate limiting налаштовано через Cloudflare KV
- ⚠️ Немає fallback якщо KV недоступний
- ⚠️ Немає алертів при перевищенні ліміту

---

## 6. 🔴 ВРАЗЛИВОСТІ СЕРЕДНЬОГО РІВНЯ

### 6.1. AUTH_SECRET в коді
**Файл:** `wrangler.jsonc`
```json
"AUTH_SECRET": "local-dev-secret-key-podvarchan-2026-42-chars!"
```
**Проблема:** Значення AUTH_SECRET у кореневому wrangler.jsonc — це тестовий/dev ключ. Якщо цей конфіг потрапить у збірку, продакшен використовуватиме слабкий ключ.
**Рішення:** Видалити AUTH_SECRET з `wrangler.jsonc` і встановлювати через `wrangler secret put AUTH_SECRET` або через Cloudflare Dashboard → Workers → podvarchan-admin → Secrets.

### 6.2. AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET у .env
**Проблема:** OAuth credentials для Google зберігаються у `.env`, але не використовуються в коді (next-auth credentials provider). Якщо додати Google OAuth пізніше — переконатись, що secret встановлено через `wrangler secret`, а не у `vars`.
**Рішення:** Видалити з `.env` або закоментувати, якщо не використовується.

### 6.3. Metadata в robots.txt
**Проблема:** `sitemap.xml` публічно доступний — це нормально. Але деякі шляхи адмінки можуть індексуватись.
**Рішення:** Додати `Disallow: /admin` в robots.txt (якщо він є на сайті).

### 6.4. Server header leaks
**Проблема:** Відповіді містять `Server: cloudflare`. Хоча це не критично (Cloudflare додає це автоматично).
**Рішення:** Мінімальний ризик, можна проігнорувати.

---

## 7. ⚠️ ПОТЕНЦІЙНІ ПРОБЛЕМИ

### 7.1. CSP з unsafe-inline/unsafe-eval
**Проблема:** `'unsafe-inline'` та `'unsafe-eval'` у `script-src` дозволяють інлайн-скрипти та eval. Це необхідно для Next.js (hot reload, аналітика Google), але створює ризик XSS.
**Рішення:** Використовувати `nonce` або `strict-dynamic` для скриптів. Для Next.js це складно, але можна з `next.config.js` додати nonce до _next/static.

### 7.2. Відсутність Content-Type перевірки при завантаженні файлів
**Файл:** `apps/admin/src/app/api/admin/media/upload/route.ts`
**Проблема:** MIME type перевіряється з `file.type`, який можна підробити на клієнті.
**Рішення:** Додати перевірку magic bytes (file signature) на сервері перед збереженням у R2.

### 7.3. Відсутність CSRF захисту для API
**Проблема:** API-роути можуть бути вразливі до CSRF, якщо використовуються cookie для аутентифікації.
**Рішення:** Додати CSRF-токени для API-роутів, або використовувати SameSite=Strict для cookie.

---

## 8. 📊 ПІДСУМКОВА ОЦІНКА

| Категорія | Оцінка |
|---|---|
| HTTP Headers | 🟢 8/10 |
| Infrastructure | 🟢 10/10 |
| Authentication | 🟢 7/10 |
| API Security | 🟢 8/10 |
| CSP | 🟡 6/10 |
| Secrets Management | 🔴 5/10 |

**Загальна оцінка: 🟡 7/10 — Добре, але є що покращити**

---

## 🎯 ТОП-5 РЕКОМЕНДАЦІЙ ДО ВИПРАВЛЕННЯ

1. **🔴 Видалити AUTH_SECRET з wrangler.jsonc** — встановити через `wrangler secret put AUTH_SECRET`
2. **🟡 Прибрати `'unsafe-eval'` з CSP** — перевірити чи потрібен він в production
3. **🟡 Додати rate limiting на login** — захист від brute-force атак на /api/auth/callback/credentials
4. **🟡 Додати magic bytes перевірку** при завантаженні файлів (захист від MIME-type spoofing)
5. **🟡 Додати CSRF захист** для адмін-API роутів

---
*Аудит виконано автоматично. Рекомендується періодичний перегляд.*
