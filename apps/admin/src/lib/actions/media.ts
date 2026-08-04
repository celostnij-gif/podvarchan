'use server'
import { cleanUpdate } from './clean-update'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { mediaAssets } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, cacheKeys } from '@/lib/revalidate'

/**
 * Media is referenced across blog/services/pages/testimonials — broad layout
 * revalidate. Cache keys are invalidated TARGETED per asset id: every public
 * read goes through getMediaPublicUrl/getMediaWithVariants with the media id
 * (coverImageId etc.), and cacheKeys.mediaUrl/mediaVariants hash that same id
 * — so a wipe of the whole `media:` family (159 assets × 2 keys) would be a
 * needless cache stampede. Keep the wipe only where hashes are unknowable.
 */
function revalidateMediaArea(ids: string[]): void {
  const keys: string[] = []
  for (const id of ids) {
    keys.push(cacheKeys.mediaUrl(id), cacheKeys.mediaVariants(id))
  }
  void revalidatePublic({
    paths: ['/ru/', '/uk/', '/ru/blog/', '/uk/blog/', '/ru/uslugi/', '/uk/uslugi/', '/sitemap.xml'],
    type: 'layout',
    keys,
  })
}

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const mediaSchema = z.object({
  altRu: z.string().optional().default(''),
  altUk: z.string().optional().default(''),
  captionRu: z.string().optional().default(''),
  captionUk: z.string().optional().default(''),
})

export async function getMediaList() {
  await requireEdit()
  const db = await getActionDb()
  return db.select().from(mediaAssets).orderBy(mediaAssets.createdAt)
}

export async function updateMediaMeta(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
  if (!existing) throw new Error('Медіа не знайдено')
  const parsed = mediaSchema.safeParse({
    altRu: formData.get('altRu'), altUk: formData.get('altUk'),
    captionRu: formData.get('captionRu'), captionUk: formData.get('captionUk'),
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  const cleaned = cleanUpdate({
    altRu: data.altRu, altUk: data.altUk,
    captionRu: data.captionRu, captionUk: data.captionUk,
  })
  if (Object.keys(cleaned).length > 0) {
    await db.update(mediaAssets).set(cleaned).where(eq(mediaAssets.id, id))
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'MEDIA', entityId: id, before: existing, after: data })
  revalidatePath('/admin/media')
  revalidateMediaArea([id])
}

export async function deleteMedia(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
  if (!existing) throw new Error('Медіа не знайдено')
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'MEDIA', entityId: id, before: existing })
  revalidatePath('/admin/media')
  revalidateMediaArea([id])
}

/**
 * Batch delete media assets by IDs (no redirect — returns JSON for client).
 * Used by the MediaListPage client component for mass operations.
 */
export async function deleteMediaBatch(ids: string[]): Promise<{ deleted: number; errors: number }> {
  const userId = await requireEdit()
  const db = await getActionDb()
  let deleted = 0
  let errors = 0
  for (const id of ids) {
    const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
    if (!existing) { errors++; continue }
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
    await writeAuditLog({ userId, action: 'DELETE', entityType: 'MEDIA', entityId: id, before: existing })
    deleted++
  }
  revalidatePath('/admin/media')
  revalidateMediaArea(ids)
  return { deleted, errors }
}
