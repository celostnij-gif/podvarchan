# РУКОВОДСТВО ПО РЕАЛИЗАЦИИ АДМИНКИ — PODVARCHAN.COM

## Подробная инструкция с промтами для агента 

**Дата:** 2026-06  
**Проект:** podvarchan.com  
**Стек:** Next.js App Router · TypeScript strict · Tailwind CSS 4 · Drizzle ORM · Cloudflare D1/R2/Pages · Auth.js v5 (next-auth@beta) · TipTap · Zod · react-hook-form

\---

## ИЗМЕНЕНИЯ vNEXT (2026-06-05)

1. Шаг 1.2: next-auth → next-auth@beta; devDeps: +tsx, +wrangler, +@aws-sdk/client-s3, +@tiptap/html
2. Шаг 1.3: .env +zod: +CLOUDFLARE_ACCOUNT_ID, +CLOUDFLARE_DATABASE_ID, +CLOUDFLARE_API_TOKEN (optional)
3. Шаг 2.1: drizzle.config.ts — убран driver: 'd1-http' и dbCredentials (binding-режим)
4. Шаг 2.1: src/db/index.ts — getDb(d1) через getRequestContext, НЕ глобальный singleton
5. Шаг 2.1: имена таблиц приведены к camelCase по всему документу
6. Шаг 2.2: seed — НЕ через DATABASE_URL; скрипт генерирует SQL → wrangler d1 execute
7. Шаг 3.2: LOGIN_OUT → LOGOUT
8. Шаг 4.1: Image → ImageIcon (import { Image as ImageIcon } from 'lucide-react')
9. Шаг 5.1: revalidatePath/revalidateTag ТОЛЬКО в server actions/route handlers, НЕ в read-слое
10. Шаг 7.2: contentJson → contentHtml через generateHTML() (@tiptap/html) при publish/update
11. Шаг 8.1: width/height изображений — на клиенте (createImageBitmap), НЕ на сервере
12. Шаг 13.1: Cron Worker → HTTP POST на /api/revalidate?secret=... (НЕ прямой revalidatePath)

\---

## КАК ПОЛЬЗОВАТЬСЯ ЭТИМ ДОКУМЕНТОМ

* Каждый раздел = один промт агенту
* Копируйте текст из блока `ПРОМТ` целиком и вставляйте в Cursor или Claude Code
* Выполняйте шаги **строго по порядку** — каждый шаг зависит от предыдущего
* После каждого шага агент обновляет `TEMP/PROGRESS.md` — проверяйте его
* TypeScript strict mode обязателен. Тип `any` запрещён везде
* Все файлы создаются с точными путями из промта — не переименовывайте
* Если шаг слишком большой — делите промт пополам, не меняя суть

**Приоритеты:**

* `P0` — блокирует деплой, реализовать первым
* `P1` — нужен для динамического контента
* `P2` — расширенные настройки
* `P3` — удобство ежедневной работы
* `P4` — защита качества и тесты

\---

## СВОДНАЯ ТАБЛИЦА ШАГОВ

|Шаг|Задача|Ключевые файлы|Приоритет|
|-|-|-|-|
|1.1|Ветка, PROGRESS.md|TEMP/PROGRESS.md|P0|
|1.2|Установить зависимости|package.json|P0|
|1.3|ENV переменные|src/env.ts|P0|
|2.1|Drizzle схема БД|src/db/schema.ts|P0|
|2.2|Миграция + seed|src/db/seed.ts|P0|
|3.1|Auth.js авторизация|src/auth.ts, middleware.ts|P0|
|3.2|Login + audit log|src/app/admin/login|P0|
|4.1|Admin layout/sidebar|AdminShell, AdminSidebar|P0|
|4.2|Дашборд /admin|src/app/admin/page.tsx|P0|
|5.1|Server actions layer|src/app/admin/actions/|P0|
|6.1|Список услуг|src/app/admin/services|P1|
|6.2|Редактор услуги|ServiceEditor.tsx|P1|
|7.1|Список статей|src/app/admin/blog|P1|
|7.2|Редактор с TipTap|BlogPostEditor, TipTapEditor|P1|
|8.1|Медиа-библиотека R2|src/app/admin/media|P1|
|9.1|FAQ + отзывы + CRM|src/app/admin/leads|P1|
|10.1|SEO-менеджер|src/app/admin/seo|P1|
|11.1|Публичный сайт на D1|src/app/\[locale]/|P1|
|12.1|Навигация + настройки|src/app/admin/settings|P2|
|13.1|Ревизии + превью + расписание|src/lib/revisions/|P3|
|14.1|Пользователи + журнал|src/app/admin/users|P2|
|15.1|Редактор главной|src/app/admin/home|P2|
|16.1|Командная палитра|CommandPalette.tsx|P3|
|17.1|Тесты + SEO-regression|scripts/seo-regression.ts|P4|
|18.1|Production деплой|ADMIN\_GUIDE.md|P0|

\---

\---

# ЭТАП 1 — ПОДГОТОВКА ПРОЕКТА \[P0]

\---

## ШАГ 1.1 — Создать ветку и зафиксировать структуру

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: подготовить проект к внедрению полноценной CMS-админки.

1. Создай ветку: git checkout -b feature/admin-panel

2. Создай файл TEMP/PROGRESS.md со структурой:
   # Прогресс реализации админки
   ## Этап 1: Подготовка
   - \[ ] 1.1 Ветка и структура
   - \[ ] 1.2 Зависимости
   - \[ ] 1.3 ENV переменные
   ## Этап 2: База данных
   ...продолжи до Этапа 20

3. Создай TEMP/content-backup/README.md с описанием,
   что нужно будет сохранить в этой папке перед миграцией.

4. Создай TEMP/MIGRATION\_MAP.md с таблицей:
   | Текущий источник | Будущая таблица |
   | messages/ru.json → servicesData | services + serviceTranslations |
   | messages/uk.json → servicesData | serviceTranslations (uk) |
   | src/constants → SERVICES | services |
   | src/constants → BLOG\_CATEGORIES | blogCategories |
   | messages → faqItems | faqItems + faqItemTranslations |
   | src/app/api/contact → route.ts | contactLeads |
   (заполни по реальной структуре проекта)

5. Обнови TEMP/PROGRESS.md: отметь 1.1 выполненным.
```

\---

## ШАГ 1.2 — Установить все зависимости

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: установить все зависимости для CMS-админки одной командой.

Выполни:

npm install drizzle-orm @auth/core next-auth@beta zod react-hook-form @hookform/resolvers \\
  @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link \\
  @tiptap/extension-image @tiptap/extension-placeholder \\
  @tiptap/extension-heading @tiptap/extension-bullet-list \\
  @tiptap/extension-ordered-list @tiptap/extension-blockquote \\
  @tiptap/extension-code-block @tiptap/html lucide-react date-fns bcryptjs

npm install -D drizzle-kit @types/bcryptjs tsx wrangler @aws-sdk/client-s3

После установки:
- Проверь, что все пакеты появились в package.json
- Проверь, что проект собирается без ошибок: npm run build
- Обнови TEMP/PROGRESS.md: отметь 1.2 выполненным.
```

\---

