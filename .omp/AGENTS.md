# Podvarchan.com — Agent Context (2026-07-08)

## Architecture
Monorepo, two Cloudflare Workers (OpenNext):
- **Site** `podvarchan` (podvarchan.com): `src/` — Next.js 15.5.18, App Router, TypeScript, Tailwind CSS, next-intl (ru/uk), OpenNext deploy
- **Admin** `podvarchan-admin` (admin.podvarchan.com): `apps/admin/` — Next.js 15.5.18, NextAuth v5, D1, R2, KV
- **Shared** `packages/shared/` — Drizzle schema, getDb, types

## Git
- Branch: `feat/split-admin-worker`
- Last commit: `745a56f` "feat(admin): Phase 14 — restructure admin into apps/admin monorepo"
- Dirty tree: split work in progress

## What's DONE (as of 2026-07-08 session)

### Infrastructure
- P0 split: apps/admin + apps/site + packages/shared created
- Admin worker `podvarchan-admin` deployed to Cloudflare
- Custom domain admin.podvarchan.com (DNS + route configured), Cloudflare Access
- CI workflow: site (Pages), admin (GitHub Actions)
- Both workers build with 0 errors

### Auth
- NextAuth v5 (Credentials + bcrypt + JWT), session.ts with real auth()
- Middleware protects /admin/*
- Auth type unification: 'USER' added to UserRole, weight map fixed

### Actions Foundation (Stage 1) — at apps/admin/src/lib/actions/
- result.ts (ActionResult<T>, ok/fail), db.ts (getActionDb), guard.ts (withAuth/withRole/etc)
- audit/log.ts (writeAuditLog fire-and-forget), index.ts (re-exports)

### 15 Action Modules (Stage 2a) — at apps/admin/src/lib/actions/
Each: Zod validation, auth guard, getActionDb, writeAuditLog, revalidateSitePath/Layout
services, blog, faq, testimonials, leads, media, pages, seo,
settings, navigation, redirects, users, audit, search, dashboard

### Dashboard (Stage 3) — real D1 COUNT queries

## What's NOT DONE / NEXT

### Stage 2b — Fix Form Imports (CRITICAL, in progress)
30+ broken imports from @/app/admin/actions/* → @/lib/actions/*
Function name mismatches to resolve:
- createFaq/updateFaq → createFaqItem/updateFaqItem
- updatePageMeta → publishPage (doesn't exist in new module)
- addSection/deleteSection/toggleSection/updateSectionContent — verify pages.ts
- getAuditEntityTypes/getAuditActions/getRevisions — missing in audit.ts
- navigation/redirects import from settings → should import from navigation/redirects
- getSeoOverride — verify exists

### Stage 4 — R2 Upload + WebP (not started)
### Stage 5 — Drag-and-drop (not started)
### Stage 6 — Public D1 + Cache invalidation (not started)
### Stage 7 — Regression (seo-regression 71/71, not started)

## Key Plan Files
- `TEMP/implementation-guide-admin-CURRENT-STATE.md` — full staged plan with prompts
- `TEMP/PROGRESS.md` — checklist by stages (0-7), updated
- `TEMP/TASKBACKLOG.md` — backlog with statuses, updated
- `TEMP/SESSION_SUMMARY_2026-07-08.md` — last session summary
- `AGENT.md` (root) — recovery protocol

## Build Commands
- Admin: `cd apps/admin && npm run build && npx tsc --noEmit`
- Site: `npm run build` (root)

## Rules
- NEVER deploy locally — only CI push to master
- NEVER touch site not-found.tsx, robots.ts, middleware redirects, canonical
- Always update TEMP/PROGRESS.md after each stage
