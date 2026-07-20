# AGENT.md — podvarchan.com

> Постоянный контекст для ИИ-агента. Читать **перед каждой задачей**.  
> Если задача противоречит этому файлу — **спроси**, не ломай инварианты.  
> **Дата:** 2026-07-20

---

## 0. Текущий статус (для агента, 2026-07-20)

| Слой | Статус |
|---|---|
| Public site | **UP** — CDN + D1 primary, SEO/cache OK |
| Admin infra (auth, CRUD, audit, media, revalidate, YMYL) | **~90%+** — не «строить с нуля» |
| Admin **product** (owner journeys, polish, acceptance) | **~70–75%** — **ещё НЕ готово к сдаче замовнику** |

**Master product plan:** `TEMP/QUALITY_ADMIN_PLAN.md` (фази A–G).  
**Останній live-аудит здачі:** `TEMP/CLIENT_ACCEPTANCE_AUDIT_2026-07-20.md`.  
**DoD клієнту:** `TEMP/ACCEPTANCE_CHECKLIST.md` + `TEMP/OWNER_JOURNEYS.md` (J1–J8).

### Що зараз робити (пріоритет)

```
Wave 0 (блокує здачу) → Wave 1 polish → Wave 2 P2
```

1. **Wave 0:** formal J1 smoke (edit→public <30s); guided publish CTA; chrome 100% UK; post cover = MediaPicker primary; audit pagination (Free 1102); `TEMP/OWNER_GUIDE_UK.md`; rotate OWNER password якщо світився.  
2. **Wave 1:** auto-slug posts; SEO в sidebar + pagination; Preview FAQ/testimonials; home/pages `useActionState`; hide debug-tools; human UK errors only.  
3. **Wave 2:** revisions real or hide stat; E2E; scheduling/OAuth/charts — **не** для v1.

**Не робити:** «фікс 500 на public» (сайт 200), «написати 14 actions» (вже є), rewrite auth/shell/workers, Cloudflare Images, `no-store` на public HTML.

### Критерій «можна здавати замовнику»

- [ ] J1–J3 owner journeys green на **prod** без підказок розробника  
- [ ] Formal proof: edit published title → public < 30s  
- [ ] Нема raw JSON / alert / reload / primary Slug Base / primary manual media URL  
- [ ] UI chrome **українською** (включно metadata/topbar/footer/block labels)  
- [ ] Builds ×2 + seo-regression + public CDN headers  
- [ ] 1-page owner guide UK + known limitations  
- [ ] Client walkthrough sign-off  

Поки пункти open — писати в звіті **«NOT READY for client»**, навіть якщо routes 200.

---

## 1. Что это за проект

`podvarchan.com` — двуязычный (RU/UK) сайт психолога-консультанта + **CMS-админка**.  
Ниша **YMYL** → SEO, canonical, publish-правила строгие.

### Цель продукта

**Админка = ядро управления сайтом**, а не «набор сырых CRUD-форм для разработчика».  
Владелец (не программист) должен **легко и предсказуемо** менять весь публичный сайт.

Из админки меняется:

- контент страниц, **блоки и секции** (home, about, metod, prices, contacts…);
- услуги, блог, FAQ, отзывы;
- **SEO** (title, description, og, robots, schema fields в `seo_meta`);
- **картинки** (R2 + media_assets);
- меню, каналы связи, редиректы, settings.

**Публичный сайт** — тонкий read-only рендер: D1 `PUBLISHED` + CDN.  
`messages/*.json` и `src/content/**` — только **fallback**, не source of truth.

### Критерий «админка готова» (продукт)

Фича считается реализованной **только** если замкнут цикл:

```
Владелец правит в UI → D1 → revalidatePublic → public page показывает изменение за секунды
```

Если UI пишет в D1, а public всё ещё читает `messages/*` / `constants` / static — **фича НЕ готова**.  
Сырой JSON textarea, `alert()`, `window.location.reload()`, смесь RU/UK UI — **не принимается** как quality bar.

### Архитектура

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  podvarchan (публичный)     │        │  podvarchan-admin            │
│  podvarchan.com             │        │  admin.podvarchan.com        │
│  src/                       │        │  apps/admin/src/             │
│  ЧИТАЕТ D1/R2               │        │  ЧИТАЕТ+ПИШЕТ D1/R2/KV       │
└──────────────┬──────────────┘        └───────────────┬──────────────┘
               │        общие ID                        │
               └───────────────┬───────────────────────┘
          D1 `podvarchan` · R2 media + inc-cache · KV RATE_LIMIT_KV
