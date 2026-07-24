import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'

/**
 * POST /api/revalidate
 *
 * Triggered by admin worker after content changes.
 * Body: { path: string, type?: 'page' | 'layout', secret: string }
 *   - path: '/uslugi', '/blog', '/' or a specific path
 *   - type: 'page' (default) or 'layout'
 *   - secret: shared secret from env.REVALIDATE_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { path?: string; paths?: string[]; type?: string; secret?: string }

    if (!body.secret || body.secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    // Accept both `path` (singular) and `paths` (array from admin)
    const allPaths = [
      ...(body.paths ?? []),
      ...(body.path ? [body.path] : []),
    ]

    if (allPaths.length === 0) {
      return NextResponse.json({ error: 'Missing path(s)' }, { status: 400 })
    }

    const type = body.type || 'page'
    for (const p of allPaths) {
      if (type === 'layout') {
        revalidatePath(p, 'layout')
      } else {
        revalidatePath(p)
      }
    }

    return NextResponse.json({ revalidated: true, paths: allPaths, type })
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
