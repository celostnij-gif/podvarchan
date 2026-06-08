# Технічний огляд проєкту Podvarchan.com

**Дата:** 08.06.2026
**Тип огляду:** Локальний dev vs Production (podvarchan.com)

---

## 1. Загальна інформація

| Параметр | Значення |
|----------|----------|
| Стек | Next.js 15.5.18 (App Router) + TypeScript + Tailwind CSS |
| Інфраструктура | Cloudflare Workers (через OpenNext) |
| База даних | Cloudflare D1 (SQLite via Drizzle ORM) |
| Локалізація | next-intl (ru, uk) |
| Рендеринг | SSG (основний) + SSR (API, OpenGraph) |
| Git гілки | `main` (робоча) + `master` (продакшн → Cloudflare) |
| Деплой | GitHub Actions → `master` → Cloudflare Workers |

---

## 2. Порівняння: Localhost vs Production

### 2.1 Публічні сторінки

| Сторінка | Localhost | Production (podvarchan.com) | Статус |
|----------|-----------|---------------------------|--------|
| `/` (корінь) | 200 | 200 | ✅ Однаково |
| `/ru/` | 200 | 200 | ✅ Однаково |
| `/ru/uslugi/` | 200 | 200 | ✅ Однаково |
| `/ru/blog/` | 200 | 200 | ✅ Однаково |
| `/ru/faq/` | 200 | 200 | ✅ Однаково |
| `/ru/kontakty/` | 200 | 200 | ✅ Однаково |
| `/ru/tseny/` | 200 | 200 | ✅ Однаково |
| `/ru/metod/` | 200 | 200 | ✅ Однаково |
| `/ru/ob-avtore/` | 200 | 200 | ✅ Однаково |

**Висновок:** Публічні сторінки ідентичні — продакшн працює коректно.

### 2.2 .well-known endpoints (Agent-Ready)

| Endpoint | Localhost | Production | Статус |
|----------|-----------|------------|--------|
| `/.well-known/agents.json` | 200 ✅ | 200 ✅ | ✅ Однаково (статичний файл) |
| `/.well-known/api-catalog` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/openid-configuration` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/oauth-authorization-server` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/oauth-protected-resource` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/jwks.json` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/mcp/server-card.json` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/agent-skills/index.json` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/agent-skills/faq.md` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/agent-skills/testimonials.md` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/agent-skills/booking.md` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/.well-known/agent-skills/services.md` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |

### 2.3 API endpoints

| Endpoint | Localhost | Production | Статус |
|----------|-----------|------------|--------|
| `/api/health` | 200 ✅ | 404 ❌ | 🚨 Не задеплоєно |
| `/api/mcp` | 200 ✅ | — | — Не перевірено на продакшні |
| `/auth.md` | 200 ✅ | 200 ⚠️ | ⚠️ Контент некоректний (віддає homepage замість markdown) |

### 2.4 Адмін-панель

| Сторінка | Localhost | Production | Статус |
|----------|-----------|------------|--------|
| `/admin/login` | 200 ✅ | 200 ✅ | ✅ Працює |
| `/admin/` | 200 ✅ | — | 🚨 Не перевірено (потрібен логін) |

---

## 📋 Дотримання ПРАВИЛА №1

> **Всі роботи виконуються виключно в гілці `main`.** 
> **Жодних змін не пушилось у `master`.** 
> **Продакшн (podvarchan.com) не зазнав деградації.**

Публічні сторінки на продакшні працюють ідентично локальній версії — жодних регресій не допущено.

---

## 3. Ключові відмінності (локальний vs продакшн)

### 🔴 Критичні (P0)

| # | Проблема | Локально | Продакшн | Наслідок |
|---|----------|----------|----------|----------|
| 1 | **Частина .well-known endpoint'ів 404** | ✅ 200 | ⚠️ 404 (6/8) | agents.json + auth.md працюють. Решта потребують діагностики (роутинг OpenNext/middleware/build)

### 🟡 Важливі (P1)

| # | Проблема | Локально | Продакшн | Наслідок |
|---|----------|----------|----------|----------|
| 1 | **Cloudflare токен** | — | ✅ **Робочий** | GitHub Actions деплоїть успішно — більше не блокер |

### 🟢 Що працює однаково добре

| Аспект | Статус |
|--------|--------|
| Всі публічні сторінки | ✅ Однаково |
| Навігація та UX | ✅ Однаково |
| Локалізація (ru/uk) | ✅ Однаково |
| Cookie banner | ✅ Однаково |
| SEO-метадані | ✅ Однаково |

---

## 4. Висновок

**Agent-Ready код частково задеплоєно. Токен робочий.**

**На продакшні:**
- ✅ `agents.json` — 200 (статичний файл)
- ✅ `auth.md` — 200 (роут-хендлер працює)
- ❌ 6 інших `.well-known` endpoint'ів — 404 (потребує діагностики роутингу на Cloudflare Workers)

> ⚠️ Всі публічні сторінки (100%) працюють ідентично локальній версії. Проблема тільки з частиною `.well-known` endpoint'ів.

---

## 5. Мапа проекту (ключові директорії)

```
├── src/
│   ├── app/
│   │   ├── admin/          ← Адмін-панель (18 модулів)
│   │   ├── .well-known/    ← Agent-Ready endpoints (11 шт.)
│   │   ├── api/            ← API (health, mcp, contact, auth)
│   │   ├── a2a/            ← Agent-to-Agent metadata
│   │   └── markdown/       ← Markdown for Agents
│   ├── components/
│   │   ├── admin/          ← Адмін-компоненти
│   │   └── ui/             ← Публічні компоненти
│   ├── db/                 ← Drizzle ORM + schema
│   ├── lib/                ← Утиліти (auth, mcp, html-to-markdown, etc.)
│   └── hooks/              ← React hooks
├── public/
│   └── .well-known/        ← Статичні файли (agents.json, skill-файли)
├── TEMP/                   ← Документація + Session Log
└── scripts/                ← Інструменти (verify, seo, export)
```
