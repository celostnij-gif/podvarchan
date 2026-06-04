# AGENT.md — Руководство для AI-агента по проекту Podvarchan.com

> **Этот файл читается агентом при каждом новом запуске.**  
> Содержит всё необходимое для понимания проекта, текущего прогресса и правил работы.

---

## 1. ЧТО ЭТО ЗА ПРОЕКТ

**podvarchan.com** — сайт онлайн-гипнотерапевтических услуг на русском и украинском языках для русскоязычной диаспоры по всему миру.

**Стек:**
- Next.js 15 App Router
- TypeScript (strict mode, `"strict": true` в tsconfig)
- Tailwind CSS 4
- Drizzle ORM
- Cloudflare D1 (SQLite) — база данных
- Cloudflare R2 — хранилище медиафайлов
- Cloudflare Pages — хостинг
- Cloudflare Workers — cron-задачи
- Auth.js v5 (next-auth@beta)
- TipTap — редактор контента
- Zod — валидация
- react-hook-form — формы
- lucide-react — иконки
- bcryptjs — хэширование паролей

**Локали:** `ru` (основная), `uk` (украинская)  
**Домен:** podvarchan.com  
**Ветка разработки:** `feature/admin-panel`

---

## 2. ПЕРВОЕ ДЕЙСТВИЕ ПРИ КАЖДОМ НОВОМ ЗАПУСКЕ

**Прежде чем что-либо делать, выполни следующее:**

```
1. Прочитай TEMP/PROGRESS.md — узнай, что уже сделано
2. Прочитай этот файл (AGENT.md) полностью
3. Если TEMP/PROGRESS.md не существует — начни с шага 1.1 из TEMP/IMPLEMENTATION_GUIDE.md
4. Определи следующий незавершённый шаг
5. Сообщи пользователю:
   "Прогресс прочитан. Последний выполненный шаг: X.X.
   Следующий шаг: Y.Y — [название]"
6. Только после подтверждения пользователя — приступай к работе
```

---

## 3. ФАЙЛЫ ПРОГРЕССА И ДОКУМЕНТАЦИИ

| Файл | Назначение |
|------|-----------|
| `TEMP/PROGRESS.md` | Главный трекер прогресса. Отмечай шаги как выполненные после завершения |
| `TEMP/IMPLEMENTATION_GUIDE.md` | Все промты для реализации по этапам |
| `TEMP/MIGRATION_MAP.md` | Карта миграции данных из JSON/констант в БД |
| `TEMP/content-backup/` | Резервные копии контента до миграции |
| `TEMP/DEPLOY_CHECKLIST.md` | Чеклист перед production деплоем |
| `AGENT.md` | Этот файл — правила и контекст для агента |
| `ADMIN_GUIDE.md` | Документация для владельца сайта (создаётся в шаге 18.1) |

**Папка `TEMP/` НЕ добавляется в .gitignore** — она должна быть в репозитории, так как содержит документацию и трекер прогресса.  
**Исключение:** `TEMP/content-backup/` можно добавить в .gitignore если там есть чувствительные данные.

---

## 4. ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА КОДА

### TypeScript
- `"strict": true` в tsconfig — обязательно
- Тип `any` **запрещён везде** без исключений
- Используй `unknown` вместо `any` там, где тип неизвестен
- Все функции должны иметь явные типы возвращаемых значений
- Все props компонентов должны иметь явные интерфейсы

### Структура файлов
- Server Components — без `'use client'` (по умолчанию)
- Client Components — с явным `'use client'` в первой строке
- Server Actions — с явным `'use server'` (в файле или функции)
- Не смешивай server и client логику в одном файле

### Запросы к БД
- Drizzle-запросы **только** в: Server Components, Route Handlers, Server Actions
- Компоненты получают данные через **typed props**, не запрашивают БД напрямую
- Все запросы из публичного сайта — через функции в `src/lib/content/`
- Все запросы из админки — через Server Actions в `src/app/admin/actions/`

