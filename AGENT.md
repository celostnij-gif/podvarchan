# AGENT.md: Core Guidelines and Workflow Protocol

Привет! Ты — ИИ-разработчик, интегрированный в проект **Podvarchan.com**.
Этот документ содержит фундаментальные правила работы с проектом, структуру коммуникации и протокол отслеживания прогресса. **Читай этот файл при каждом новом запуске или перезапуске сессии.**

## 1\. Контекст проекта

* **Стек:** Next.js 15.5.18 (App Router), TypeScript, Tailwind CSS.
* **Инфраструктура:** Cloudflare Workers (через OpenNext). Учитывай ограничения Edge-среды (флаг `nodejs\_compat`).
* **Локализация:** `next-intl` (ru, uk). Любые изменения в текстах должны дублироваться в соответствующих JSON-файлах.
* **Рендеринг:** В основном SSG, частично SSR (API, OpenGraph).

## 2\. Файли проекту (оновлено 2026-07-06)

### Основні файли в корені:
- `MIGRATION_PLAN.md` — **ОСНОВНИЙ ПЛАН**. Перехід адмін-панелі на версію з Podvarchan.com.
- `AGENT.md` — цей файл. Правила та протоколи.
- `DEPLOY_CHECKLIST.md` — чекліст перед деплоєм.
- `ADMIN_GUIDE.md` — посібник адмін-панелі.

### Основні файли в TEMP/:
- `TEMP/TECH_REPORT_2026-06-27.md` — технічний звіт по сайту.
- `TEMP/migration-progress.md` — **ТРЕКЕР**. Пофазовий список задач з чекбоксами. Оновлювати після кожної задачі.

### Інші файли:
- `DEPLOY_CHECKLIST.md` — чекліст перед деплоєм.
- `ADMIN_GUIDE.md` — посібник адмін-панелі.

## 3\. Протокол роботи і відновлення (Recovery Protocol)

При втраті контексту, збої середовища або запуску нової сесії:

1. **Перевірити статус Git:** `git status` і `git diff`, щоб зрозуміти на чому зупинились.
2. **Прочитати `MIGRATION_PLAN.md`:** Визначити поточну фазу міграції адмін-панелі.
3. **Перевірити `src/app/admin/`:** Які сторінки вже переписані, які ще ні.
4. **Прочитати `AGENT.md`:** Оновити контекст правил проекту.


* **Міграція, а не нова розробка:** Всі зміни — копіювання та адаптація файлів з `C:/buff/Podvarchan.com/`. Не писати з нуля.
* **Атомарність фазами:** Виконуй одну фазу з `MIGRATION_PLAN.md` за раз. Не змішувати фази.
* **Build після кожної фази:** `npm run build` — 0 помилок перед коммітом.
* **Комміт після фази:** `git commit -m "feat(admin): Migration Phase X — назва"`
* **Джерело truth:** `MIGRATION_PLAN.md` в корені проекту. Старі файли планів видалено.
* **Безпека Cloudflare:** Не використовуй Node.js API несумісні з Workers.

## 5\. Порядок виконання міграції

1. При старті сесії — прочитай `MIGRATION_PLAN.md` (поточна фаза) та `AGENT.md` (правила).
2. Вибери першу невиконану задачу з поточної фази.
3. Проаналізуй файли-джерела в `C:/buff/Podvarchan.com/` та поточні файли в бекапі.
4. Виконай копіювання/адаптацію.
5. Протестуй: `npm run build` — 0 помилок.
6. Якщо фаза завершена — `git add`, `git commit -m "feat(admin): Migration Phase X — назва"`, `git push`.
7. Перейди до наступної фази.

## 6\. Інфраструктура та конфігурація

### 6.1. GitHub Actions
**GitHub Actions** — основний пайплайн. Тригер: push в `master`.
Workflow: `.github/workflows/deploy.yml`.

### 6.2. Secrets в GitHub

| Secret | Призначення |
|---|---|
| CLOUDFLARE_API_TOKEN | Токен для wrangler deploy |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare Account ID |
| CLOUDFLARE_DATABASE_ID | Database ID для D1 bindings |
| AUTH_SECRET | Secret для NextAuth |
| NEXT_PUBLIC_SITE_URL | https://podvarchan.com |
| NEXT_PUBLIC_GA_ID | G-42W6951F8L |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | 0x4AAAAAADYZ2z3RysEsBoQu |
| CONTACT_EMAIL | podvarchan@gmail.com |
| RESEND_API_KEY | Для Email Sending |
| ADMIN_SEED_EMAIL | Email для seed-адміна |
| ADMIN_SEED_PASSWORD | Пароль для seed-адміна |
| DEPLOY | Флаг для GitHub Actions |

