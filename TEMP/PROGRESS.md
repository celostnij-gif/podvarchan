# PROGRESS.md — Поточний стан реалізації адмін-панелі

## Останнє оновлення
2026-06-05

## Етап 0 — Исправление руководства

### ✅ 0.1 — 12 правок в IMPLEMENTATION_GUIDE.md — виконано 2026-06-05
- [x] Правка 1: next-auth → next-auth@beta, devDeps +tsx/wrangler/@aws-sdk/client-s3/+@tiptap/html
- [x] Правка 2: +CLOUDFLARE_ACCOUNT_ID, +CLOUDFLARE_DATABASE_ID, +CLOUDFLARE_API_TOKEN в env + zod (optional)
- [x] Правка 3: drizzle.config.ts — убран driver: 'd1-http' и dbCredentials (binding-режим)
- [x] Правка 4: src/db/index.ts — getDb(d1) через getRequestContext, НЕ глобальный singleton
- [x] Правка 5: имена таблиц приведены к camelCase по всему документу
- [x] Правка 6: seed — НЕ через DATABASE_URL; скрипт → SQL → wrangler d1 execute
- [x] Правка 7: LOGIN_OUT → LOGOUT
- [x] Правка 8: Image → ImageIcon (import { Image as ImageIcon })
- [x] Правка 9: revalidatePath/Tag ТОЛЬКО в server actions/route handlers
- [x] Правка 10: contentJson → contentHtml через @tiptap/html при publish/update
- [x] Правка 11: width/height изображений — на клиенте через createImageBitmap
- [x] Правка 12: Cron Worker → HTTP POST на /api/revalidate?secret=...

---

## Виконані задачі (підготовка сайту)

### ✅ 1.1 — Налаштування ESLint
- Міграція на ESLint flat config
- Виправлено 4 критичні помилки
- ESLint — 0 errors

### ✅ 1.2 — Очищення Git та сміттєвих файлів
- Додано tsconfig.tsbuildinfo в .gitignore
- Проаналізовано img/ та public/images/
- Видалено мертві імпорти

### ✅ 2.1 — OG-зображення
- Додано metadataBase в layout.tsx
- Виправлено set-state-in-effect в TiltCard та useScrollProgress

### ✅ 2.2 — Дедуплікація контенту
- Винесено тексти з constants у messages
- Додано локальні типи для messages

### ✅ 3.1 — Rate Limiting
- Створено src/lib/rateLimit.ts (KV + in-memory fallback)
- Додано cloudflare-env.d.ts
- Оновлено route.ts

---

## Поточний етап: Етап 1 — Підготовка проекту до адмін-панелі [P0]

### ✅ 1.1 — Створення гілки та структури — виконано 2026-06-04
- [x] Створено гілку `feature/admin-panel`
- [x] Оновлено PROGRESS.md
- [x] Створено TEMP/content-backup/README.md
- [x] Створено TEMP/MIGRATION_MAP.md
- [x] Збережено бэкап контенту (messages, constants, blog)

