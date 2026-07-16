import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'

/**
 * POST /api/revalidate
 *
 * Called by admin worker after content mutations (cross-worker).
 *
 * Body JSON:
 *   { secret: string, path?: string, paths?: string[], type?: 'page' | 'layout' }
 *
 * - path / paths: public site paths e.g. /ru/blog/slug/ (prefer locale + trailing slash)
 * - type: 'page' (default) or 'layout' (segment + children)
 *
 * Keep this handler cheap — Free plan CPU budget.
 */
type RevalidateBody = {
  secret?: string
  path?: string
  paths?: string[]
  type?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidateBody

    if (!body.secret || body.secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const paths = [
      ...(Array.isArray(body.paths) ? body.paths : []),
      ...(body.path ? [body.path] : []),
    ]
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0)

    if (paths.length === 0) {
      return NextResponse.json({ error: 'Missing path(s)' }, { status: 400 })
    }

    // Cap batch size — avoid pathological payloads
    const limited = paths.slice(0, 40)
    const useLayout = body.type === 'layout'
    const done: string[] = []
    const errors: string[] = []

    for (const p of limited) {
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
    })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