## ШАГ 1.3 — Настроить переменные окружения

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: добавить все переменные окружения для админки.

1. Добавь в .env.local (НЕ в git):
   DATABASE\_URL=
   AUTH\_SECRET=
   ADMIN\_SEED\_EMAIL=
   ADMIN\_SEED\_PASSWORD=
   S3\_ENDPOINT=
   S3\_REGION=auto
   S3\_BUCKET=
   S3\_ACCESS\_KEY\_ID=
   S3\_SECRET\_ACCESS\_KEY=
   NEXT\_PUBLIC\_MEDIA\_BASE\_URL=
   CLOUDFLARE\_ACCOUNT\_ID=
   CLOUDFLARE\_DATABASE\_ID=
   CLOUDFLARE\_API\_TOKEN=

2. Обнови .env.example — добавь те же ключи,
   но с пустыми значениями или примерами (без реальных данных):
   DATABASE\_URL=your\_neon\_or\_d1\_connection\_string
   AUTH\_SECRET=openssl\_rand\_base64\_32
   ...

3. Убедись, что .gitignore содержит .env.local
   (добавь если нет).

4. Создай src/env.ts с zod-валидацией переменных:
   import { z } from 'zod'
   const envSchema = z.object({
     DATABASE\_URL: z.string().min(1),
     AUTH\_SECRET: z.string().min(32),
     ADMIN\_SEED\_EMAIL: z.string().email(),
     ADMIN\_SEED\_PASSWORD: z.string().min(8),
     S3\_ENDPOINT: z.string().url().optional(),
     S3\_BUCKET: z.string().optional(),
     S3\_ACCESS\_KEY\_ID: z.string().optional(),
     S3\_SECRET\_ACCESS\_KEY: z.string().optional(),
     NEXT\_PUBLIC\_MEDIA\_BASE\_URL: z.string().url().optional(),
     CLOUDFLARE\_ACCOUNT\_ID: z.string().min(1).optional(),
     CLOUDFLARE\_DATABASE\_ID: z.string().min(1).optional(),
     CLOUDFLARE\_API\_TOKEN: z.string().min(1).optional(),
   })
   export const env = envSchema.parse(process.env)

5. Обнови TEMP/PROGRESS.md: отметь 1.3 выполненным.
```

\---

\---

# ЭТАП 2 — БАЗА ДАННЫХ: DRIZZLE + CLOUDFLARE D1 \[P0]

\---

## ШАГ 2.1 — Создать Drizzle конфиг и схему базы данных

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
ORM: Drizzle ORM. База: Cloudflare D1 (SQLite).

Задача: создать полную схему базы данных.

1. Создай drizzle.config.ts в корне:
   import type { Config } from 'drizzle-kit'
   export default {
     schema: './src/db/schema.ts',
     out: './drizzle/migrations',
     dialect: 'sqlite',
   } satisfies Config

2. Создай src/db/schema.ts со следующими таблицами
   (используй sqliteTable из drizzle-orm/sqlite-core):

   ПОЛЬЗОВАТЕЛИ:
   - users: id, email, passwordHash, name, role (OWNER|ADMIN|EDITOR|VIEWER),
     isActive, lastLoginAt, createdAt, updatedAt
   - auditLogs: id, userId, action, entityType, entityId,
     beforeJson, afterJson, ip, userAgent, createdAt

   SEO:
   - seoMeta: id, entityType, entityId, locale, title, description,
     keywords, canonicalPath, ogTitle, ogDescription, ogImageId,
     robotsIndex, robotsFollow, schemaType, createdAt, updatedAt

   СТРАНИЦЫ:
   - pages: id, type (HOME|METHOD|ABOUT|FAQ|CONTACTS|PRIVACY|CUSTOM),
     status (DRAFT|PUBLISHED|ARCHIVED), sortOrder, publishedAt,
     createdAt, updatedAt
   - pageTranslations: id, pageId, locale, slug, title, excerpt,
     contentJson, seoMetaId
   - pageSections: id, pageId, key, type, enabled, sortOrder, settingsJson
   - pageSectionTranslations: id, sectionId, locale, contentJson

   УСЛУГИ:
   - services: id, slugBase, icon, category, priority, status,
     featured, sortOrder, createdAt, updatedAt
   - serviceTranslations: id, serviceId, locale, slug, title,
     shortTitle, description, heroTitle, heroSubtitle,
     symptomsJson, processJson, benefitsJson, faqJson,
     ctaText, seoMetaId

   БЛОГ:
   - blogCategories: id, slugBase, serviceId, sortOrder, status
   - blogCategoryTranslations: id, categoryId, locale, slug,
     name, description, seoMetaId
   - blogPosts: id, categoryId, authorId, status
     (DRAFT|REVIEW|SCHEDULED|PUBLISHED|ARCHIVED),
     coverImageId, readingMinutes, publishedAt, scheduledAt,
     createdAt, updatedAt
   - blogPostTranslations: id, postId, locale, slug, title,
     excerpt, contentJson, contentHtml, tableOfContentsJson,
     faqJson, seoMetaId

   МЕДИА:
   - mediaAssets: id, fileName, originalName, mimeType, size,
     width, height, storageKey, publicUrl, altRu, altUk,
     titleRu, titleUk, captionRu, captionUk, uploadedById, createdAt

   FAQ:
   - faqItems: id, group (HOME|GENERAL|SERVICE|CONTACTS),
     serviceId, status, sortOrder
   - faqItemTranslations: id, faqItemId, locale, question, answer

   ОТЗЫВЫ:
   - testimonials: id, status (DRAFT|PUBLISHED|HIDDEN),
     clientName, clientAge, avatarInitials, rating, source,
     consentConfirmed, publishedAt, sortOrder
   - testimonialTranslations: id, testimonialId, locale,
     problem, result, text

   ЗАЯВКИ:
   - contactLeads: id, name, email, phone, message, sourcePage,
     locale, status (NEW|IN\_PROGRESS|CONTACTED|BOOKED|CLOSED|SPAM),
     internalNote, ipHash, userAgent, createdAt, updatedAt
   - leadEvents: id, leadId, userId, type, note, createdAt

   НАСТРОЙКИ:
   - siteSettings: key (primaryKey), valueJson, updatedById, updatedAt
   - contactChannels: id, type (TELEGRAM|WHATSAPP|EMAIL|PHONE|CUSTOM),
     label, value, url, isPrimary, isEnabled, sortOrder
   - navigationItems: id, location (HEADER|FOOTER|MOBILE), parentId,
     href, labelRu, labelUk, isEnabled, sortOrder
   - redirectRules: id, fromPath, toPath, statusCode (301|302),
     isEnabled, hitCount, createdAt

   РЕВИЗИИ:
   - contentRevisions: id, entityType, entityId, locale, dataJson,
     createdById, createdAt, label

3. Создай src/db/index.ts — функцию getDb(d1: D1Database), которая принимает D1-бандлинг из runtime-контекста Cloudflare и возвращает drizzle-инстанс. НЕ используй глобальный singleton — D1 доступен только через `getRequestContext().env.DB` (пакет `@cloudflare/next-on-pages`).

4. Обнови TEMP/PROGRESS.md: отметь 2.1 выполненным.
```

