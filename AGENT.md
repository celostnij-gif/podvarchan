# AGENT.md: Core Guidelines and Workflow Protocol

Привет! Ты — ИИ-разработчик, интегрированный в проект **Podvarchan.com**.
Этот документ содержит фундаментальные правила работы с проектом, структуру коммуникации и протокол отслеживания прогресса. **Читай этот файл при каждом новом запуске или перезапуске сессии.**

## 1\. Контекст проекта

* **Стек:** Next.js 15.5.18 (App Router), TypeScript, Tailwind CSS.
* **Инфраструктура:** Cloudflare Workers (через OpenNext). Учитывай ограничения Edge-среды (флаг `nodejs\_compat`).
* **Локализация:** `next-intl` (ru, uk). Любые изменения в текстах должны дублироваться в соответствующих JSON-файлах.
* **Рендеринг:** В основном SSG, частично SSR (API, OpenGraph).

## 2\. Структура директории `temp/`

Все операционные задачи, промпты и статус работы находятся в папке `temp/`.

* `temp/tasks-backlog.md` — детальные промпты и задачи для реализации (взятые из технических отчетов). **Фазы 0-9 выполнены.**
* `temp/PROGRESS.md` — **КРИТИЧЕСКИ ВАЖНЫЙ ФАЙЛ**. История завершённых работ (Phases 0-9 — SEO/производительность).

### Admin Panel (активная разработка)

* `temp/admin-panel-plan.md` — **ОСНОВНОЙ ПЛАН**. 14 фаз (Phase 1-14), dependency order, priotetety. Читать при старте сессии.
* `temp/admin-progress.md` — **ТРЕКЕР**. Пофазовый список задач с чекбоксами. Обновлять после каждой задачи.
* `temp/MIGRATION_MAP.md` — карта: текущие JSON/константы → будущие таблицы БД.
* `temp/content-backup/` — снепшот контента до миграции.
## 3\. Протокол работы и восстановления (Recovery Protocol)

При потере контекста, сбое среды или запуске новой сессии, ты обязан выполнить следующие шаги:

1. **Проверить статус Git:** Выполни `git status` и `git diff`, чтобы понять, на чем оборвалась работа.
2. **Прочитать `temp/admin-progress.md`:** Определить текущую фазу админ-панели и последнюю выполненную задачу.
3. **Прочитать `temp/admin-panel-plan.md`:** Восстановить понимание полного плана и зависимостей.
4. **Согласовать продолжение:** Кратко резюмировать пользователю: "Фаза X, последняя задача Y. В Git — N незакоммиченных файлов. Продолжаем?"

## 4\. Строгие правила разработки (Workflow Rules)

* **Атомарность:** Выполняй строго ОДНУ задачу из `temp/tasks-backlog.md` за раз. Не пытайся фиксить SEO, если текущая задача — настройка ESLint.
* **Организация Git коммитов:** Не делай коммит всех изменений разом (`git commit -am`). Разделяй коммиты по смыслу (например, `feat: add cookie banner`, `chore: setup eslint`, `i18n: sync uk translations`).
* **Самодокументирование:** После завершения каждой задачи или логического блока, ты **обязан** обновить файл `temp/PROGRESS.md`, отметив выполненное чекбоксом `\[x]` и записав дату/время.
* **Безопасность среды Cloudflare:** Не используй Node.js API (например, `fs`, `child\_process`), которые не поддерживаются в Cloudflare Workers, если код выполняется в рантайме браузера или Edge.
* **Запрос разрешений:** Перед выполнением деструктивных команд (удаление файлов, хард-ресет git, масштабный рефакторинг) — всегда запрашивай подтверждение у пользователя.

## 5\. Порядок выполнения задач

1. При старті сесії — прочитай `temp/admin-progress.md` (поточний стан) та `temp/admin-panel-plan.md` (повний план).
2. Вибери першу невиконану задачу з поточної фази в `temp/admin-progress.md`.
3. Проаналізуй файли, пов'язані з задачею.
4. Виконай зміни.
5. Протестуй: `npm run build` — 0 помилок. Якщо змінював публічні сторінки — curl перевірка.
6. Онови `temp/admin-progress.md` — відміть задачу виконаною.
7. Якщо фаза завершена — `git add`, `git commit -m "feat(admin): Phase N — ..."`, `git push`.
8. Перейди до наступної фази.

**GitHub Actions** — основной пайплайн. Тригер: push в `master`.
Workflow: `.github/workflows/deploy.yml` — `npm ci` → `eslint` → `cloudflare/wrangler-action@v3` (з `preCommands: npx opennextjs-cloudflare build`).

Cloudflare Workers Builds (GitHub App) — дублирующий білд, але тільки GitHub Actions деплоїть робочий воркер.

### 6.2. Версії (зафіксовано 2026-06-18)

| Компонент | Версія |
|---|---|
| Next.js | 15.5.19 |
| @opennextjs/cloudflare | 1.19.11 |
| @opennextjs/aws | 4.0.2 |
| Wrangler | 4.102.0 |
| workerd compatibility_date | 2026-06-03 |
| Node.js (CI) | 22.16.0 |
| npm (CI) | 10.9.2 |

### 6.3. РЕШЕНИЕ: помилка `@swc/helpers` при `npm ci`

