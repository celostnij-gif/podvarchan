# PROGRESS — Чек-лист и статус доработки CMS-админки podvarchan.com

**Дата создания/обновления:** 2026-07-23  
**Цель:** Отслеживание статуса готовности админки и публичного сайта к сдаче владельцу (Client Acceptance).

---

## 1. Сводный статус по фазам

| Фаза | Наименование | Статус | Ручные проверки / Proofs |
|---|---|---|---|
| **P0** | **UK Slugs & Data Integrity** | 🟡 IN PROGRESS | Ожидает проведения миграции slug'ов в D1 и проверки 301-правил |
| **P1** | **Home CMS Cycle** | 🟡 IN PROGRESS | Подготовлены контракты `Hero` и `d1Sections` в `home-client.tsx` |
| **P2** | **Static Pages CMS** | ⏳ PLANNED | В плане (About, Method, Pricing, Contacts, Legal) |
| **P3** | **Data Integrity Guards** | ⏳ PLANNED | Включение защит от затираний и проверки уникальности slug'ов |
| **P4** | **Acceptance & Delivery** | ⏳ PLANNED | Финальный проход по Owner Journeys, сборка и передача руководства |

---

## 2. Детальный чеклист задач

### Phase P0 — UK Slugs Fix & Routing (SEO)
- [ ] Аудит D1: выявление всех записи `service_translations` и `blog_post_translations`, где `uk.slug == ru.slug`.
- [ ] Выполнение скрипта корректировки UK-слогов в D1 remote.
- [ ] Добавление правил 301 в `redirect_rules` для опубликованных затронутых сущностей.
- [ ] Проверка sitemap.xml и генерации `hreflang` (отсутствие одинаковых URL для разных локалей).
- [ ] Проверка direct 200 OK для украинских страниц услуг без промежуточного хопа 301.

### Phase P1 — Home CMS Cycle
- [ ] Интеграция `getPageByType('HOME')` с компонентом `Hero` (`title`, `subtitle`, `ctaButton`).
- [ ] Задействование `d1Sections` в `home-client.tsx` (вместо игнорирования `_d1Sections`).
- [ ] Реализация гибридного рендеринга (D1 primary -> messages fallback).
- [ ] Подключение `revalidatePublic(['/ru/', '/uk/'])` при сохранении в `/admin/home`.
- [ ] Проверка цикла обновления: изменения в админке отображаются на публичном сайте за секунды.

### Phase P2 — Static Pages CMS
- [ ] Первоначальный seed данных статических страниц в D1 из текстов живых страниц.
- [ ] Подключение чтения секций в `src/app/[locale]/[...slug]/page.tsx`.
- [ ] Интеграция `BlockEditorPanel` для удобного редактирования статических страниц.
- [ ] Связывание `generateMetadata` с D1 `seo_meta` для статических маршрутов.

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