\---

## ШАГ 2.2 — Создать первую миграцию и seed-скрипт

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Drizzle ORM, Cloudflare D1, bcryptjs для хэширования паролей.

Задача: создать миграцию и seed-скрипт.

1. Сгенерируй миграцию:
   npx drizzle-kit generate

2. Создай src/db/seed.ts:
   - импортирует данные из messages/ru.json и messages/uk.json
   - импортирует данные из src/constants/index.ts
   - создаёт OWNER пользователя из env.ADMIN\_SEED\_EMAIL / ADMIN\_SEED\_PASSWORD
     (пароль через bcryptjs.hash, 12 rounds)
   - переносит все услуги (services + serviceTranslations ru + uk)
   - переносит категории блога (blogCategories + blogCategoryTranslations)
   - переносит FAQ (faqItems + faqItemTranslations)
   - создаёт page типа HOME с базовыми pageSections
   - создаёт navigationItems для HEADER, FOOTER, MOBILE
   - создаёт contactChannels (email, telegram, whatsapp)
   - создаёт базовые siteSettings
   - ИДЕМПОТЕНТЕН: проверяет существование перед вставкой
   - выводит отчёт в конце: кол-во услуг, статей, FAQ, страниц,
     переводов, пользователей, SEO-записей

3. Добавь в package.json скрипты:
   "db:generate": "drizzle-kit generate",
   "db:migrate:local": "wrangler d1 migrations apply DB --local",
   "db:migrate:prod": "wrangler d1 migrations apply DB",
   "db:seed:sql": "tsx src/db/seed.ts",
   "db:seed": "tsx src/db/seed.ts --out=seed.sql && wrangler d1 execute DB --local --file=seed.sql",
   "db:studio": "drizzle-kit studio"
   
   ВАЖНО: seed НЕ использует DATABASE_URL — он пишет в локальный D1 binding
   через wrangler d1 execute, либо (при флаге --out) генерирует SQL-файл
   и применяет его через wrangler.

4. Создай TEMP/content-backup/ и скопируй туда:
   - messages/ru.json → TEMP/content-backup/ru.json
   - messages/uk.json → TEMP/content-backup/uk.json
   - src/constants/index.ts → TEMP/content-backup/constants.ts

5. Обнови TEMP/PROGRESS.md: отметь 2.2 выполненным.
```

\---

\---

# ЭТАП 3 — АВТОРИЗАЦИЯ И ЗАЩИТА /ADMIN \[P0]

\---

## ШАГ 3.1 — Настроить Auth.js v5 + credentials provider

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Auth.js v5 (next-auth@beta). Cloudflare D1 через Drizzle.

Задача: настроить безопасную авторизацию для /admin.

1. Создай src/auth.ts:
   - credentials provider: email + password
   - проверяет пользователя в БД через Drizzle
   - сравнивает пароль через bcryptjs.compare
   - проверяет isActive === true
   - возвращает { id, email, name, role }
   - после входа записывает lastLoginAt

2. Создай src/auth.config.ts:
   - pages: { signIn: '/admin/login', error: '/admin/login' }
   - callbacks: jwt и session — добавляют role в токен и сессию
   - session: { strategy: 'jwt' }

3. Создай middleware.ts в корне:
   - защищает все маршруты /admin/\* кроме /admin/login
   - если нет сессии → redirect на /admin/login
   - если сессия есть и путь /admin/login → redirect на /admin

4. Создай src/types/auth.ts:
   type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
   
   Расширь Session и JWT типы для добавления role:
   declare module 'next-auth' {
     interface Session { user: { role: UserRole } }
   }

5. Создай src/lib/auth/permissions.ts:
   - canPublish(role): boolean
   - canDelete(role): boolean
   - canManageUsers(role): boolean
   - canManageSettings(role): boolean
   - canEditContent(role): boolean
   - canViewLeads(role): boolean

6. Создай src/lib/auth/session.ts:
   - getAdminSession(): Promise<SessionWithRole | null>
   - requireAdminSession(): Promise<SessionWithRole> (throws если нет)
   - requireRole(role: UserRole): Promise<SessionWithRole>

7. Добавь rate limiting на endpoint auth:
   - максимум 5 неверных попыток за 15 минут с одного IP
   - после 5 попыток — задержка 15 минут
   - одинаковое сообщение для неверного email и пароля

8. Обнови TEMP/PROGRESS.md: отметь 3.1 выполненным.
```

\---

## ШАГ 3.2 — Создать страницу /admin/login и audit log

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Next.js App Router, Auth.js v5, react-hook-form + zod.

Задача: создать страницу входа и механизм audit log.

1. Создай src/app/admin/login/page.tsx:
   - форма: email + password
   - react-hook-form + zod валидация
   - показывает ошибку при неверных данных
   - после входа → redirect /admin
   - meta: noindex, nofollow
   - дизайн: тёмная тема, лого Podvarchan

2. Создай src/lib/audit/log.ts:
   async function writeAuditLog({
     userId, action, entityType, entityId,
     before, after, request
   }): Promise<void>
   
   Типы action:
   'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' |
   'LOGIN' | 'LOGOUT' | 'UPLOAD' | 'SETTINGS\_CHANGE'

3. Добавь запись AuditLog при входе и выходе.

4. Создай src/app/admin/logout/route.ts:
   - POST handler
   - завершает сессию
   - пишет AuditLog с action LOGOUT
   - redirect на /admin/login

5. Обнови TEMP/PROGRESS.md: отметь 3.2 выполненным.
```

\---

\---

# ЭТАП 4 — LAYOUT И ОБЩИЙ UX АДМИНКИ \[P0]

\---

## ШАГ 4.1 — Создать shell, sidebar и topbar админки

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Tailwind CSS 4. lucide-react для иконок.

Задача: создать основной layout для всей админки.

1. Создай src/app/admin/layout.tsx:
   - оборачивает все /admin/\* маршруты
   - проверяет сессию через requireAdminSession()
   - рендерит <AdminShell>

2. Создай src/components/admin/AdminShell.tsx:
   - двухколоночный layout: sidebar (240px) + main content
   - тёмная тема: bg-zinc-950
   - responsive: sidebar скрывается на mobile, открывается бургером

3. Создай src/components/admin/AdminSidebar.tsx:
   Меню (с иконками lucide-react):
   - Обзор (/admin) — LayoutDashboard
   - Страницы (/admin/pages) — FileText
   - Главная (/admin/home) — Home
   - Услуги (/admin/services) — Briefcase
   - Блог (/admin/blog) — PenSquare
   - Категории (/admin/categories) — Tag
   - FAQ (/admin/faq) — HelpCircle
   - Отзывы (/admin/testimonials) — Star
   - Медиа (/admin/media) — ImageIcon (импортировать как import { Image as ImageIcon } from 'lucide-react', чтобы не конфликтовать с next/image)
   - Заявки (/admin/leads) — Inbox
   - SEO (/admin/seo) — Search
   - Навигация (/admin/navigation) — Menu
   - Редиректы (/admin/redirects) — ArrowRight
   - Настройки (/admin/settings) — Settings
   - Пользователи (/admin/users) — Users
   - Журнал (/admin/audit) — ClipboardList
   
   Активный пункт выделяется gold-цветом (#C9A84C).
   Внизу сайдбара: имя пользователя + роль + кнопка выхода.

4. Создай src/components/admin/AdminTopbar.tsx:
   - заголовок текущего раздела (получает через props)
   - кнопка "Открыть сайт" → новая вкладка с podvarchan.com
   - индикатор сохранения (иконка + текст: Сохранено / Сохранение...)
   - переключатель локали RU / UK (сохраняет в cookie)
   - аватар пользователя + выпадающее меню (профиль, выход)

5. Создай src/components/admin/ui/StatusBadge.tsx:
   Компонент для отображения статусов:
   DRAFT → серый, PUBLISHED → зелёный, ARCHIVED → жёлтый,
   REVIEW → синий, SCHEDULED → фиолетовый,
   NEW → красный (заявки), SPAM → серый

6. Обнови TEMP/PROGRESS.md: отметь 4.1 выполненным.
```

