# Memory Snapshot — Podvarchan.com (2026-07-07)

## Git
- **Branch:** `feat/split-admin-worker`
- **Last commit:** `745a56f` — `feat(admin): Phase 14 — restructure admin into apps/admin monorepo`
- **Uncommitted:** 6 files modified, 3 untracked (site worker split work)
- **Working tree:** dirty (split in progress)

## Completed today

### Phase 14 finalization (earlier)
- Committed monorepo restructure: `src/app/admin/` → `apps/admin/`
- Cleaned admin deps from root `package.json` (removed bcryptjs, better-sqlite3, @types/bcryptjs, @types/better-sqlite3)
- Fixed root `tsconfig.json` (was minimal stub, now proper Next.js config)
- Removed stale `db/index.ts` (imported non-existent `@drizzle/store`)
- Removed stale `src/index.ts` (imported non-existent `createSchema`)
- Fixed `packages/shared/src/index.ts` to export `getDb`
- Fixed `.github/workflows/deploy.yml` — removed `AUTH_SECRET` from site deploy, added admin deploy job

### P0: Admin split — infrastructure
- **`apps/site/`** — created complete public site worker:
  - `src/` — copied from root (all public pages, components, lib, etc.)
  - `messages/`, `public/`, `drizzle/`, `tests/` — copied from root
  - `package.json` — clean, no admin deps (no next-auth, tiptap, bcryptjs)
  - `wrangler.jsonc` — same bindings as root (D1, R2, KV), vars without AUTH_SECRET
  - `next.config.mjs` — same as root
  - `tailwind.config.ts` — same as root
  - `postcss.config.mjs` — same as root
  - `tsconfig.json` — standard Next.js config
  - `open-next.config.ts` — same as root
  - `cloudflare-env.d.ts` — same as root

- **`apps/admin/`** — already existed (from Phase 14), configured for `podvarchan-admin` on `admin.podvarchan.com`
- **`packages/shared/`** — already existed, schema extracted, `getDb` export fixed

### P0: Admin split — CI/CD
- `.github/workflows/deploy.yml` — already has both `deploy-site` and `deploy-admin` jobs
- Site builds from root (clean public site, build verified ✅)
- Admin builds from `apps/admin/` (has known stub issues — pre-existing migration stubs)

## Build verification
- **Public site** (`next build` from root): ✅ 36 routes, 0 errors, compiled in 6.5s
- **Admin** (`next build` from `apps/admin/`): ❌ pre-existing stub errors (migration stubs — not part of split task)
- **OpenNext build** (root): Next.js compilation ✅, timed out on Windows at "Collecting build traces" (expected, CI uses Ubuntu)

## What remains (per ADMIN_SPLIT_PLAN.md)
### Deploy
- [ ] PR to master
- [ ] Deploy admin worker first (`apps/admin`)
- [ ] Deploy slimmed public site (root, currently works)
- [ ] Configure `admin.podvarchan.com` domain
- [ ] Cloudflare Access for admin domain
- [ ] Smoke tests after deploy

### Not part of split (pre-existing stubs, migrate later)
- Admin Server Actions — stubs (blog, pages, seo, services have `'use server'` placement issues)
- Session helpers — `requireAdminSession()` throws
- Dashboard data — returns zeros
- Audit log — missing
- R2 upload — local fallback only
- Forms import `@/app/admin/actions/*` (doesn't exist)

## Key files
- `AGENT.md` — recovery protocol
- `MIGRATION_PLAN.md` — admin migration plan (phases A-G, paused)
- `TEMP/ADMIN_SPLIT_PLAN.md` — approved admin split plan
- `TEMP/PROGRESS.md` — current progress
- `TEMP/migration-progress.md` — migration tracker
- `MEMORY_SNAPSHOT.md` — this file
