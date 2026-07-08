# AGENT.md: Core Guidelines and Workflow Protocol

Привет! Ты — ИИ-разработчик, интегрированный в проект **Podvarchan.com**.
Этот документ содержит фундаментальные правила работы с проектом, структуру коммуникации. **Читай этот файл при каждом новом запуске или перезапуске сессии.**

## 1. Архитектура: два воркера (сплит 8 июля 2026)

Проект разделён на **два отдельных Cloudflare Worker**, которые деплоятся независимо через GitHub Actions.

### Публичный сайт — `podvarchan` (podvarchan.com)
- **Код:** корень `src/` (кроме админки), билд: `npm run build`
- **Данные:** D1 (только чтение), R2 (медиа)
- **next-intl** (ru/uk), SSG/ISR, SEO
- **catch-all** `[...slug]/page.tsx` вызывает `notFound()` — HTTP 404

### Админ-панель — `podvarchan-admin` (admin.podvarchan.com)
- **Код:** `apps/admin/`, билд: `cd apps/admin && npm run build`
- **Данные:** D1 (CRUD), R2 (загрузка), KV (rate limit)
- **Авторизация:** NextAuth v5 (Credentials, D1 + bcrypt, JWT)
- **session.ts** — вызывает `auth()` из NextAuth (починено 8 июля)
- **Логин:** работает с данными из ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD (.env.local)

### Общее
- **shared:** `packages/shared/` — Drizzle-схема, getDb, типы
- **D1:** общая `podvarchan` (ID: `ea2c9727-65f8-4d36-8ff1-5cfb2f4cef36`)
- **R2 media:** общий `podvarchan-media`
- **Inc-cache:** раздельные бакеты (сайт: `podvarchan-inc-cache`, админка: `podvarchan-admin-inc-cache`)

## 2. Файлы проекта (обновлено 2026-07-08)

### Корень
- `AGENT.md` — этот файл
- `.env.local` — все секреты локально
- `MIGRATION_PLAN.md` — старый план миграции (заморожен, сплит выполнен)
- `ADMIN_GUIDE.md` — руководство админ-панели

### Публичный сайт
- `src/app/[locale]/[...slug]/page.tsx` — catch-all с `notFound()`
- `src/app/[locale]/not-found.tsx` — 404 (noindex, canonical null)
- `src/middleware.ts` — редиректы локализации

### Админ-панель (`apps/admin/`)
- `src/lib/auth/session.ts` — **ВАЖНО**: auth() (починено 8 июля)
- `src/auth.ts` / `src/auth.config.ts` — NextAuth
- `src/middleware.ts` — защита `/admin/*`
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `wrangler.jsonc` — D1, R2, KV конфиг

### CI/CD
- `.github/workflows/deploy.yml` — 2 jobs: site + admin

## 3. Протокол восстановления (Recovery Protocol)

При потере контекста или запуске новой сессии:

1. **Прочитать AGENT.md** — архитектура, состояние, todo
2. **Проверить Git:** `git status`, `git log --oneline -5`
3. **Проверить CI:** последний запуск Actions (оба воркера)
4. **Проверить админку:** `curl -sL https://admin.podvarchan.com/admin/login | grep -c __next_error__` → 0
5. **Проверить сайт:** `curl -sL -o /dev/null -w "%{http_code}" https://podvarchan.com/ru/nesuschestvuet-xyz/` → 404

### Правила
- **НЕ ТРОГАТЬ** админ-воркер когда работаешь с публичным сайтом и наоборот
- **НЕ ДЕПЛОИТЬ** локально (`npx wrangler deploy`) — только push в `master`
- **ВСЕГДА билдить** после изменений: `npm run build` или `cd apps/admin && npm run build`
- **НЕ ПРАВИТЬ** not-found.tsx, robots.ts, middleware-редиректы, canonical
- **НЕ ПРАВИТЬ** рабочие страницы сайта без явного запроса

## 4. Инфраструктура и деплой

### 4.1. GitHub Actions
**Триггер:** push в `master`. Workflow: `.github/workflows/deploy.yml`
- `deploy-site` — сборка + деплой `podvarchan`
- `deploy-admin` — сборка + деплой `podvarchan-admin`

### 4.2. Secrets в GitHub (все 15 установлены)
| Secret | Назначение |
|--------|-----------|
| `CLOUDFLARE_API_TOKEN` | Токен wrangler deploy |
| `CLOUDFLARE_ACCOUNT_ID` | `d2d025682352e4f90336d295deef3fce` |
| `CLOUDFLARE_DATABASE_ID` | D1 database ID |
| `AUTH_SECRET` | NextAuth JWT |
| `AUTH_URL` | `https://admin.podvarchan.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://podvarchan.com` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile |
| `TURNSTILE_SECRET_KEY` | Turnstile verify |
| `CONTACT_EMAIL` | `podvarchan@gmail.com` |
| `RESEND_API_KEY` | Resend email |
| `REVALIDATE_SECRET` | API revalidate |
| `ADMIN_SEED_EMAIL` | Seed admin |
| `ADMIN_SEED_PASSWORD` | Seed admin пароль |
| `DEPLOY` | Флаг CI |