\---

## ШАГ 4.2 — Создать дашборд /admin

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Next.js App Router, Server Components, Drizzle ORM.

Задача: создать главный дашборд /admin с реальными данными из D1.

1. Создай src/app/admin/page.tsx (Server Component):
   Запрашивает из БД:
   - новые заявки за последние 7 дней (contactLeads, status=NEW)
   - 5 последних заявок
   - черновики (blogPosts, services со status=DRAFT)
   - страницы без meta description
   - страницы без UK-перевода
   - 5 последних опубликованных статей

2. Блоки дашборда:
   - Карточки статистики: заявки, черновики, SEO-проблемы, переводы
   - Таблица последних заявок (имя, email, статус, дата, ссылка)
   - Список черновиков (тип, название, дата, ссылка на редактор)
   - SEO-виджет: N страниц без description, без canonical, без og:image
   - Быстрые действия: \[+ Новая статья] \[+ Новая услуга]
     \[↑ Загрузить фото] \[🗺 Открыть sitemap]

3. Создай src/lib/admin/dashboard.ts:
   - getDashboardStats(db): Promise<DashboardStats>
   - тип DashboardStats описывает все блоки дашборда

4. Обнови TEMP/PROGRESS.md: отметь 4.2 выполненным.
```

\---

\---

# ЭТАП 5 — SERVER ACTIONS И DATA LAYER \[P0]

\---

## ШАГ 5.1 — Создать базовый слой server actions

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Next.js Server Actions, Drizzle ORM, zod.

Задача: создать базовый типизированный слой для всех server actions.

1. Создай src/lib/actions/result.ts:
   type ActionResult<T = void> =
     | { success: true; data: T }
     | { success: false; error: string; fields?: Record<string, string\[]> }
   
   function ok<T>(data: T): ActionResult<T>
   function fail(error: string, fields?: ...): ActionResult<never>

2. Создай src/lib/actions/guard.ts:
   async function withAdminAction<T>(
     request: Request | null,
     requiredRole: UserRole,
     handler: (session: SessionWithRole) => Promise<ActionResult<T>>
   ): Promise<ActionResult<T>>
   
   Внутри:
   - проверяет сессию
   - проверяет роль
   - оборачивает в try/catch
   - при ошибке возвращает fail(...)

3. Создай src/app/admin/actions/ со структурой:
   - pages.ts — server actions для страниц
   - services.ts — server actions для услуг
   - blog.ts — server actions для блога
   - media.ts — server actions для медиа
   - leads.ts — server actions для заявок
   - settings.ts — server actions для настроек
   - faq.ts — server actions для FAQ
   - testimonials.ts — server actions для отзывов

   Каждый файл помечен 'use server'.
   Каждый action использует withAdminAction из guard.ts.
   После каждого изменения вызывает writeAuditLog.
   После изменения контента вызывает revalidatePath / revalidateTag.
   
   ВАЖНО: revalidatePath и revalidateTag вызываются ТОЛЬКО в server actions
   и route handlers. Функции чтения из src/lib/content/ НИКОГДА не вызывают
   revalidation — read-слой только читает данные.

4. Создай src/lib/content/ со слоем чтения данных:
   - pages.ts: getPage, getPages, getHomePageSections
   - services.ts: getService, getServices, getServiceBySlug
   - blog.ts: getBlogPost, getBlogPosts, getBlogPostBySlug
   - seo.ts: getSeoMeta, generateMetadataFromSeo
   - navigation.ts: getNavigation
   
   Эти функции ТОЛЬКО читают данные. Используются публичным сайтом.
   Все функции принимают locale: 'ru' | 'uk'.

5. Обнови TEMP/PROGRESS.md: отметь 5.1 выполненным.
```

\---

\---

# ЭТАП 6 — МОДУЛЬ УСЛУГ \[P1]

\---

## ШАГ 6.1 — Создать список услуг /admin/services

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Next.js App Router, Drizzle ORM, lucide-react, Tailwind.

Задача: создать раздел управления услугами.

1. Создай src/app/admin/services/page.tsx:
   - Server Component, получает данные через Drizzle
   - таблица со столбцами:
     иконка | название RU | название UK | slug RU | slug UK |
     статус | приоритет | SEO-score | дата обновления | действия
   - кнопки действий: редактировать, предпросмотр, удалить
   - кнопка "+ Новая услуга" вверху
   - поиск по названию (client-side для простоты)
   - фильтр по статусу (DRAFT/PUBLISHED/ARCHIVED)

2. Создай src/app/admin/services/new/page.tsx:
   - redirect на /admin/services/\[id] после создания
   - server action createService в actions/services.ts

3. Создай server action в src/app/admin/actions/services.ts:
   
   createService(data: CreateServiceInput): Promise<ActionResult<{id: string}>>
   - требует роль ADMIN или выше
   - создаёт services + serviceTranslations (ru) + serviceTranslations (uk)
   - пишет AuditLog
   - возвращает id созданной услуги

   updateService(id, data): Promise<ActionResult<void>>
   - обновляет services + нужные serviceTranslations
   - если slug изменился у PUBLISHED услуги →
     создаёт RedirectRule (301) со старого slug
   - вызывает revalidatePath для страницы услуги и списка услуг
   - пишет AuditLog

   publishService(id): Promise<ActionResult<void>>
   - проверяет: title непустой, slug непустой, meta description есть
   - меняет status → PUBLISHED, устанавливает publishedAt
   - если uk-перевод пустой → возвращает ошибку
   - вызывает revalidatePath
   - пишет AuditLog

   deleteService(id): Promise<ActionResult<void>>
   - только OWNER может удалять
   - если статус PUBLISHED → запрещает (нужно сначала архивировать)

