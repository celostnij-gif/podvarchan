# AGENT.md — podvarchan.com

> Постоянный контекст для ИИ-агента. Читать **перед каждой задачей**.  
> Если задача противоречит этому файлу — **спроси**, не ломай инварианты.  
> **Дата:** 2026-07-16

---

## 1. Что это за проект

`podvarchan.com` — двуязычный (RU/UK) сайт психолога-консультанта + **CMS-админка**.  
Ниша **YMYL** → SEO, canonical, publish-правила строгие.

### Цель продукта

**Админка = ядро управления сайтом.** Из неё гибко меняется:

- контент страниц, **блоки и секции** (home, about, metod, prices, contacts…);
- услуги, блог, FAQ, отзывы;
- **SEO** (title, description, og, robots, schema fields в `seo_meta`);
- **картинки** (R2 + media_assets);
- меню, каналы связи, редиректы, settings.

**Публичный сайт** — тонкий read-only рендер: D1 `PUBLISHED` + CDN.  
`messages/*.json` и `src/content/**` — только **fallback**, не source of truth.

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
- `revalidatePath` в admin **не** чистит public → только кросс-воркер revalidate (§7).

### План реализации CMS (не с нуля)

Master-план в TEMP (читать по `TEMP/README.md`):

1. `TEMP/COMPLETION_GUIDE.md` — стратегия Free + gaps  
2. `TEMP/IMPLEMENTATION_STEPS.md` — **как делать этапы A–H**  
3. `TEMP/PUBLIC_D1_MAP.md`, `REVALIDATE_MAP.md`, `GAPS_MAP.md`, `SECRETS_TODO.md`  
4. `TEMP/PROGRESS.md` — чеклист  

Порядок: **A → B → C → D → E → F → G → H**. Не перескакивать.

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
- смена slug у PUBLISHED → `redirect_rules` **301** (from → to, обе локали).

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

Auth/permissions/session · AdminShell/layout/login · split workers · CF Access domain ·  
TipTap core · soft-404 · 308 locale logic · CDN cache strategy · observability 1% public ·  
полная переписка Drizzle schema «заодно».

Точечные правки schema/actions/pages — только по этапу плана.

---

## 13. Definition of Done

1. `npm run build` + `cd apps/admin && npm run build` — 0 TS errors, без `any`.  
2. `seo-regression.sh` green + curl: home, uslugi, blog, faq, sitemap, robots; unknown=404.  
3. Мутации: audit + `revalidatePublic` с paths из REVALIDATE_MAP.  
4. Public: D1 primary где этап закрыт; нет load-all-by-slug.  
5. CDN s-maxage **сохранён** (не no-store).  
6. `TEMP/PROGRESS.md` обновлён; отчёт с пруфами (команды/коды).  
7. Владелец: create/edit/publish → видно на сайте за секунды.

---

## 14. Рабочий процесс агента

1. Прочитай `AGENT.md` + `TEMP/README.md` + текущий этап в `IMPLEMENTATION_STEPS.md`.  
2. Сверь код (не память): `public.ts`, actions, wrangler.  
3. Меняй **один** этап/подшаг → build → smoke.  
4. Обнови `TEMP/PROGRESS.md`.  
5. Коммиты — атомарные, осмысленные; секреты не коммитить.  
6. Сомнение по SEO/CPU/cache — **стоп и вопрос**.

Не использовать как master: старый `implementation-guide-admin-CURRENT-STATE.md`  
(этапы 0–5 «сделать actions» — уже в прошлом).

---

## 15. Диагностика

1. Сначала читай файл и импорты.  
2. Воспроизведи (curl / tail / d1).  
3. Одно изменение — одна проверка.  
4. Не глуши TS через `any` / `@ts-ignore` / `as unknown as`.  
5. `wrangler tail` — runtime; `wrangler d1 execute --remote` — данные.  
6. >2 неудачных попытки одной гипотезы → запиши в PROGRESS, смени подход или спроси.

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
```

**Логические ловушки:**

- забыли `revalidatePublic` → правка «не на сайте»;  
- revalidate paths без `/ru` `/uk` → cache miss не там;  
- publish без UK / consent;  
- slug change без 301;  
- public query без `PUBLISHED`;  
- отключили CDN cache;  
- ресайз в worker;  
- D1 в middleware.

**Порядок сдачи:** grep → build×2 → seo-regression → curl → PROGRESS → «готово» с пруфами.
