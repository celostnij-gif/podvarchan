# Podvarchan.com — Agent Context (2026-07-08)
# AGENT.md — Полное руководство AI-агента по проекту Podvarchan.com

> Этот файл читается агентом при каждом новом запуске.
> Содержит контекст проекта, текущий прогресс, все промты и правила работы.

\---

## РАЗДЕЛ A. КОНТЕКСТ ПРОЕКТА

### A.1. Описание

podvarchan.com — сайт онлайн- психолонических, гипнотерапевтических и биоэнергетических услуг на русском и украинском
языках для русскоязычной диаспоры по всему миру.

Главная идея: публичный сайт остаётся быстрым SEO-сайтом на Next.js, но контент
переносится из статичных JSON/констант в управляемую базу данных. Админка становится
рабочим кабинетом, а не просто набором форм.

### A.2. Стек

* Next.js 15 App Router
* TypeScript (strict mode, any запрещён)
* Tailwind CSS 3
* Drizzle ORM
* Cloudflare D1 (SQLite, binding-режим) — база данных
* Cloudflare R2 — хранилище медиафайлов
* Cloudflare Workers (OpenNext) + Pages — хостинг
* Auth.js v5 (next-auth@beta) — авторизация
* bcryptjs (12 rounds) — хэширование паролей
* TipTap + @tiptap/html — редактор контента
* Zod — валидация
* react-hook-form + @hookform/resolvers — формы
* lucide-react — иконки
* next-intl — локализация
* framer-motion — анимации
* Resend — email
* Cloudflare Turnstile — антиспам

### A.3. Важные детали стека

* D1 берётся из runtime-контекста: getRequestContext().env.DB, далее getDb(DB).
НИКОГДА не глобальный singleton, НИКОГДА не DATABASE\_URL.
* TipTap: в БД хранится contentJson. При publish генерировать contentHtml через
generateHTML из @tiptap/html с теми же extensions.
* lucide-иконку Image импортировать как ImageIcon (конфликт с next/image).
* Размеры изображений считать на клиенте (edge runtime не поддерживает sharp).
* Cron Worker НЕ вызывает revalidatePath напрямую — делает HTTP POST на
/api/revalidate (защита REVALIDATE\_SECRET).

### A.4. Локали и домен

Локали: ru (основная), uk (украинская)
Домен: podvarchan.com - публичный сайт, admin.podvarchan.com - админка
Деплой: GitHub Actions, конфиг wrangler.jsonc, 

\---

## РАЗДЕЛ B. ПЕРВОЕ ДЕЙСТВИЕ ПРИ КАЖДОМ ЗАПУСКЕ

1. Прочитай TEMP/PROGRESS.md — узнай, что сделано
2. Прочитай AGENT.md полностью
3. Если TEMP/PROGRESS.md не существует — создай его и начни с первого шага 
4. Определи следующий незавершённый шаг
5. Сообщи: "Последний шаг: X.X. Следующий: Y.Y — \[название]"
6. Жди подтверждения пользователя — потом работай

\---

## РАЗДЕЛ C. ТЕКУЩИЙ ПРОГРЕСС 

Готово:
Отмечай здесь
Осталось:
Отмечай здесь

\---

## РАЗДЕЛ D. ФАЙЛЫ ПРОЕКТА

|Файл|Назначение|
|-|-|
|TEMP/PROGRESS.md|Главный трекер прогресса|
|TEMP/IMPLEMENTATION\_GUIDE.md|Все промты по этапам|
|TEMP/MIGRATION\_MAP.md|Карта миграции данных|
|TEMP/content-backup/|Бэкап контента до миграции|
|TEMP/DEPLOY\_CHECKLIST.md|Чеклист деплоя (шаг 18.1)|
|AGENT.md|Этот файл|
|ADMIN\_GUIDE.md|Документация для владельца (шаг 18.1)|

TEMP/ - добавить в .gitignore.
TEMP/content-backup/ — добавить в .gitignore.

\---

## РАЗДЕЛ E. ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА КОДА

### TypeScript

* "strict": true в tsconfig обязательно
* Тип any запрещён везде без исключений
* Вместо unknown там, где тип неизвестен
* Явные типы возврата у функций
* Явные интерфейсы у props компонентов

### Структура файлов

* Server Components — без 'use client' (по умолчанию)
* Client Components — с явным 'use client' в первой строке
* Server Actions — с явным 'use server'
* Не смешивать server/client логику в одном файле

