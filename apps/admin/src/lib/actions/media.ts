'use server'
import { cleanUpdate } from './clean-update'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { mediaAssets, serviceIndexPath } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { requireDelete } from '@/lib/auth/guards'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, cacheKeys } from '@/lib/revalidate'
import { deleteR2Keys, getOwnedMediaKeys } from '@/lib/media/integrity'

/**
 * Media is referenced across blog/services/pages/testimonials — broad layout
 * revalidate. Cache keys are invalidated TARGETED per asset id: every public
 * read goes through getMediaPublicUrl/getMediaWithVariants with the media id
 * (coverImageId etc.), and cacheKeys.mediaUrl/mediaVariants hash that same id
 * — so a wipe of the whole `media:` family (159 assets × 2 keys) would be a
 * needless cache stampede. Keep the wipe only where hashes are unknowable.
 */
async function revalidateMediaArea(ids: string[]): Promise<void> {
  const keys: string[] = []
  for (const id of ids) {
    keys.push(cacheKeys.mediaUrl(id), cacheKeys.mediaVariants(id))
  }
  await revalidatePublic({
    paths: ['/ru/', '/uk/', '/ru/blog/', '/uk/blog/', serviceIndexPath('ru'), serviceIndexPath('uk'), '/sitemap.xml'],
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
  await revalidateMediaArea([id])
}

async function getMediaBucket(): Promise<R2Bucket> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = getCloudflareContext()
  const r2 = env.MEDIA_R2_BUCKET as R2Bucket | undefined
  if (!r2) throw new Error('Media storage is not configured')
  return r2
}

type MediaAsset = typeof mediaAssets.$inferSelect

async function clearAssetStorage(r2: R2Bucket, asset: MediaAsset): Promise<void> {
  if (!asset.storageKey) throw new Error('Media asset has no storage key')
  const keys = getOwnedMediaKeys(asset.id, asset.storageKey, asset.variantsJson)
  try {
    await deleteR2Keys(r2, keys)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown storage error'
    throw new Error(`Could not delete media ${asset.id} from storage: ${message}`)
  }
}

export async function deleteMedia(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
  if (!existing) throw new Error('Медіа не знайдено')
  const r2 = await getMediaBucket()
  await clearAssetStorage(r2, existing)
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'MEDIA', entityId: id, before: existing })
  revalidatePath('/admin/media')
  await revalidateMediaArea([id])
}

/** Batch delete media assets by IDs while keeping R2 and D1 consistent. */
export async function deleteMediaBatch(ids: string[]): Promise<{ deleted: number; errors: number }> {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const r2 = await getMediaBucket()
  const successfulIds: string[] = []
  let errors = 0
  for (const id of ids) {
    const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
    if (!existing) { errors++; continue }
    try {
      await clearAssetStorage(r2, existing)
      await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
      await writeAuditLog({ userId, action: 'DELETE', entityType: 'MEDIA', entityId: id, before: existing })
      successfulIds.push(id)
    } catch {
      errors++
    }
  }
  if (successfulIds.length > 0) {
    revalidatePath('/admin/media')
    await revalidateMediaArea(successfulIds)
  }
  return { deleted: successfulIds.length, errors }
}
