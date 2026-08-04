# AGENTS.md — podvarchan.com

Этот файл — обязательный контекст для любого AI-агента (Claude Code, Cursor, и т.д.), работающего с этим репозиторием. Перед любой правкой агент обязан прочитать этот файл целиком. Если инструкция в промпте пользователя противоречит этому файлу — приоритет у **AGENTS.md**, если явно не указано обратное.

---

## 0. Что это за проект

Двуязычный (RU/UK) сайт практикующего гипнотерапевта Вячеслава Подварчана с собственной CMS-админкой. Ниша **YMYL** (Your Money Your Life — психологическая/медицинская тематика), поэтому к SEO/E-E-A-T требования выше стандартных.

```
podvarchan/
├── src/                          # Public worker — podvarchan.com (READ-ONLY из D1)
├── apps/admin/src/                # Admin worker — admin.podvarchan.com (READ+WRITE D1/R2/KV)
├── packages/shared/src/db/schema/ # SOURCE OF TRUTH для схемы БД (Drizzle)
├── drizzle/migrations/            # SQL-миграции
├── messages/                      # i18n fallback (ru.json, uk.json)
├── scripts/                       # seed, revalidate, seo-regression и др.
└── TEMP/                          # Планы/аудиты/агентские промпты (рабочая область, не деплоится)
```

Два независимых Cloudflare Workers на **общей** D1-базе `podvarchan`, общей R2-медиатеке `podvarchan-media` и общем KV `RATE_LIMIT_KV`. У каждого воркера — своя incremental cache в R2 (`podvarchan-inc-cache` и `podvarchan-admin-inc-cache`).

---

## 1. Жёсткие технические ограничения Cloudflare Free Plan

Эти лимиты **не обсуждаются** и не решаются апгрейдом тарифа — вся архитектура обязана в них укладываться.

| Ресурс | Лимит | Что это значит на практике |
|---|---|---|
| CPU time / запрос | **~10 мс** | Любой тяжёлый синхронный код (парсинг больших JSON, ресайз изображений, сложные regex-цепочки в middleware) может привести к `Error 1102` / таймауту. Профилировать всё, что трогает middleware или рендер публичной страницы. |
| Bundle size / воркер | **~3 MiB gzip** | Публичный воркер и админка **разделены намеренно** — не сливать их обратно в один проект. Тяжёлые клиентские библиотеки (`framer-motion`, `date-fns`) — только точечный импорт, тяжёлую анимацию — через `next/dynamic({ ssr: false })`. |
| D1 Reads | 5,000,000 / сутки | С запасом при текущем трафике, но публичные страницы всё равно обязаны идти через кеш-слой (см. Раздел 3), а не бить в D1 при каждом запросе. |
| D1 Writes | 100,000 / сутки | С огромным запасом — не источник проблем, но не плодить лишние `UPDATE` (например, не писать `updated_at` на чтение). |
| KV операций | 100,000 / сутки на namespace | Используются **два раздельных namespace**: `RATE_LIMIT_KV` (не трогать под кеш контента) и `CONTENT_CACHE_KV` (кеш контента, см. Раздел 3). Не смешивать назначение внутри одного namespace. |
| R2 Storage | 10 GB | Медиа + inc-cache двух воркеров + кеш-снапшоты контента. Загружаемые изображения — только в WebP/AVIF, без хранения оригиналов в высоком разрешении без необходимости. |
| Workers requests | 100,000 / сутки на 2 воркера суммарно | Каждый лишний внутренний fetch (например, cross-worker revalidate) — это отдельный request budget. Не делать revalidate-запросы чаще, чем реально нужно (батчить, если публикуется несколько сущностей подряд). |
| Image resizing | **Недоступен в рантайме Workers** | Никаких `sharp`, `next/image` loader'ов с server-side resize, Cloudflare Image Resizing API в рантайме воркера. Ресайз — **только** на этапе загрузки в админке (client-side `<canvas>`/`createImageBitmap` в браузере редактора) или на этапе build. |

