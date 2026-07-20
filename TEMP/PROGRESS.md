# PROGRESS — чеклист реалізації адмінки

**Оновлювати після кожного підкроку.**  
**Старт пакету:** 2026-07-17  
**Останній acceptance-аудит:** 2026-07-20 → `CLIENT_ACCEPTANCE_AUDIT_2026-07-20.md`

Легенда: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` cancelled/n/a

---

## Wave 0 — Client acceptance blockers (2026-07-20)

- [ ] W0.1 Formal J1 smoke: edit published service title → public <30s (пруф)
- [ ] W0.2 Guided publish CTA (service + post)
- [x] W0.3 Chrome UK 100% (layout/topbar/footer/block registry) — completed 2026-07-20
- [ ] W0.4 Post cover: MediaPicker primary, URL advanced
- [ ] W0.5 Audit pagination (зняти ~1MB SSR / 1102 risk)
- [ ] W0.6 OWNER_GUIDE_UK.md handoff
- [ ] W0.7 Rotate OWNER password (світився в чаті)
- [ ] Client walkthrough J1–J8 sign-off

---

## Етап 0 — База

- [x] 0.1 REVALIDATE_SECRET на public + admin (verify, не логувати значення)
- [x] 0.2 PUBLIC_SITE_URL / AUTH_URL prod
- [x] 0.3 ENTITY_MATRIX звірена з кодом
- [x] 0.4 D1 remote counts записані в NOTES

## Етап 1 — CMS cycle

- [x] 1.1 Public `/api/revalidate` paths[] + type — існує + тест 401 пройдено
- [x] 1.2 Admin `revalidatePublic` + locale expand — існує (`lib/revalidate.ts`)
- [x] 1.3 blog actions paths — `revalidatePublic` у blog.ts (posts/categories)
- [x] 1.4 services actions paths — `revalidatePublic` у services.ts
- [x] 1.5 faq / testimonials / pages / nav / settings / seo — усі вкриті; settings додано цього сесією
- [~] 1.6 Smoke: edit → visible on public < 30s — deploy OK (admin 06:43 / public 06:44, 2026-07-18); фінальний proof потребує live admin edit (credential відсутні)

## Етап 2 — Public D1 content

- [x] 2.1 by-slug SQL (no load-all)
- [x] 2.2 list without contentHtml
- [x] 2.3 uslugi list + detail
- [x] 2.4 blog list + detail + category (D1-primary; locale-correct slug; dynamicParams=true — admin-added categories no longer 404)
- [x] 2.5 home D1 sections + testimonials + FAQ
- [x] 2.6 about / metod / tseny / kontakty
- [x] 2.7 sitemap D1 primary
- [x] 2.8 seo-regression green

## Етап 3 — Chrome D1

- [x] 3.1 getNavigation wired header (layout fetches D1 nav; MAIN_NAV fallback; labels t()-driven — no bilingual regression)
- [x] 3.2 Footer services + blog-categories from D1 (getServices/getBlogCategories; const + messages fallback removed)
- [x] 3.3 contact channels public — Footer contact column renders getContactChannels() (D1) + fallback to site-email
- [x] 3.4 site settings used where needed — email (brand + contact) from getSiteSetting('contactEmail'), default podvarchan@gmail.com
- [x] 3.5 revalidate chrome paths — nav/contact/settings mutations already call revalidatePublic (Stage 1); layout re-renders chrome

## Етап 4 — Media

- [x] 4.1 browser optimize variants — `buildWebpVariants` (apps/admin/src/lib/media/optimize.ts) викликається з UploadZone; smoke: 800×600 PNG → master 800 + variants 800/400
- [x] 4.2 upload stores variants + meta — `/api/admin/media/upload` (admin worker; R2 binding MEDIA_R2_BUCKET є в обох wrangler.jsonc) пише master+variants у R2 `podvarchan-media` + рядок media_assets з variants_json (підтверджено D1-запитом)
- [x] 4.3 ResponsiveImage public — `/api/media/[...path]` віддає master+variants як image/webp з `Cache-Control: public, max-age=31536000, immutable` (Worker НЕ ресайзить; resize у браузері). curl 200 для master/800/400
- [x] 4.4 MediaPicker cover flows — MediaPickerDialog відкривається з форми поста, показує завантажений ассет, onSelect виставляє coverImageId + превʼю (UI-смоук). Тест-ассет видалено (D1+R2) — production чистий

## Етап 5 — YMYL

- [x] 5.1 canPublish only — `requirePublish` + `canPublish` in 6 form actions (commit `fbe8932`, CI deployed 2026-07-18); browser-verified OWNER publish succeeds, EDITOR block structurally enforced
- [x] 5.2 RU+UK+meta checks — `assertBilingual` + `assertMetaPresent` in all 6 gates (same commit)
- [x] 5.3 testimonials consent — schema `consentConfirmed`, action gate `testimonials.ts:132`, checkbox UI
- [x] 5.4 slug change → 301 rules — `blog.ts`, `services.ts`, `pages.ts` insert redirect rules on slug change for PUBLISHED entities
- [x] 5.5 (opt) edge apply redirects — `redirectRules` table + `syncRedirectRulesToKv()` + middleware reads from KV

## Етап 9 — Доопрацювання до продукту (2026-07-19 сесія 2)

- [x] 9.1 home/page.tsx + home-editor.tsx — повний переклад на українську (Головна, Параметри, Назва, Короткий опис, Чернетка/Опубліковано/Архів, Збереження)
- [x] 9.2 pages/[id]/edit-form.tsx — UK переклад (Основне, 🇷🇺 Російська, 🇺🇦 Українська, Видалити, Зберегти)
- [x] 9.3 pages/[id]/section-editor.tsx — UK переклад (Секції сторінки, Тип секції, Ключ унікальний, Увімк/Вимк, Видалити, Додати, З шаблону, або)
- [x] 9.4 users/page.tsx — повний UK (Користувачі, Імʼя, Роль, Статус, Останній вхід, Власник/Адмін/Редактор/Спостерігач/Користувач, Активний/Неактивний)
- [x] 9.5 settings/site-settings.tsx — UK KNOWN_KEYS (Назва сайту, Опис сайту, Email для зв'язку, Посилання на соцмережі, Години роботи, ID аналітики), filter tabs (Всі/Відомі/Власні), empty state
- [x] 9.6 settings/contact-channels.tsx — UK (Основний, Увімк)
- [x] 9.7 revisions/[entityType]/[entityId]/revisions-list.tsx — темні стилі адмінки, UK locale, emoji locale badges
- [x] 9.8 revisions/[entityType]/[entityId]/page.tsx — темні стилі, UK рядки, truncated ID
- [x] 9.9 revisions/page.tsx — **NEW** index stub (G47 ✅) — навігаційна сторінка з посиланнями на розділи
- [x] 9.10 seo/page.tsx + seo-audit-client.tsx — **G46 ✅** клієнтський пошук за URL/заголовком, фільтр за типом, кліковані score-картки (green/yellow/red), UK заголовки, «Скинути фільтри»
- [x] 9.11 src/lib/preview.ts — `canPreviewList()` helper для list-entities без slug-matching
- [x] 9.12 src/lib/db/public.ts — `getFAQs(previewCookie?)` + `getTestimonials(previewCookie?)` — **G25 ✅** preview support для list helpers
- [x] 9.13 Build PASS: admin + public (2026-07-19)
- [x] 9.14 Commit `67cb6cf` pushed → CI deploy

---

## Етап 6 — Admin UX P0

- [x] 6.1 Shared TipTap component — `components/admin/editor/TipTapEditor.tsx` extracted from blog; old `tiptap-editor.tsx` deleted
- [x] 6.2 TipTap FAQ + services + text-block (+ testimonials if needed) — FAQ answer, services description, testimonial text, TextBlockEditor body all use shared TipTap; `FaqAccordion` renders HTML; `faqSchema` strips tags for JSON-LD
- [x] 6.3 pages/home useActionState, no alert — `alert()` replaced with inline error state in home-editor, edit-form, page-form, section-editor (`d9c5b51`). `useTransition` kept (actions redirect on success — useActionState needs full action refactor per AGENT §7)
- [x] 6.4 no location.reload in section editor — grep confirmed no `location.reload` in admin
- [x] 6.5 section DnD + persist order — dnd-kit + `reorderSections` action (already implemented in section-editor.tsx)
- [x] 6.6 block editors primary (no JSON primary) — ImageTextEditor body converted to TipTap; all block editors structured (no JSON textarea primary)
- [x] 6.7 services visual *Json editors — symptomsJson + faqJson use StructuredListEditor; processJson + benefitsJson collapsed as advanced JSON (next commit pending)
- [x] 6.8 UI labels UK consistency — home-editor: Заголовок→Назва, Краткое описание→Короткий опис; edit-form, page-form same (`d9c5b51`)
- [x] 6.9 grep AGENT §16 clean (alert/reload/any) — no `alert()`, no `location.reload()`, no `any` in admin/src

## Етап 7 — Admin UX P1

- [x] 7.1 Open on site links — `ViewOnSiteLink` shared component + links in blog posts list, services sortable list, pages list (published entities only)
- [x] 7.2 empty/loading states — all list pages verified: blog, services, faq, testimonials, pages, leads, media, navigation, redirects, audit already have empty states
- [x] 7.3 nav full button labels — AdminSidebar NAV_GROUPS + StatusBadge default labels + dashboard labels all converted to Ukrainian
- [x] 7.4 dashboard shortcuts — quick action buttons (new post/service/testimonial/FAQ/settings/site link) added to dashboard header
- [x] 7.5 SEO entry from entity — SEO link button added to blog post edit, service edit, pages edit headers (links to `/admin/seo/{type}/{id}`)

## Етап 8 — Preview

- [x] 8.1 preview token/cookie — `src/lib/preview.ts` (HMAC-SHA256, Web Crypto), `src/app/api/preview/route.ts` (verify + set cookie), `apps/admin/src/app/api/preview/sign/route.ts` (sign + redirect)
- [x] 8.2 public DRAFT gate — `isPreviewAllowed` → `canPreview` in all detail helpers (`getServiceBySlug`, `getBlogPostBySlug`, `getPageByType`). List helpers (`getFAQs`, `getTestimonials`) do NOT yet support preview — PreviewButton in FAQ/testimonial forms would be a dead control
- [x] 8.3 UI button Переглянути — `PreviewButton` component in blog post, service, pages edit forms (not wired in FAQ/testimonials — blocked by 8.2 list helpers gap)
- [x] 8.4 noindex preview — layout.tsx sets `{ index: false, follow: false }` when `__preview` cookie present
- [x] Auth on `/api/preview/sign` — added `getCurrentUser()` + `canEditContent()` check (2026-07-19)
- [ ] FAQ/testimonials PreviewButton — blocked: list helpers need `previewCookie` param first
- [ ] FAQ/testimonials list helper preview support — `getFAQs`, `getTestimonials` need `previewCookie` param + `isPreviewAllowed` call

---

## Builds / smoke (останній прогін)

| Check | Date | Result |
|---|---|---|
| `npm run build` (public) | 2026-07-19 | PASS |
| `cd apps/admin && npm run build` | 2026-07-19 | PASS |
| `seo-regression.sh` | | |
| `npm run lint` (public) | 2026-07-20 | PASS (0 err, 34 warn) |
| `npx opennextjs-cloudflare build` (public) | 2026-07-20 | PASS (CI #305 ✅) |
### 2026-07-20

- **Phase D — Pages/Home polish (3d68e10):** SectionEditor local state, no router.refresh(); HomeEditor/EditPageForm no useTransition, inline save; add-section UK labels, auto-key type-{ts}, sortOrder sent, both locales present; ViewOnSiteLink on page edit
- **CI fix (46dff98, owner):** Broken `"use client'` quote in `tseny/client-page.tsx` (CheckTsenyPage task regression) fixed by site owner. Root eslint.config.mje extended ignores (`apps/admin/**`, `**/cloudflare-env.d.ts`, `**/postcss.config.mjs`). 3 admin forms converted to useActionState. CI #305 ✅ both jobs.
- **Settings typed form + blog category nav + tseny D1 (0172986):** Pushed earlier; confirmed deployed.