### Валидация
- Все входные данные Server Actions валидируются через **zod-схемы**
- Одинаковые zod-схемы используются и на клиенте (react-hook-form), и на сервере
- Схемы хранятся в `src/lib/validators/`

### Безопасность
- Каждый Server Action проверяет сессию через `requireAdminSession()`
- Каждый Server Action проверяет роль через `canXxx(role)` из `permissions.ts`
- После каждого изменения данных вызывается `writeAuditLog()`
- Пароли хранятся только в виде bcrypt-хэша (12 rounds)

---

## 5. СТРУКТУРА ДИРЕКТОРИЙ

```
src/
├── app/
│   ├── [locale]/           # Публичный сайт (ru/uk)
│   │   ├── page.tsx        # Главная
│   │   ├── uslugi/         # Услуги
│   │   └── blog/           # Блог
│   ├── admin/              # Вся админка
│   │   ├── layout.tsx      # Layout с проверкой сессии
│   │   ├── page.tsx        # Дашборд
│   │   ├── login/          # Страница входа
│   │   ├── services/       # Управление услугами
│   │   ├── blog/           # Управление блогом
│   │   ├── media/          # Медиа-библиотека
│   │   ├── leads/          # Заявки CRM
│   │   ├── seo/            # SEO-менеджер
│   │   ├── faq/            # FAQ
│   │   ├── testimonials/   # Отзывы
│   │   ├── navigation/     # Навигация
│   │   ├── settings/       # Настройки сайта
│   │   ├── users/          # Пользователи
│   │   ├── audit/          # Журнал действий
│   │   ├── home/           # Редактор главной
│   │   ├── pages/          # Статические страницы
│   │   ├── categories/     # Категории блога
│   │   ├── redirects/      # Редиректы
│   │   └── actions/        # Server Actions
│   │       ├── services.ts
│   │       ├── blog.ts
│   │       ├── media.ts
│   │       ├── leads.ts
│   │       ├── settings.ts
│   │       ├── faq.ts
│   │       ├── testimonials.ts
│   │       └── pages.ts
│   ├── api/
│   │   ├── admin/media/upload/  # Upload endpoint
│   │   └── admin/preview/       # Preview endpoint
│   └── sitemap.ts
├── components/
│   ├── admin/              # UI компоненты админки
│   │   ├── AdminShell.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ui/             # StatusBadge, Toast и др.
│   │   ├── services/       # ServiceEditor
│   │   ├── blog/           # BlogPostEditor, TipTapEditor
│   │   ├── media/          # MediaPicker
│   │   ├── seo/            # SeoMetaEditor
│   │   └── audit/          # JsonDiff
│   └── sections/           # Секции публичного сайта (НЕ трогать без необходимости)
├── db/
│   ├── schema.ts           # Drizzle схема
│   ├── index.ts            # Инициализация Drizzle
│   └── seed.ts             # Seed-скрипт
├── lib/
│   ├── actions/            # result.ts, guard.ts
│   ├── auth/               # permissions.ts, session.ts
│   ├── audit/              # log.ts
│   ├── content/            # Слой чтения данных для публичного сайта
│   ├── admin/              # dashboard.ts и др.
│   ├── seo/                # score.ts, validate.ts
│   ├── revisions/          # create.ts, restore.ts
│   ├── storage/            # r2.ts
│   └── validators/         # zod-схемы
├── types/
│   └── auth.ts             # UserRole, SessionWithRole
├── auth.ts                 # Auth.js конфиг
├── auth.config.ts
└── env.ts                  # zod-валидация ENV
TEMP/
├── PROGRESS.md             # ГЛАВНЫЙ ТРЕКЕР
├── IMPLEMENTATION_GUIDE.md # Все промты
├── MIGRATION_MAP.md        # Карта миграции
├── content-backup/         # Бэкап контента
└── DEPLOY_CHECKLIST.md     # Деплой чеклист
drizzle/
└── migrations/             # Drizzle миграции
scripts/
└── seo-regression.ts       # SEO audit скрипт
e2e/
└── admin.spec.ts           # Playwright тесты
```

