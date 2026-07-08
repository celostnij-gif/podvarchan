# MIGRATION PLAN: Admin Panel — Podvarchan.com → Podvarchan-master-backup

**Мета:** Переписати адмін-панель поточної розробки (backup) на робочу версію з `Podvarchan.com`. Замінити все: UI, Server Actions, Auth, Schema — щоб адмінка збігалася з продакшном і працювала.

**Джерело:** `C:/buff/Podvarchan.com/` (live, робоча версія)
**Приймач:** `C:/buff/Podvarchan-master-backup/` (поточна розробка, Phase 14)

---

## Фаза A — Schema alignment (сумісність з D1)

Поточна схема в бекапі не збігається з продакшн D1. Треба привести таблиці у відповідність.

### A1. Users
- Додати колонку `google_id` (text, unique)
- Розширити enum `role`: `USER, VIEWER, EDITOR, ADMIN, OWNER`
- Змінити `lastLoginAt` з text на integer (timestamp_ms)
- Змінити `createdAt`/`updatedAt` з text на integer

### A2. Services
- Додати колонки: `publishedAt` (integer), `scheduledAt` (integer)
- Розширити enum `status`: `DRAFT, PUBLISHED, SCHEDULED, ARCHIVED`

### A3. Blog posts
- Додати колонки: `publishedAt` (integer), `scheduledAt` (integer)
- Додати `seoMetaId` в blogPostTranslations

### A4. Інші таблиці
- Перевірити відповідність `createdAt`/`updatedAt` формату (text vs integer)
- Додати відсутні таблиці: `content_revisions`, `lead_events` (якщо нема)
- Додати індекси та foreign keys де потрібно

### A5. D1 migration
- Створити `drizzle/migrations/<timestamp>_align_schema.sql`
- Застосувати до production D1

---

## Фаза B — Auth upgrade (NextAuth v4 → v5 + Google OAuth)

**Мета:** Додати Google OAuth, rate limiting login, правильну ієрархію ролей.

### B1. Файли з Podvarchan.com
- `src/auth.ts` — нова конфігурація NextAuth (Credentials + Google OAuth + rate limit)
- `src/lib/auth/session.ts` — `getAdminSession()`, `requireAdminSession()`, `requireRole()`
- `src/lib/auth/permissions.ts` — розширена ієрархія (USER..OWNER)
- `src/types/auth.ts` — типи сесії з ролями

### B2. Адаптація
- Змінити імпорти в `auth.config.ts` на нову структуру
- Оновити `src/env.ts` — додати `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST`

### B3. Middleware
- Скопіювати адмін-захист з live-версії (JWT cookie check)
- Зберегти існуючий захист публічних сторінок (slug mapping, redirects)

---

## Фаза C — Server Actions (ActionResult + HOC guards)

**Мета:** Замінити прямі перевірки ролей на HOC-обгортки та ActionResult.

### C1. Ядро
- `src/lib/actions/result.ts` — `ok()`, `fail()`, `ActionResult<T>`
- `src/lib/actions/guard.ts` — `withRole()`, `withCanDelete()`, etc.
- `src/lib/actions/db.ts` — `getActionDb()` (D1 через getCloudflareContext)
- `src/lib/actions/index.ts` — єдина точка експорту

### C2. CRUD модулі
- `src/lib/actions/services.ts`
- `src/lib/actions/blog.ts`
- `src/lib/actions/faq.ts`
- `src/lib/actions/testimonials.ts`
- `src/lib/actions/leads.ts`
- `src/lib/actions/media.ts`
- `src/lib/actions/pages.ts`
- `src/lib/actions/seo.ts`
- `src/lib/actions/navigation.ts`
- `src/lib/actions/redirects.ts`
- `src/lib/actions/settings.ts`
- `src/lib/actions/users.ts`
- `src/lib/actions/audit.ts`
- `src/lib/actions/search.ts`

### C3. Видалити
- `src/app/admin/actions/*` — старий підхід з прямими перевірками
- `src/lib/auth/permissions.ts` — замінити на новий з Podvarchan.com

---