```

- Данные **не дублируются**. Мутации — только admin.
- Админка — **отдельный** worker (лимит Free ~3 MiB gzip public).
- `revalidatePath` в admin **не** чистит public → только кросс-воркер revalidate (§8).  
- Quality bar админки: **§17–§21** (читать перед любой admin-задачей).

### План реализации CMS (не с нуля)

Master-план в TEMP (читать по `TEMP/README.md`):

1. `TEMP/MASTER_PLAN.md` — бачення + етапи **0–8**  
2. `TEMP/IMPLEMENTATION_STEPS.md` — покрокові задачі / DoD  
3. `TEMP/ADMIN_UX_SPEC.md` + `AGENT_PROMPTS.md` — UX + готові промпти  
4. `TEMP/ENTITY_MATRIX.md`, `PUBLIC_D1_MAP.md`, `REVALIDATE_MAP.md`, `GAPS_MAP.md`  
5. `TEMP/FREE_PLAN.md`, `SECRETS_TODO.md`, `NOTES.md`  
6. `TEMP/PROGRESS.md` — чеклист (оновлювати!)  

Порядок: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**. Не стрибати через cycle (1–2) у polish UI.

---

## 2. Free plan — главный технический инвариант

| Ограничение | Значение | Следствие |
|---|---|---|
| CPU / request | **~10 ms** | Тяжёлая работа = 500 / Error 1102 |
| Public bundle | ~3 MiB gzip | Админка отдельно (уже) |
| Edge HTML cache | `s-maxage=604800` + SWR + stale-if-error | Сайт живёт с CDN, Worker редко |

В `src/middleware.ts` (не ослаблять без причины):

```
Cache-Control: public, s-maxage=604800, stale-while-revalidate=2592000, stale-if-error=604800
```

### Запрещено на public worker

| ❌ | ✅ |
|---|---|
| Ресайз/WebP в Worker | Browser optimize до upload |
| Load-all + `.find` по slug | SQL `WHERE slug = ?` + `.get()` |
| D1 query в middleware hot path | KV snapshot / static maps |
| `Cache-Control: no-store` на HTML «для админки» | `revalidatePublic` точечно |
| `next/image` runtime optimize | `ResponsiveImage` + srcset готовых WebP |
| 5+ D1 queries на одну page | 1–3 cheap queries, `Promise.all` |
| List endpoints с полным `contentHtml` | list без body; body только detail |
| Поднимать observability sampling | public `head_sampling_rate: 0.01` |

Бюджет cache miss: 1–2 D1 (+ optional seo/media) → HTML → CDN.

---

## 3. Стек (версии не «обновлять заодно»)

| Слой | Технология |
|---|---|
| Framework | **Next.js 15.5.20**, App Router, Server Actions |
| Язык | **TypeScript strict** — `any` **запрещён** |
| Стили | Tailwind CSS 3 |
| БД | Cloudflare **D1** + **Drizzle** |
| Storage | R2 media + inc-cache |
| KV | `RATE_LIMIT_KV` |
| Runtime | OpenNext **1.20.1** (`@opennextjs/cloudflare`) |
| Auth | NextAuth v5 (Credentials + bcrypt + JWT) |
| Editor | TipTap |
| Validation | zod |
| Plan | **Cloudflare Free** |

---

## 4. Раскладка репозитория

```
src/                              # public worker
  app/[locale]/**                 # RU/UK pages
  app/api/revalidate/route.ts     # POST secret + paths[]
  app/api/media/[...path]/       # R2 serve (immutable)
  lib/db/public.ts                # ONLY published reads + fallback
  middleware.ts                   # 308 locale, CDN cache, SEO redirects
apps/admin/src/                   # admin worker
  app/admin/**                    # UI routes
  app/api/admin/**                # upload, media list
  lib/actions/**                  # mutations
  lib/revalidate.ts               # revalidatePublic → public API
  lib/auth/* · lib/audit/log.ts
packages/shared/src/db/schema/**  # SOURCE OF TRUTH схемы
messages/*.json                   # fallback UI/legacy content
wrangler.jsonc · apps/admin/wrangler.jsonc
TEMP/                             # планы CMS (см. TEMP/README.md)
scripts/seo-regression.sh         # smoke SEO (после изменений)
```

Код > этот файл. Схема: `packages/shared/src/db/schema/*` (+ PRAGMA remote при сомнении).  
Дубли schema в `src/db` / `apps/admin/src/db` — синхронизировать при миграциях.

---

## 5. Команды

```bash
npm run build                      # public
cd apps/admin && npm run build     # admin
bash scripts/seo-regression.sh     # smoke (должен быть green)
npm run test                       # vitest если есть
npx wrangler deploy                # public
cd apps/admin && npx wrangler deploy
npx wrangler secret put NAME
npx wrangler d1 execute podvarchan --remote --command "..."
npx wrangler tail podvarchan
```

Секреты: wrangler secret **+** GitHub Actions. Не коммитить значения.  
Список: `TEMP/SECRETS_TODO.md` (`REVALIDATE_SECRET` на **обоих** workers).

---

## 6. Auth и права

Auth **готов — не переписывать**.

- `getAdminSession` / `requireAdminSession` / `getCurrentUser` — session layer.
- Права **только** `permissions.ts`: `canPublish`, `canDelete`, `canEditContent`,
  `canManageUsers`, `canManageSettings`, `canViewAudit`.
- Роли: `VIEWER < EDITOR < ADMIN < OWNER`.
- CRUD контента — `EDITOR+`; **publish** — `canPublish` (OWNER/ADMIN);
  delete — `canDelete` (OWNER); settings/users — соответствующие can*.
- `/admin/*` — middleware + Cloudflare Access; `noindex,nofollow`.

Есть `withRole` / `ActionResult` (`guard.ts`, `result.ts`) — **предпочитать** для нового кода.  
Старые actions с `throw`+`redirect` можно не big-bang переписывать; новые — `ok`/`fail`.

---

## 7. Server actions (мутации)

Файлы: `apps/admin/src/lib/actions/*`, `'use server'`.

Минимальный контракт каждой мутации:

1. Auth + permission  
2. zod (`safeParse`)  
3. D1 write  
4. `writeAuditLog` — **fire-and-forget** (try/catch внутри `log.ts`)  
5. `revalidatePath('/admin/...')` — только admin UI  
6. **`revalidatePublic({ paths })`** — public CDN (fire-and-forget)  
7. `ok` / `fail` или понятный redirect  

Импорты: `@/lib/actions/*`, `@/db`, `@/lib/auth/*`, `@podvarchan/shared`.  
Старый `@/app/admin/actions/*` — **запрещён**.

### YMYL publish (не ослаблять)

Перед `PUBLISHED`:

- непустые title + slug (RU);
- непустой UK-перевод (title + slug);
- meta description (seo_meta или excerpt);
- `testimonials`: только при `consentConfirmed === true`;
- смена slug у PUBLISHED → `redirect_rules` **301** (from → to, обе локали);
- publish-мутации — только через `canPublish` (OWNER/ADMIN), **не** через `canEditContent`.

---

## 8. Кросс-воркер revalidate (критично)

Admin и public — разные процессы.

| | |
|---|---|
| Public | `POST /api/revalidate/` body: `{ secret, path? \| paths[], type? }` |
| Admin | `apps/admin/src/lib/revalidate.ts` → `revalidatePublic({ paths })` |
| Secret | `REVALIDATE_SECRET` **одинаковый** на обоих workers |
| Base URL | `PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_URL` = `https://podvarchan.com` |

Paths **всегда** с локалью и trailing slash, например:

`/ru/blog/{slug}/`, `/uk/blog/{ukSlug}/`, `/ru/blog/`, `/uk/blog/`

Полная таблица: **`TEMP/REVALIDATE_MAP.md`**.

`revalidatePath` в admin для **public** URL — бесполезен.  
`revalidatePath('/admin/...')` — нормален.

Без revalidate правка в D1 может быть невидима до **7 дней** (CDN).

---

## 9. Public reads (D1)

Единая точка: `src/lib/db/public.ts`.

Правила:

- только `status = 'PUBLISHED'` (preview cookie — отдельная задача);
- detail: **SQL by slug**, не load-all;
- list: `ORDER BY` + `LIMIT`, **без** тяжёлого `contentHtml` если не нужен;
- отзывы public: `consentConfirmed = true`;
- fallback: try D1 → messages/static → notFound/empty;
- карта маршрутов: **`TEMP/PUBLIC_D1_MAP.md`**.

---

## 10. Изображения

- Optimize **в браузере**: WebP ~0.82, ширины 1600/1200/800/400, без upscale; SVG as-is.  
- Worker: R2 put/get only; `cacheControl: public, max-age=31536000, immutable`.  
- Public: `/api/media/...` + `ResponsiveImage` (srcset), **без** Next Image optimize.  
- Keys: `media/<YYYY>/<MM>/<uuid>[-width].webp`.

---

## 11. SEO-инварианты

- Locale redirects: **308**, не 307.  
- Missing URL → **HTTP 404** (не soft-200).  
- Один H1; title/description; **absolute** canonical; hreflang ru/uk/x-default; JSON-LD; нет PLACEHOLDER.  
- `sitemap.xml` — только published, обе локали, hreflang.  
- `robots.txt` — Disallow `/api/`, `/_next/`.  
- Доработки CMS **не** должны ломать публичный SEO/визуал без явной задачи.

После изменений:

```bash
bash scripts/seo-regression.sh   # green
# + curl ключевых URL из §13
```

---

## 12. Что НЕ трогать без нужды

Auth/permissions/session **логика** · split workers · CF Access domain ·  
TipTap **extensions core** (можно выносить shared wrapper) · soft-404 · 308 locale logic ·  
CDN cache strategy public · observability 1% public · полная переписка Drizzle schema «заодно».

**Можно и нужно** (product finish / здача):

- labels UK у AdminShell / layout metadata / topbar / footer / block registry;  
- forms: publish CTA, MediaPicker primary, auto-slug, advanced collapse tech fields;  
- home/pages → `useActionState` contract;  
- audit/seo **pagination** (важкі list pages → Error 1102 на Free);  
- hide debug-tools від OWNER IA;  
- owner guide + acceptance smoke.

Точечные правки schema/actions/pages/forms — по `QUALITY_ADMIN_PLAN` Wave 0–1 і §17 / §22.

---

## 13. Definition of Done

### 13.1 Технический DoD (всегда)

1. `npm run build` + `cd apps/admin && npm run build` — 0 TS errors, без `any`.  
2. `seo-regression.sh` green + curl: home, uslugi, blog, faq, sitemap, robots; unknown=404.  
3. Мутации: audit + `revalidatePublic` с paths из REVALIDATE_MAP.  
4. Public: D1 primary где этап закрыт; нет load-all-by-slug.  
5. CDN s-maxage **сохранён** (не no-store).  
6. `TEMP/PROGRESS.md` обновлён; отчёт с пруфами (команды/коды).  
7. Владелец: create/edit/publish → видно на сайте за секунды.

### 13.2 Admin product DoD (для любой admin-фичи)

Фича в админке **не сдана**, пока нет всех пунктов:

| # | Требование |
|---|---|
| 1 | Владелец правит **без** raw JSON / без знания SQL / без правок `messages/*.json` |
| 2 | Форма: `useActionState` + inline error; **нет** `alert()` / `confirm` как единственного UX (confirm на delete — ок) |
| 3 | RU+UK контент обязателен для publish; UI-метки **единый язык** (UK) |
| 4 | Rich text → shared TipTap; structured lists → visual list editor; images → MediaPicker |
| 5 | Reorderable lists → DnD (`SortableList` / dnd-kit), не «пересоздай заново» |
| 6 | Action: auth + permission + zod + D1 + audit + `revalidateAdmin` + **`revalidatePublic`** |
| 7 | Public page реально читает D1 (не только admin write) |
| 8 | После save: `router.refresh()` / revalidate, **не** `window.location.reload()` |
| 9 | Empty / loading / error states; status badge DRAFT/PUBLISHED/ARCHIVED |
| 10 | Free: public CPU/cache не ухудшены; тяжёлое — в browser или admin (редко) |

---

## 14. Рабочий процесс агента

1. Прочитай `AGENT.md` **§0 + §17–§22** + `TEMP/README.md` + `TEMP/CLIENT_ACCEPTANCE_AUDIT_2026-07-20.md` (або новіший audit).  
2. Master plan: `TEMP/QUALITY_ADMIN_PLAN.md` (Wave 0→1→2). Journeys: `TEMP/OWNER_JOURNEYS.md`.  
3. Сверь код (не память): forms, actions, `public.ts`, wrangler.  
4. Бери **один** gap / одну journey → code → build admin (+ public якщо `src/`) → **live smoke**.  
5. Для admin UX: shared-паттерн (TipTap/SortableList/useActionState/MediaPicker) → форми.  
6. Онови `TEMP/PROGRESS.md` + статус gap у `GAPS_MAP.md` / checklist.  
7. Коммиты атомарні; **секрети/паролі ніколи** в git / TEMP / AGENT.md / chat-логах.  
8. Сумнів по SEO/CPU/cache/YMYL — **стоп і питання**.  
9. Перед «готово до здачі» — пройди `TEMP/ACCEPTANCE_CHECKLIST.md` end-to-end на prod.

Не використовувати як master: старі TEMP-звіти з «10/11 URL 500» / «14 actions missing»  
(див. `TEMP/DRAFT_PLAN_CORRECTIONS.md`).

---

## 15. Диагностика

1. Сначала читай файл и импорты.  
2. Воспроизведи (curl / tail / d1 / login admin).  
3. Одно изменение — одна проверка.  
4. Не глуши TS через `any` / `@ts-ignore` / `as unknown as`.  
5. `wrangler tail` — runtime; `wrangler d1 execute --remote` — данные.  
6. >2 неудачных попытки одной гипотезы → запиши в PROGRESS, смени подход или спроси.  
7. «Правка не на сайте» → сначала `revalidatePublic` + secret + paths с `/ru` `/uk`, потом public helper.

---

## 16. Самопроверка (grep)

Должно быть **пусто** / осмысленно:

```bash
# no any
rg ": any\\b| as any\\b|@ts-ignore|@ts-nocheck|as unknown as" apps/admin/src src

# broken import path
rg "app/admin/actions" apps/admin/src

# load-all anti-pattern in public helpers (после этапа A — не должно остаться)
rg "getServices\\(locale\\)|getBlogPosts\\(locale\\)" src/lib/db/public.ts
# by-slug functions must not call full list

# locale redirect must stay 308
rg "307" src/middleware.ts

# hardcode localhost in app code (кроме tests)
rg "localhost|127\\.0\\.0\\.1" src apps/admin/src --glob '!**/node_modules/**'

# legacy form UX (цель — 0 в content-формах)
rg "alert\\(|window\\.location\\.reload" apps/admin/src

# raw JSON as primary editor (допустимы advanced/dev-only; не primary UX)
rg "font-mono.*textarea|name=\"[^\"]*Json\"|content_json" apps/admin/src/app/admin

# publish must use canPublish
rg "canEditContent.*publish|publish.*canEditContent" apps/admin/src/lib/actions
```

**Логические ловушки:**

- забыли `revalidatePublic` → правка «не на сайте»;  
- revalidate paths без `/ru` `/uk` → cache miss не там;  
- publish без UK / consent;  
- slug change без 301;  
- public query без `PUBLISHED`;  
- отключили CDN cache;  
- ресайз в worker;  
- D1 в middleware;  
- admin UI пишет D1, public читает static → «админка бесполезна»;  
- JSON textarea вместо block/list editor → «карявая админка»;  
- TipTap только в blog → остальные сущности second-class;  
- `alert()` / full page reload → ломает UX;  
- секреты в чате/TEMP/репо.

**Порядок сдачи:** grep → build×2 → seo-regression → curl public + spot-check admin route → PROGRESS → «готово» с пруфами.

---

## 17. Админка = product quality bar (критично)

> Цель: **удобная, функциональная, интуитивная CMS**, а не технический админ-каркас.  
> Пользователь: владелец сайта (OWNER), не разработчик.

### 17.1 Неприемлемо (reject)

| ❌ Запрещено как «готово» | ✅ Вместо этого |
|---|---|
| Raw JSON `<textarea>` для контента владельца | Структурированные поля / block editors / list editors |
| TipTap **только** в blog | Shared TipTap для FAQ answer, service description, testimonial text, text-block body |
| `useTransition` + `alert(error)` | `useActionState` + inline error banner + `isRedirectError` |
| `window.location.reload()` после save | `router.refresh()` / server revalidate admin path |
| Смесь RU/UK UI-меток / «Админ-панель» RU chrome | Единый UI language: **украинский** (контент-поля RU/UK як дані) |
| Ручной URL media **як primary** (picker secondary) | `MediaPickerDialog` primary; manual URL тільки advanced |
| `Slug Base` / sortOrder / priority як primary fields | Auto-slug з title; tech fields у `<details>` advanced |
| Publish лише через status `<select>` без CTA | «Зберегти чернетку» + «Опублікувати» + YMYL human errors |
| Reorder только «удали и создай» | DnD (`SortableList` / dnd-kit) + persist `sortOrder` |
| Кнопки-аббревиатуры «Збр», «Дел», «Зняти» | Полные подписи: «Зберегти», «Видалити», «Зняти з публікації» |
| Publish через `canEditContent` | Только `canPublish` |
| CRUD в admin без public D1 read | Полный цикл: admin → D1 → public helper → page |
| Hardcode footer/nav/services в `constants` как primary | D1 primary; constants/messages = fallback |
| SSR dump audit/seo без pagination (~MB HTML) | Pagination / filters / limit — Free admin CPU |
| Тяжёлая логика на public worker «ради удобства админки» | Тяжёлое в browser (optimize) или admin (редко); public — cheap read + CDN |
| «Routes 200 = готово до клієнта» | Тільки `ACCEPTANCE_CHECKLIST` + J1–J8 walkthrough |

### 17.2 Приемлемо / эталон

- **Blog posts** — эталон rich text: TipTap, RU/UK, media cover, publish flow.  
- **Services / FAQ / Testimonials lists** — эталон DnD reorder.  
- **Navigation** — эталон tree DnD (допилить подписи кнопок).  
- **Media** — эталон UploadZone + MediaPicker.  
- **Block registry** (`apps/admin/src/lib/blocks/registry.ts`) — эталон page sections:  
  новый тип блока = `registerBlock` + editor + defaultContent, **не** ad-hoc JSON в page form.

### 17.3 Матрица «сущность → must-have UX»

| Сущность | List | Edit UX | RU/UK | Publish | DnD | Media | Public read |
|---|---|---|---|---|---|---|---|
| Blog posts | ✅ | TipTap | ✅ | canPublish | — | cover picker | `getBlogPost*` |
| Blog categories | ✅ | fields | ✅ | — | — | — | categories |
| Services | ✅ | fields + TipTap desc + visual *Json lists | ✅ | canPublish | sort | optional | `getService*` |
| FAQ | ✅ | TipTap answer | ✅ | status | sort | — | `getFAQs` |
| Testimonials | ✅ | fields + consent | ✅ | canPublish + consent | sort | — | `getTestimonials` |
| Pages / Home | ✅ | **BlockEditor** + DnD sections | ✅ | canPublish | sections | MediaPicker in blocks | `getPageByType` |
| SEO | by entity | form fields | per locale | — | — | og image picker | `getSEOMeta` |
| Navigation | tree | labels + href | labelRu/Uk | enable | tree DnD | — | `getNavigation` |
| Contact channels | list | type/value/url | label | enable | sort | — | `getContactChannels` |
| Settings | form | key → typed fields | — | canManageSettings | — | logo picker | `getSiteSetting` |
| Redirects | list | from/to/code | — | enable | — | — | middleware/KV later |
| Media | grid | alt/meta | — | — | upload DnD | R2 | `/api/media` |
| Leads | list+detail | status/notes | — | — | — | — | admin-only |
| Users / Audit | list | role filters | — | permissions | — | — | admin-only |

### 17.4 Язык UI vs контент

- **UI chrome** (sidebar, buttons, labels, errors, empty states): **украинский**, единый стиль.  
- **Контентные данные**: всегда пара **RU + UK** (поля/вкладки), не «сначала только RU».  
- Не смешивать «Русский» в pages и «RU — переклад» в blog — один паттерн:  
  `🇷🇺 Російська` / `🇺🇦 Українська` или `RU` / `UK` **одинаково везде**.

### 17.5 Формы — обязательный контракт

Новая или правимая content-форма **должна**:

1. `'use client'` + `useActionState` (не raw `useTransition`+alert).  
2. `isRedirectError` rethrow.  
3. Inline error: красный banner `state.error`.  
4. `htmlFor` / `id` на всех controls; `<label>` у каждого поля.  
5. Pending state на submit (`disabled` + текст «Збереження…»).  
6. Success path: redirect **или** `router.refresh()` + понятный success (banner/toast).  
7. Validation: zod на server action (`safeParse`); client — required HTML5 где уместно.  
8. Опасные действия (delete, unpublish): `confirm` **или** destructive dialog — ок.  
9. Shared field styles: те же Tailwind-классы input/select/button, что в blog/service forms.  
10. Нет дублирования TipTap — вынести shared:  
    `apps/admin/src/components/admin/editor/TipTapEditor.tsx` (или эквивалент),  
    импорт из blog/services/faq/testimonials/blocks.

### 17.6 Page sections / Home — block-first

Страницы и home **не** редактируются через raw `content_json` textarea.

- Источник типов: `lib/blocks/registry.ts` + editors в `lib/blocks/editors/*`.  
- UI: `BlockLibraryDialog` (добавить блок) + `BlockEditorPanel` / typed editor + DnD order.  
- Save per section / batch — но после save **без full reload**.  
- Public: `getPageByType` → рендер секций по `type` (registry mapping на public components).  
- Новый блок = registry + admin editor + public renderer (+ revalidate page paths).  
  **Не** «добавить JSON в textarea и надеяться».

### 17.7 Structured JSON fields (services и т.п.)

Поля вроде `symptomsJson`, `processJson`, `benefitsJson`, `faqJson`:

- ❌ primary UX = mono textarea с JSON;  
- ✅ visual list editor (add/remove/reorder rows: title, text, icon…);  
- serialize → JSON string в D1;  
- optional «Advanced JSON» collapse только для dev/OWNER, не default.

### 17.8 Preview (целевой стандарт)

- DRAFT не светить на public без явного preview.  
- Цель: кнопка «Переглянути» → public URL с `__preview` cookie / signed token (этап P2/G).  
- Пока preview нет — хотя бы «Відкрити на сайті» для PUBLISHED (locale URLs).

### 17.9 Feedback & empty states

- Empty list: текст + CTA «Створити…».  
- Loading: skeleton или disabled controls, не пустой экран.  
- Errors: human-readable украинский, не stack dump.  
- StatusBadge: DRAFT / PUBLISHED / ARCHIVED единообразно.

### 17.10 Admin sidebar IA

Группы логичны (Контент / CRM / Система). При добавлении раздела:

- иконка Lucide + label UK;  
- active state по pathname;  
- не плодить дубли (Home отдельно от Pages — ок, если Home = shortcut на type HOME).  
- SEO: либо в entity form tab, либо `/admin/seo` — но **одна** понятная точка входа с entity.

---

## 18. Замкнутый CMS-цикл (admin ↔ public)

### 18.1 Правило

```
Admin UI ──write──► D1 (shared)
                      │
                      ├── audit_logs (fire-and-forget)
                      ├── revalidatePublic(paths[]) ──► public worker CDN
                      └── public page read: src/lib/db/public.ts (PUBLISHED only)
```

Любая сущность из §17.3 **обязана** иметь:

1. Schema в `packages/shared` (+ sync admin/public schema copies при миграции).  
2. Admin list + edit UI (quality bar §17).  
3. Actions в `apps/admin/src/lib/actions/*` с полным контрактом §7.  
4. Public helper в `src/lib/db/public.ts`.  
5. Page/component public, который **сначала** D1, потом fallback.  
6. Paths в `TEMP/REVALIDATE_MAP.md` + вызов `revalidatePublic`.

### 18.2 Anti-patterns (разрыв цикла)

| Симптом | Причина | Фикс |
|---|---|---|
| Правил в admin — на сайте старое | Нет revalidate / неверный secret / path без locale | §8 + SECRETS_TODO |
| Правил — сайт «из JSON» | page всё ещё `getMessages`/`SERVICES` const primary | PUBLIC_D1_MAP, этап C/D |
| Footer/menu не из admin | Footer читает `constants.SERVICES` | D1 `getServices` / `getNavigation` |
| sitemap не видит новые slug | sitemap на const fallback | D1 published lists |
| 500 на public после «удобного» admin | load-all / heavy query / no-store | Free §2 |

### 18.3 Fallback policy

1. try D1 PUBLISHED  
2. empty/throw → messages/static fallback  
3. detail still empty → `notFound()` (HTTP 404)  
4. **Не** публиковать DRAFT. Preview — отдельно.

---

## 19. Free plan + админка (баланс)

### 19.1 Где можно тяжелее

| Слой | Бюджет | Можно |
|---|---|---|
| **Public** worker | ~10 ms CPU, CDN primary | 1–3 cheap D1, HTML render |
| **Admin** worker | редкие запросы владельца | CRUD, joins, TipTap bundle, upload API |
| **Browser** (admin) | client | WebP variants, DnD, rich editors |

### 19.2 Всё равно запрещено (даже в admin)

- Ресайз/WebP **в Worker** (только browser `optimize.ts` до upload).  
- Cloudflare Images / paid AI / heavy WASM «заодно».  
- `Cache-Control: no-store` на **public** HTML.  
- Тянуть admin-only libs в public bundle.  
- Поднимать public observability sampling.  
- N+1 D1 в public page; list с full `contentHtml`.

### 19.3 Admin bundle

- Admin — отдельный worker (уже). Не мёржить admin UI в public.  
- TipTap / dnd-kit — только `apps/admin`.  
- Shared schema/types — `packages/shared`, без UI.

### 19.4 R2 / D1 Free-friendly

- Media keys immutable; public serve `max-age=31536000`.  
- D1 writes — точечные; batch reorder — один action, не 50 round-trips без нужды.  
- Audit log fire-and-forget, не блокирует UX.  
- revalidatePublic fire-and-forget, не блокирует save (но логировать failure).

---

## 20. Как реализовывать admin-фичу (чеклист агента)

Перед кодом:

1. [ ] Какая сущность? Есть ли schema + public helper + page?  
2. [ ] Этап в TEMP (A–H) / gap id — не прыгать через CPU/revalidate.  
3. [ ] Есть ли эталонная форма рядом (blog/service) для copy pattern?

Во время:

4. [ ] Action: auth → permission → zod → D1 → audit → revalidateAdmin → revalidatePublic.  
5. [ ] UI: useActionState, labels UK, RU/UK fields, no JSON primary, TipTap/DnD/MediaPicker as needed.  
6. [ ] Public: SQL by slug / limit lists; fallback only.  
7. [ ] Paths: locale + trailing slash; REVALIDATE_MAP.

После:

8. [ ] build admin (+ public если трогали src/).  
9. [ ] grep §16 (alert/reload/any/old imports).  
10. [ ] smoke: admin route 200 + public URL после hypothetical publish path.  
11. [ ] PROGRESS.md + кратко «что владелец теперь может».

### 20.1 Приоритет работ (если не указан этап)

> Інфра-цикл (D1 + revalidate + media + YMYL) **вже здебільшого закритий**.  
> Зараз пріоритет = **product finish + client acceptance** (див. §0 Wave 0–1).

1. **P0 Wave 0** Formal live smoke J1 (edit→public <30s) + guided publish CTA.  
2. **P0 Wave 0** Chrome 100% UK; MediaPicker primary cover; audit pagination; owner guide.  
3. **P0 Wave 1** SEO IA + list perf; auto-slug posts; Preview FAQ/testimonials; form contract home/pages.  
4. **P1** Hide debug-tools; ViewOnSite locale slugs; error strings UK-only.  
5. **P2** Revisions product, charts, OAuth, scheduling, E2E suite.

Не починати P2, поки Wave 0 acceptance blockers open.  
Не «лікувати» неіснуючі public 500 і «відсутні actions».

### 20.2 Секреты и доступы

- Секреты только wrangler secret / CI secrets / local `.env` (gitignored).  
- **Никогда** не писать password, API tokens, AUTH_SECRET, CF token в `AGENT.md`, `TEMP/*`, commits, PR.  
- Если секреты засветились в чате — **рекомендовать rotate**, не копировать в репо.  
- Admin login: Credentials + CF Access; не ослаблять middleware `noindex`.

---

## 21. Целевая модель «ядро CMS» (vision)

Владелец открывает `admin.podvarchan.com` и без разработчика:

1. Меняет **главную** (hero, блоки, FAQ-ref, отзывы) block editor'ом.  
2. Правит **услуги** (тексты RU/UK, списки симптомов/процесса, FAQ услуги, SEO, publish).  
3. Пишет **блог** (TipTap, cover, category, SEO, publish).  
4. Ведёт **FAQ / отзывы** (consent, reorder).  
5. Правит **страницы** about/metod/tseny/kontakty секциями.  
6. Грузит **медиа** (WebP variants в browser → R2).  
7. Меняет **меню, каналы, settings**.  
8. Смотрит **заявки**, **audit**, **redirects**.  
9. Жмёт «Зберегти» / «Опублікувати» → **через секунды видно на podvarchan.com** (RU и UK).

Всё это — **внутри Cloudflare Free**: public на CDN + cheap D1; admin отдельно; без worker image pipeline.

Любая задача по админке должна **приближать** этот vision и **не** плодить half-CRUD, оторванный от public.

---

## 22. Здача замовнику (client acceptance)

> Ціль цього розділу: **довести адмінку до ідеалу продукту** і закрити acceptance.  
> Детальний gap-list: `TEMP/CLIENT_ACCEPTANCE_AUDIT_2026-07-20.md`.  
> Checklist: `TEMP/ACCEPTANCE_CHECKLIST.md`. Journeys: `TEMP/OWNER_JOURNEYS.md`.

### 22.1 Що вже є (не переписувати)

- Login OWNER, RBAC, split workers, D1, R2 media, audit, revalidatePublic.  
- Public D1 primary + CDN Free model.  
- Shared TipTap, StructuredListEditor, MediaPicker, DnD lists/sections.  
- YMYL gates (bilingual, meta, consent, canPublish, slug→301).  
- Dashboard real stats + quick actions + draft links.

### 22.2 Wave 0 — блокує здачу (робити першим)

| # | Задача | DoD |
|---|---|---|
| W0.1 | Formal **J1 smoke** на prod | Edit published service title → public H1 < 30s; пруф у PROGRESS |
| W0.2 | Guided publish CTA (service + post мінімум) | «Зберегти чернетку» / «Опублікувати»; YMYL errors UK |
| W0.3 | Chrome UK 100% | Немає «Админ-панель» RU; block registry labels UK |
| W0.4 | Post cover MediaPicker primary | Manual URL лише advanced collapse |
| W0.5 | Audit list pagination | Не SSR dump ~1MB; без Error 1102 на list |
| W0.6 | `TEMP/OWNER_GUIDE_UK.md` | 1 сторінка: послуга / пост / головна / медіа |
| W0.7 | Security | Rotate OWNER password якщо був у чаті |

### 22.3 Wave 1 — product polish перед walkthrough

| # | Задача |
|---|---|
| W1.1 | Auto-slug blog post (+ category уже advanced) |
| W1.2 | SEO в sidebar + server pagination/filter SEO list |
| W1.3 | PreviewButton FAQ + testimonials (public helpers вже є) |
| W1.4 | home/pages → `useActionState` + success banner |
| W1.5 | Tech fields (priority/sortOrder/slugBase) глибше в advanced |
| W1.6 | Hide `/admin/debug-tools` з OWNER IA (або flag) |
| W1.7 | ViewOnSiteLink: locale slug, не лише slugBase |
| W1.8 | Catch errors: тільки human UK (не `Unknown error`) |

### 22.4 Wave 2 — після client walkthrough (не блокує v1)

Revisions product UI · E2E playwright J1–J3 · optional 301 `/o-mne` · scheduling · OAuth · charts.

### 22.5 Порядок «готово до здачі»

```
1. Закрити Wave 0 (код + deploy)
2. Browser walkthrough J1–J8 як OWNER (TEMP/OWNER_JOURNEYS)
3. Grep §16 + §17.1 reject list
4. build public + admin
5. seo-regression + curl public CDN
6. Заповнити ACCEPTANCE_CHECKLIST [x]
7. Sign-off: agent → product owner → client OWNER
```

**Формула:** якщо client walkthrough fail на J1/J2/J3 — **не ready**, навіть якщо build green і routes 200.

### 22.6 Anti-goals v1

Не блокують і не починати «замість» Wave 0:

- OAuth / multi-provider login  
- Dashboard charts  
- Publish scheduling  
- Deep revision restore  
- Big-bang design system rewrite  
- Cloudflare Images / paid AI / worker resize