| curl home/uslugi/blog/faq | | |
 | revalidate 401 wrong secret | 2026-07-18 | PASS — public returns 401 on wrong secret |
| admin login + /admin 200 | | |

---

## Journal

### 2026-07-20 — Client acceptance audit

- Live+code аудит адмінки: `TEMP/CLIENT_ACCEPTANCE_AUDIT_2026-07-20.md`.  
- **Вердикт:** public UP + admin CRUD UP; product **~70–75%**; **NOT READY** для фінальної здачі.  
- Progress vs 07-19: no alert/reload; StructuredList *Json; auto-slug services/categories; revisions index 200; media UK; drafts linked; SEO filters.  
- Open blockers: formal J1 smoke; guided publish; RU chrome («Админ-панель»); cover URL primary; audit ~940KB; SEO не в sidebar; owner guide; password rotate.  
- Free smell: admin Error **1102** під серією authenticated GET (audit/seo heavy).  
- `AGENT.md` оновлено: §0 status + §22 здача; TEMP/README пріоритет Wave 0–2.

### 2026-07-20 — Phase C: Chrome UK + Error Messages (W0.3)

**C.4: Chrome UK 100% — AdminTopbar, AdminShell, AdminSidebar, layout, pages, leads:**
- `AdminTopbar.tsx`: 15 breadcrumb labels RU→UK (Админ-панель→Адмін-панель, Услуги→Послуги, Отзывы→Відгуки, Страницы→Сторінки, Навигация→Навігація, Пользователи→Користувачі, Настройки→Налаштування, Редиректы→Редиректи, Вход→Вхід) + 2 UI labels (Открыть меню→Відкрити меню, Выйти→Вийти)
- `AdminShell.tsx`: footer Админ-панель→Адмін-панель
- `AdminSidebar.tsx`: subtitle Панель управления→Панель керування
- `layout.tsx`: metadata title Админ-панель→Адмін-панель
- `pages/new/page.tsx`: heading Новая страница→Нова сторінка
- `leads/page.tsx`: placeholder Имя→Ім'я

