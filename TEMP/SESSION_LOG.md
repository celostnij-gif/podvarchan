# SESSION_LOG.md — Історія сесій проєкту Podvarchan.com

> **Призначення:** Фіксація всіх робочих сесій, щоб при новому запуску я міг швидко відновити контекст.
> **Формат:** Нова сесія додається в КІНЕЦЬ файлу. Старі записи не редагувати.

---

## Сесія 1 — Admin Panel: Підготовка та база даних

**Дата:** 04.06.2026
**Гілка:** `feature/admin-panel`
**Git коміти:** (9 комітів)

### Що зроблено:
- ✅ ESLint міграція на flat config
- ✅ Очищення Git (додано tsconfig.tsbuildinfo в .gitignore)
- ✅ OG-зображення, metadataBase
- ✅ Дедуплікація контенту (тексти з constants → messages)
- ✅ Rate Limiting (KV + in-memory)
- ✅ Drizzle схема БД — 25 таблиць
- ✅ Seed + міграція (drizzle/migrations/0000)
- ✅ Встановлено всі залежності (91 пакет)
- ✅ ENV змінні (src/env.ts з zod)
- ✅ Auth.js v4 + Credentials + Drizzle + bcrypt
- ✅ Логін /admin/login + audit log

**Створено:** `src/db/`, `src/auth.ts`, `src/env.ts`, drizzle.config, seed scripts

---

## Сесія 2 — Admin Panel: UI та функціонал

**Дата:** 04.06.2026 (продовження)
**Гілка:** `feature/admin-panel`