**Симптом:** GitHub Actions падає на `npm ci` з `Missing: @swc/helpers@0.5.23 from lock file`.
**Причина:** npm 11 (локально) резолвить `@swc/helpers@0.5.15` в `package-lock.json`, але npm 10.9.2 (CI) потребує `0.5.23` через те, що `next` та інші пакети очікують новішу версію.
**Фікс TRY 1 (не спрацював):** Ручне редагування `package-lock.json` (bump 0.5.15→0.5.23) — npm install знову писав 0.5.15.
**Фікс TRY 2 (спрацював):**
1. `npm install @swc/helpers@0.5.23` — додати як явну залежність в `package.json` з `^0.5.23`.
2. Видалити `node_modules` та `package-lock.json`.
3. `npm install` — повна перегенерація lock-файлу.
4. Коміт: `7dd96e0` ("fix: regenerate package-lock.json, add @swc/helpers@0.5.23 explicit dep").

**ЗОЛОТЕ ПРАВИЛО:** Якщо `npm ci` падає з помилкою "Missing: ... from lock file" — НЕ редагуй lock-файл вручну. Додай проблемний пакет як явну залежність в `package.json` і регенеруй `package-lock.json` через `npm install`.

### 6.4. Secrets в GitHub (обов'язкові)

| Secret | Призначення |
|---|---|
| CLOUDFLARE_API_TOKEN | Токен для wrangler deploy |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare Account ID |
| NEXT_PUBLIC_SITE_URL | https://podvarchan.com |
| NEXT_PUBLIC_GA_ID | G-42W6951F8L |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | 0x4AAAAAADYZ2z3RysEsBoQu |
| CONTACT_EMAIL | podvarchan@gmail.com |

### 6.5. Wrangler config

- `wrangler.jsonc` — основний конфіг.
- `compatibility_date: "2026-06-03"`.
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`.
- Біндінги: `RATE_LIMIT_KV` (KV), `DB` (D1), `WORKER_SELF_REFERENCE`, `ASSETS`.
- Environment variables: `NEXTJS_ENV`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `CONTACT_EMAIL`, `AUTH_TRUST_HOST`, `REVALIDATE_URL`.

### 6.6. Успішний деплой 2026-06-18

Run #63 (коміт `7dd96e0`) — всі кроки пройдено.
URL: https://podvarchan.maguchen.workers.dev
Version ID: bed23700-a844-467d-b3c5-ee383591f194
**
НЕ ЗМІНЮЙ цю конфігурацію без явної команди користувача.**
Якщо сумніваєшся — прочитай цей розділ і повернись до перевірки версій.

### 6.7. ЗАПРЕТ: локальний wrangler deploy

**НІКОЛИ не використовуй `npx wrangler deploy` локально.**
Wrangler завантажує ~15 MB на кожен деплой, що критично грузить мережу.
Деплой виключно через GitHub Actions: push в `master` → автоматичний deploy.
Виняток (WRANGLER DEPLOY ALLOWED): тільки коли через GitHub Actions зробити деплой неможливо (наприклад, GitHub зламався / Actions недоступні / секрети відкликані / терміновий hotfix вночі), і це погоджено з користувачем.

## 7. Cloudflare Workers AI — Selection Rules

### 7.1. Доступные бесплатные модели

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

## 9. Admin Panel Implementation Rules (обов'язково)

> Активна розробка: `feature/admin-panel`. Всі фази — в `temp/admin-panel-plan.md`, трекер — `temp/admin-progress.md`.

### 9.1. ZERO DEGRADATION

**Публічний сайт завжди залишається робочим.** Жоден коміт не ламає build або рендеринг. Перед кожним комітом обов'язково:
1. `npm run build` — 0 помилок
2. Якщо змінювалися публічні сторінки — curl перевірка 5 ключових URL
3. Якщо змінювалася middleware — перевірити /admin/login та /admin редиректи

Порушення цього правила = відкат коміту.

### 9.2. COMMITS AFTER PHASE

Один коміт = одна фаза з `temp/admin-panel-plan.md`. Commit message: `feat(admin): Phase N — короткий опис`. Після коміту — `git push`.

**НЕ МОЖНА:**
- Комітити половину фази
- Змішувати дві фази в одному коміті
- Використовувати `git commit -am` для всього одразу

### 9.3. RECOVERY PROTOCOL

При запуску нової сесії (замість старого п.3):
1. `git status` / `git diff` — на чому зупинилися
2. Прочитати `temp/admin-progress.md` — яка фаза, які задачі виконані
3. Прочитати `temp/admin-panel-plan.md` — повний контекст і залежності
4. Якщо є незакомічені файли — фаза не завершена, продовжити її
5. Повідомити користувачу: "Фаза N, задача X. Продовжуємо."

### 9.4. CONTENT MIGRATION SAFETY

При перемиканні публічних сторінок з JSON/констант на D1 (Phase 12):
1. **Спочатку seed** — заповнити БД даними
2. **Потім переключення** — змінити код сторінки на читання з D1
3. **Старі JSON не видаляти** — поки curl не підтвердить, що все працює
4. **Тільки після верифікації** — видалити дубльовані ключі з messages/*.json

### 9.5. NO LOCAL DEPLOY (поширюється на адмінку)

Правило 6.7 діє і для адмін-панелі. Деплой — виключно через GitHub Actions при push в `master`.