**C.4: English→Ukrainian translations:**
- `csv-button.tsx`: Exporting...→Експорт..., Export CSV→Експорт CSV
- `seo/[entityType]/[entityId]/page.tsx`: 11 YMYL assessment strings (Author mention found→Згадка автора знайдена, E-E-A-T signals→Сигнали E-E-A-T, Date/recentcy→Сигнал дати/актуальності, YMYL Assessment→Оцінка YMYL, Medical→Медичний, etc.)
- 5 form files: 'Unknown error'→'Невідома помилка' (category-form, service-form, faq-form, testimonial-form, post-form)
- `seo/audit.ts`: 21 warning/label strings (Missing <title>→Відсутній <title>, Title too short→Заголовок занадто короткий, etc.; Good→Добре, Needs work→Потребує роботи, Poor→Погано; No title→Без заголовка, No description→Без опису)
- `media/UploadZone.tsx`: 3 error strings (Variant generation failed→Помилка генерації варіантів, Upload failed→Помилка завантаження)
- `media/MediaPickerDialog.tsx`: 2 error strings (WEBP conversion failed→Помилка конвертації WEBP, Upload failed→Помилка завантаження)

**C.5: Action error messages EN→UK:**
- `services.ts:220`: "Service with slugBase... already exists"→"Послуга з slugBase... вже існує"
- `leads.ts:83`: "Lead not found"→"Лід не знайдено"