### База данных

* Drizzle только в: Server Components, Route Handlers, Server Actions
* D1: getRequestContext().env.DB → getDb(DB)
* Публичное чтение → src/lib/content/
* Запись из админки → src/app/admin/actions/ (фактически src/lib/actions/)
* Компоненты получают данные через typed props, не запрашивают БД напрямую

### Кэш и ревалидация

* revalidatePath / revalidateTag — ТОЛЬКО в Server Actions и Route Handlers
* Read-слой src/lib/content/ ничего не ревалидирует
* Cron Worker делает POST на /api/revalidate, не вызывает revalidate напрямую

### Валидация

* Все входы Server Actions — через zod
* Одни схемы на клиенте (react-hook-form) и сервере
* Схемы в src/lib/validators/

### Безопасность

* Каждый Server Action: requireAdminSession() + withRole/canXxx
* После каждой мутации — writeAuditLog()
* Пароли — только bcrypt-хэш (12 rounds)
* rate limit на login, задержка после неверного пароля
* Одинаковое сообщение для неверного email и пароля
* /admin/\* закрыт через robots.txt и meta noindex

### TipTap

* Хранить contentJson в БД
* При publish/update генерировать contentHtml через generateHTML

\---

## РАЗДЕЛ F. СТРУКТУРА ДИРЕКТОРИЙ

```
drizzle/migrations/
scripts/seo-regression.ts
e2e/admin.spec.ts
```

\---

## РАЗДЕЛ G. МОДЕЛИ ДАННЫХ

### Статусы контента

```
DRAFT      → черновик, не виден публично
REVIEW     → на проверке (только EDITOR)
SCHEDULED  → запланирован (публикуется по cron)
PUBLISHED  → опубликован, виден публично
ARCHIVED   → архив, не виден публично
```

### Роли пользователей

```
OWNER  → полный доступ, пользователи, настройки
ADMIN  → контент, публикация, заявки, медиа
EDITOR → черновики, публикация через REVIEW
VIEWER → только просмотр
```

### Статусы заявок

```
NEW → IN\_PROGRESS → CONTACTED → BOOKED → CLOSED → SPAM
```

\---

## РАЗДЕЛ H. ПРАВИЛА ОБНОВЛЕНИЯ ПРОГРЕССА

После каждого завершённого шага:

1. Открой TEMP/PROGRESS.md
2. Измени - \[ ] на - \[x]
3. Добавь дату: - \[x] 1.1 — выполнено 2026-06-04
4. При отклонениях от плана запиши ПРИМЕЧАНИЕ

\---

## РАЗДЕЛ I. ПОВЕДЕНИЕ ПРИ СБОЕ

При новом запуске после сбоя:

1. Читай TEMP/PROGRESS.md
2. Читай файлы последнего шага — убедись что созданы корректно
3. Проверь: npx tsc --noEmit
4. Не начинай шаг заново если он помечен выполненным — полностью перепроверь работоспособность и корректность работы
5. Если шаг начат но не завершён — продолжи с места остановки

\---

## РАЗДЕЛ J. ПРАВИЛО ДЛЯ ПУБЛИЧНОГО САЙТА

Публичный сайт не должен деградировать.

* Сначала: npm run build
* Используй fallback на константы пока БД не заполнена
* После изменений: снова npm run build
* canonical, hreflang, JSON-LD должны остаться теми же

\---

## РАЗДЕЛ K. SEO-ПРАВИЛА (КРИТИЧНО)

1. canonical всегда абсолютный, содержит /ru/ или /uk/
2. hreflang триплет: ru + uk + x-default на каждой странице
3. Нельзя публиковать с пустым title, description, slug
4. Нельзя публиковать с PLACEHOLDER, common.siteTitle, undefined, null
5. H1 ровно один на каждой публичной странице
6. Sitemap только из PUBLISHED контента
7. /admin/\* закрыт через robots.txt и noindex
8. При смене slug у PUBLISHED — автоматически 301 redirect
9. og:image на каждой опубликованной странице
10. YMYL-слова (вылечим, гарантируем, навсегда избавим) — предупреждение

\---

## РАЗДЕЛ L. КОМАНДЫ