4. Обнови TEMP/PROGRESS.md: отметь 6.1 выполненным.
```

\---

## ШАГ 6.2 — Создать редактор услуги /admin/services/\[id]

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
react-hook-form + zod, TipTap, lucide-react, Tailwind.

Задача: создать полноценный редактор услуги с вкладками.

1. Создай src/app/admin/services/\[id]/page.tsx:
   Server Component, загружает данные услуги.
   Рендерит <ServiceEditor service={...} />

2. Создай src/components/admin/services/ServiceEditor.tsx:
   Вкладки (tabs): Контент | SEO | Публикация | История

3. Вкладка "Контент":
   - Переключатель RU / UK (показывает соответствующий перевод)
   - Поля: status, приоритет, иконка (select), категория, featured
   - slug (с кнопкой "сгенерировать из title")
   - title, shortTitle
   - heroTitle, heroSubtitle
   - description (textarea)
   - symptomsJson (динамический список с add/remove)
   - processJson (шаги: заголовок + описание)
   - benefitsJson (список преимуществ)
   - faqJson (вопрос + ответ, до 10 пунктов)
   - ctaText

4. Вкладка "SEO":
   Компонент <SeoMetaEditor entityType="SERVICE" entityId={id} locale={locale} />
   
   Поля: title, description, keywords, og:title, og:description,
   robots (index/follow toggle), canonical (readonly, автогенерируется)

5. Вкладка "Публикация":
   - текущий статус
   - дата последнего изменения
   - автор последнего изменения
   - кнопки: \[Сохранить черновик] \[Опубликовать] \[Архивировать]
   - предупреждение при несохранённых изменениях (useBeforeUnload)

6. Вкладка "История":
   Список contentRevisions для этой услуги.
   Для каждой: дата, автор, label, кнопка "Восстановить".

7. Автосохранение черновика каждые 60 секунд (только если есть изменения).

8. Обнови TEMP/PROGRESS.md: отметь 6.2 выполненным.
```

\---

\---

# ЭТАП 7 — МОДУЛЬ БЛОГА \[P1]

\---

## ШАГ 7.1 — Создать список статей и server actions блога

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать управление блогом.

1. Создай src/app/admin/blog/page.tsx:
   Таблица: заголовок | категория | RU | UK | статус |
   дата публикации | автор | SEO-score | действия
   Фильтр по статусу и категории.
   Кнопка "+ Новая статья".

2. Создай src/app/admin/actions/blog.ts:

   createBlogPost(data): Promise<ActionResult<{id: string}>>
   - создаёт blogPosts + blogPostTranslations (ru) + blogPostTranslations (uk)
   - статус: DRAFT
   - пишет AuditLog

   updateBlogPost(id, locale, data): Promise<ActionResult<void>>
   - обновляет blogPostTranslations нужной локали
   - если slug изменился у PUBLISHED → создаёт RedirectRule
   - вызывает revalidateTag('blog')
   - пишет AuditLog

   publishBlogPost(id): Promise<ActionResult<void>>
   - проверяет: title, slug, excerpt, meta description
   - сериализует contentJson (TipTap getJSON) → contentHtml через generateHTML
     из @tiptap/html с тем же набором extensions
   - status → PUBLISHED, publishedAt = now()
   - вызывает revalidateTag('blog'), revalidatePath для статьи

   scheduleBlogPost(id, scheduledAt: Date): Promise<ActionResult<void>>
   - status → SCHEDULED
   - устанавливает scheduledAt

   unpublishBlogPost(id): Promise<ActionResult<void>>
   - status → DRAFT
   - вызывает revalidateTag('blog')

   updateBlogPost(id, locale, data) при сохранении/публикации тоже
   сериализует contentJson → contentHtml через generateHTML().

3. Создай src/app/admin/categories/page.tsx и actions:
   createCategory, updateCategory, deleteCategory (если нет статей)

4. Обнови TEMP/PROGRESS.md: отметь 7.1 выполненным.
```

\---

## ШАГ 7.2 — Создать редактор статьи с TipTap

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
TipTap, react-hook-form, Tailwind.

Задача: создать редактор статьи с богатым редактором и SEO-панелью.

1. Создай src/components/admin/blog/BlogPostEditor.tsx:
   Layout: две колонки.
   Левая (2/3): редактор контента.
   Правая (1/3): SEO/публикация.

2. Левая панель:
   - Переключатель RU / UK
   - Поле title (большое)
   - Поле excerpt (150 символов макс, счётчик)
   - TipTap редактор с тулбаром:
     H2, H3, Bold, Italic, Link, BulletList, OrderedList,
     Blockquote, CodeBlock, Image (через медиа-библиотеку)
   - Под редактором: SEO-score полоска (0-100)

3. Правая панель — вкладки: SEO | Публикация | Ссылки

   SEO вкладка:
   - meta title (счётчик 0-65, зелёный 30-65)
   - meta description (счётчик 0-160, зелёный 120-160)
   - og:image (выбор из медиа-библиотеки)
   - canonical (readonly)
   - preview Google snippet (реальный вид в поиске)

   Публикация вкладка:
   - текущий статус
   - категория (select)
   - связанная услуга (select)
   - coverImage (выбор из медиа)
   - readingMinutes (авто или ручной)
   - scheduledAt (datetime-local input)
   - кнопки: \[Черновик] \[На проверку] \[Опубликовать] \[Запланировать]

   Ссылки вкладка:
   - список внутренних ссылок в тексте
   - предупреждение: нет ссылки на money-page (услугу)
   - нет 2-5 внутренних ссылок → предупреждение

4. Создай src/components/admin/blog/TipTapEditor.tsx:
   Оборачивает useEditor из TipTap.
   extensions: StarterKit, Link, Image, Placeholder
   Сохраняет contentJson (editor.getJSON()) в форму.
   Тулбар с кнопками форматирования.

5. Обнови TEMP/PROGRESS.md: отметь 7.2 выполненным.
```

\---

\---

# ЭТАП 8 — МЕДИА-БИБЛИОТЕКА \[P1]

\---

## ШАГ 8.1 — Создать медиа-библиотеку с загрузкой в R2

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Cloudflare R2 (S3-compatible). Next.js API routes.

Задача: создать медиа-библиотеку с загрузкой файлов в Cloudflare R2.

1. Создай src/app/api/admin/media/upload/route.ts:
   POST handler (только авторизованные):
   - принимает multipart/form-data
   - проверяет тип файла (jpg, png, webp, avif only)
   - проверяет размер (макс 5MB)
   - генерирует уникальный fileName: YYYY/MM/uuid.ext
   - загружает в R2 через S3-compatible API
   - сохраняет MediaAsset в D1
   - возвращает { id, publicUrl, width, height }
   
   ВАЖНО: width/height изображения получаются НА КЛИЕНТЕ (через createImageBitmap
   или Image объект в браузере) и передаются в запросе загрузки,
   т.к. на edge runtime Cloudflare Pages серверный sharp недоступен.

2. Создай src/lib/storage/r2.ts:
   - uploadFile(key, body, contentType): Promise<string>
   - deleteFile(key): Promise<void>
   - getFileUrl(key): string
   Использует env.S3\_\* переменные.
   Использует fetch с AWS SigV4 или @aws-sdk/client-s3.

3. Создай src/app/admin/media/page.tsx:
   - Grid изображений из БД
   - поиск по названию
   - drag-and-drop зона загрузки
   - клик на изображение → modal с деталями:
     alt RU, alt UK, title RU, title UK, caption, размер, URL
   - кнопки: копировать URL, удалить, заменить файл