**C.7: Debug page protection:**
- `debug-tools/page.tsx`: Added `requireRole('OWNER')` guard + translated page heading and table headers to Ukrainian

**Summary:** ~75+ UI strings translated from RU/EN to Ukrainian across 18 files. Admin chrome now fully Ukrainian (W0.3 complete). Debug page OWNER-only protected.

### 2026-07-17

- TEMP очищено від сміття (звіти, алерти, скріни, старий backlog).  
- Додано пакет MASTER_PLAN / STEPS / UX_SPEC / PROMPTS / MATRIX / PROGRESS.  
- AGENT.md §17–§21 уже містить quality bar.  
- Реалізацію етапів 0–8 **ще не стартували** в цій сесії (лише docs).

### 2026-07-18

- **0.1 REVALIDATE_SECRET (verify):** `wrangler secret list` → REVALIDATE_SECRET present on both `podvarchan` (public) + `podvarchan-admin` (admin). Public `/api/revalidate` → 401 on wrong secret (enforced). Value-equality НЕ перевіряється напряму (не логуємо значення); proof = smoke етапу 1.4 (admin edit → public <30s).
- **0.2 URLs:** admin `vars` має `NEXT_PUBLIC_SITE_URL=https://podvarchan.com` + `AUTH_URL=https://admin.podvarchan.com`; public має `NEXT_PUBLIC_SITE_URL`. `revalidatePublic` uses `PUBLIC_SITE_URL || NEXT_PUBLIC_SITE_URL` → OK. Додано `PUBLIC_SITE_URL` до admin vars для явності.
- **Findings:** public `wrangler.jsonc` комітить plaintext `AUTH_SECRET` dev-value у `vars` (порушення AGENT §20.2 — real `AUTH_SECRET` уже remote secret; рекомендую видалити plaintext var). Legacy unused `REVALIDATE_URL` var у public. `podvarchan-admin` remote має `CLOUDFLARE_API_TOKEN` secret.