### 4.3. Secrets на воркере (Cloudflare, установлены через API 8 июля)
- `AUTH_SECRET`, `TURNSTILE_SECRET_KEY`, `REVALIDATE_SECRET`
- `AUTH_URL` — в `vars:` в `apps/admin/wrangler.jsonc`

### 4.4. Wrangler configs
- **Сайт:** корневой `wrangler.jsonc` — D1, KV, R2, ASSETS
- **Админка:** `apps/admin/wrangler.jsonc` — те же D1/KV/R2 + отд. inc-cache
- Compatibility: `nodejs_compat`, дата `2026-06-27`

### 4.5. @swc/helpers при npm ci
**Симптом:** CI падает с `Missing: @swc/helpers@0.5.23 from lock file`
**Фикс:** `npm install @swc/helpers@^0.5.23` → удалить `node_modules` + `package-lock.json` → `npm install`
**Правило:** не редактировать lock-файл вручную

## 5. Текущее состояние админ-панели (2026-07-08)

### ✅ Работает
- Деплой через CI (build + wrangler deploy) — оба воркера
- Админка отвечает на `admin.podvarchan.com` (307 → /admin/login)
- **session.ts** — реальные `auth()` вызовы (починено 8 июля)
- Логин-страница рендерится (0 `__next_error__`)
- NextAuth: Credentials, D1 + bcrypt, JWT
- Middleware защищает `/admin/*`
- AUTH_SECRET, TURNSTILE_SECRET_KEY, REVALIDATE_SECRET установлены
- Seed-админ существует в D1 (логин по ADMIN_SEED_EMAIL/PASSWORD)

### ❌ Stubs (не работает)
| Компонент | Файл | Проблема |
|-----------|------|----------|
| **Dashboard** | `src/lib/admin/dashboard.ts` | Всегда нули |
| **Server actions** | `src/lib/actions/*` | Stubs, нет реализации |
| **R2 upload** | media actions | Не дописан |
| **Audit log** | `src/lib/audit/log.ts` | Отсутствует |
| **Формы** | `service-form.tsx` и др. | Неверные импорты |

### 🔜 Приоритет
1. Протестировать логин на `admin.podvarchan.com`
2. Dashboard — реальные D1-запросы
3. Server actions — CRUD для контента
4. R2 upload — загрузка медиа
5. Audit log — логирование
6. Формы — исправить импорты

## 6. Sitemap и robots.txt

`robots.txt` генерируется динамически (`src/app/robots.ts`). Статический `public/robots.txt` не нужен.
Sitemap генерируется Next.js из App Router. На 2026-06-26: 132 URL (66 страниц x 2 языка).
`middleware.ts` исключает `/robots.txt` из обработки.

## 7. Работа с AI-моделями (Cloudflare Workers AI)

### Доступные модели
| Модель | ID | Контекст |
|--------|-----|----------|
| Qwen3 30B A3B FP8 | `@cf/qwen/qwen3-30b-a3b-fp8` | 32K — сложные задачи, код |
| GLM 4.7 Flash | `@cf/zai-org/glm-4.7-flash` | 131K — быстрое ревью |
| Llama 3.2 3B | `@cf/meta/llama-3.2-3b-instruct` | 80K — лёгкие задачи |
| Llama 3.2 11B Vision | `@cf/meta/llama-3.2-11b-vision-instruct` | 128K — мультимодальная |
| Mistral 7B | `@cf/mistral/mistral-7b-instruct-v0.2-lora` | 15K — базовая |
| Granite 4.0 H/Micro | `@cf/ibm-granite/granite-4.0-h-micro` | 131K — большие файлы |

### API эндпоинт
```
POST https://api.cloudflare.com/client/v4/accounts/d2d025682352e4f90336d295deef3fce/ai/v1/chat/completions
Authorization: Bearer CLOUDFLARE_API_TOKEN (из .env)
Body: { model: "@cf/...", messages: [...], max_tokens: N }
```

### Процесс Executor → Reviewer
1. **Executor** выполняет задачу
2. **Reviewer** (Cloudflare AI модель) проверяет diff
3. Вердикт: `PASS` / `NEEDS FIX` / `FAIL`

## 8. Schema changes
- Любые изменения в D1 схемах — через Drizzle migrations
- Не редактировать production D1 напрямую