4. Создай src/components/admin/media/MediaPicker.tsx:
   Переиспользуемый компонент для выбора изображения.
   Открывает modal с медиа-библиотекой.
   Используется в редакторах услуг, статей, SEO.

5. Создай src/app/admin/actions/media.ts:
   deleteMediaAsset(id): только ADMIN/OWNER
   updateMediaAsset(id, data): обновляет alt/title/caption
   
   Перед удалением: проверяет, не используется ли
   изображение в опубликованном контенте.

6. Обнови TEMP/PROGRESS.md: отметь 8.1 выполненным.
```

\---

\---

# ЭТАП 9 — FAQ, ОТЗЫВЫ И ЗАЯВКИ (CRM) \[P1]

\---

## ШАГ 9.1 — Модули FAQ, отзывов и мини-CRM заявок

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать модули FAQ, отзывов и CRM заявок.

--- FAQ ---
1. Создай src/app/admin/faq/page.tsx:
   Таблица с drag-and-drop сортировкой.
   Столбцы: вопрос RU | вопрос UK | группа | услуга | статус | действия
   Кнопка "+ Добавить вопрос"

2. Создай src/app/admin/actions/faq.ts:
   createFaqItem, updateFaqItem, deleteFaqItem, reorderFaqItems

--- ОТЗЫВЫ ---
3. Создай src/app/admin/testimonials/page.tsx:
   Таблица: имя | проблема | рейтинг | источник | согласие | статус | действия
   Кнопка "+ Добавить отзыв"

4. Создай src/app/admin/actions/testimonials.ts:
   - createTestimonial, updateTestimonial
   - publishTestimonial: проверяет consentConfirmed === true
     иначе возвращает ошибку
   - Не публиковать без согласия клиента (YMYL защита)

--- ЗАЯВКИ (мини-CRM) ---
5. Создай src/app/admin/leads/page.tsx:
   Таблица: дата | имя | email | телефон | язык |
   страница-источник | статус | последнее действие
   Фильтр по статусу. Сортировка по дате.

6. Создай src/app/admin/leads/\[id]/page.tsx:
   Карточка заявки:
   - сообщение клиента
   - контакты + кнопки: mailto:, https://t.me/, https://wa.me/
   - история статусов (LeadEvent timeline)
   - форма добавления внутренней заметки
   - выбор нового статуса
   - источник заявки и UTM (если есть)

7. Создай src/app/admin/actions/leads.ts:
   updateLeadStatus(id, status, note): Promise<ActionResult<void>>
   - меняет статус
   - создаёт LeadEvent с заметкой
   - пишет AuditLog
   
   markLeadAsSpam(id): только ADMIN/OWNER

8. Обнови TEMP/PROGRESS.md: отметь 9.1 выполненным.
```

\---

\---

# ЭТАП 10 — SEO-МОДУЛЬ \[P1]

\---

## ШАГ 10.1 — Создать SEO-менеджер и score-систему

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать полноценный SEO-модуль с автоматической проверкой.

1. Создай src/lib/seo/score.ts:
   calculateSeoScore(meta: SeoMetaData): { score: number, issues: SeoIssue\[] }
   
   Критерии (каждый = баллы):
   - title: есть +10, длина 30-65 символов +10
   - description: есть +10, длина 120-160 символов +10
   - canonical: есть и абсолютный +10, содержит /ru/ или /uk/ +5
   - hreflang: ru + uk + x-default есть +10
   - og:image: есть +10
   - robots: index+follow для публичных страниц +5
   - нет "common.siteTitle" +5
   - нет "PLACEHOLDER" +5
   - нет пустого H1 +10
   
   Итог: 0-100 баллов.
   SeoIssue = { type, severity: 'error'|'warning'|'info', message }

2. Создай src/lib/seo/validate.ts:
   validateBeforePublish(entityType, entityId, locale): Promise<ValidationResult>
   
   БЛОКИРУЕТ публикацию (errors):
   - пустой title
   - пустой meta description
   - пустой slug
   - canonical конфликтует с другой страницей
   - PLACEHOLDER в любом текстовом поле
   - null/undefined в обязательных полях
   
   ПРЕДУПРЕЖДАЕТ (warnings):
   - og:image не выбран
   - hreflang не настроен
   - description слишком короткий/длинный
   
   YMYL-проверка:
   - ищет слова: вылечим, гарантируем, навсегда избавим,
     без врача, медицинский результат, лечение панических атак
   - возвращает как warning с предложением замены

3. Создай src/app/admin/seo/page.tsx:
   Таблица всех индексируемых URL:
   URL | локаль | title | description | canonical |
   hreflang | robots | schema | sitemap | score
   
   Фильтр: только с ошибками.
   Экспорт в CSV.

4. Создай src/components/admin/seo/SeoMetaEditor.tsx:
   Переиспользуемый компонент.
   Props: entityType, entityId, locale, currentMeta
   
   Поля: title (счётчик), description (счётчик), keywords,
   og:title, og:description, og:image (MediaPicker),
   robots (toggle index/follow), canonical (readonly + ручной override),
   schema type (select)
   
   Внизу: живой preview Google snippet.
   Внизу: живой preview OG-карточки.
   Внизу: SeoScore полоса с issues.

5. Создай src/app/admin/redirects/page.tsx:
   Таблица: fromPath | toPath | код | активен | hits | дата
   Форма добавления нового редиректа.
   Кнопка импорта CSV.

6. Обнови TEMP/PROGRESS.md: отметь 10.1 выполненным.
```

\---

\---

# ЭТАП 11 — ПУБЛИЧНЫЙ САЙТ: ПЕРЕХОД НА БД \[P1]

\---

## ШАГ 11.1 — Подключить публичный сайт к данным из D1

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Cloudflare D1 + Drizzle ORM. Существующие страницы Next.js.

Задача: переключить публичный сайт с JSON/констант на чтение из D1.
ВАЖНО: публичный сайт не должен визуально измениться.

1. Обнови src/app/\[locale]/page.tsx (главная):
   - получить Page (type=HOME) из D1 через getPage('HOME', locale)
   - получить активные PageSection через getHomePageSections(pageId)
   - отрендерить секции в sortOrder порядке
   - generateMetadata из SeoMeta через generateMetadataFromSeo()

2. Обнови src/app/\[locale]/uslugi/page.tsx (список услуг):
   - getServices(locale, { status: 'PUBLISHED' })
   - если нет данных в БД → fallback на константы (временно)

3. Обнови src/app/\[locale]/uslugi/\[slug]/page.tsx (страница услуги):
   - getServiceBySlug(locale, slug)
   - если нет → проверить RedirectRule, если есть → redirect
   - если нет ничего → notFound()
   - generateMetadata из SeoMeta
   - generateStaticParams из всех published услуг

4. Обнови src/app/\[locale]/blog/\[slug]/page.tsx (статья):
   - getBlogPostBySlug(locale, slug, { status: 'PUBLISHED' })
   - если нет → проверить RedirectRule
   - generateMetadata из SeoMeta

5. Обнови src/app/sitemap.ts:
   - строить из D1: published pages, services, blog posts, categories
   - включать обе локали
   - исключать draft, archived, noindex

6. Обнови src/app/\[locale]/layout.tsx:
   - getNavigation(locale) из D1

7. Контрольная проверка после внедрения:
   - все URL работают (нет 404)
   - title/canonical/hreflang не изменились
   - sitemap содержит те же страницы
   - JSON-LD разметка не изменилась

8. Обнови TEMP/PROGRESS.md: отметь 11.1 выполненным.
```

