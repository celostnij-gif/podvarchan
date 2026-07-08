# AGENT.md: Core Guidelines and Workflow Protocol

Привет! Ты — ИИ-разработчик, интегрированный в проект **Podvarchan.com**.
Этот документ содержит фундаментальные правила работы с проектом, структуру коммуникации. **Читай этот файл при каждом новом запуске или перезапуске сессии.**

# AGENT.md — podvarchan.com

> Постоянный контекст для ИИ-агента (Cursor / Claude Code / Codex).
> Читается **перед каждой задачей**. Это не промт под одну задачу, а правила
> проекта: архитектура, команды, конвенции, инварианты и запреты.
> Если инструкция задачи противоречит этому файлу — **сначала спроси**, не ломай инварианты.

**Дата актуализации:** 2026-07-08 · **Ветка активной разработки:** `feat/split-admin-worker` (доводка админки)

---

## 1. Что это за проект

`podvarchan.com` — двуязычный (RU/UK) сайт психолога-консультанта + CMS-админка.
Ниша **YMYL** (здоровье/психология) → к SEO, canonical и правилам публикации относимся строго.

**Монорепо, два Cloudflare Worker'а на общих данных:**

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  podvarchan (публичный)     │        │  podvarchan-admin (админка)  │
│  podvarchan.com             │        │  admin.podvarchan.com        │
│  src/                       │        │  apps/admin/src/             │
│  ЧИТАЕТ D1/R2 (read-only)   │        │  ЧИТАЕТ+ПИШЕТ D1/R2/KV       │
└──────────────┬──────────────┘        └───────────────┬──────────────┘
               │        общие ресурсы (одни ID)         │
               └───────────────┬───────────────────────┘
                    D1 `podvarchan` · R2 `podvarchan-media` + `podvarchan-inc-cache` · KV `RATE_LIMIT_KV`