### Кодифицированные ограничения, уже принятые в проекте (не менять без явного запроса):
- Доступ к D1 **только** через `getRequestContext().env.DB`.
- `no any` в TypeScript (strict mode) — без исключений.
- Иконки из `lucide-react` — импортировать под алиасом `ImageIcon`, если это `Image` (конфликт с DOM/Next `Image`).
- **Server Actions существуют только в `apps/admin/src/lib/actions/**`.** Публичный воркер — read-only, никаких мутаций, никаких Server Actions на публичных страницах.
- Всегда держать в уме 10ms CPU budget при написании любого кода, исполняемого на каждый публичный запрос (middleware, `generateMetadata`, layout).

---

## 2. Архитектурное правило: публичный сайт READ-ONLY

`src/` (podvarchan.com) не создаёт, не обновляет и не удаляет строки в D1 **никогда**, за одним исключением — `contact_leads`/`lead_events` через `/api/contact/` (единственный легитимный write-путь с публичной стороны, обязательно с rate-limit через `RATE_LIMIT_KV`).

Все остальные мутации — только через `admin.podvarchan.com`. Если задача требует, чтобы публичная страница "что-то запомнила" — это либо KV-кеш (временное, невидимое пользователю), либо задача для админки, а не для `src/`.

---

## 3. Обязательный контракт кеширования (три уровня)

Любая новая функция чтения данных в `src/lib/db/public.ts` **обязана** идти через кеш-обёртку, а не дёргать `env.DB` напрямую из компонента страницы.

```
CDN edge cache (Cache-Control)
      ↓ miss
KV (CONTENT_CACHE_KV) — TTL 1ч–24ч в зависимости от типа сущности
      ↓ miss
R2 (podvarchan-inc-cache/content/*.json) — durable fallback, живёт дольше KV
      ↓ miss ИЛИ D1 недоступен
D1 (source of truth) — только тут разрешён прямой SELECT
```

```typescript
// src/lib/cache/content-cache.ts — эталонный паттерн, переиспользовать, не изобретать заново
export async function getWithFallback<T>(
  env: CloudflareEnv,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const kvHit = await env.CONTENT_CACHE_KV.get(key, 'json');
  if (kvHit !== null) return kvHit as T;

  try {
    const fresh = await fetcher(); // единственное место, где идём в D1
    await env.CONTENT_CACHE_KV.put(key, JSON.stringify(fresh), { expirationTtl: ttlSeconds });
    // fire-and-forget копия в R2 для graceful degradation
    // (использовать ctx.waitUntil, не await)
    return fresh;
  } catch (d1Error) {
    const r2Fallback = await env.CONTENT_CACHE_R2.get(`content/${key}.json`);
    if (r2Fallback) return r2Fallback.json() as Promise<T>;
    throw d1Error;
  }
}
```

### TTL-матрица (не менять без пересмотра всего плана инвалидации)

| Сущность | Ключ KV | TTL |
|---|---|---|
| `navigation_items`, `site_settings`, `contact_channels` | `nav:*`, `settings:all`, `contacts:all` | 86400 |
| `services`, `service:{slug}`, `faq:{group}` | `services:list:{locale}`, `service:{slug}:{locale}`, `faq:{group}:{locale}` | 21600 |
| `pages` (HOME/ABOUT/METHOD/PRICING/CONTACTS/PRIVACY/DISCLAIMER), `blog_categories`, `testimonials` | `page:{type}:{locale}`, `blog-cats:{locale}`, `testimonials:all:{locale}` | 43200 |
| `blog_posts` список/detail | `blog:list:{locale}:{page}`, `blog:{slug}:{locale}` | 3600 |
| Скомпилированные `redirect_rules` | `redirects:compiled` | без TTL, инвалидация только вручную из админки |

### Cache-Control (edge) по типам страниц