---

## 6. МОДЕЛИ ДАННЫХ (КРАТКИЙ СПРАВОЧНИК)

### Статусы контента
```
DRAFT       → черновик, не виден публично
REVIEW      → на проверке (только EDITOR)
SCHEDULED   → запланирован (публикуется по cron)
PUBLISHED   → опубликован, виден публично
ARCHIVED    → архив, не виден публично
```

### Роли пользователей
```
OWNER  → полный доступ, управление пользователями, настройки
ADMIN  → управление контентом, публикация, заявки, медиа
EDITOR → создание/редактирование черновиков, публикация через REVIEW
VIEWER → только просмотр
```

### Статусы заявок
```
NEW         → новая, не обработана
IN_PROGRESS → в работе
CONTACTED   → связались с клиентом
BOOKED      → записан на сессию
CLOSED      → завершена
SPAM        → спам
```

### Локали
```
ru → русский (основная)
uk → украинский
```

---

## 7. ПОРЯДОК ВЫПОЛНЕНИЯ ШАГОВ

### Приоритет P0 (обязательно для деплоя)
1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1

### Приоритет P1 (динамический контент)
6.1 → 6.2 → 7.1 → 7.2 → 8.1 → 9.1 → 10.1 → 11.1

### Приоритет P2 (расширенные настройки)
12.1 → 14.1 → 15.1

### Приоритет P3 (удобство работы)
13.1 → 16.1

### Приоритет P4 (качество и тесты)
17.1

### Финальный шаг (всегда последний)
18.1 — production деплой

**Правило:** Не начинай P1 пока не завершены все P0.  
**Правило:** Не начинай P2 пока не завершены все P1.

---

## 8. ПРАВИЛА ОБНОВЛЕНИЯ ПРОГРЕССА

После **каждого завершённого шага** обязательно:

1. Открой `TEMP/PROGRESS.md`
2. Найди соответствующий пункт
3. Измени `- [ ]` на `- [x]`
4. Добавь дату и краткое примечание:
   ```
   - [x] 1.1 Ветка и структура — выполнено 2026-06-04
   - [x] 1.2 Зависимости — выполнено 2026-06-04, добавлен @aws-sdk для R2
   ```
5. Если возникли отклонения от плана — запиши их:
   ```
   - [x] 2.1 Drizzle схема — выполнено 2026-06-05
     ПРИМЕЧАНИЕ: использован Neon (Postgres) вместо D1 из-за ограничений
   ```

---

## 9. ПОВЕДЕНИЕ ПРИ СБОЯХ И ВОЗОБНОВЛЕНИИ РАБОТЫ

### Если агент запускается заново после сбоя:

1. Прочитай `TEMP/PROGRESS.md` — определи последний завершённый шаг
2. Прочитай файлы последнего шага — убедись, что они созданы корректно
3. Проверь компиляцию: `npx tsc --noEmit`
4. Определи состояние: либо шаг завершён и можно двигаться дальше, либо нужно доделать
5. **Никогда не начинай шаг заново** если он помечен как выполненный — только проверяй

### Если шаг был начат но не завершён:

1. Изучи что уже создано (какие файлы существуют)
2. Определи что осталось сделать из промта в TEMP/IMPLEMENTATION_GUIDE.md
3. Продолжи с того места где остановился
4. После завершения — отметь шаг в PROGRESS.md

### Если обнаружена ошибка в уже выполненном шаге:

1. Зафиксируй проблему в PROGRESS.md как примечание к шагу
2. Исправь только ошибку, не переделывай весь шаг
3. Не изменяй публичные интерфейсы и типы без необходимости

---

## 10. ПРАВИЛА РАБОТЫ С ПУБЛИЧНЫМ САЙТОМ

> **Главное правило: публичный сайт не должен деградировать.**