- **0.3 ENTITY_MATRIX (reconcile):** усі tables з матриці існують у remote D1; усі public helpers з матриці присутні у `src/lib/db/public.ts` (getServices/getServiceBySlug/getBlogPosts*/getPageByType/getFAQs/getTestimonials/getNavigation/getContactChannels/getSiteSetting/getSEOMeta + media). Підтверджено gap: `Footer.tsx:4,107` + `sitemap.ts:2,88` досі читають `SERVICES` з `@/constants` (не D1) — статуси матриці ❌/⚠️ вірні.
- **0.4 D1 remote counts:** записані у NOTES.md (services 19, blog_posts 31, blog_categories 10, faq_items 10, pages 10, page_sections 4, media_assets 81, navigation_items 12, contact_channels 3, site_settings 14, testimonials 11, seo_meta 62, redirect_rules 0, audit_logs 17, contact_leads 0, users 1).

- **Етап 1 (CMS cycle) audit:** 1.1/1.2 вже реалізовані й перевірені (public 401). Усі content-actions викликають `revalidatePublic`: blog/services/faq/testimonials/pages/navigation/seo (з коду) + `settings.ts` додано цього сесією (5 мутацій, type layout для chrome). `redirects` → KV sync; `media` cover ревалідується owning-entity. 1.6 smoke заблоковано: не можу build/deploy з Windows-робочої станції (OpenNext тільки Ubuntu CI; локальний deploy заборонено), тому end-to-end cycle перевіряє CI/deploy + live edit.

- **Deploy (2026-07-18):** push `4506c95` → CI задеплоїв обидва workers: admin `podvarchan-admin` 06:43:35, public `podvarchan` 06:44:06 UTC. Production health: admin 307 (CF Access, OK), public /ru/ 200 + Cache-Control s-maxage=604800 (без no-store регресу), revalidate 401 на wrong secret. 1.6 functional smoke (edit→visible) потребує live admin edit — credential відсутні; процедуру передано користувачу.