```

- Данные **не дублируются**. Оба воркера привязаны к одним и тем же D1/R2/KV по общим ID.
- Публичный воркер только **читает** контент. Все мутации — только через админ-воркер.
- Админка — **отдельный воркер** (сделано, чтобы публичный бандл влез в лимит Free ~3 MiB gzip).
  Из-за этого админка **не может** напрямую вызвать `revalidatePath` публичного воркера —
  инвалидация кэша идёт кросс-воркерно (см. §7).

---

## 2. Стек (точные версии — не «обновлять заодно»)

| Слой | Технология |
|---|---|
| Framework | **Next.js 15.5.20**, App Router, Server Actions |
| Язык | **TypeScript strict** — тип `any` **запрещён** |
| Стили | Tailwind CSS 3 |
| БД / ORM | Cloudflare **D1** + **Drizzle ORM** |
| Хранилище | Cloudflare **R2** (media + inc-cache) |
| KV | `RATE_LIMIT_KV` |
| Рантайм | Cloudflare Workers через **OpenNext 1.20.1** (`@opennextjs/cloudflare`) |
| Auth | **NextAuth v5** (Credentials + bcrypt + JWT) |
| Редактор | **TipTap** |
| Валидация | zod |
| План Cloudflare | **Free** — 10 ms CPU/запрос (см. §8 про изображения) |

---

## 3. Раскладка репозитория

```
src/                         # публичный воркер `podvarchan`
  app/[locale]/**            #   RU/UK страницы (locale = ru | uk)
  app/api/revalidate/route.ts#   приём кросс-воркерной ревалидации (секрет + tag/path)
  lib/db/public.ts           #   чтение из D1 (published), fallback на messages/*.json
  components/ui/**
  middleware.ts              #   locale-редиректы (308!), кэш-заголовки, soft-404
apps/admin/src/              # админ-воркер `podvarchan-admin`
  app/admin/**               #   34 маршрута: списки + формы (UI готов)
  app/api/admin/**           #   upload и пр. серверные роуты
  lib/actions/**             #   server actions (см. §6) — 'use server'
  lib/auth/session.ts        #   getAdminSession / requireAdminSession / requireRole
  lib/auth/permissions.ts    #   canPublish/canDelete/canEditContent/canManageUsers/…
  lib/audit/log.ts           #   writeAuditLog
packages/shared/             # общий код обоих воркеров
  schema.ts                  #   Drizzle-схема (ИСТОЧНИК ИСТИНЫ по таблицам/полям)
  (getDb / getDB)            #   фабрика Drizzle-инстанса
scripts/seo-regression.sh    # регресс-гейт (эталон 71/71)
messages/*.json              # статические тексты — legacy fallback, НЕ источник истины
wrangler.jsonc               # биндинги публичного воркера
apps/admin/wrangler.jsonc    # биндинги админ-воркера
TEMP/                        # рабочая директория агента (PROGRESS.md, карты, отчёты)
```

**Перед работой сверяйся с реальным репо, а не с этим файлом:** таблицы/поля — из
`packages/shared/schema.ts`, биндинги — из `wrangler.jsonc`. Если этот AGENT.md
разошёлся с кодом — код прав, поправь AGENT.md отдельным коммитом.

---

## 4. Команды

```bash
# Сборка (оба воркера должны собираться с 0 ошибок TS/ESLint)
npm run build                      # публичный (root)
cd apps/admin && npm run build     # админ-воркер

# Регресс-гейт SEO — ОБЯЗАТЕЛЕН после любого этапа. Эталон: 71/71 PASS
bash scripts/seo-regression.sh

# Тесты (если есть)
npm run test                       # vitest: permissions, seo score, slug

# Деплой / секреты (Wrangler)
npx wrangler deploy                                    # публичный
cd apps/admin && npx wrangler deploy                   # админ
cd apps/admin && npx wrangler secret put <NAME>        # секрет в воркер
```

**Секреты живут в двух местах**, держи синхронно: `wrangler secret` (рантайм) +
GitHub Actions (CI). Никогда не коммить значения — только `.env.example` с именами.

---

## 5. Модель прав (auth)

Auth **готов, не переписывай**. Используй как есть:

- `getAdminSession()` / `requireAdminSession()` / `requireRole(minRole)` — `lib/auth/session.ts`.
- Проверки прав — **только** через `permissions.ts` (`canPublish`, `canDelete`,
  `canEditContent`, `canManageUsers`, `canManageSettings`, `canViewAudit`).
  **Не хардкодь иерархию ролей заново** в actions.
- Роли (по возрастанию): `VIEWER < EDITOR < ADMIN < OWNER`.
- Каждый мутирующий server action проходит гард (§6) → сессия + запись в audit.
- Все `/admin/*` защищены middleware + Cloudflare Access. Страницы админки — `noindex,nofollow`.

Ориентир по правам: CRUD контента — `EDITOR+`; publish/unpublish — `canPublish` (OWNER/ADMIN);
delete — `canDelete` (OWNER); settings — `canManageSettings`; users — `canManageUsers`.

---

## 6. Конвенции server actions (обязательный паттерн)

Каждый файл в `apps/admin/src/lib/actions/` начинается с `'use server'`. Общий скелет мутации:

```ts
export const updateService = withRole('EDITOR', async (session, id, input) => {
  const parsed = ServiceSchema.safeParse(input);            // 1. zod-валидация
  if (!parsed.success) return fail('Ошибка валидации', parsed.error.flatten().fieldErrors);
  const db = getActionDb();
  const before = await db.select().from(services).where(eq(services.id, id)).get();
  await db.update(services).set({ /* ... */ }).where(eq(services.id, id)).run();
  await writeAuditLog({ userId: session.user.id, action: 'UPDATE',
    entityType: 'SERVICE', entityId: id, before, after: input });   // 2. audit
  await revalidatePublic({ tags: ['services'], paths: [`/ru/uslugi/${slug}`, `/uk/…`] }); // 3. §7
  return ok(undefined);
});
```

Правила:
- Возвращай **`ActionResult<T>`** (`ok(data)` / `fail(msg, fields?)`), не кидай голые исключения наружу.
- Гарды: `withAuth`, `withRole(minRole)`, `withCanPublish`, `withCanDelete`, … — внутри дергают auth + audit.
- **`writeAuditLog` — fire-and-forget:** оборачивай в try/catch, ошибку глотай, никогда не роняй action.
- **`revalidatePublic` — тоже fire-and-forget.** Ошибка ревалидации не должна валить сохранение.
- Импорты только через алиасы: `@/lib/actions/*`, `@/db`, `@/lib/auth/*`, `packages/shared`.
  Старый путь `@/app/admin/actions/*` — **битый**, его быть не должно:
  `grep -rn "app/admin/actions" apps/admin/src` → пусто.

**Правила публикации (YMYL — НЕ ослаблять):** перед `PUBLISH` — непустые title/slug/meta description
+ непустой UK-перевод; при смене slug у PUBLISHED — создать `redirect_rules` (**301**) со старого пути;
`testimonials` публиковать только при `consentConfirmed === true`.

---

## 7. Кросс-воркерная инвалидация кэша (критично)

Админ-воркер и публичный — **разные процессы**, `revalidatePath` напрямую не работает.

- Публичный `src/app/api/revalidate/route.ts` принимает `?secret=&type=tag&tag=…` или
  `type=path&path=/ru/blog/xxx` (поддержка нескольких tag/path за вызов).
- Админский `lib/actions/revalidate.ts::revalidatePublic({tags?, paths?})` дергает этот эндпоинт
  с `REVALIDATE_SECRET`, базовый URL из `PUBLIC_SITE_URL` (`https://podvarchan.com`).
  Если есть service binding на публичный воркер — предпочесть его HTTP-вызову.
- Теги по сущностям: blog→`blog`, услуги→`services`(+путь), faq→`faq`,
  navigation/settings→`settings`, testimonials→`testimonials`.

**Без этого правки в админке НЕ видны на клиенте** — публичный воркер продолжит отдавать
старый кэш/JSON. Любой мутирующий action обязан вызывать `revalidatePublic` с верными тегами.

---

## 8. Изображения (Free plan — важное ограничение)

10 ms CPU/запрос → **тяжёлый ресайз в воркере не делаем**.
Оптимизация — **в браузере** перед загрузкой: конвертация в **WebP** (`quality ~0.82`),
набор ширин **1600/1200/800/400** (без апскейла), SVG не растрируем.
Воркер только кладёт готовые файлы в R2 (`media/<YYYY>/<MM>/<uuid>-<width>.webp`,
`cacheControl: public, max-age=31536000, immutable`) и пишет `media_assets` в D1.
Публичный сайт отдаёт через `<img srcset>` (компонент `ResponsiveImage`), **без** рантайм Next Image.

Апгрейд-путь (когда перейдут на платный план, **не сейчас**): серверная оптимизация через
Cloudflare Images или Photon(WASM) в отдельном Images-воркере при том же контракте `media_assets`.

---

## 9. SEO-инварианты (нарушение = регресс, чинить немедленно)

Публичный сайт визуально и по SEO **не должен меняться** при доработках админки.

- Локаль-редиректы — **308 (permanent), не 307.** 307 ломает консолидацию дублей в GSC (была первопричина плохой индексации).
- Несуществующие URL → **HTTP 404** (soft-404 закрыт 8 июля через `notFound()`). Не «200 с редиректом на /ru/».
- На каждой странице: один `H1`, `title` без литерала `common.siteTitle`, meta description,
  **абсолютный** canonical, hreflang `ru`/`uk`/`x-default`, валидный JSON-LD, нет `PLACEHOLDER`.
- `sitemap.xml` — только published (RU+UK, hreflang на каждом URL, без `.html`, без query).
- `robots.txt` — всё разрешено, кроме `/api/` и `/_next/`.
- Публичные D1-запросы: **только `status = PUBLISHED`** (кроме превью по `__preview` cookie),
  `ORDER BY sortOrder` где применимо.

**Гейт:** после любого изменения — `bash scripts/seo-regression.sh` → **71/71 PASS**. Меньше — не мержить.

---

## 10. Что НЕ трогать (готово и задеплоено)

Не переделывай без явной необходимости под текущую задачу:
Drizzle-схема + миграции/seed · NextAuth v5 + middleware + permissions + session ·
layout (AdminShell/Sidebar/Topbar/CommandPalette/StatusBadge) · login (тёмная тема) ·
34 маршрута админки (UI списков и форм) · TipTap · вынос админки в отдельный воркер ·
кастомный домен `admin.podvarchan.com` + TLS + Cloudflare Access · CI (2 job'а) ·
sitemap/robots/hreflang · soft-404 fix. Касание этих зон — только точечно и без SEO-регресса.

---

## 11. Definition of Done (для любой задачи)

1. `npm run build` (root) и `cd apps/admin && npm run build` — **0 ошибок** TS/ESLint, `any` нет.
2. `bash scripts/seo-regression.sh` → **71/71 PASS**.
3. Публичные ключевые URL (ru+uk) 200: `/`, `/uslugi/`, `/uslugi/<slug>`, `/blog/`, `/blog/<slug>`,
   `/faq/`, `/kontakty/`, `/ob-avtore/`, `/metod/`, `/tseny/`, `sitemap.xml`, `robots.txt`;
   несуществующий URL = **404**; `noindex` сохранён где надо.
4. Мутации пишутся в `audit_logs` и вызывают `revalidatePublic` с верными тегами.
5. `TEMP/PROGRESS.md` обновлён; краткий отчёт в конце шага.
6. **Ничего не сломано** на публичном сайте.

---

## 12. Рабочий процесс агента

- Веди `TEMP/PROGRESS.md` (чеклист по этапам), `TEMP/STUBS_MAP.md`, `TEMP/PUBLIC_D1_MAP.md`,
  `TEMP/SECRETS_TODO.md`. Обновляй после каждого шага.
- Шаги выполняй по порядку из `implementation-guide-admin-CURRENT-STATE.md`
  (Этап 1 server actions — фундамент для остального).
- Не строй проект с нуля — база/auth/layout/UI уже есть, дорабатываешь заглушки.
- Малые атомарные коммиты в `feat/split-admin-worker`, осмысленные сообщения. Секреты не коммить.
- Сомневаешься, ломает ли изменение инвариант из §9 — **остановись и спроси**.

---

## 13. Как НЕ тупить: протокол диагностики

Правила, чтобы не гадать и не ходить по кругу. **Одно предположение — одна проверка.**

1. **Сначала читай, потом пиши.** Перед правкой файла — прочитай его целиком и 1–2 места,
   которые его импортируют. Не редактируй по названию функции «на память».
2. **Воспроизведи ошибку до фикса.** Нет способа воспроизвести (лог, curl, тест, `wrangler tail`) —
   значит ещё не понял баг. Не «чини» вслепую.
3. **Читай сообщение об ошибке целиком.** Первая строка стектрейса + файл:строка. TS-ошибка почти
   всегда точна — не «глуши» её через `any`, `// @ts-ignore`, `as unknown as` (это запрещено, §14).
4. **Локализуй, потом меняй.** Бинарный поиск: `git log -p <file>`, `git bisect` по регрессу,
   комментирование блоков. Не переписывай модуль целиком, если сломана одна строка.
5. **Меняй по одному.** Одно изменение → пересборка/тест → вывод. Пять правок разом = неизвестно, что помогло.
6. **Не изобретай API.** Не уверен в сигнатуре Drizzle / NextAuth v5 / OpenNext / Workers —
   открой `node_modules/<pkg>/dist/*.d.ts` или официальную доку. Не выдумывай метод, которого нет.
7. **Проверяй факт инструментом, а не памятью.** Поведение роута — `curl -sI`; содержимое таблицы —
   реальный запрос к схеме; путь импорта — `grep`. Утверждение без проверки = баг в отчёте.
8. **Застрял на >2 попытки по одной гипотезе — смени подход.** Выпиши в `TEMP/PROGRESS.md`:
   что пробовал, что вышло, следующая гипотеза. Если и это не сходится — **остановись и спроси**,
   не коммить полурабочий обход.
9. **`wrangler tail`** на нужном воркере — основной способ увидеть рантайм-ошибку на Cloudflare
   (стектрейсы там, а не в браузере). Логи D1 — через `wrangler d1`.

**Правило отчёта:** каждое «сделано / работает / не воспроизводится» — с доказательством
(вывод команды, код ответа, номер строки). Без пруфа — не пиши «готово».

---

## 14. Ловим ошибки и неточности: чек-лист самопроверки

Прогоняй перед тем, как сказать «готово». Многое ловится одним `grep`.

**Grep-анти-паттерны (должны давать ПУСТО):**

```bash
grep -rn ": any\b\| as any\b\|@ts-ignore\|@ts-nocheck\|as unknown as" apps/admin/src src   # типобезопасность
grep -rn "app/admin/actions" apps/admin/src                                                # битый старый путь импорта
grep -rn "console\.log" apps/admin/src src                                                 # забытые логи (оставлять только осознанно)
grep -rni "PLACEHOLDER\|TODO\|FIXME\|lorem" src app                                         # заглушки, утёкшие в прод
grep -rn "common\.siteTitle\|common\.\w\+\b" src/app                                        # непереведённый литерал ключа в разметке
grep -rn "http://\|localhost\|127\.0\.0\.1" src app                                         # хардкод хоста вместо PUBLIC_SITE_URL/env
grep -rn "revalidatePath\|revalidateTag" apps/admin/src                                     # НЕ работает кросс-воркерно → должно быть revalidatePublic
grep -rn "307" src middleware.ts                                                            # локаль-редирект обязан быть 308, не 307
```

**Логические неточности, которые агенты пропускают в этом проекте:**

- **Забыли `revalidatePublic`** в мутирующем action → правка сохранилась, но на сайте не видна. Проверь: каждая мутация → ревалидация с верным тегом (§7).
- **Забыли `writeAuditLog`** или он не в try/catch → падение аудита роняет сохранение. Аудит — fire-and-forget.
- **Мутация без гарда прав** (`withRole`/`canPublish`/`canDelete`) → дыра в доступе. Каждая мутация проходит §5.
- **Публичный запрос без `status = PUBLISHED`** → в прод утекают draft/archived. Проверь все чтения в `src`.
- **Смена slug у PUBLISHED без `redirect_rules` (301)** → битая ссылка + потеря SEO.
- **`await` потерян** у промиса (Drizzle `.run()/.get()/.all()`, `writeAuditLog`) → гонки, «иногда не сохраняется».
- **zod-схема не покрывает поле формы** → мусор в БД. Схема = форма = колонка D1, один в один.
- **Nullable-поле D1 читается как `string`** → рантайм-`undefined`. Сверяйся с типами из `schema.ts`, а не с ожиданием.
- **UK-локаль забыта** — правка только для `ru`. Обе локали или явное «uk наследует ru».
- **Тяжёлая работа в воркере** (ресайз, синхронный цикл по всем записям) → упор в 10 ms CPU (§8), 500 в проде под нагрузкой.
- **Изменение затрагивает `middleware.ts`/canonical/sitemap** → почти наверняка SEO-регресс. Прогони гейт (§9) и не считай, что «мелочь».

**Порядок сдачи:** grep-таблица чисто → `npm run build` ×2 (0 ошибок) → `seo-regression.sh` 71/71 →
ключевые URL из §11 руками (curl) → только потом «готово» с пруфами.


