# ПРОГРЕСС ДОВОДКИ АДМИНКИ (ОТ ТЕКУЩЕГО СОСТОЯНИЯ)

**Дата:** 2026-07-08
**Проект:** Podvarchan.com (монорепо, 2 воркера)
**Стек:** Next.js 15.5.20 · TypeScript strict · Tailwind CSS 3 · Drizzle ORM · Cloudflare D1/R2/KV · OpenNext 1.20.1 · NextAuth v5

---

## Этап 0. Разведка/TEMP
- [x] 0.1 TEMP подготовлен (PROGRESS.md, TASKBACKLOG.md, TECH_REPORTs созданы)
- [x] 0.2 Созданы TEMP/STUBS_MAP.md, TEMP/FORM_IMPORTS.md, TEMP/PUBLIC_D1_MAP.md
- [x] 0.3 Создан TEMP/SOURCE_REF.md (исходник старых actions в src/app/admin/actions/)

## Этап 1. Foundation + Audit
- [x] 1.1 result.ts — ActionResult<T>, ok(), fail()
- [x] 1.2 db.ts — getActionDb() singleton
- [x] 1.3 guard.ts — withAuth, withRole, withCanPublish, withCanDelete, withCanManageUsers, withCanManageSettings
- [x] 1.4 audit/log.ts — writeAuditLog() fire-and-forget
- [x] 1.5 index.ts — реэкспорт всего
- [x] 1.6 Auth type unification: USER добавлен в UserRole, фикс weight-карты
- [x] 1.7 cd apps/admin && npm run build → 0 ошибок

## Этап 2. 15 модулей actions + фикс импортов форм
- [x] 2.1 services.ts — create/update/delete/publish
- [x] 2.2 blog.ts — categories + posts CRUD + publish
- [x] 2.3 faq.ts — create/update/delete
- [x] 2.4 testimonials.ts — create/update/delete/publish
- [x] 2.5 leads.ts — get/markRead/delete/export
- [x] 2.6 media.ts — getMediaList/updateMediaMeta/deleteMedia
- [x] 2.7 pages.ts — create/update/delete/publish
- [x] 2.8 seo.ts — CRUD for SEO rules
- [x] 2.9 settings.ts — siteSettings CRUD + contactChannels
- [x] 2.10 navigation.ts — CRUD + toggle + reorder
- [x] 2.11 redirects.ts — CRUD + toggle + hitCount
- [x] 2.12 users.ts — get/update/delete
- [x] 2.13 audit.ts — getAuditLogs (фильтрованный) + getAuditLogById
- [x] 2.14 search.ts — adminSearch (заглушка для поиска)
- [x] 2.15 Fix form imports — all @/app/admin/actions/* → @/lib/actions/* (30+ paths fixed, function name mismatches resolved)
- [x] 2.16 cd apps/admin && npm run build → 0 ошибок (verified 2026-07-08)

## Этап 3. Dashboard на реальных D1-данных
- [x] 3.1 dashboard.ts переписан: COUNT сервисов/постов/лидов/отзывов/медиа
- [x] 3.2 DashboardData типизирован (DashboardStats interface)
- [x] 3.3 Дополнить: черновики, SEO-пробелы, последние лиды (DashboardData nesting done)

## Этап 4. R2 upload + WebP
- [ ] 4.1 browser-image-compression (или canvas-ресайзер)
- [ ] 4.2 src/lib/media/optimize.ts — buildWebpVariants
- [ ] 4.3 Форма загрузки (drag-and-drop зона)
- [ ] 4.4 /api/admin/media/upload/route.ts — POST
- [ ] 4.5 R2 storage: ключи media/YYYY/MM/uuid-<width>.webp
- [ ] 4.6 Публичный ResponsiveImage.tsx з srcset
- [ ] 4.7 media.ts deleteMedia з перевіркою використання
- [ ] 4.8 Сборка 0 ошибок

## Этап 5. Drag-and-drop
- [ ] 5.1 @dnd-kit залежності
- [ ] 5.2 SortableList.tsx — переиспользуемый компонент
- [ ] 5.3 Reorder-actions: reorderFaqItems, reorderNavigation, reorderServices, reorderTestimonials
- [ ] 5.4 Підключити на сторінках: FAQ, navigation, services, testimonials
- [ ] 5.5 public queries з ORDER BY sortOrder
- [ ] 5.6 Сборка 0 ошибок

## Этап 6. Публичный сайт на D1 + инвалидация кэша
- [ ] 6A.1 public.ts — getBlogPosts, getFaqItems, getTestimonials, getNavigation (D1 + fallback)
- [ ] 6A.2 Маршрути: blog, faq, services, testimonials з D1
- [ ] 6A.3 ISR: revalidate=3600 + теги кэша
- [ ] 6B.4 /api/revalidate/route.ts — перевірити секрет + параметри
- [ ] 6B.5 revalidate.ts — revalidatePublic({tags, paths}) POST до публічного воркера
- [ ] 6B.6 Викликати revalidatePublic у всіх мутирующих actions
- [ ] 6.7 Сборка 0 ошибок

## Этап 7. Регрессия
- [ ] 7.1 TypeScript 0 ошибок (обидва воркери)
- [ ] 7.2 scripts/seo-regression.sh → 71/71
- [ ] 7.3 Перевірка ключових URL: /, /uslugi/, /blog/, /faq/ — 200
- [ ] 7.4 Адмінка: логін, CRUD, dashboard
- [ ] 7.5 TEMP/DONE_REPORT.md

---

## Критерії готовності (цілі власника)
- [ ] Власник створює/редагує статтю RU+UK → публікує → з'являється на сайті
- [ ] Зображення ресайзиться → WebP → srcset
- [ ] Drag-and-drop FAQ/меню/услуги/отзывы → порядок зберігається
- [ ] Будь-яка правка контенту → відображається на публічному клієнті
- [ ] Усі дії адмінів пишуться в audit_logs
- [ ] Dashboard — реальні числа
- [ ] seo-regression 71/71, сайт не деградував