При работе над любым шагом, затрагивающим публичный сайт:

- **Сначала проверь** что текущий сайт работает: `npm run build`
- **Не удаляй** существующие компоненты — только добавляй новый слой данных
- **Используй fallback** к статичным данным пока БД не заполнена:
  ```typescript
  const services = await getServicesFromDB(locale) 
    ?? SERVICES_FALLBACK // константы из src/constants
  ```
- **После изменения** — снова проверь: `npm run build`
- **SEO не должно деградировать:** canonical, hreflang, JSON-LD должны остаться теми же

---

## 11. КЛЮЧЕВЫЕ ЗАВИСИМОСТИ МЕЖДУ ШАГАМИ

```
src/db/schema.ts (2.1)
    ↓ необходим для
src/auth.ts (3.1), src/db/seed.ts (2.2), все actions/*

src/lib/actions/guard.ts (5.1)
    ↓ необходим для
ВСЕХ server actions (6.1, 7.1, 8.1, 9.1, 10.1, 12.1, 13.1, 14.1)

src/lib/content/* (5.1)
    ↓ необходим для
src/app/[locale]/* (11.1)

src/components/admin/media/MediaPicker.tsx (8.1)
    ↓ необходим для
ServiceEditor (6.2), BlogPostEditor (7.2), SeoMetaEditor (10.1)

src/lib/seo/score.ts и validate.ts (10.1)
    ↓ необходим для
публикация услуг (6.1), публикация статей (7.1)
```

---

## 12. ЧАСТЫЕ ОШИБКИ — ИЗБЕГАЙ

### Запрещённый any
```typescript
// ЗАПРЕЩЕНО
const data: any = await db.query(...)

// ПРАВИЛЬНО
const data: ServiceWithTranslations = await db.query(...)
```

### Server Action без проверки сессии
```typescript
// ЗАПРЕЩЕНО
export async function updateService(id: string, data: unknown) {
  await db.update(services).set(data as Record<string, unknown>)
}

// ПРАВИЛЬНО
export async function updateService(id: string, data: unknown): Promise<ActionResult<void>> {
  return withAdminAction(null, 'EDITOR', async (session) => {
    const validated = updateServiceSchema.parse(data)
    await db.update(services).set(validated).where(eq(services.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', ... })
    revalidatePath(`/ru/uslugi/${validated.slugRu}`)
    return ok(undefined)
  })
}
```

### Drizzle запрос напрямую из компонента
```typescript
// ЗАПРЕЩЕНО
async function ServiceCard() {
  const service = await db.select().from(services).where(...)
  return <div>{service.title}</div>
}

// ПРАВИЛЬНО — данные через props от page.tsx
async function ServiceCard({ service }: { service: ServiceData }) {
  return <div>{service.title}</div>
}
```

### Публикация без SEO-валидации
```typescript
// ЗАПРЕЩЕНО
await db.update(services).set({ status: 'PUBLISHED' })...

// ПРАВИЛЬНО
const validation = await validateBeforePublish('SERVICE', id, 'ru')
if (!validation.canPublish) return fail(validation.errors.join(', '))
await db.update(services).set({ status: 'PUBLISHED', publishedAt: new Date() })...
```

---

## 13. КОМАНДЫ ДЛЯ ПРОВЕРКИ

```bash
# Проверка ESLint (запускай после каждого шага, перед TypeScript)
npm run lint

# Проверка TypeScript (запускай после каждого шага)
npx tsc --noEmit

# Полная проверка перед коммитом: lint + typecheck
npm run lint && npx tsc --noEmit

# Проверка сборки (запускай перед окончанием этапа)
npm run build

# Локальный запуск
npm run dev

# Генерация миграции (после изменений схемы)
npm run db:generate

# Применение миграций локально
npm run db:migrate:local

# Seed данных
npm run db:seed

# SEO regression тест (после шага 17.1)
npm run test:seo

# Unit тесты
npm run test
```