## Фаза D — UI Components (темна тема, AdminShell, Editor-и)

**Мета:** Скопіювати весь компонентний шар з Podvarchan.com.

### D1. Layout
- `src/app/admin/layout.tsx` — кореневий layout з `AdminShell`
- `src/components/admin/AdminShell.tsx` — оболонка (sidebar + topbar + footer)
- `src/components/admin/AdminSidebar.tsx` — Lucide-іконки, темна тема
- `src/components/admin/AdminTopbar.tsx` — профіль, logout
- `src/components/admin/CommandPalette.tsx` — Cmd+K пошук

### D2. Editors
- `src/components/admin/ServiceEditor.tsx` — форма послуги (RU/UK таби)
- `src/components/admin/BlogEditor.tsx` — редактор блогу
- `src/components/admin/TipTapEditor.tsx` — WYSIWYG (rich text)
- `src/components/admin/FaqEditor.tsx`
- `src/components/admin/TestimonialEditor.tsx`
- `src/components/admin/SeoEditor.tsx`
- `src/components/admin/MediaLibrary.tsx`
- `src/components/admin/StatusBadge.tsx`
- `src/components/admin/index.ts` — re-export

### D3. Dashboard data
- `src/lib/admin/dashboard.ts` — `getDashboardData()`

---

## Фаза E — Admin Pages (Server Components + Client Editors)

**Мета:** Переписати всі адмін-сторінки за єдиним патерном.

### E1. Pattern
```
src/app/admin/<entity>/
├── page.tsx          — список (Server Component, таблиця)
├── [id]/page.tsx     — редактор (отримує дані через Server Action → Client Editor)
```

### E2. Сторінки
- `/admin` — Dashboard (статистика, останні заявки, чернетки, SEO issues)
- `/admin/login` — логін
- `/admin/services` + `/[id]` + `/new`
- `/admin/blog` + `/[id]` + `/new`
- `/admin/blog/categories` + `/[id]` + `/new`
- `/admin/faq` + `/[id]` + `/new`
- `/admin/testimonials` + `/[id]` + `/new`
- `/admin/leads` + `/[id]`
- `/admin/media` + `/[id]`
- `/admin/pages` + `/[id]`
- `/admin/seo` + `/[entityType]`
- `/admin/navigation`
- `/admin/redirects`
- `/admin/settings`
- `/admin/audit`
- `/admin/users`

### E3. Preview API
- `src/app/api/admin/preview/route.ts` — cookies для предпросмотра чернеток

---

## Фаза F — Tailwind та кастомізація

- Стилі темної теми (zinc-based) вже є в Tailwind config
- Перевірити чи `@tailwindcss/typography` є в залежностях
- Додати `framer-motion` для анімацій (вже є)
- Додати `lucide-react` (вже є)
- Додати `@hookform/resolvers` + `react-hook-form` для форм (вже є)

---

## Фаза G — Build та верифікація

### G1. Перевірка
- `npm run build` — 0 помилок
- `npx tsc --noEmit` — 0 помилок
- `npm run lint` — 0 помилок, 0 warnings

### G2. D1 міграція
- Застосувати міграції до production D1
- `npm run db:seed` — дані

### G3. Deploy
- `git add . && git commit -m "feat(admin): Phase M — Admin panel rewrite"`
- `git push` → GitHub Actions
- Smoke tests: /admin/login, /admin, публічні сторінки

---

## Порядок виконання

```
Фаза A (Schema) ──→ Фаза B (Auth) ──→ Фаза C (Actions) ──→ Фаза D (UI) ──→ Фаза E (Pages) ──→ Фаза F (Styles) ──→ Фаза G (Verify)
```

**Залежності:**
- B (Auth) залежить від A (Schema) — таблиця users має бути оновлена
- C (Actions) залежить від A (Schema) та B (Auth)
- D (UI) незалежна від A-C
- E (Pages) залежить від C (Actions) та D (UI)
- F (Styles) можна паралельно з D-E
- G (Verify) — фінальна

**Оптимізація:**
- Фази A + F можна робити паралельно
- Фаза D — перший візуальний результат (безпечно, без БД)
