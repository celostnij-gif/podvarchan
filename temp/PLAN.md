# План реалізації ТЗ: Модернізація, семантика, локалізація

## Огляд

Мета: розширення структури сайту, усунення технічних дефектів, глибока локалізація.

**Гілка розробки:** `feature/site-modernization`

---

## Phase 1 — Нові сторінки послуг

### Step 1.1 — Сторінка «Онлайн-консультація психолога»
**Файли:**
- `src/constants/index.ts` — додати `{ slug: 'onlajn-konsultaciya-psyhologa', category: 'zagalni-zapit', priority: 1, icon: '👤', ctaLink: '/kontakty/' }` в `SERVICES`
- `messages/ru.json` — додати тексти (title, shortTitle, description, metaDescription, keywords, cta) для `servicesData`
- `messages/uk.json` — додати українські тексти для `servicesData`
- `messages/ru.json` — додати симптоми в `serviceSymptoms[slug]` (6 шт.)
- `messages/uk.json` — додати симптоми в `serviceSymptoms[slug]`

**Prompt:** "Add new service 'psyholog-online' to SERVICES constant, messages/ru.json and messages/uk.json servicesData with all SEO fields and symptoms array for serviceSymptoms."

### Step 1.2 — Сторінка «Психолог-біоенергетик»
**Файли:**
- `src/constants/index.ts` — додати `{ slug: 'psyholog-bioenergetyk', category: 'zagalni-zapit', priority: 1, icon: '🔮', ctaLink: '/kontakty/' }` в `SERVICES`
- `messages/ru.json` — додати тексти
- `messages/uk.json` — додати українські тексти
- `messages/ru.json` — симптоми в `serviceSymptoms`
- `messages/uk.json` — симптоми

**Prompt:** "Add new service 'psyholog-bioenergetyk' to SERVICES constant, messages/ru.json and messages/uk.json servicesData with all SEO fields and symptoms array for serviceSymptoms."

### Step 1.3 — Оновити карту сайту
**Файл:** `src/app/sitemap.ts`
- Нові сторінки мають автоматично додаватися через цикл по `SERVICES` вже існуючим кодом.
- Перевірити, що пріоритет = 0.9 для нових slug.
- Якщо фільтрація за `priority` є — переконатися, що priority = 1 проходить.

**Prompt:** "Verify sitemap.ts auto-generates entries for all SERVICES including new ones. Ensure new services with priority >=1 get included. No code change needed if existing logic handles it."

---

## Phase 2 — Технічні виправлення

### Step 2.1 — HSTS заголовок
**Файл:** `next.config.mjs`
- Додати `{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }` в security headers.

**Prompt:** "Add Strict-Transport-Security header with max-age=31536000; includeSubDomains to next.config.mjs security headers array."

### Step 2.2 — Preload шрифтів
**Файли:** `src/app/layout.tsx`
- Додати `<link rel="preload" href="/fonts/..." as="font" type="font/woff2" crossorigin>` для Inter та Cormorant Garamond.
- Використати Next.js `preload` або додати через `head` link tags.

**Prompt:** "Add preload links for Inter and Cormorant Garamond font files in root layout.tsx. Use next/font's preload: true or explicit link tags with rel=preload, as=font, type=font/woff2, crossorigin."

### Step 2.3 — Кастомна сторінка 404
**Файли:**
- `src/app/[locale]/not-found.tsx` — створити стилізовану 404 сторінку
- Дизайн: темний фон, великий текст "404", пояснення, кнопка на головну
- Використати `AnimatedSection`, `SectionContainer`, `Link` з проекту

**Prompt:** "Create localized 404 not-found page at src/app/[locale]/not-found.tsx. Use existing design system components (AnimatedSection, SectionContainer, Link, font-display). Ukrainian text: 'Сторінку не знайдено', 'Можливо, її перемістили або вона більше не існує', 'На головну'. Must integrate with next-intl for locale-aware content."

### Step 2.4 — Оптимізація ContactForm.tsx
**Файл:** `src/components/ContactForm.tsx` (455 рядків, 14.8 KB)
- Винести повторювані стилі в CSS класи
- Об'єднати дублюючі стани (isSubmitting, status → один стан)
- Спростити анімаційні обгортки
- Видалити мертвий код

**Prompt:** "Optimize ContactForm.tsx: reduce from 455 lines by extracting repeated tailwind classes into CSS, merging duplicate state (isSubmitting/status into single union type), simplifying animation wrappers. Target: 30-40% reduction. Keep all functionality (Resend API, Turnstile, validation)."

---

## Phase 3 — Глибока локалізація

### Step 3.1 — Симптоми послуг (вже винесено)
Перевірка: `messages/ru.json` вже має `serviceSymptoms` для всіх slug, `uk.json` також має.
Сторінка `client-page.tsx` вже читає `getSymptoms(messages, slug)`.
→ Нових змін не потрібно, тільки додати симптоми для нових сторінок (Phase 1).

**Prompt:** "Skip — serviceSymptoms already extracted to i18n messages. Just ensure new service slugs have symptoms entries."

### Step 3.2 — Локалізація юридичних сторінок
**Файли:**
- `messages/uk.json` — додати `disclaimer.content` та `privacy.content` українською
- `messages/ru.json` — перевірити, що `disclaimer.content` та `privacy.content` існують (вже є з попередніх комітів)

Сторінки `page.tsx` вже читають `t('content')` — нічого міняти не треба.

**Prompt:** "Add Ukrainian translation for disclaimer.content and privacy.content in messages/uk.json. The disclaimer page reads t('content') from messages, so no component changes needed. Legal texts must be complete Ukrainian versions of the original Russian."

### Step 3.3 — Локалізація відгуків (вже зроблено)
Перевірка: `uk.json` вже має 10 testimonial items українською.
→ Нових змін не потрібно.

---

## Phase 4 — Валідація

### Step 4.1 — Збірка
- `npm run build` без помилок

### Step 4.2 — Schema.org валідація
- На сторінках `uslugi/[slug]/page.tsx` має генеруватися `serviceSchema()` з locale
- Зв'язка `@id` з `/ob-avtore/#person`

### Step 4.3 — ContactForm smoke test
- Форма має проходити валідацію, Turnstile, Resend API

---

## Атомарні коміти

1. `feat: add psychologist consultation service page (RU+UK)`
2. `feat: add bioenergeticist service page (RU+UK)`
3. `fix: add HSTS header to next.config.mjs`
4. `perf: preload fonts and add font-display optimization`
5. `feat: add custom 404 error page`
6. `refactor: optimize ContactForm.tsx size and complexity`
7. `feat: add Ukrainian legal page content (disclaimer + privacy)`
8. `chore: verify build, schema.org, and ContactForm`

---

## Таблиця змін

| Крок | Файли | Тип зміни |
|------|-------|-----------|
| 1.1 | constants/index.ts, messages/ru.json, messages/uk.json | ADD |
| 1.2 | constants/index.ts, messages/ru.json, messages/uk.json | ADD |
| 1.3 | sitemap.ts | VERIFY |
| 2.1 | next.config.mjs | EDIT |
| 2.2 | app/layout.tsx | EDIT |
| 2.3 | app/[locale]/not-found.tsx (NEW) | ADD |
| 2.4 | components/ContactForm.tsx | REFACTOR |
| 3.2 | messages/uk.json (privacy, disclaimer content) | ADD |
| 4 | — | BUILD/TEST |