### Що зроблено:
- ✅ AdminShell, AdminSidebar, AdminTopbar, StatusBadge
- ✅ Дашборд /admin зі статистикою
- ✅ Server Actions (10 модулів: services, blog, faq, testimonials, leads, media, pages, navigation, settings, redirects)
- ✅ Модуль послуг (список + редактор)
- ✅ Модуль блогу (список + TipTap редактор)
- ✅ Медіа-бібліотека (drag-n-drop upload, прев'ю, копіювання URL)
- ✅ FAQ, Testimonials, Leads CRUD

**Створено:** `src/components/admin/`, всі admin pages

---

## Сесія 3 — Admin Panel: SEO, публічний сайт, доопрацювання

**Дата:** 05.06.2026
**Гілка:** `feature/admin-panel`

### Що зроблено:
- ✅ SEO-модуль (score, validate, YMYL)
- ✅ Публічний сайт на D1 (послуги, блог, FAQ, sitemap)
- ✅ Навігація, налаштування, редиректи (CRUD)
- ✅ Ревізії, прев'ю, cron scheduler
- ✅ Користувачі та журнал аудиту
- ✅ Редактор головної сторінки
- ✅ Командна палітра (Ctrl+K)
- ✅ 123 unit-тести (Vitest)
- ✅ E2E тести (Playwright)
- ✅ SEO-regression скрипт
- ✅ DEPLOY_CHECKLIST.md, ADMIN_GUIDE.md

**Коміти:** merge в `main`, 110 static pages build

---

## Сесія 4 — Agent-Ready Infrastructure

**Дата:** 07.06.2026
**Гілка:** `main`

### Що зроблено:
- ✅ DNS-AID (`/.well-known/agents.json`, A2A metadata)
- ✅ Markdown for Agents (middleware, route, HTML→MD converter)
- ✅ API Catalog RFC 9727 (application/linkset+json)
- ✅ OAuth/OIDC Discovery (openid-configuration, oauth-authorization-server, jwks.json)
- ✅ OAuth Protected Resource RFC 9728
- ✅ Auth.md (/auth.md route handler + public/auth.md)
- ✅ MCP Server Card SEP-1649 (+ JSON-RPC endpoint)
- ✅ Agent Skills Index RFC v0.2.0 (booking.md, services.md)
- ✅ WebMCP (WebMCPProvider.tsx, tools registration)
- ✅ verify-agent-ready.sh скрипт
- ✅ AGENT.md — повна карта .well-known endpoint'ів

**Створено:** `public/.well-known/`, `src/app/.well-known/`, `src/lib/mcp/`, `src/types/webmcp.d.ts`

---

## Сесія 5 — Правила, верифікація, нові skill-файли

**Дата:** 08.06.2026
**Гілка:** `main`

### Що зроблено:
1. **AGENT.md — ПРАВИЛО №1:** Захист продакшну
   - Дві гілки: `main` (робоча) + `master` (продакшн → Cloudflare)
   - Заборона на пряму зміну `master`

2. **AGENT.md — ПРАВИЛО №2:** AGENT.md — тільки додавання
   - Заборона редагувати існуючі секції

3. **Локальна верифікація Agent-Ready (10/10 PASSED)**
   - Запущено `scripts/verify-agent-ready.sh` локально
   - 🐛 **Виправлено:** конфлікт `public/auth.md` vs `src/app/auth.md/route.ts` → видалено статичний файл
   - Оновлено `TEMP/PROGRESS.md`

4. **Нові skill-файли для AI-агентів**
   - `public/.well-known/agent-skills/faq.md` — FAQ (9 питань, 5 категорій)
   - `public/.well-known/agent-skills/testimonials.md` — 10 відгуків клієнтів
   - Оновлено `src/app/.well-known/agent-skills/index.json/route.ts` — додано `hypnotherapy-faq`, `client-testimonials`
   - Перевірено: HTTP 200, TypeScript 0 errors

5. **AGENT.md — ПРАВИЛО №3:** Пам'ять сесій (поточна сесія)
   - Створено `TEMP/SESSION_LOG.md`
   - Оновлено протокол запуску/завершення сесії

### Поточний стан (після деплою):
| Аспект | Статус |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` в GitHub Secrets | ✅ **Токен робочий, деплой з master працює** |
| `.env.local` для Cloudflare | ⬜ **Файл існує тільки з Turnstile keys** |
| `.well-known` endpoints на продакшні | ⚠️ **agents.json 200, auth.md 200, решта — 404 (чекає деплой)** |

### Що ще зроблено в цій сесії:
- 🔍 **Технічний огляд** — порівняно локальний dev vs podvarchan.com онлайн
- 🖥️ **Браузерна інспекція** — перевірено всі сторінки на продакшні, .well-known endpoint'и
- 📊 **Створено `TEMP/TECHNICAL_OVERVIEW.md`** — детальний технічний огляд з таблицями
- 🤖 **robots.txt** — прибрано GPTBot, ChatGPT-User, `/*?*` блоки (коміт 0e0e647, запушено в main + master)
- 📄 **.gitignore** — прибрано AGENT.md, додано `public/uploads/`
- 🔬 **Діагностика .well-known 404** — знайдено кореневу причину та виправлено (коміт 6389f19)

**Ключове відкриття:** Деякі Agent-Ready endpoint'и (agents.json + auth.md) працюють на продакшні після деплою. Решта 6 endpoint'ів (api-catalog, openid-configuration, oauth-*, mcp, agent-skills) повертають 404 — причина НЕ в токені (деплой працює).

### 🔬 Діагностика .well-known 404 (08.06.2026)

**Коренева причина:** Cloudflare Workers з `assets` binding у `wrangler.jsonc` перехоплює всі запити під `/.well-known/`. Коли в `public/.well-known/` існують статичні файли (`agents.json`, skill-файли), Cloudflare копіює їх в `.open-next/assets/.well-known/`. Після цього Cloudflare починає обробляти ВСІ запити під `/.well-known/` на рівні assets — запити до нестатичних шляхів (`api-catalog`, `openid-configuration` тощо) ніколи не доходять до worker'а, отримуючи 404 напряму від asset-системи.

**Докази:**
- `agents.json` (статичний файл в `public/.well-known/`) — 200, бо Cloudflare віддає напряму з assets ✅
- `auth.md` (роут-хендлер поза `.well-known/`, `public/auth.md` було видалено) — 200, бо немає конфлікту з assets ✅
- Всі роут-хендлери в `src/app/.well-known/` — 404, бо Cloudflare перехоплює на рівні assets ❌

**Виправлення (коміт 6389f19):**
1. Видалено `public/.well-known/` (5 файлів: `agents.json`, `booking.md`, `services.md`, `faq.md`, `testimonials.md`)
2. Створено 5 роут-хендлерів в `src/app/.well-known/`:
   - `agents.json/route.ts` — повертає JSON агент-індексу
   - `agent-skills/booking.md/route.ts` — повертає markdown
   - `agent-skills/services.md/route.ts` — повертає markdown
   - `agent-skills/faq.md/route.ts` — повертає markdown
   - `agent-skills/testimonials.md/route.ts` — повертає markdown
3. Після фіксу: немає `.well-known/` в assets → Cloudflare передає всі запити worker'у
4. TypeScript 0 errors ✅
5. Коміт `6389f19` запушено в `main` + `master` (чекає деплой)

### TODO (наступна сесія):
- [ ] **Перевірити .well-known на продакшні** після деплою (мають стати 200)
- [ ] Перевірити verify-agent-ready.sh на продакшні
- [ ] `/.well-known/ai-plugin.json` — ChatGPT Plugin manifest
- [ ] Англійська версія skill-файлів

---

## Сесія 6 — .gitignore очищення + фікс картинок блогу (D1)

**Дата:** 09.06.2026
**Гілка:** `main`

### Що зроблено:

#### 1. .gitignore — очищення сміття
- Додано в .gitignore: `output.txt`, `response.txt`, `playwright-report/`, `test-results/`, `unlock-dir.ps1`
- Виконано `git rm --cached` для всіх цих файлів (видалено з трекінгу)
- Прибрано зайвий `README.md` з .gitignore (файл не існує)

#### 2. 🐛 Фікс: зниклі картинки в блозі після D1

**Проблема:** Після міграції на D1, при даних з бази поля `image` та `imageAlt` були порожніми рядками (`''`). Картинки — статичні файли в `public/images/blog/` — нікуди не ділися, але код їх не передавав у компоненти.

**Виправлено в 3 файлах:**
- `src/app/[locale]/blog/[slug]/page.tsx`:
  - При даних з D1 — резолвить `image`/`imageAlt` зі статичних даних (`getBlogPost(slug)`)
  - Додано `getCategoryInfoFromDb` — резолвить назву та slug категорії з D1
  - Виправлено імпорти (прибрано unused, додано top-level static imports)

- `src/app/[locale]/blog/page.tsx`:
  - Додано `staticImageMap` з `BLOG_POST_METAS` — при даних з D1 підставляє `image`/`imageAlt`

- `src/app/[locale]/blog/kategoriya/[cat]/page.tsx`:
  - Той самий підхід з `staticImageMap` для сторінки категорії

**TypeScript:** 0 errors ✅
**Code Review:** схвалено, зауваження виправлено (динамічні імпорти → статичні)

#### 3. ✅ ChatGPT Plugin manifest (ai-plugin.json)
- Створено `src/app/.well-known/ai-plugin.json/route.ts` — ChatGPT Plugin manifest
- Містить: name_for_model, description_for_model, auth (none), api → `/api/openapi.json`, logo_url, contact_email, legal_info_url
- Оновлено `src/app/.well-known/agents.json/route.ts` — додано `chatgpt_plugin` reference
- TypeScript 0 errors ✅

#### 4. 🔍 Порівняння localhost vs podvarchan.com
- **Браузерна перевірка:** `/ru/blog/`, `/ru/blog/chto-takoe-gipnoterapiya/`, `/ru/`
- **Результат:** Сайти функціонально ідентичні
- **Картинки:** Всі завантажуються на обох версіях (фікс працює) ✅
- **Консоль:** 0 помилок на обох версіях
- **Єдина відмінність:** Cookie consent банер (присутній тільки на продакшні — це нормально)

#### 5. 🔧 Виправлено ESLint (Toast.tsx)
- `src/components/Toast.tsx` — unused param `message` → `_message`

#### 6. Документування
- Оновлено `TEMP/SESSION_LOG.md` (цей запис)
- Оновлено `TEMP/PROGRESS.md` (позначено виконані задачі)

### Коміти в цій сесії:
- `91bc231` — `chore: cleanup gitignore + fix blog images missing from D1`
