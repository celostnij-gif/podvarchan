# AGENT.md — podvarchan.com

> Постоянный контекст для ИИ-агента. Читать **перед каждой задачей**.  
> Если задача противоречит этому файлу — **спроси**, не ломай инварианты.  
> **Дата обновления:** 2026-07-23

---

## 0. Текущий статус (актуальный на 2026-07-23)

| Слой | Статус | Комментарий |
|---|---|---|
| Public site | **UP (100%)** | CDN `s-maxage=604800` + D1 primary. **Категорический запрет деградации клиентов.** |
| Admin infra (auth, CRUD, audit, media, revalidate, YMYL) | **~90%+** | Готовая инфраструктура — не «перестраивать с нуля». |
| Admin **product** (Home/Pages CMS cycle, UK slugs data, acceptance) | **В ДОРАБОТКЕ** | **NOT READY for client** до полного закрытия цикла UI -> D1 -> Public. |

**Master CMS plan (актуальный):** [TEMP/ADMIN_CMS_MASTER_PLAN.md](file:///c:/buff/Podvarchan-master-backup/TEMP/ADMIN_CMS_MASTER_PLAN.md)  
**Live evidence:** [TEMP/VERIFIED_PROD_GAPS_2026-07-22.md](file:///c:/buff/Podvarchan-master-backup/TEMP/VERIFIED_PROD_GAPS_2026-07-22.md)  
**Exact AI prompts:** `TEMP/AGENT_PROMPTS/` (P0 → P4)  
**Полные отчёты:** `TEMP/FULL_SITE_REPORT.md`, `FULL_DATABASE_REPORT.md`, `FULL_SEO_REPORT.md`, `FULL_TECHNICAL_REPORT.md`, `FULL_ADMIN_DB_AUDIT.md`  

---

## 1. Что это за проект

`podvarchan.com` — двуязычный (RU/UK) сайт психолога-консультанта + **CMS-админка**.  
Ниша **YMYL** (Your Money Your Life) → требования к SEO, canonical, YMYL-валидаторам и правилам публикации максимальные.

### Главный продукт-инвариант
**Админка = полноценный инструмент управления сайтом**, а не набор технического CRUD для разработчика.  
Владелец сайта (не программист) должен **легко, предсказуемо и красиво** управлять контентом публичного сайта.

Каждая фича считается **ГОТОВОЙ**, только если полностью замкнут цикл:
```
Владелец правит в UI → D1 → revalidatePublic → public page показывает изменение за секунды (<30s)
```

Если UI пишет в D1, а public всё ещё читает `messages/*` / `constants` / static — **фича НЕ готова**.

---

## 2. Архитектура и ограничения Cloudflare (Free Plan)

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  podvarchan (публичный)     │        │  podvarchan-admin            │
│  podvarchan.com             │        │  admin.podvarchan.com        │
│  src/                       │        │  apps/admin/src/             │
│  ЧИТАЕТ D1/R2               │        │  ЧИТАЕТ+ПИШЕТ D1/R2/KV       │
└──────────────┬──────────────┘        └───────────────┬──────────────┘
               │        общие ID                        │
               └───────────────┬───────────────────────┘
          D1 `podvarchan` · R2 media · KV RATE_LIMIT_KV
```

| Ограничение | Значение | Запрет (Нельзя) | Обязательно (Нужно) |
|---|---|---|---|
| **CPU Time per request** | **~10 ms** | Ресайз картинок в воркере; D1 запросы в middleware; `load-all` и поиск по slug в JS. | 1–3 точечных запроса к D1 `WHERE slug=?`; отдавать картинки напрямую из R2. |
| **Edge Cache** | `s-maxage=604800` | Ставить `Cache-Control: no-store` на публичный HTML. | Точечный вызов `revalidatePublic` при сохранении в админке. |
| **Media** | R2 storage | Загрузка несжатых картинок без WebP-оптимизации. | Клиентская WebP-компрессия в браузере перед загрузкой. |

---

## 3. SEO Инварианты и правила редиректов

1. **UK Slugs:** В D1 украинские слоги **обязаны быть аутентичными** (например, `hipnoterapiya-onlayn`, а не копия RU-слога `gipnoterapiya-onlayn`).
2. **301 Редиректы:** Любое изменение публикуемого URL (slug) автоматически создает запись в `redirect_rules` (301 с old → new для обеих локалей).
3. **Статические URL (Обо мне, Цены...):** Запрещено менять исторические публичные URL (например, `/uk/ob-avtore/` на `/uk/pro-avtora/`) без явной директивы и плана 301-редиректов!
4. **Locale Redirects:** Только 308 (Permanent Redirect), никаких 307.
5. **Missing URL:** Только честный 404 (никаких soft-200).
6. **Тестирование:** После любых изменений SEO обязателен запуск `bash scripts/seo-regression.sh`.

---

## 4. Дорожная карта выполнения задач (P0 → P4)

Строгая последовательность выполнения фаз:

```
P0 (UK Slugs & Data Integrity) ──► P1 (Home CMS Cycle) ──► P2 (Static Pages CMS) ──► P3 (Data Integrity Guards) ──► P4 (Acceptance Smoke)
```

- **Phase P0 (UK Slugs & Data):** Безопасное исправление UK-слогов в базе D1, добавление 301-правил, устранение лишних хопов редиректов.
- **Phase P1 (Home CMS Cycle):** Полная интеграция `/admin/home` с компонентом `HomeClient` и публичным сайтом (Hero, блоки, отзывы, FAQ, CTA).
- **Phase P2 (Static Pages CMS):** Перевод статических страниц (`About`, `Method`, `Pricing`, `Contacts`, `Privacy`, `Disclaimer`) на блочный редактор D1.
- **Phase P3 (Data Integrity Guards):** Защита от дублей, пустых перезаписей данных при сохранениях, валидация билингвальности.
- **Phase P4 (Acceptance & Smoke):** Проведение smoke-тестов на продакшене, проверка от отсутствия выпаданий, передача руководства владельцу.

---

## 5. Требования к качеству UI/UX Админки (Quality Bar)

Для любого интерфейса админки **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО**:

1. ❌ **Raw JSON textarea** как основной UX редактора (использовать `BlockEditorPanel`, `TipTap`, визуальные списки).
2. ❌ Использование `alert()`, `confirm()` (кроме удаления) или полной перезагрузки страницы `window.location.reload()`. Используйте `useActionState`, понятные баннеры ошибок и `router.refresh()`.
3. ❌ Смесь языков в интерфейсе админки. Весь UI-хром должен быть на **украинском языке**.
4. ❌ Ручные ссылки на медиа как основной способ. Используйте диалог `MediaPicker`.
5. ❌ Пустые сохранения (empty overwrite). Поля не должны затираться пустыми строками при сохранении части данных.
6. ❌ Ручной ввод сложных технических полей (sortOrder, slug_base) в основной форме. Убирайте их в раздел "Дополнительно" (`<details>`), а slug генерируйте автоматически из заголовка.

---

## 6. Чек-лист Definition of Done (DoD)

Фича или этап считается выполненным **ТОЛЬКО при выполнении всех пунктов**:

- [ ] `npm run build` (public) и `cd apps/admin && npm run build` (admin) проходят **без ошибок TypeScript**.
- [ ] Запуск `bash scripts/seo-regression.sh` возвращает **GREEN**.
- [ ] Изменение контента в админке отображается на публичном сайте менее чем за **30 секунд**.
- [ ] В коде нет вызовов `alert()`, `window.location.reload()`, сырого JSON в основных формах.
- [ ] Для всех публикаций строго соблюдается билингвальность (RU + UK).
- [ ] Публичный сайт не деградировал: отведенные HTTP-коды 200, сохранены CDN-заголовки `s-maxage=604800`.
- [ ] Файл [TEMP/PROGRESS.md](file:///c:/buff/Podvarchan-master-backup/TEMP/PROGRESS.md) обновлен со ссылками и результатами проверок.
