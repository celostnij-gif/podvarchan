# RECAP.md — лог сессий Podvarchan.com

Обновлять в конце каждой сессии. При старте новой сессии читать `AGENT.md` (архитектура/правила) и этот файл (что сделано).

---

## 2026-07-08 — Soft-404 fix + Admin session fix + CI fix

**Ветка:** `fix/soft-404-status` → push в `master` (без PR)

### Публичный сайт
- **Soft-404**: `src/app/[locale]/[...slug]/page.tsx` — заменил статическую 404-JSX на `notFound()`. HTTP 200 → 404.
- **Приёмка:** все URL на `podvarchan.com`:
  - `/ru/nesuschestvuet-xyz/` → 404 ✅
  - `/uk/nesuschestvuet-xyz/` → 404 ✅
  - `/totally-fake-root/` → 308 → 404 ✅
  - noindex сохранён ✅
  - blog-404 не задет ✅
  - рабочие страницы 200 ✅

### Админ-панель
- **session.ts**: `apps/admin/src/lib/auth/session.ts` — заглушки (null/throw) → реальные `auth()` вызовы.
- **CI**: `deploy.yml` — убран `secrets:` блок из admin deploy (падал на `wrangler secret bulk`).
- **Secrets**: установлены на `podvarchan-admin` через Cloudflare API:
  - `AUTH_SECRET`, `TURNSTILE_SECRET_KEY`, `REVALIDATE_SECRET`
- **CI последний**: run 28934414679 — site ✅, admin ✅

### Документация
- **AGENT.md**: переписан — два воркера, архитектура, stubs, приоритеты, инфраструктура.
- **RECAP.md**: создан.

### Что дальше (админка)
1. Протестировать логин на `admin.podvarchan.com`
2. Dashboard — реальные D1-запросы
3. Server actions — CRUD для контента
4. R2 upload
5. Audit log
6. Формы — исправить импорты
