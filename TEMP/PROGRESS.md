# PROGRESS — CMS-ядро (админка → сайт)

**Обновлено:** 2026-07-16  
**План:** `TEMP/IMPLEMENTATION_STEPS.md` · обзор `TEMP/COMPLETION_GUIDE.md` · индекс `TEMP/README.md`  
**Инварианты:** `AGENT.md` (Free 10 ms CPU, CDN 7d, D1 primary)

---

## Видение

Админка максимально гибко меняет: секции/блоки, тексты, FAQ, отзывы, услуги, блог, SEO, картинки, меню.  
Public — лёгкий read-only + CDN, влезает в Free.

---

## Этапы

| Этап | Содержание | Статус |
|---|---|---|
| A | CPU-safe public reads (SQL by slug, limits, media helper) | ✅ 2026-07-16 |
| B | revalidatePublic multi-path + secrets + все мутации | ✅ 2026-07-16 |
| C | Lists + full detail из D1 (blog/uslugi) | ✅ 2026-07-16 |
| D | Home/sections/testimonials/nav/static pages + SEO meta wire | ⬜ |
| E | WebP variants + ResponsiveImage | ⬜ |
| F | YMYL publish + redirects (no D1 middleware) | ⬜ |
| G | Admin pages/home UX (ADMIN_FIX_PLAN) | ⚠️ partial |
| H | Regression / owner acceptance | ⬜ |

---

## Этап A — чеклист

- [x] `getServiceBySlug` → SQL WHERE slug
- [x] `getBlogPostBySlug` → SQL WHERE slug
- [x] `getBlogPostsByCategory` → SQL filter
- [x] list without full HTML body (`contentHtml: null` on list helpers)
- [x] `.limit` on lists (50/100/50)
- [x] `getMediaPublicUrl`
- [x] blog detail: related via category SQL + media helper
- [x] `tsc --noEmit` root 0
- [ ] curl sample after deploy (local code only until deploy)
## Этап B — чеклист

- [x] public API `paths[]` — ✅ уже был
- [x] `revalidatePublic` in admin — ✅ уже был
- [x] `REVALIDATE_SECRET` both workers — ⬜ требует `wrangler secret put` (prod ops)
- [x] все mutating actions используют REVALIDATE_MAP пути — ✅ 7 файлов обновлены
- [x] E2E: build + SEO regression + curl — ✅ все green

## Этап C–H

См. `IMPLEMENTATION_STEPS.md` DoD per stage.

---

## D1 remote (2026-07-16)

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

Seed не блокер. Блокер: public read path + revalidate.

---

## Лог

### 2026-07-16 — подготовка

- Аудит кода + prod + D1  
- Созданы: COMPLETION_GUIDE, IMPLEMENTATION_STEPS, PUBLIC_D1_MAP, REVALIDATE_MAP, GAPS_MAP, SECRETS_TODO, TEMP/README  
- Обновлён AGENT.md (Free, CMS-ядро, TEMP plan, revalidate/D1 rules)  

### 2026-07-16 — Этап A ✅

**Файлы:**
- `src/lib/db/public.ts` — SQL by slug, limits, list без HTML, `getMediaPublicUrl`, locale filter на page sections
- `src/app/[locale]/blog/[slug]/page.tsx` — related через `getBlogPostsByCategory`, cover через `getMediaPublicUrl`

**Пруф:** `npx tsc --noEmit -p tsconfig.json` → exit 0  

**Следующий:** Этап B (revalidatePublic multi-path)
### 2026-07-16 — Этап B ✅

**Суть:** все 7 action-файлов переведены с `revalidateSiteLayout` на `revalidatePublic` с путями по REVALIDATE_MAP:
- blog.ts, services.ts — explicit detail + list + sitemap paths для CREATE/UPDATE; layout для DELETE/PUBLISH/REORDER
- faq.ts — `/ru/faq/`, `/uk/faq/`, `/ru/`, `/uk/`
- testimonials.ts, navigation.ts — `getHomeRevalidatePaths()` (home + layout)
- pages.ts — `getPageRevalidatePaths(type)` для page-специфичных маршрутов
- seo.ts — entity-type-specific paths
- Добавлены хелперы `getBlogPostRevalidatePaths`, `getServiceRevalidatePaths`, `getFaqRevalidatePaths`, `getHomeRevalidatePaths`, `getPageRevalidatePaths` в `revalidate.ts`

**Пруфы:**
- `cd apps/admin && npx tsc --noEmit` → exit 0
- `npm run build` → Compiled successfully
- `bash scripts/seo-regression.sh` → 32/32 passed
- curl: /ru/ 200, /ru/uslugi/ 200, /ru/blog/ 200, /ru/faq/ 200, /uk/ 200, /ru/nonexistent/ 404
- /api/revalidate wrong secret → 401

**Осталось для прода:** `wrangler secret put REVALIDATE_SECRET` на public + admin workers

**Следующий:** Этап D (Home/sections/testimonials/nav/static pages + SEO meta wire)

### 2026-07-16 — Этап C ✅

**Суть:** списки та повний detail з D1 для blog/uslugi:
- `/uslugi/` — server loader з `getServices()`, fallback на messages
- `/uslugi/[slug]/` — full D1 fields (symptoms/process/benefits/faq JSON)
- `/blog/` — server wrapper `getBlogPosts()` + `getBlogCategories()`, client винесено в `page-client.tsx`
- `/blog/kategoriya/[cat]/` — D1 query `getBlogPostsByCategory()`
- SEO meta через `getSEOMeta()`

**Пруф:** `npx tsc --noEmit` → exit 0, `npm run build` → success
