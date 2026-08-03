import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { invalidateExact, invalidateKeys } from '@/lib/db/kv-cache'

/**
 * POST /api/revalidate
 *
 * Called by admin worker after content mutations (cross-worker).
 *
 * Body JSON:
 *   { secret, path?, paths?, type?: 'page' | 'layout', keys?: string[], prefixes?: string[] }
 *
 * - path / paths: public site paths e.g. /ru/blog/slug/ (prefer locale + trailing slash)
 * - type: 'page' (default) or 'layout' (segment + children)
 * - keys: exact logical CONTENT_CACHE_KV keys to delete (cacheKeys.* from
 *   @podvarchan/shared, no `d1c:` prefix — applied here). Targeted per-mutation
 *   invalidation (AGENTS.md §4), never a namespace wipe.
 * - prefixes: scoped entity-family prefixes to wipe (e.g. 'media:' for hashed
 *   media lookups unknowable from the admin side).
 *
 * Keep this handler cheap — Free plan CPU budget.
 */
type RevalidateBody = {
  secret?: string
  path?: string
  paths?: string[]
  type?: string
  keys?: string[]
  prefixes?: string[]
}

const MAX_BATCH = 40

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter((v) => v.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidateBody

    if (!body.secret || body.secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const paths = [
      ...stringArray(body.paths),
      ...stringArray([body.path].filter((p): p is string => typeof p === 'string')),
    ].slice(0, MAX_BATCH)

    if (paths.length === 0) {
      return NextResponse.json({ error: 'Missing path(s)' }, { status: 400 })
    }

    const keys = stringArray(body.keys).slice(0, MAX_BATCH)
    const prefixes = stringArray(body.prefixes).slice(0, MAX_BATCH)
    const useLayout = body.type === 'layout'
    const done: string[] = []
    const errors: string[] = []

    // Targeted D1 KV cache invalidation — delete exactly the affected keys
    try {
      await invalidateExact(keys)
    } catch {
      // best-effort — cache TTL will expire eventually
    }
    try {
      await Promise.all(prefixes.map((p) => invalidateKeys(p)))
    } catch {
      // best-effort — cache TTL will expire eventually
    }

    for (const p of paths) {
      try {
        if (useLayout) {
          revalidatePath(p, 'layout')
        } else {
          revalidatePath(p)
        }
        done.push(p)
      } catch {
        errors.push(p)
      }
    }

    return NextResponse.json({
      revalidated: errors.length === 0,
      paths: done,
      errors: errors.length ? errors : undefined,
      type: useLayout ? 'layout' : 'page',
      keysDeleted: keys.length,
      prefixesWiped: prefixes.length,
    })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
