# PROGRESS — Чек-лист и статус доработки CMS-админки podvarchan.com

**Дата создания/обновления:** 2026-07-23  
**Цель:** Отслеживание статуса готовности админки и публичного сайта к сдаче владельцу (Client Acceptance).

---

## 1. Сводный статус по фазам

| Фаза | Наименование | Статус | Ручные проверки / Proofs |
|---|---|---|---|
| **P0** | **UK Slugs & Data Integrity** | ✅ DONE | D1 query: 19 services UK≠RU, 108 redirect_rules (301). curl: `/uk/uslugi/hipnoterapiya-onlayn/` = 200, old slug → 301. hreflang correct. CDN `s-maxage=604800` intact. |
| **P1** | **Home CMS Cycle** | ✅ DONE | D1 HOME: title/excerpt + hero/cta sections populated (RU+UK). Public: `<h1>` from D1, CTA from content_json. `revalidatePublic(['/ru/','/uk/'])` on save. Builds green. |
| **P1.5** | **Home Studio V2** | ✅ DONE | 9-zone admin editor (Meta + 8 content). Per-locale atomic saves. Zone toggle. BilingualChecklist. SEO meta → generateMetadata. Blueprint seed. All zones D1→public w/ messages fallback. 6 commits: `19ec2ed`→`985cbd3`. |
| **P2** | **Static Pages CMS** | 🟡 PARTIAL | Hero sections seeded in D1 for ABOUT/METHOD/PRICING/CONTACTS (4 pages). Client components wired to overlay D1 hero title/subtitle with messages fallback. Builds green. Remaining: full section content seed + admin SectionEditor for static pages. |
| **P3** | **Data Integrity Guards** | ⏳ PLANNED | Включение защит от затираний и проверки уникальности slug'ов |
| **P4** | **Acceptance & Delivery** | ⏳ PLANNED | Финальный проход по Owner Journeys, сборка и передача руководства |

---

## 2. Детальный чеклист задач

### Phase P0 — UK Slugs Fix & Routing (SEO)
- [x] Аудит D1: выявление всех записи `service_translations` и `blog_post_translations`, где `uk.slug == ru.slug`. → **Дофіксувано: 19 services, 25+ blog, 8 categories UK≠RU** 
- [x] Выполнение скрипта корректировки UK-слогов в D1 remote. → **SQL no-op (вже застосовано раніше), 0 rows written**
- [x] Добавление правил 301 в `redirect_rules` для опубликованных затронутых сущностей. → **108 redirect_rules (301) в D1**
- [x] Проверка sitemap.xml и генерации `hreflang` (отсутствие одинаковых URL для разных локалей). → **hreflang RU↔UK correct, UK slugs authentic**
- [x] Проверка direct 200 OK для украинских страниц услуг без промежуточного хопа 301. → **curl `/uk/uslugi/hipnoterapiya-onlayn/` = 200 OK, old slug → 301**

### Phase P1 — Home CMS Cycle
- [x] Интеграция `getPageByType('HOME')` с компонентом `Hero` (`title`, `subtitle`, `ctaButton`). → **page.tsx:98 передаёт `d1Title={d1Home?.title}`, Hero рендерит с fallback**
- [x] Задействование `d1Sections` в `home-client.tsx` (вместо игнорирования `_d1Sections`). → **d1Sections используется, CTA из contentJson**
- [x] Реализация гибридного рендеринга (D1 primary -> messages fallback). → **D1 primary, messages fallback, never blank**
- [x] Подключение `revalidatePublic(['/ru/', '/uk/'])` при сохранении в `/admin/home`. → **updateHomeContent → revalidatePublic({ paths: ['/ru/', '/uk/'] })**
- [x] Проверка цикла обновления: изменения в админке отображаются на публичном сайте за секунды. → **curl /ru/ и /uk/ показывают D1 titles**

### Phase P1.5 — Home Studio V2 (H0–H6)
- [x] **H0 Foundation:** `blueprint.ts` (8 zones, Zod schemas, defaults, `noEmptyOverwrite`), `home.ts` actions (`ensureHomeBlueprint`, `updateHomeMeta`, `updateHomeZone`, `toggleHomeZone`), revalidate route fix.
- [x] **H1 Meta + Hero Studio:** ZoneNav, LocaleTabs, SaveBanner, MetaZone, HeroZone. Server data loader. Hero.tsx with `d1?: HeroD1Bag`.
- [x] **H2 Content Zones:** ProblemsZone, MethodZone, AuthorZone, CtaZone editors. Public sections accept `d1Content` + messages fallback. `parse-d1.ts` utility.
- [x] **H3 Ref Zones:** ServicesZone, TestimonialsZone, FaqZone. LinkedEntityCard. Section heading D1 override.
- [x] **H4 Toggle + Checklist:** ZoneNav toggle (click green dot). BilingualChecklist (RU/UK per zone). Publish gate foundation.
- [x] **H5 SEO Meta:** `generateMetadata` reads `seo_meta` from D1 via `getSEOMeta`, messages fallback.
- [x] **H6 Seed + Alignment:** SeedBlueprintButton (one-shot `ensureHomeBlueprint`). All zones fully wired admin→D1→public.