| Secret (необов'язкові) | Призначення |
|---|---|
| AUTH_GOOGLE_ID | Google OAuth Client ID |
| AUTH_GOOGLE_SECRET | Google OAuth Client Secret |
| TURNSTILE_SECRET_KEY | Secret для Turnstile перевірки |
| REVALIDATE_SECRET | Secret для revalidation API |

### 6.3. Wrangler config
- `wrangler.jsonc` — основний конфіг.
- `compatibility_date: "2026-06-27"`.
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`.
- Біндінги: `DB` (D1), `RATE_LIMIT_KV` (KV), `WORKER_SELF_REFERENCE`, `ASSETS`.
- R2: `NEXT_INC_CACHE_R2_BUCKET`, `MEDIA_R2_BUCKET`.

### 6.4. ЗАПРЕТ: локальний wrangler deploy
**НІКОЛИ не використовуй `npx wrangler deploy` локально.** Деплой виключно через GitHub Actions: push в `master`.
Виняток — тільки коли GitHub Actions недоступний і це погоджено з користувачем.

### 6.5. РЕШЕНИЕ: помилка `@swc/helpers` при `npm ci`

**Симптом:** GitHub Actions падає на `npm ci` з `Missing: @swc/helpers@0.5.23 from lock file`.
**Причина:** npm 11 (локально) резолвить `@swc/helpers@0.5.15` в `package-lock.json`, але npm 10.9.2 (CI) потребує `0.5.23` через те, що `next` та інші пакети очікують новішу версію.
**Фікс TRY 1 (не спрацював):** Ручне редагування `package-lock.json` (bump 0.5.15→0.5.23) — npm install знову писав 0.5.15.
**Фікс TRY 2 (спрацював):**
1. `npm install @swc/helpers@0.5.23` — додати як явну залежність в `package.json` з `^0.5.23`.
2. Видалити `node_modules` та `package-lock.json`.
3. `npm install` — повна перегенерація lock-файлу.
4. Коміт: `7dd96e0` ("fix: regenerate package-lock.json, add @swc/helpers@0.5.23 explicit dep").

**ЗОЛОТЕ ПРАВИЛО:** Якщо `npm ci` падає з помилкою "Missing: ... from lock file" — НЕ редагуй lock-файл вручну. Додай проблемний пакет як явну залежність в `package.json` і регенеруй `package-lock.json` через `npm install`.

| Модель | ID | Контекст | Особенность |
|---|---|---|---|
| **Qwen3 30B A3B FP8** | `@cf/qwen/qwen3-30b-a3b-fp8` | 32K токенов | Самая мощная, reasoning. Для сложной редактуры, YMYL-рецензирования, кода, архитектурных решений. |
| **GLM 4.7 Flash** | `@cf/zai-org/glm-4.7-flash` | 131K токенов | Быстрая, большой контекст. Для пакетной обработки, локализации, аудита переводов, ревью множества файлов за раз. |
| **Llama 3.2 3B** | `@cf/meta/llama-3.2-3b-instruct` | 80K токенов | Лёгкие задачи: проверка орфографии, быстрые ответы, простые рерайты. |
| **Llama 3.2 11B Vision** | `@cf/meta/llama-3.2-11b-vision-instruct` | 128K токенов | Мультимодальная. Для генерации alt-текстов, анализа скриншотов/UI. |
| **Mistral 7B** | `@cf/mistral/mistral-7b-instruct-v0.2-lora` | 15K токенов | Базовая. Для однофайловых ревью, простых рефакторингов. |
| **Granite 4.0 H/Micro** | `@cf/ibm-granite/granite-4.0-h-micro` | 131K токенов | Большой контекст. Для анализа больших файлов, кодовых баз. |
| **Llama 3.2 1B** | `@cf/meta/llama-3.2-1b-instruct` | 60K токенов | Для быстрых классификаций и простых проверок. |
| **Gemma 2B/7B** | `@cf/google/gemma-2b-it-lora` / `@cf/google/gemma-7b-it-lora` | 8K/3.5K | Компактные. Для простых переформулировок. |

### 7.2. Назначение ролей в плане

Каждый план (в TEMP/) ДОЛЖЕН включать таблицу назначений:

```md
| Роль | Модель | Обоснование |
|---|---|---|
| **Executor** | `cloudflare/@cf/qwen/qwen3-30b-a3b-fp8` | Сложная задача (код/YMYL/reasoning) |
| **Reviewer** | `cloudflare/@cf/zai-org/glm-4.7-flash` | Быстрое ревью всех файлов за раз |
```

### 7.3. Процесс Executor → Reviewer

1. **Executor** (я или task-агент) выполняет задачу.
2. **Reviewer** (Cloudflare-модель через curl/node_repl) проверяет дифф:
   - GET Diff изменений.
   - Отправить в Cloudflare AI с промптом на проверку качества/безопасности/YMYL.
   - Получить вердикт: `PASS` / `NEEDS FIX` / `FAIL`.
3. Если `PASS` → commit + push.
4. Если `NEEDS FIX` → исправить замечания → повторное ревью.

### 7.4. Модель по умолчанию

Если задача не указана в плане — использовать `cloudflare/@cf/qwen/qwen3-30b-a3b-fp8` как executor и `cloudflare/@cf/zai-org/glm-4.7-flash` как reviewer.

### 7.5. API эндпоинт

```
POST https://api.cloudflare.com/client/v4/accounts/d2d025682352e4f90336d295deef3fce/ai/v1/chat/completions
Authorization: Bearer CLOUDFLARE_API_TOKEN (из .env)
Body: { model: "@cf/...", messages: [...], max_tokens: N }
```

Модели указывать явно (full ID). Эндпоинт `/v1/models` не поддерживается (405).

## 8. Sitemap и robots.txt (2026-06-26)

### 8.1. Генерация robots.txt

`robots.txt` генерируется **динамически** через Next.js Metadata Route API: `src/app/robots.ts`.
Статический файл `public/robots.txt` **не нужен** — он перекроет динамическую генерацию.

Строка 31 в `robots.ts`:
```ts
sitemap: `${SITE.url}/sitemap.xml`,
```
Автоматически добавляет `Sitemap: https://podvarchan.com/sitemap.xml` в `/robots.txt`.

`middleware.ts` (строка 30) исключает `/robots.txt` из обработки — путь проходит к Next.js-роуту.

### 8.2. Карта сайта (sitemap.xml)

Sitemap генерируется Next.js (страницы из App Router). На 2026-06-26 содержит **132 URL** (66 уникальных страниц x 2 языка).

**Группы страниц:**
| Раздел | URL на язык |
|---|---|
| `/` — главная | 1 |
| `/uslugi/` — услуги (категория) | 1 |
| `/uslugi/*` — детальные услуги | 18 |
| `/blog/` — блог (список) | 1 |
| `/blog/kategoriya/*` — категории блога | 7 |
| `/blog/*` — статьи | 20 |
| `/ob-avtore/` — об авторе | 1 |
| `/metod/` — метод | 1 |
| `/tseny/` — цены | 1 |
| `/faq/` — FAQ | 1 |
| `/kontakty/` — контакты | 1 |
| `/politika-konfidentsialnosti/` — политика | 1 |
| `/disclaimer/` — дисклеймер | 1 |

### 8.3. Свежий слепок ссылок

Последний снепшот всех URL с live-версии сохранён в `%TEMP%\live-urls-podvarchan.txt` (132 URL, отсортированы, без дублей).


## 9. Migration Rules (оновлено 2026-07-06)

### 9.1. ZERO DEGRADATION
**Публічний сайт завжди залишається робочим.** Жоден коміт не ламає build або рендеринг.
1. `npm run build` — 0 помилок перед кожним комітом
2. Якщо змінювалися публічні сторінки — curl перевірка 5 ключових URL
3. Якщо змінювалася middleware — перевірити /admin/login та /admin редиректи

### 9.2. Migration Workflow
1. Одна фаза з `MIGRATION_PLAN.md` за раз
2. Build після кожної фази
3. Коміт: `feat(admin): Migration Phase X — назва`
4. Push → GitHub Actions деплой
5. Smoke test після деплою

### 9.3. Source of truth
**Джерело:** `C:/buff/Podvarchan.com/` — копіюємо звідти.
**Приймач:** поточний проект — адаптуємо під його структуру.
**План:** `MIGRATION_PLAN.md` в корені проекту.

### 9.4. ASK BEFORE NEXT PHASE
Перед початком нової фази — запитати користувача.
Формат: "Migration Phase X завершена. Дозволяєте перейти до Phase X+1 — [назва]?"

### 9.5. Schema changes
Будь-які зміни в D1 схемах виконувати через Drizzle migrations.
Не редагувати production D1 напряму.
