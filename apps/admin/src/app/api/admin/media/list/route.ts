import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { desc, like, or } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const db = getDB()
  const query = db.select().from(mediaAssets)

  const rows = q
    ? await query
        .where(
          or(
            like(mediaAssets.originalName, `%${q}%`),
            like(mediaAssets.fileName, `%${q}%`),
          ),
        )
        .orderBy(desc(mediaAssets.createdAt))
        .all()
    : await query.orderBy(desc(mediaAssets.createdAt)).all()

  return NextResponse.json({ assets: rows })
}
