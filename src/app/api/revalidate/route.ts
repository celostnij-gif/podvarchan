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
    const body = await request.json() as { path?: string; type?: string; secret?: string }

    if (!body.secret || body.secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    if (!body.path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    if (body.type === 'layout') {
      revalidatePath(body.path, 'layout')
    } else {
      revalidatePath(body.path)
    }

    return NextResponse.json({ revalidated: true, path: body.path, type: body.type || 'page' })
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