### ✅ 1.2 — Встановлення залежностей — виконано 2026-06-04
- [x] Встановлено drizzle-orm, drizzle-kit, @types/bcryptjs
- [x] Встановлено @auth/core, next-auth (Auth.js v5)
- [x] Встановлено zod, react-hook-form, @hookform/resolvers
- [x] Встановлено @tiptap/* (9 пакетів редактора)
- [x] Встановлено lucide-react, date-fns, bcryptjs
- [x] TypeScript — без помилок
- [x] Додано 91 новий пакет (81 runtime + 10 devDeps)
  ПРИМІТКА: довелося перевстановити node_modules через пошкоджений package-lock.json

### ✅ 1.3 — ENV змінні — виконано 2026-06-04
- [x] Створено src/env.ts з zod-валідацією усіх змінних (обов'язкові + опціональні)
- [x] Оновлено .env.example — додано адмін-панель (D1, Auth, Seed, R2)
- [x] .gitignore — вже містить `.env*.local`
- [x] TypeScript — без помилок

---

## Етап 2 — База даних: Drizzle + Cloudflare D1 [P0]

### ✅ 2.1 — Drizzle схема БД — виконано 2026-06-04
- [x] Створено drizzle.config.ts (d1-http драйвер)
- [x] Створено src/db/schema.ts — 20 таблиць (users, auditLogs, seoMeta, pages, pageTranslations, pageSections, pageSectionTranslations, services, serviceTranslations, blogCategories, blogCategoryTranslations, blogPosts, blogPostTranslations, mediaAssets, faqItems, faqItemTranslations, testimonials, testimonialTranslations, contactLeads, leadEvents, siteSettings, contactChannels, navigationItems, redirectRules, contentRevisions)
- [x] Створено src/db/index.ts (Drizzle ініціалізація для D1)
- [x] Оновлено cloudflare-env.d.ts — додано D1Database тип
- [x] TypeScript — без помилок
  ПРИМІТКА: виправлено circular reference в navigationItems.parentId, змінено uniqueIndex→index на contentRevisions, додано onDelete каскади

### ✅ 2.2 — Seed + міграція — виконано 2026-06-04
- [x] Згенеровано міграцію: drizzle/migrations/0000_serious_diamondback.sql (25 таблиць)
- [x] Додано скрипти в package.json: db:generate, db:migrate:local, db:migrate:prod, db:seed, db:studio
- [x] Створено src/db/seed.ts — ідемпотентний seed (OWNER, services, blog, faq, testimonials, pages, navigation, contacts, settings)
- [x] Встановлено tsx в devDependencies
- [x] TypeScript — без помилок
  ПРИМІТКА: виправлено баг з ідентифікацією статей (перевірка через slug, а не id)

---

## Етап 3 — Авторизація та захист /admin [P0]

### ✅ 3.1 — Auth.js (NextAuth v4) — виконано 2026-06-04
- [x] Створено src/types/auth.ts — розширення типів Session, JWT, UserRole
- [x] Створено src/lib/auth/permissions.ts — canPublish, canDelete, canManageUsers та ін.
- [x] Створено src/lib/auth/session.ts — getAdminSession, requireAdminSession, requireRole
- [x] Створено src/auth.ts — NextAuth v4 + Credentials + Drizzle + bcrypt + rate limit (in-memory)
- [x] Створено src/app/api/auth/[...nextauth]/route.ts
- [x] Оновлено src/middleware.ts — комбінований захист /admin + next-intl i18n (JWT через getToken)
- [x] TypeScript — без помилок
  ПРИМІТКА: D1 binding отримується через getCloudflareContext() — dev mode без wrangler повертає null

### ✅ 3.2 — Логін та audit log — виконано 2026-06-04
- [x] Створено src/app/admin/login/page.tsx — react-hook-form + zod + dark theme + next-auth signIn
- [x] Створено src/app/admin/layout.tsx — базовий layout (noindex, dark bg)
- [x] Створено src/lib/audit/log.ts — writeAuditLog (D1 + Drizzle)
- [x] Створено src/app/admin/logout/route.ts — POST logout + audit log + signOut
- [x] TypeScript — без помилок

---

## Етап 4 — Layout та UX адмінки [P0]

### ✅ 4.1 — Shell, sidebar, topbar — виконано 2026-06-04
- [x] Створено AdminShell — лейаут-обгортка (сайдбар + топбар + футер)
- [x] Створено AdminSidebar — навігація з 4 групами (Главная, Контент, CRM, Система)
- [x] Створено AdminTopbar — хлібні крихти + юзер інфо + Logout
- [x] Створено StatusBadge — 9 статусів (draft, published, scheduled, archived, hidden, review, spam, active, inactive)
- [x] Створено index.ts — реекспорт адмін-компонентів
- [x] Оновлено src/app/admin/layout.tsx — інтеграція AdminShell + getAdminSession
- [x] Login page (admin/login) — рендериться без Shell (тільки темний фон + контент)
- [x] TypeScript — без помилок

### ✅ 4.2 — Дашборд /admin — виконано 2026-06-04
- [x] Створено src/lib/admin/dashboard.ts — модуль збору статистики з D1 (10 категорій даних)
- [x] Створено src/app/admin/page.tsx — дашборд зі StatCard сіткою (5 колонок), alert-панелями
- [x] Секція «Последние заявки» — таблиця з ім'ям, контактом, джерелом, статусом, датою
- [x] Секція «Черновики» — список неопублікованих статей/услуг/страниц
- [x] Секція «SEO-проблемы» — записи без meta-description
- [x] Graceful fallback — при недоступності D1 показує заглушку + банер
- [x] TypeScript — без помилок

---

## Етап 5 — Server Actions [P0]

### ✅ 5.1 — Базовий шар server actions — виконано 2026-06-04
- [x] result.ts — ActionResult тип + helpers (ok, okVoid, fail, isOk, isFail, unwrap)
- [x] guard.ts — 9 guards з forwarding args через ...args/spread
- [x] db.ts — getActionDb helper
- [x] 10 action modules: services, blog, faq, testimonials, leads, media, pages, navigation, settings, redirects
- [x] index.ts — реекспорт усіх actions
- [x] content/index.ts — sync (статичні дані) + async (D1) шари
- [x] TypeScript — без помилок

---

## Етап 6 — Модуль послуг [P1]

### ✅ 6.1 — Список послуг /admin/services — виконано 2026-06-04
- [x] Створено src/app/admin/services/page.tsx — таблиця з іконкою, назвою, slug, статусом, пріоритетом, датою зміни
- [x] 7 колонок з responsive visibility (mobile/tablet/desktop)
- [x] Empty state + D1 fallback banner
- [x] StatusBadge для статусів (DRAFT/PUBLISHED/ARCHIVED)
- [x] Посилання на /admin/services/[id] (редагування) та /admin/services/new (створення)
- [x] TypeScript — без помилок

### ✅ 6.2 — Редактор послуги /admin/services/[id] — виконано 2026-06-04
- [x] Створено src/app/admin/services/[id]/page.tsx — серверний компонент (create + edit режими)
- [x] Створено src/components/admin/ServiceEditor.tsx — форма з react-hook-form + zod
- [x] Секція «Основные настройки»: slugBase, icon, category, priority, featured
- [x] Секція «Переводы»: вкладки RU/UK з полями (title, slug, shortTitle, description, heroTitle, heroSubtitle, ctaText + JSON-поля)
- [x] Кнопки: Save / Publish-Unpublish / Delete (з підтвердженням)
- [x] Toast-сповіщення про результат операцій
- [x] Виправлено updateService — правильно оновлює переклади (upsert)
- [x] Додано TranslationSchema з усіма extra-полями в схему валідації
- [x] TypeScript — без помилок

---

## Етап 7 — Модуль блогу [P1]

### ✅ 7.1 — Список статей /admin/blog — виконано 2026-06-04
- [x] Створено src/app/admin/blog/page.tsx — таблиця з назвою, категорією, статусом, часом читання, датою
- [x] Double left join: blogPosts→blogPostTranslations (RU title) + blogPosts→blogCategoryTranslations (RU category name)
- [x] StatusBadge для 5 статусів блогу (DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED)
- [x] Empty state + D1 fallback banner
- [x] Responsive columns (mobile/tablet/desktop)
- [x] TypeScript — без помилок

### ✅ 7.2 — Редактор з TipTap — виконано 2026-06-04
- [x] Створено src/components/admin/TipTapEditor.tsx — WYSIWYG редактор (Bold, Italic, Strike, H2-H4, Blockquote, BulletList, OrderedList, CodeBlock, Link, Image, Undo/Redo)
- [x] Створено src/components/admin/BlogEditor.tsx — форма з react-hook-form+zod+TipTap, вкладки RU/UK, категорія, статуси
- [x] Створено src/app/admin/blog/[id]/page.tsx — серверний компонент (create + edit режими)
- [x] Оновлено src/components/admin/index.ts — експорт BlogEditor, TipTapEditor
- [x] Типовий набір: заголовок, slug, excerpt, content (TipTap), категорія, час читання, статус
- [x] Кнопки: Save / Delete (з підтвердженням) + кнопки статусів (DRAFT/REVIEW/PUBLISHED/ARCHIVED)
- [x] Dark theme, consistent styling з адмін-панеллю
- [x] TypeScript — без помилок

---

## Етап 8 — Медіа-бібліотека [P1]

### ✅ 8.1 — Медіа-бібліотека /admin/media — виконано 2026-06-04
- [x] Додано uploadMediaAsset action — локальне зберігання (public/uploads/YYYY/MM/), валідація (20 MB), визначення розмірів зображень
- [x] Додано deleteFileLocally — фізичне видалення файлу при delete
- [x] Створено src/components/admin/MediaLibrary.tsx — сітка з responsive grid (2–6 колонок)
- [x] Drag-n-drop upload zone + кнопка вибору файлів
- [x] Прев'ю зображень + іконки для інших типів файлів
- [x] Копіювання URL в буфер + видалення з підтвердженням
- [x] Створено src/app/admin/media/page.tsx
- [x] Image dimension detection: JPEG (64KB header, proper marker skip), PNG, GIF, WEBP
- [x] TypeScript — без помилок

---

## Етап 9 — FAQ, відгуки, CRM [P1]

### ✅ 9.1 — FAQ, Testimonials, Leads — виконано 2026-06-04
  ПРИМІТКА (2026-06-05): виправлено баг в `updateTestimonial` — додано upsert перекладів (була відсутня логіка оновлення `testimonialTranslations`). Додано імпорт `and` з drizzle-orm. Виправлено type error в `blog/kategoriya/[cat]/page.tsx`. Видалено unused imports `SERVICE_ICONS` та `SERVICES`.
  TypeScript — 0 errors, ESLint — 0 errors/warnings.

---

## Етап 10 — SEO-модуль [P1]

### ✅ 10.1 — SEO-менеджер — виконано 2026-06-05
- [x] Створено src/lib/seo/score.ts — calculateSeoScore (0-100 балів, 10 критеріїв, кольорова шкала)
- [x] Створено src/lib/seo/validate.ts — validateBeforePublish з YMYL-перевіркою (17 проблемних слів)
- [x] Створено src/app/admin/redirects/page.tsx — повноцінний CRUD: таблиця, форма додавання, toggle вкл/викл, видалення
- [x] Оновлено SeoEditor.tsx — додано Google Snippet Preview, live SEO Score з полоскою + список проблем
- [x] Оновлено admin/seo/page.tsx — додано колонку Score з кольоровим індикатором
  ПРИМІТКА: виправлено баги (unused imports, ogImageId не відстежувався, score макс 80 замість 100)
  TypeScript — 0 errors, ESLint — 0 errors/warnings

---

## Етап 11 — Публічний сайт на D1 [P1]

### ✅ 11.1 — Підключення публічного сайту до D1 — виконано 2026-06-05
- [x] Головна сторінка — getPublishedTestimonials + fallback на messages (AggregateRating schema)
- [x] Список послуг (/uslugi) — серверна обгортка + D1 + fallback
- [x] Сторінка послуги (/uslugi/[slug]) — getServiceBySlug + fallback на messages
- [x] Список блогу (/blog) — серверна обгортка + D1 + fallback
- [x] Стаття блогу (/blog/[slug]) — getBlogPostBySlug + fallback на статику
- [x] Категорія блогу (/blog/kategoriya/[cat]) — D1 + fallback на статику
- [x] FAQ (/faq) — getPublishedFaq + fallback на messages
- [x] Sitemap — async, D1 try/catch для послуг/категорій/статей з fallback на константи
- [x] Layout — підготовлено шар даних для навігації (TODO, очікує доопрацювання Header/Footer)
  ПРИМІТКА: виправлено баги (await в не-async функції sitemap, unused imports)
  TypeScript — 0 errors, ESLint — 0 errors/warnings

---

## Етап 12 — Навігація, налаштування, редиректи [P2]

### ✅ 12.1 — Navigation, Settings, Redirects — виконано 2026-06-05
- [x] Contact channels CRUD actions в settings.ts (getContactChannels, create/update/deleteContactChannel)
- [x] /admin/navigation/ — управління пунктами навігації: вкладки HEADER/FOOTER/MOBILE, дерево parent/children, toggle вкл/викл, модальна форма, видалення
- [x] /admin/settings/ — редактор налаштувань сайту (12 полів з onBlur-save) + управління контактними каналами (CRUD, тип/label/value/url)
- [x] /admin/redirects/ — реалізовано в Step 10.1
  ПРИМІТКА: виправлено unused imports, loadItems → reload, Drizzle type assertion, ESLint set-state-in-effect через setTimeout
  TypeScript — 0 errors, ESLint — 0 errors/warnings

---

## Етап 13 — Ревізії, прев'ю, розклад [P3]

### ⬜ 13.1 — Revisions, preview, cron

---

## Етап 14 — Користувачі та журнал [P2]

### ✅ 14.1 — Users, Audit log — виконано 2026-06-05
- [x] src/lib/actions/users.ts — CRUD (getUsers, create/update/deleteUser) + zod-валідація + bcrypt + withCanManageUsers
- [x] src/lib/actions/audit.ts — getAuditLogs з фільтрацією (action, entityType) + left join з users
- [x] /admin/users/ — таблиця з role badges, toggle активності, create/edit modal, delete, кольори ролей
- [x] /admin/audit/ — панель фільтрів + expandable деталі з before/after JSON diff
  ПРИМІТКА: виправлено EMPTY_FORM role type, невикористані імпорти, passwordHash деструктуризація
  TypeScript — 0 errors, ESLint — 0 errors/warnings

---

## Етап 15 — Редактор головної [P2]

### ✅ 15.1 — Home page editor — виконано 2026-06-05
- [x] getHomePage, updateSectionSettings, updateSectionTranslation в pages.ts
- [x] /admin/home/ — редактор: сітка секцій, toggle вкл/викл, модальне вікно налаштувань (background/alignment/itemCount), редактор контенту (RU/UK JSON для hero/finalCta)
- [x] AdminSidebar — додано посилання «Головна» в групу Контент
  ПРИМІТКА: виправлено імпорт and, dead code allTrans, невикористані імпорти
  TypeScript — 0 errors, ESLint — 0 errors/warnings

---

## Етап 16 — Командна палітра [P3]

### ⬜ 16.1 — Command palette, toast, polish

---

## Етап 17 — Тести [P4]

### ⬜ 17.1 — Unit tests, SEO-regression, E2E

---

## Етап 18 — Production деплой [P0]

### ⬜ 18.1 — DEPLOY_CHECKLIST.md, ADMIN_GUIDE.md, фінальний деплой
