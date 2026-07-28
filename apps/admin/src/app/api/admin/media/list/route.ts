import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { desc, like, or, sql } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const page = Number(searchParams.get('page')) || 1
  const offset = (page - 1) * PAGE_SIZE

  const db = getDB()

  const conditions = q
    ? or(
        like(mediaAssets.originalName, `%${q}%`),
        like(mediaAssets.fileName, `%${q}%`),
      )
    : undefined

  const [total] = await db
    .select({ count: sql<number>`count(DISTINCT ${mediaAssets.id})` })
    .from(mediaAssets)
    .where(conditions)
    .all() ?? []

  const assets = await db
    .select()
    .from(mediaAssets)
    .where(conditions)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)
    .all()

  return NextResponse.json({ assets, total: total?.count ?? 0 })
}