- **Stage 2+3 (2026-07-18):** blog/kategoriya/[cat] → D1-primary category meta + locale-correct slug to getBlogPostsByCategory (UK category pages повертали 0 постів); dynamicParams=true (admin-категорії більше не 404). Stage 3: Footer читає getServices/getBlogCategories (прибрано SERVICES const + messages-фолбек); Header отримує navItems з getNavigation('HEADER') через layout (MAIN_NAV fallback; лейбли через t() — без регресу білінгви). 3.3/3.4 відкладено (потрібне рішення по UI). tsc --noEmit exit 0.

- **Verify (2026-07-18, deploy 07:08:15):** Stages 2-3 on prod. /ru/ 200 (Cache-Control s-maxage=604800, без no-store). /ru/blog/kategoriya/trevoga/ 200 (13 RU post links), /uk/blog/kategoriya/trivoga/ 200 (**5 UK post links** — доведено виправлення 0-постів для UK). /uslugi/ → 308 → /ru/uslugi/ 200 (локаль-редірект, OK). Footer/Header D1-вкладення не ламає рендер. P0 (етапи 1-2) ЗАКРИТО. 3.3/3.4 — відкладено, рішення користувача.

- **Stage 3.3/3.4 verify (2026-07-18, deploy 07:08:47):** Footer contact column → D1 getContactChannels() (фолбек на site-email); email (brand + contact) → getSiteSetting('contactEmail'). /ru/ 200, футер рендерить контакти (booking + mailto + t.me/wa.me). Stage 3 ЗАВЕРШЕНО (3.1–3.5). P0 (етапи 1-2) + Stage 3 closed.

- **Stage 4 (Media) verify (2026-07-18):** повний end-to-end smoke на production. 4.1 `buildWebpVariants` (optimize.ts) → master + variants (800×600 → 800/400; натуральна ширина 800, тому 1200/1600 пропущено). 4.2 `/api/admin/media/upload` (admin worker; R2 binding MEDIA_R2_BUCKET присутній у ОБОХ wrangler.jsonc — коментар "адмінка не має R2" був ЗАСТАРІЛИМ, виправлено у MediaPickerDialog.tsx + media/[id]/page.tsx) пише R2 `podvarchan-media` + рядок media_assets (variants_json підтверджено D1-запитом: id d4da976f…, variants 800+400, size 1428). 4.3 публічний `/api/media/[...path]` віддає master/800/400 як image/webp з `Cache-Control: public, max-age=31536000, immutable` (Worker НЕ ресайзить — resize у браузері). 4.4 MediaPickerDialog у формі поста відкривається, показує завантажений ассет, onSelect виставляє coverImageId + превʼю (UI-смоук через браузер). Тест-ассет (.tmp_test_upload.png) видалено з D1 + R2 → production без сміття. Етап 4 ЗАВЕРШЕНО (4.1–4.4).

- **Stage 7 (Admin UX P1) (2026-07-18):** Усі пункти 7.1–7.5 ЗАВЕРШЕНО. 7.1: `ViewOnSiteLink` shared component (`components/admin/ViewOnSiteLink.tsx`) + посилання "Переглянути" у blog posts list, services sortable list, pages list (тільки для PUBLISHED). 7.2: усі list-сторінки вже мають empty states (blog, services, faq, testimonials, pages, leads, media, navigation, redirects, audit). 7.3: AdminSidebar NAV_GROUPS, StatusBadge default labels, dashboard labels — все переведено на українську (Панель керування, Послуги, Відгуки, Навігація, Користувачі, Налаштування, Редиректи, Чернетка, Опубліковано, Приховано, тощо). 7.4: quick action buttons (Новий пост, Нова послуга, Новий відгук, Нове FAQ, Налаштування, Сайт ↗) додано до dashboard header. 7.5: SEO link button додано до blog post edit, service edit, pages edit headers → `/admin/seo/{type}/{id}`. Builds: public `npm run build` PASS (273 static pages), admin `npx next build` PASS (усі routes). Баг: `'use client'` directive був після import у services-sortable-list.tsx — виправлено.