\---

\---

# ЭТАП 12 — НАВИГАЦИЯ, НАСТРОЙКИ, РЕДИРЕКТЫ \[P2]

\---

## ШАГ 12.1 — Модули навигации и настроек сайта

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать управление навигацией и настройками сайта.

1. Создай src/app/admin/navigation/page.tsx:
   - drag-and-drop список пунктов меню
   - три вкладки: HEADER | FOOTER | MOBILE
   - для каждого пункта: RU label, UK label, href, enabled toggle
   - кнопка "+ Добавить пункт"
   - сохранение всего порядка одной кнопкой

2. Создай src/app/admin/actions/settings.ts:
   updateNavigationOrder(items): Promise<ActionResult<void>>    updateNavigationItem(id, data): Promise<ActionResult<void>>
    createNavigationItem(data): Promise<ActionResult<{id: string}>>
    deleteNavigationItem(id): Promise<ActionResult<void>>
    (имена таблиц в коде — camelCase: navigationItems, siteSettings, contactChannels и т.д.)

3. Создай src/app/admin/settings/page.tsx:
   Вкладки:
   - Общие: название сайта, автор, должность, default locale, timezone
   - Контакты: email, Telegram, WhatsApp, телефон, primary CTA
   - SEO: default og:image, site description, author schema
   - Аналитика: GA4 ID, toggle аналитики
   - Юридическое: владелец, privacy email, дата политики, дисклеймер
   - Социальные сети: ссылки

4. Дополни src/app/admin/actions/settings.ts:
   updateSiteSettings(group, data): Promise<ActionResult<void>>
   - проверяет роль OWNER
   - валидирует через zod-схему группы
   - пишет AuditLog с before/after
   - вызывает revalidateTag('settings')

5. Создай src/app/admin/redirects/page.tsx:
   - таблица всех redirectRules
   - форма: fromPath, toPath, statusCode (301|302)
   - кнопка "Деактивировать"
   - счётчик hitCount

6. Обнови TEMP/PROGRESS.md: отметь 12.1 выполненным.
```

\---

\---

# ЭТАП 13 — РЕВИЗИИ, ПРЕВЬЮ, ПУБЛИКАЦИЯ ПО РАСПИСАНИЮ \[P3]

\---

## ШАГ 13.1 — Ревизии, предпросмотр и запланированная публикация

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: добавить систему ревизий, предпросмотра и scheduled публикации.

1. Создай src/lib/revisions/create.ts:
   createRevision({entityType, entityId, locale, data, userId, label})
   Вызывается:
   - при каждой публикации (label: "Публикация YYYY-MM-DD HH:mm")
   - при ручном "Сохранить версию" (label: введённый пользователем)
   - автоматически каждые 10 минут если есть изменения

2. Создай src/lib/revisions/restore.ts:
   restoreRevision(revisionId): Promise<ActionResult<void>>
   - берёт dataJson из ContentRevision
   - применяет к соответствующей Translation записи
   - статус переводит в DRAFT (не публикует автоматически)
   - пишет AuditLog

3. Создай src/app/api/admin/preview/route.ts:
   GET handler:
   - проверяет session
   - принимает ?entityType=SERVICE\&entityId=xxx\&locale=ru
   - загружает DRAFT данные
   - устанавливает \_\_preview=1 cookie
   - redirect на публичную страницу
   
   Публичный сайт проверяет \_\_preview cookie:
   если есть → загружает DRAFT, иначе только PUBLISHED

4. Создай Cloudflare Cron Worker для scheduled публикации:
   Файл: src/worker/scheduler.ts
   - запускается каждые 5 минут (cron: "\*/5 \* \* \* \*")
   - ищет blogPosts и services со status=SCHEDULED и scheduledAt <= now
   - публикует их (status → PUBLISHED, publishedAt = now)
   - делает HTTP POST на защищённый секретом on-demand revalidation route
     (/api/revalidate?secret=...), который вызывает revalidatePath/revalidateTag
   - НЕ вызывает Next.js revalidatePath напрямую (Cron Worker — отдельный Worker)
   - пишет AuditLog

5. Создай src/app/api/revalidate/route.ts:
   - GET handler, принимает secret в query
   - сравнивает secret с env.REVALIDATION_SECRET
   - вызывает revalidatePath/revalidateTag для указанных страниц
   - возвращает { revalidated: true }

6. Добавь wrangler.toml секцию:
   \[\[triggers.crons]]
   crons = \["\*/5 \* \* \* \*"]

6. Обнови TEMP/PROGRESS.md: отметь 13.1 выполненным.
```

\---

\---

# ЭТАП 14 — ПОЛЬЗОВАТЕЛИ И ЖУРНАЛ ДЕЙСТВИЙ \[P2]

\---

## ШАГ 14.1 — Модуль управления пользователями и журнал

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Только OWNER может управлять пользователями.

Задача: создать управление пользователями и журнал действий.

1. Создай src/app/admin/users/page.tsx (только OWNER):
   Таблица: имя | email | роль | статус | последний вход | действия
   Кнопка "+ Добавить пользователя"
   Предупреждение: нельзя удалить себя.

2. Создай src/app/admin/actions/users.ts:
   createUser(data): Promise<ActionResult<{id: string}>>
   - только OWNER
   - хэширует пароль через bcryptjs
   - отправляет email с инструкциями (опционально)

   updateUserRole(id, role): Promise<ActionResult<void>>
   - только OWNER
   - нельзя изменить роль себя

   deactivateUser(id): Promise<ActionResult<void>>
   - только OWNER
   - помечает isActive = false (не удаляет)
   - завершает активные сессии пользователя

3. Создай src/app/admin/audit/page.tsx:
   Таблица журнала действий:
   дата | пользователь | действие | тип сущности | сущность | IP
   Фильтр по пользователю, действию, периоду.
   Клик на строку → modal с before/after JSON diff.

4. Создай src/components/admin/audit/JsonDiff.tsx:
   Визуальное сравнение before/after JSON:
   - удалённые поля → красный фон
   - добавленные → зелёный фон
   - изменённые → жёлтый фон
   - неизменённые → серый