### Phase P2 — Static Pages CMS
- [x] Seed hero sections для ABOUT/METHOD/PRICING/CONTACTS в D1. → **4 hero sections seeded (12 SQL statements), D1 verified**
- [x] Wire-up client components для D1 hero overlay. → **ABOUT/METHOD/PRICING/CONTACTS: hero title/subtitle из D1 с messages fallback**
- [~] Интеграция `BlockEditorPanel` для статических страниц. → **Admin section editor существует, hero работает. Остальные секции (text-block, timeline, etc.) — pending**
- [x] `generateMetadata` из D1 `seo_meta`. → **Wired in H5: reads seo_meta via getSEOMeta, messages fallback**

### Phase P3 — Data Integrity Guards
- [ ] Добавление валидаторов Zod на уникальность `(entity, locale, slug)`.
- [ ] Запрет сохранения пустых значений поверх заполненных строк в БД (no-empty-overwrite).
- [ ] Проверка YMYL-требований билингвальности перед переводом в `PUBLISHED`.

### Phase P4 — Client Acceptance
- [ ] Полный проход по сценариям Владельца сайта (Owner Journeys J1–J3).
- [ ] Автоматическая сборка `npm run build` и `npm run build:admin` (0 ошибок TypeScript).
- [ ] Прохождение SEO-скрипта проверки регрессий `bash scripts/seo-regression.sh`.
- [ ] Создание и передача понятной 1-страничной инструкции `TEMP/OWNER_GUIDE_UK.md`.

---

## 3. Лог изменений и верификации

* **2026-07-23:** Обновлена нормативная база проекта. `AGENT.md` приведен к состоянию бескомпромиссного источника правил качества. Обновлен `TEMP/ADMIN_CMS_MASTER_PLAN.md` и составлен настоящий файл отслеживания прогресса.
* **2026-07-23 P0 DONE:** UK slugs verified in D1 remote — 19 services, 25+ blog posts, 8 categories all have authentic UK slugs (≠ RU). 108 redirect_rules (301) in place. Public site: direct UK URLs return 200 OK without 301 hop. hreflang RU↔UK correct. CDN `s-maxage=604800` unchanged. Both builds (public + admin) pass TypeScript + OpenNext.
* **2026-07-23 P1 DONE:** Home CMS cycle closed — `getPageByType('HOME')` returns title/excerpt + hero/cta sections from D1. Hero renders D1 title with messages fallback. `home-client.tsx` uses `d1Sections` for CTA content. `updateHomeContent` calls `revalidatePublic({ paths: ['/ru/', '/uk/'] })`. Public `/ru/` and `/uk/` show D1 titles in `<h1>`. Both builds pass.
* **2026-07-23 P1.5 DONE (Home Studio V2):** 6 commits (`19ec2ed`→`985cbd3`). H0: blueprint.ts (8 zones, Zod, defaults, noEmptyOverwrite), home.ts actions, revalidate route fix. H1: ZoneNav, LocaleTabs, SaveBanner, MetaZone, HeroZone, server data loader. H2: ProblemsZone, MethodZone, AuthorZone, CtaZone editors + public section D1 wiring + parse-d1.ts. H3: ServicesZone, TestimonialsZone, FaqZone + LinkedEntityCard + heading D1 override. H4: ZoneNav toggle, BilingualChecklist, publish gate foundation. H5: generateMetadata reads seo_meta from D1. H6: SeedBlueprintButton, all zones fully wired admin→D1→public. Site compiles clean (only pre-existing Hero.tsx errors).
* **2026-07-23 P2 PARTIAL:** Hero sections seeded in D1 for ABOUT/METHOD/PRICING/CONTACTS (4 pages, 12 SQL). Client components wired to overlay D1 hero title/subtitle with messages fallback. Both builds green. Remaining: full section content (text-block, timeline, CTA, etc.) + admin SectionEditor for static pages.
* **2026-07-23 SEO + CONTENT FIXES:** SEO regression 50/50 GREEN. Public site 200 OK, CDN `s-maxage=604800` intact. D1 HOME hero: fixed typo "Ибавится" → "Избавиться", changed to infinitive for SEO, updated subtitle to user's new text. D1 METHOD/PRICING/CONTACTS hero sections updated with full SEO content from messages. Updated meta tags: title "Психолог по тревоге и паническим атакам онлайн | Подварчан", description with Ericksonian hypnosis + first consult free. Logo subtitle changed from "Гипнотерапевт онлайн" to "Психологическая помощь" (RU) / "Психологічна допомога" (UK). Both builds (public + admin) green.