```bash
npx tsc --noEmit          # после каждого шага
npm run build             # перед окончанием этапа
npm run dev               # локальный запуск
npm run db:generate       # после изменений схемы
npm run db:migrate:local  # применить миграции локально
npm run db:seed           # seed данных
npm run test:seo          # SEO regression
npm run test              # unit тесты
```

\---

## РАЗДЕЛ M. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

Обязательные:

```
DATABASE\_URL
AUTH\_SECRET             (минимум 32 символа)
ADMIN\_SEED\_EMAIL
ADMIN\_SEED\_PASSWORD     (минимум 8 символов)
CLOUDFLARE\_ACCOUNT\_ID
CLOUDFLARE\_DATABASE\_ID
REVALIDATE\_SECRET
```

Медиа (R2):

```
S3\_ENDPOINT
S3\_REGION               (обычно 'auto')
S3\_BUCKET
S3\_ACCESS\_KEY\_ID
S3\_SECRET\_ACCESS\_KEY
NEXT\_PUBLIC\_MEDIA\_BASE\_URL
```

\---
## Architecture
Monorepo, two Cloudflare Workers (OpenNext):
- **Site** `podvarchan` (podvarchan.com): `src/` — Next.js 15.5.18, App Router, TypeScript, Tailwind CSS, next-intl (ru/uk), OpenNext deploy
- **Admin** `podvarchan-admin` (admin.podvarchan.com): `apps/admin/` — Next.js 15.5.18, NextAuth v5, D1, R2, KV
- **Shared** `packages/shared/` — Drizzle schema, getDb, types

## Git
- Last commit: `745a56f` "feat(admin): Phase 14 — restructure admin into apps/admin monorepo"
- Dirty tree: split work in progress

## What's DONE (as of 2026-07-08 session)

### Infrastructure
- P0 split: apps/admin + apps/site + packages/shared created
- Admin worker `podvarchan-admin` deployed to Cloudflare
- Custom domain admin.podvarchan.com (DNS + route configured), Cloudflare Access
- CI workflow: site (Pages), admin (GitHub Actions)
- Both workers build with 0 errors

### Auth
- NextAuth v5 (Credentials + bcrypt + JWT), session.ts with real auth()
- Middleware protects /admin/*
- Auth type unification: 'USER' added to UserRole, weight map fixed

### Actions Foundation (Stage 1) — at apps/admin/src/lib/actions/
- result.ts (ActionResult<T>, ok/fail), db.ts (getActionDb), guard.ts (withAuth/withRole/etc)
- audit/log.ts (writeAuditLog fire-and-forget), index.ts (re-exports)

### 15 Action Modules (Stage 2a) — at apps/admin/src/lib/actions/
Each: Zod validation, auth guard, getActionDb, writeAuditLog, revalidateSitePath/Layout
services, blog, faq, testimonials, leads, media, pages, seo,
settings, navigation, redirects, users, audit, search, dashboard

### Dashboard (Stage 3) — real D1 COUNT queries

## What's NOT DONE / NEXT

### Stage 2b — Fix Form Imports (CRITICAL, in progress)
30+ broken imports from @/app/admin/actions/* → @/lib/actions/*
Function name mismatches to resolve:
- createFaq/updateFaq → createFaqItem/updateFaqItem
- updatePageMeta → publishPage (doesn't exist in new module)
- addSection/deleteSection/toggleSection/updateSectionContent — verify pages.ts
- getAuditEntityTypes/getAuditActions/getRevisions — missing in audit.ts
- navigation/redirects import from settings → should import from navigation/redirects
- getSeoOverride — verify exists


### Stage 6 — Public D1 + Cache invalidation (not started)
### Stage 7 — Regression (seo-regression 71/71, not started)

## Key Plan Files
- `TEMP/implementation-guide-admin-CURRENT-STATE.md` — full staged plan with prompts
- `TEMP/PROGRESS.md` — checklist by stages (0-7), updated
- `TEMP/TASKBACKLOG.md` — backlog with statuses, updated
- `TEMP/SESSION_SUMMARY_2026-07-08.md` — last session summary
- `AGENT.md` (root) — recovery protocol

## Build Commands
- Admin: `cd apps/admin && npm run build && npx tsc --noEmit`
- Site: `npm run build` (root)

## Rules
- NEVER deploy locally — only CI push to master
- NEVER touch site not-found.tsx, robots.ts, middleware redirects, canonical
- Always update TEMP/PROGRESS.md after each stage
