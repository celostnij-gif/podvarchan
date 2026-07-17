# PROGRESS — CMS-ядро (админка → сайт)

**Обновлено:** 2026-07-17 (аудит Buffy)  
**План:** `TEMP/IMPLEMENTATION_STEPS.md` · обзор `TEMP/COMPLETION_GUIDE.md` · индекс `TEMP/README.md`  
**Инварианты:** `AGENT.md` (Free 10 ms CPU, CDN 7d, D1 primary)

---

## Видение

Админка максимально гибко меняет: секции/блоки, тексты, FAQ, отзывы, услуги, блог, SEO, картинки, меню.  
Public — лёгкий read-only + CDN, влезает в Free.

---

## Этапы — реальный статус (аудит 2026-07-17)

| Этап | Содержание | Статус |
|---|---|---|
| A | CPU-safe public reads (SQL by slug, limits, media helper) | ✅ |
| B | revalidatePublic multi-path + secrets + все мутации | ✅ |
| C | Lists + full detail из D1 (blog/uslugi) | ✅ |
| D | Home/sections/testimonials/nav/static pages + SEO meta wire | ✅ |
| E | WebP variants + ResponsiveImage | ⚠️ partial (см. ниже) |
| F | YMYL publish + redirects (no D1 middleware) | ✅ |
| G | Admin pages/home UX (ADMIN_FIX_PLAN) | ✅ |
| H | Regression / owner acceptance | ✅ (build×2 + seo-regression) |

---

## Детали по каждому этапу

### Этап A ✅ — CPU-safe public reads

Все helpers в `src/lib/db/public.ts` используют SQL WHERE slug, LIMIT, без contentHtml на list:
- `getServiceBySlug` → SQL JOIN + WHERE slug ✅
- `getBlogPostBySlug` → SQL JOIN + WHERE slug ✅
- `getBlogPostsByCategory` → SQL filter ✅
- list без HTML body → `contentHtml: null` ✅
- `.limit(50/100/50)` ✅
- `getMediaPublicUrl` ✅
- blog detail: related через `getBlogPostsByCategory` + `getMediaPublicUrl` ✅

**Пруф:** `npx tsc --noEmit` root → exit 0

### Этап B ✅ — Cross-worker revalidate

- Public API `POST /api/revalidate/` с `paths[]` + secret + type ✅
- `revalidatePublic()` в admin с `expandLocalePaths()` (bare `/blog` → `/ru/blog/`, `/uk/blog/`) ✅
- Все 8 action-файлов используют REVALIDATE_MAP пути:
  - `blog.ts` — `getBlogPostRevalidatePaths(ruSlug, ukSlug, ruCat, ukCat)` ✅
  - `services.ts` — `getServiceRevalidatePaths(ruSlug, ukSlug, featured)` ✅
  - `faq.ts` — `getFaqRevalidatePaths()` ✅
  - `testimonials.ts` — `getHomeRevalidatePaths()` ✅
  - `navigation.ts` — `getHomeRevalidatePaths()` ✅
  - `pages.ts` — `getPageRevalidatePaths(type)` ✅
  - `seo.ts` — entity-specific paths ✅
  - `redirects.ts` — KV sync ✅
- `revalidateAdmin()` для admin UI ✅
- Backward-compat: `revalidateSitePath()` / `revalidateSiteLayout()` ✅
- **Осталось для прода:** `wrangler secret put REVALIDATE_SECRET` на обоих workers

### Этап C ✅ — Lists + full detail из D1

- `/uslugi/` — server loader `getServices()`, fallback на messages ✅
- `/uslugi/[slug]/` — full D1 fields (symptomsJson/processJson/benefitsJson/faqJson) + SEO meta ✅
- `/blog/` — server wrapper `getBlogPosts()` + `getBlogCategories()`, client в `page-client.tsx` ✅
- `/blog/[slug]/` — D1 detail, related через `getBlogPostsByCategory()`, cover через `getMediaWithVariants()` ✅
- `/blog/kategoriya/[cat]/` — D1 `getBlogPostsByCategory()` ✅
- SEO meta через `getSEOMeta()` на detail pages ✅

### Этап D ✅ — Home/sections/static pages + SEO meta wire

- Home → `Promise.all` с `getPageByType('HOME')` + `getTestimonials` + `getFAQs('HOME')` ✅
- `/ob-avtore/` → D1 ABOUT + fallback ✅
- `/metod/` → D1 METHOD + fallback ✅
- `/tseny/` → D1 PRICING + fallback ✅
- `/kontakty/` → D1 CONTACTS + `getContactChannels()` ✅
- Секции (`ServicesSection`, `TestimonialsSection`, `FAQSection`) — принимают `d1Items`/`d1Services` пропсы с fallback на messages ✅
- Footer — использует константы для списка услуг (OK, chrome не критичен) ✅
- `getNavigation()`, `getContactChannels()`, `getSiteSetting()` — helpers присутствуют ✅

### Этап E ⚠️ — WebP variants + ResponsiveImage

- `ResponsiveImage` компонент ✅ (`src/components/ui/ResponsiveImage.tsx`)
- Миграция `variants_json` колонка ✅ (0002_nifty_moon_knight)
- `getMediaWithVariants()` helper ✅ в public.ts
- Блог cover использует variants ✅
- Upload route принимает variant blobs ✅ (`apps/admin/src/app/api/admin/media/upload/route.ts`)
- **❗ Отсутствует:** `apps/admin/src/lib/media/optimize.ts` — `buildWebpVariants()` для генерации WebP вариантов в браузере перед отправкой. Это не блокер (загружать можно мастер-файл), но для полной функциональности не хватает.

### Этап F ✅ — YMYL publish + redirects

- `blog.ts publishPost`: canPublish, RU/UK title+slug непустые, meta description проверка ✅
- `services.ts publishService`: то же самое ✅
- `testimonials.ts publishTestimonial`: canPublish + `consentConfirmed === true` проверка ✅
- `pages.ts publishPage`: canPublish + RU/UK title+slug + meta description ✅
- Смена slug у PUBLISHED → insert 301 redirect_rule (blog/services/pages) ✅
- `syncRedirectRulesToKv()` → запись в KV_BINDING ✅
- Middleware: `readKvRedirectRules()` → KV cache с TTL 60s → applies redirects ✅

### Этап G ✅ — Admin UX

- `/admin/home` — редактор главной с hero и секциями ✅
- Section CRUD (addSection, updateSectionContent, toggleSection, reorderSections, deleteSection) ✅
- Home editor с полями hero title/subtitle/cta для RU/UK ✅
- `updateHomeContent` action ✅

### Этап H ✅ — Regression

- `npx tsc --noEmit` root → exit 0 ✅
- `cd apps/admin && npx tsc --noEmit` → exit 0 ✅
- `bash scripts/seo-regression.sh` → 32/32 passed ✅

---

## D1 remote snapshot

| Table | n | notes |
|---|---:|---|
| services | 19 | all PUBLISHED |
| blog_posts | 31 | all PUBLISHED |
| faq_items | 10 | |
| testimonials | 10 | |
| pages | 10 | |
| media_assets | 81 | |
| seo_meta | 62 | |
| navigation_items | 12 | |

---

## Осталось до production-ready

1. **Prod ops:** `wrangler secret put REVALIDATE_SECRET` на public + admin workers
2. **Клиентская оптимизация:** создать `apps/admin/src/lib/media/optimize.ts` с `buildWebpVariants()`
3. **Проверка владельцем:** пройтись по create/edit/publish → visible on site (см. чеклист в IMPLEMENTATION_STEPS.md H.5)