### Правило перевірки перед коммітом

> **Важливо:** pre-commit hook з `lint-staged` уже налаштовано — він автоматично
> запускає `eslint --fix` та `eslint --max-warnings 0` на всіх staged `.ts/.tsx/.js` файлах.
> Якщо ESLint знайде помилки або warnings — комміт буде заблоковано.

1. **Спочатку** `npm run lint` — виправити всі помилки та попередження (якщо потрібно перевірити весь проєкт)
2. **Потім** `npx tsc --noEmit` — переконатися що TypeScript компілюється
3. **Фінально** — `git commit` — pre-commit hook автоматично перевірить staged файли

### Як обійти pre-commit hook (аварійно)
```bash
git commit --no-verify -m "повідомлення"
```

---

## 14. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

Все переменные описаны и валидируются в `src/env.ts`.

Обязательные:
```
DATABASE_URL            — строка подключения к D1 или Postgres
AUTH_SECRET             — минимум 32 символа (openssl rand -base64 32)
ADMIN_SEED_EMAIL        — email первого OWNER
ADMIN_SEED_PASSWORD     — пароль минимум 8 символов
CLOUDFLARE_ACCOUNT_ID   — ID аккаунта Cloudflare
CLOUDFLARE_DATABASE_ID  — ID базы D1
```

Опциональные (медиа через R2):
```
S3_ENDPOINT             — endpoint Cloudflare R2
S3_REGION               — обычно 'auto'
S3_BUCKET               — название bucket
S3_ACCESS_KEY_ID        — ключ доступа R2
S3_SECRET_ACCESS_KEY    — секретный ключ R2
NEXT_PUBLIC_MEDIA_BASE_URL — публичный URL для медиафайлов
```

---

## 15. SEO-ПРАВИЛА (КРИТИЧНО ДЛЯ ПРОЕКТА)

Нарушать нельзя:

1. Canonical всегда абсолютный, содержит `/ru/` или `/uk/`
2. hreflang всегда триплет: `ru`, `uk`, `x-default`
3. Нельзя публиковать с пустым title, description или slug
4. Нельзя публиковать с текстом "PLACEHOLDER", "common.siteTitle", "undefined", "null"
5. H1 ровно один на каждой публичной странице
6. Sitemap строится только из PUBLISHED контента
7. `/admin/*` закрыт через robots.txt и meta noindex
8. При смене slug у PUBLISHED страницы — автоматически создаётся 301 redirect
9. og:image должен быть у каждой опубликованной страницы
10. YMYL-слова (вылечим, гарантируем, навсегда избавим) — предупреждение при публикации

---

## 16. АРХИТЕКТУРНЫЕ РЕШЕНИЯ И ПРИЧИНЫ

| Решение | Причина |
|---------|---------|
| Drizzle вместо Prisma | Нативная поддержка Cloudflare D1/Workers |
| D1 (SQLite) вместо Postgres | Edge-compatible, нет отдельного managed сервиса |
| Auth.js v5 | Нативная поддержка App Router и Edge Runtime |
| TipTap вместо других редакторов | Лучшая TypeScript-поддержка, JSONContent для БД |
| `src/lib/content/` отдельно от actions | Чтение кэшируется, запись — только авторизовано |
| bcryptjs вместо argon2 | Лучшая совместимость с Edge Runtime |

---

## 17. РАБОТА С ЛОКАЛИЗАЦИЕЙ

Все контентные модели: основная запись + переводы.

```
Service (slugBase, icon, status)
  + ServiceTranslation (locale='ru', slug, title, description)
  + ServiceTranslation (locale='uk', slug, title, description)
```

Правила:
- slug разный для каждой локали
- весь текстовый контент — отдельный для каждой локали
- статус публикации — единый для сущности
- нельзя опубликовать если активная локаль пустая

---

*Последнее обновление AGENT.md: 2026-06*  
*При изменении архитектуры — обновляй этот файл*
