# DEPLOY_CHECKLIST.md

**Проект:** Podvarchan.com  
**Дата останнього оновлення:** 2026-07-06

---

## Перед деплоєм

### 1. TypeScript
- [ ] `npx tsc --noEmit` — 0 помилок
- [ ] `npm run lint` — 0 помилок, 0 warnings

### 2. Build
- [ ] `npm run build` — 0 помилок
- [ ] `npx opennextjs-cloudflare build` — успішно
- [ ] Розмір бандла не перевищує 3 MiB (ліміт Workers Free)
- [ ] `optimizePackageImports` працює, `lucide-react`/`framer-motion` не роздуті

### 3. Unit tests
- [ ] `npx vitest run` — всі тести PASS
  - `seo/score.test.ts` — SEO score
  - `auth/permissions.test.ts` — ролі
  - `db/slug.test.ts` — генерація slug
  - `db/seed.test.ts` — ідемпотентність seed

### 4. E2E (Playwright)
- [ ] `npx playwright test` — 6 сценаріїв PASS
  - admin-login
  - admin-crud-service
  - admin-crud-blog
  - admin-page-builder
  - seo-manager
  - media-upload

### 5. SEO regression
- [ ] `node scripts/seo-regression.ts` — 0 регресій
- [ ] 132 URL (sitemap) — всі 200 OK
- [ ] canonical, hreflang, robots, Content-Type — без змін

### 6. D1 migration
- [ ] Міграції застосовані на production:
  ```bash
  npx wrangler d1 migrations apply DB --remote
  ```
- [ ] `drizzle/migrations/` синхронізовано з D1

### 7. Seed
- [ ] Seed запущено на production:
  ```bash
  npx tsx src/db/seed.ts
  ```
- [ ] Дані перевірено:
  - 19 послуг + переклади RU/UK
  - 7 категорій блогу + переклади
  - 9 FAQ + переклади
  - Сторінки + переклади
  - Навігація + контакти

### 8. GitHub Secrets
- [ ] Всі необхідні secrets додані в Settings → Secrets and variables → Actions:

| Secret | Status |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ |
| `CLOUDFLARE_DATABASE_ID` | ✅ |
| `AUTH_SECRET` | ✅ |
| `ADMIN_SEED_EMAIL` | ✅ |
| `ADMIN_SEED_PASSWORD` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | ✅ |
| `NEXT_PUBLIC_GA_ID` | ✅ |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ |
| `CONTACT_EMAIL` | ✅ |
| `TURNSTILE_SECRET_KEY` | ✅ |
| `RESEND_API_KEY` | ✅ |
| `DEPLOY` | ✅ |
|
| **Примітка:** Усі 13 secrets налаштовано станом на 2026-07-06.
### 9. Wrangler config
- [ ] `wrangler.jsonc`:
  - [ ] D1 binding (`DB`) — ✅
  - [ ] R2 buckets (`NEXT_INC_CACHE_R2_BUCKET`, `MEDIA_R2_BUCKET`) — ✅
  - [ ] KV namespace (`RATE_LIMIT_KV`) — ✅
  - [ ] WORKER_SELF_REFERENCE — ✅
  - [ ] `vars` — production значення
  - [ ] `compatibility_date` — актуальна
  - [ ] `nodejs_compat` — включено

### 10. Smoke tests (після деплою)
- [ ] `/admin/login` — 200, форма логіна
- [ ] `/` (RU) — 200, заголовок, метадані
- [ ] `/uk/` (UK) — 200
- [ ] `/uslugi/gipnoterapiya-onlayn/` — 200
- [ ] `/blog/` — 200
- [ ] `/ob-avtore/` — 200
- [ ] `/faq/` — 200
- [ ] `/kontakty/` — 200
- [ ] `/tseny/` — 200

### 11. Перевірка мета-тегів (curl)
- [ ] `curl -s -o /dev/null -w "%{http_code}" https://podvarchan.com/` — 200
- [ ] HTTP → HTTPS редирект працює
- [ ] `/?` → 308 `/` (trailing slash)
- [ ] `.html` → 410 Gone
- [ ] Неіснуюча сторінка → 404 (не 500)
- [ ] `curl -s https://podvarchan.com/robots.txt` — містить Sitemap
- [ ] `curl -s https://podvarchan.com/sitemap.xml` — 200, всі URL

### 12. INDEX.md
- [ ] `src/app/auth.md/` — оновлено для AI agents
- [ ] Містить актуальні endpoints та схеми
- [ ] `src/app/.well-known/agent-skills/` — всі сервіси описані

---

## Процес деплою

```bash
# 1. Переконатись що все закомічено
git status

# 2. Build
npm run build

# 3. Коміт
git add .
git commit -m "feat(admin): Phase N — опис"

# 4. Пуш → GitHub Actions автоматично деплоїть
git push

# 5. Моніторинг
# GitHub → Actions → останній run
# Перевірити що Deploy to Cloudflare — зелений

# 6. Post-deploy verification
# Виконати smoke tests з п. 10-11
```