| Тип страницы | `s-maxage` | `stale-while-revalidate` | `stale-if-error` |
|---|---|---|---|
| Home / Services / FAQ / About / Method / Pricing / Contacts / Privacy / Disclaimer | 604800 | 2592000 | 604800 |
| Blog (list/post/category) | 86400 | 604800 | 604800 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt` | 3600 | 86400 | 604800 |
| Static assets, R2 media | `max-age=31536000, immutable` | — | — |
| `/api/preview/` | **`no-cache` всегда, безусловно** | — | — |

**Правило:** длинный TTL — это не риск устаревания, потому что свежесть обеспечивается **on-demand-инвалидацией** (Раздел 4), а не пересчётом по таймеру. Если агент видит короткий TTL там, где нет причины (страница не критична к секундной свежести) — это повод удлинить TTL, а не сократить.

### Агрегаты (sitemap.xml, llms-файлы, тяжёлые сводки)

Любой артефакт, который строится из **нескольких сущностей** (sitemap.xml, `/llms.txt`, `/llms-full.txt`, будущие агрегаты), обязан соответствовать трём требованиям:

1. **Готовый артефакт кешируется, а не рендер пересобирается на каждый запрос.** Отрисованный результат (XML/текст) лежит в `CONTENT_CACHE_KV` (текст, TTL ≤ 1ч) с зеркалом в R2 (`content/...` без TTL). Путь запроса — один KV get, не серия кеш-лукапов + D1-запросов + сериализации (это была причина error 1102 на sitemap: холодный рендер превышал ~10 мс CPU и клал сайт мёртвой петлёй).
2. **Сборка агрегата использует только лёгкие getter'ы.** Для sitemap это `getBlogPostsLite` (`blog:list:lite:{locale}`, только id/slug/updatedAt/publishedAt), а не полный `blog:list` с `faqJson`/`excerpt`. Запрещено строить агрегат из тяжёлых списков, нужных страницам.
3. **Прогрев после инвалидации и по cron.** Инвалидация агрегата в `/api/revalidate` синхронно удаляет KV+R2 и ставит прогрев через `ctx.waitUntil`; плюс cron-прогрев (`wrangler/worker.ts scheduled`) держит KV тёплым до истечения TTL. Первый запрос после публикации — всегда KV-hit, никогда тяжёлый рендер в пик трафика.

---

## 4. Обязательная инвалидация кеша при любой мутации

**Каждая функция в `apps/admin/src/lib/actions/**`, вызывающая `db.insert/update/delete`, обязана в конце вызвать `invalidateContent(entity)`.** Без исключений. PR, добавляющий новую server action без вызова `invalidateContent`, считается незавершённым.

```typescript
// apps/admin/src/lib/revalidate.ts — эталон
await invalidateContent({ type: 'service', slug: 'gipnoterapiya-onlayn', locale: 'both' });
```

Это должно синхронно:
1. Дёрнуть `POST {PUBLIC_WORKER_URL}/api/revalidate/` с секретом `REVALIDATE_SECRET`.
2. На стороне публичного воркера — удалить соответствующие ключи из `CONTENT_CACHE_KV` **и** вызвать `revalidatePath()`/`revalidateTag()` Next.js **и** обновить/удалить R2-снапшот.
3. Не полагаться на истечение TTL как на основной механизм публикации — TTL это safety net, а не рабочий путь обновления.

Если агент пишет новый server action и не уверен, как правильно собрать `entity`/`keys`/`paths` для инвалидации — сначала прочитать существующие примеры в `apps/admin/src/lib/actions/`, не изобретать новый формат ключей.

---

## 5. SEO — обязательный чек-лист для 100% соответствия (на каждую новую/изменённую публичную страницу)

Ничто из перечисленного не опционально для YMYL-ниши психологии/гипнотерапии:

- [ ] `<title>` уникален, 50-60 символов, есть в обеих локалях (`ru`/`uk`).
- [ ] `<meta name="description">` 140-160 символов, уникален.
- [ ] `<link rel="canonical">` формируется через `buildCanonical(path, locale)`, никогда не хардкодится вручную.
- [ ] `hreflang`: `ru` + `uk` + `x-default` присутствуют на **каждой** странице (проверить особенно на новых типах страниц — это была причина регрессии в июльском аудите: 80+ URL без взаимного hreflang).
- [ ] Если UK-slug отличается от RU (`tseny/` → `tsiny/`, `ob-avtore/` → `pro-avtora/`) — использовать `ukPath` маппинг, не создавать новый паттерн для каждой страницы.
- [ ] JSON-LD подключён и включает `dateModified` (из `updatedAt` сущности), не только `datePublished`.
- [ ] Для YMYL-контента (тревога, паника, ПТСР, любая клиническая тематика) — блок `reviewedBy`/`medicallyReviewedBy` обязателен на новых статьях этой категории, без исключений.
- [ ] `robots` meta = `index, follow`, если явно не требуется иное (draft/preview — `noindex`).
- [ ] Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`) и Twitter Card (`summary_large_image`) — присутствуют всегда, `og:image` минимум дефолтный (`SITE.defaultOgImage`), по возможности — из `seo_meta.og_image_id`, если заполнен.
- [ ] Новая страница/сущность автоматически попадает в `sitemap.xml` через существующий генератор (`src/app/sitemap.ts`), не через ручное добавление URL.
- [ ] Alt-тексты обязательны на всех `<img>`, в обеих локалях (`alt_ru`/`alt_uk`), WebP/AVIF формат, `width`/`height` заданы явно (избегать CLS).
- [ ] Single `<h1>` на страницу, логичная иерархия `<h2>`/`<h3>` без пропусков уровней.
- [ ] Никаких новых внутренних ссылок без описательного anchor text (не "нажмите сюда").
- [ ] `AggregateRating` (если используется на странице) — только из реальных данных `testimonials`, никогда не хардкодить числа.
- [ ] После любой правки, затрагивающей >1 страницу — прогнать `scripts/seo-regression.sh`, должно быть зелено (сейчас baseline — 50/50 проверок).

**Запрещено:** создавать страницу/сущность, у которой отсутствует хотя бы один из первых пяти пунктов чек-листа выше (title/description/canonical/hreflang/UK-slug-mapping) — именно это было причиной "нулевая индексация Google" в раннем аудите проекта.

---

## 6. AI-поиск / GEO (готовность для LLM и AI Overviews)

Публичный сайт должен одинаково хорошо отдаваться и человеку в браузере, и AI-агенту/краулеру.

- [ ] `robots.txt` разрешает `GPTBot`, `Google-Extended`, `ClaudeBot`, `CCBot`, `Applebot-Extended`, `Amazonbot`, `Bytespider`, `PerplexityBot`, `ChatGPT-User`, `CloudflareBrowserRenderingCrawler` — **не удалять и не сужать** этот список без явного запроса владельца.
- [ ] `Content-Signal: ai-train=yes, search=yes, ai-input=yes` header — сохраняется на всех ответах.
- [ ] `/llms.txt` и `/llms-full.txt` обновляются при добавлении новых типов услуг/крупных разделов — это не статичный файл "на один раз", а живой артефакт, синхронизированный с реальным составом сайта.
- [ ] `/api/md` (content negotiation `Accept: text/markdown`) обязан отдавать markdown-версию **любой** новой публичной страницы, а не только тех типов, что были на момент последнего аудита — если добавляется новый тип роута, проверить, что он попадает под этот rewrite в middleware.
- [ ] Контент новых страниц/статей должен следовать **BLUF** (bottom-line-up-front): первый абзац — прямой ответ на вопрос, без "воды" перед сутью — так его лучше цитируют AI Overview и LLM-агенты.
- [ ] Предпочитать факт-плотный контент: списки, конкретные цифры (длительность сессии, формат, цена), а не общие описательные фразы — это прямое требование AIO-05 ("Information Density & Quotability") из внутреннего аудита.
- [ ] Structured data (`Person`, `ProfessionalService`, `Service`, `FAQPage`, `BlogPosting`, `BreadcrumbList`) — обязательны на соответствующих типах страниц, `BlogPosting` используется с `@id`-интерлинком на `Person`, не голый `Article`.
- [ ] `/api/mcp/` (MCP endpoint) — не ломать контракт при рефакторинге `src/lib/mcp/tools.ts`; если добавляются новые MCP-инструменты, документировать их в этом же файле.
- [ ] `/.well-known/security.txt` (RFC 9116) — не удалять, обновлять контакт при смене владельца/email.

---

## 7. Что нельзя делать никогда (hard no)

- Мержить `src/` (public) и `apps/admin/src/` (admin) обратно в один Next.js проект/воркер — превысит bundle budget.
- Использовать `sharp` или любой server-side image resize в рантайме Workers.
- Ставить `revalidate` короче необходимого "для перестраховки" — это увеличивает нагрузку на D1 без пользы, раз on-demand-инвалидация работает.
- Делать прямой `env.DB.select()` из компонента публичной страницы, минуя `getWithFallback()`.
- Добавлять мутацию в админке без парного вызова `invalidateContent()`.
- Хардкодить SEO-данные (title/description/canonical) в JSX страницы вместо `generateMetadata()` + `src/lib/seo/metadata.ts`.
- Урезать список разрешённых AI-ботов в `robots.txt` или `Content-Signal` header без явного запроса от владельца проекта.
- Публиковать новую YMYL-статью (тревога/паника/ПТСР/клиническая тематика) без `reviewedBy`/`medicallyReviewedBy`.
- Удалять/переименовывать колонки в `packages/shared/src/db/schema/` без миграции и без проверки реального % заполнения в живой D1 (низкий % NULL в старом отчёте не значит "не используется" — сверяться напрямую с БД, отчёты в `TEMP/` могут быть устаревшими).
- Запускать `npx wrangler deploy` вручную локально вместо push в `master` (деплой идёт через CI/GitHub Actions).

---

## 8. Команды, которые агент должен знать

```bash
# Build
npm run build                          # Public worker
cd apps/admin && npm run build         # Admin worker

# Миграции
npm run db:generate                    # Сгенерировать миграцию из схемы
npm run db:migrate:local               # Применить локально
npm run db:migrate:prod                # Применить на прод D1

# Seed
npx tsx scripts/seed-real-data.ts
npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --remote
npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --local

# Прямая сверка с живой БД (делать перед любым структурным решением)
npx wrangler d1 execute podvarchan --remote --command "SELECT COUNT(*) FROM <table>"

# SEO-регрессия
bash scripts/seo-regression.sh
```

Деплой — **только** через push в `master` (GitHub Actions auto-deploy на оба воркера). Локальный `wrangler deploy` — только для экстренной отладки, не как штатный путь.

---

## 9. Definition of Done для любой задачи агента

Задача не считается завершённой, пока не выполнено всё применимое из списка:

1. Код проходит `no any` / strict TypeScript без ошибок.
2. Если тронут `lib/db/public.ts` — чтение идёт через `getWithFallback()`, не напрямую.
3. Если тронута любая admin server action с мутацией — добавлен вызов `invalidateContent()`.
4. Если добавлена/изменена публичная страница — пройден чек-лист SEO (Раздел 5) и AI-готовности (Раздел 6).
5. `scripts/seo-regression.sh` зелёный.
6. Bundle budget не превышен ни у одного из двух воркеров (проверить `wrangler deploy --dry-run` при подозрении на рост бандла).
7. Изменения задокументированы одним markdown-файлом в `TEMP/`, если это агентская задача из плана (по текущему рабочему процессу проекта), с явной пометкой даты и "что изменилось от предыдущего отчёта" — избегать повторения ситуации, когда несколько отчётов одной датой противоречат друг другу по фактам БД.