5. Обнови TEMP/PROGRESS.md: отметь 14.1 выполненным.
```

\---

\---

# ЭТАП 15 — РЕДАКТОР ГЛАВНОЙ И СТРАНИЦ \[P2]

\---

## ШАГ 15.1 — Редактор главной страницы с секциями

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать редактор главной страницы с управляемыми секциями.

1. Создай src/app/admin/home/page.tsx:
   Список секций с drag-and-drop порядком:
   - hero | problems | method | services | author |
     testimonials | faq | finalCta
   - каждая секция: toggle вкл/выкл, редактировать, предпросмотр

2. Создай src/app/admin/home/sections/\[key]/page.tsx:
   Редактор секции в зависимости от type:
   
   hero: RU/UK заголовок, подзаголовок, CTА текст, фоновое фото
   problems: RU/UK заголовок, список проблем (add/remove)
   services: RU/UK заголовок, выбор услуг для отображения
   author: RU/UK имя, должность, bio, фото, credentials
   testimonials: RU/UK заголовок, выбор отзывов
   faq: RU/UK заголовок, выбор FAQ-вопросов
   finalCta: RU/UK заголовок, текст кнопки, href

3. ВАЖНО: не давать менять Tailwind-классы напрямую.
   Только контролируемые параметры в settingsJson:
   - background: 'default' | 'surface' | 'elevated' | 'gold-accent'
   - alignment: 'left' | 'center'
   - itemCount: number (для карточек)
   - showCta: boolean

4. Создай src/app/admin/pages/page.tsx:
   Таблица статических страниц (about, contacts, privacy, disclaimer).
   Для каждой: название, RU slug, UK slug, статус, SEO-score, изменить.

5. Обнови TEMP/PROGRESS.md: отметь 15.1 выполненным.
```

\---

\---

# ЭТАП 16 — КОМАНДНАЯ ПАЛИТРА И ФИНАЛЬНЫЙ POLISH \[P3]

\---

## ШАГ 16.1 — Командная палитра и финальные улучшения UX

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: добавить командную палитру и финальные улучшения UX.

1. Создай src/components/admin/CommandPalette.tsx:
   Горячая клавиша: Ctrl+K (Cmd+K на Mac)
   Поиск по:
   - страницам и услугам (из БД)
   - статьям блога (из БД)
   - заявкам (имя, email)
   Быстрые действия:
   - "Новая статья" → /admin/blog/new
   - "Новая услуга" → /admin/services/new
   - "Загрузить изображение" → /admin/media
   - "Настройки SEO" → /admin/seo
   - "Журнал действий" → /admin/audit
   
   Реализация: useEffect + keydown listener, modal с input + список.
   Навигация стрелками + Enter.

2. Добавь к AdminShell: <CommandPalette />

3. Добавь toast-уведомления:
   - после успешного сохранения: зелёный toast
   - после ошибки: красный toast
   - после публикации: зелёный toast с ссылкой на страницу
   Используй простой кастомный Toast без библиотек.

4. Добавь useBeforeUnload во все редакторы:
   если есть несохранённые изменения → предупреждение при закрытии вкладки.

5. Добавь счётчик новых заявок в сайдбаре (бейдж рядом с "Заявки"):
   обновляется при загрузке layout.

6. Обнови TEMP/PROGRESS.md: отметь 16.1 выполненным.
```

\---

\---

# ЭТАП 17 — ТЕСТИРОВАНИЕ \[P4]

\---

## ШАГ 17.1 — Создать тесты и SEO-regression скрипт

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.

Задача: создать тесты для критических частей системы.

1. Unit-тесты (vitest или jest):
   src/\_\_tests\_\_/seo/score.test.ts — calculateSeoScore
   src/\_\_tests\_\_/seo/validate.test.ts — validateBeforePublish
   src/\_\_tests\_\_/auth/permissions.test.ts — canPublish, canDelete и т.д.
   src/\_\_tests\_\_/db/slug.test.ts — генерация slug из title

2. Создай scripts/seo-regression.ts:
   Скрипт обходит все публичные URL (ru + uk) и проверяет:
   - status 200
   - один H1
   - title без "common.siteTitle"
   - meta description есть
   - canonical есть и абсолютный
   - hreflang (ru + uk + x-default) есть
   - JSON-LD валидный JSON
   - нет "PLACEHOLDER" в тексте
   
   Выводит отчёт: OK/FAIL для каждого URL.
   Добавь в package.json: "test:seo": "tsx scripts/seo-regression.ts"

3. Добавь базовый Playwright тест (если не установлен — установи):
   e2e/admin.spec.ts:
   - вход в /admin/login
   - переход в /admin/blog/new
   - заполнение заголовка и контента
   - сохранение черновика
   - публикация
   - открытие публичной страницы
   - проверка title и canonical в head

4. Обнови TEMP/PROGRESS.md: отметь 17.1 выполненным.
```

\---

\---

# ЭТАП 18 — ДЕПЛОЙ И ЭКСПЛУАТАЦИЯ \[P0]

\---

## ШАГ 18.1 — Подготовить production деплой

```
ПРОМТ ДЛЯ АГЕНТА:

Ты работаешь над Next.js App Router проектом Podvarchan.com.
TypeScript strict mode обязателен. Тип any запрещён.
Cloudflare Pages + D1 + R2 + Workers.

Задача: подготовить проект к production деплою.

1. Проверь, что production build проходит без ошибок:
   npm run build
   Исправь все TypeScript ошибки и предупреждения.

2. Создай TEMP/DEPLOY\_CHECKLIST.md с чеклистом:
   \[ ] База данных D1 создана в Cloudflare Dashboard
   \[ ] Миграции применены: wrangler d1 migrations apply DB
   \[ ] Seed выполнен: npm run db:seed
   \[ ] OWNER пользователь создан и может войти в /admin
   \[ ] R2 bucket создан с публичным read
   \[ ] R2 CORS настроен
   \[ ] ENV переменные добавлены в Cloudflare Pages Settings
   \[ ] AUTH\_SECRET добавлен в Cloudflare Pages
   \[ ] /admin/login открывается и работает
   \[ ] Публичный сайт загружает данные из D1
   \[ ] Sitemap генерируется из БД
   \[ ] Загрузка изображений работает через R2

3. Создай ADMIN\_GUIDE.md в корне (документация для владельца):
   ## Как войти в админку
   ## Как создать и опубликовать статью
   ## Как изменить услугу
   ## Как загрузить изображение
   ## Как изменить SEO
   ## Как обработать заявку
   ## Как откатить версию контента
   ## Что нельзя публиковать (YMYL-ниша)
   ## Что делать если что-то сломалось

4. Создай wrangler.toml (если не существует) с:
   - database binding для D1
   - r2 binding
   - cron triggers для scheduler

5. Обнови TEMP/PROGRESS.md: отметь 18.1 выполненным.
   Отметь все выполненные этапы итоговым статусом.
```

\---

\---

## КРИТЕРИИ ГОТОВНОСТИ ВСЕЙ СИСТЕМЫ

Перед переходом на production убедитесь, что выполнено всё из списка:

1. Владелец может войти в /admin и безопасно выйти
2. Владелец может создать, отредактировать и опубликовать услугу на RU и UK
3. Владелец может создать, отредактировать и опубликовать статью на RU и UK
4. Изменение контента сразу отображается на публичном сайте после revalidate
5. Sitemap обновляется после публикации
6. Canonical и hreflang генерируются корректно для RU/UK
7. Нельзя случайно опубликовать страницу с пустым title, description, slug или PLACEHOLDER
8. Все действия администратора пишутся в AuditLog
9. Изображения загружаются через медиа-библиотеку и имеют alt RU/UK
10. Заявки из формы попадают в админку и имеют статусы
11. Есть предпросмотр черновика
12. Есть история версий и восстановление
13. Production build проходит успешно
14. E2E-сценарии входа, публикации и проверки SEO проходят

