'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

const updateSchema = z.object({
  altRu: z.string().max(500).optional().default(''),
  altUk: z.string().max(500).optional().default(''),
  titleRu: z.string().max(500).optional().default(''),
  titleUk: z.string().max(500).optional().default(''),
  captionRu: z.string().max(2000).optional().default(''),
  captionUk: z.string().max(2000).optional().default(''),
})

function now(): string {
  return new Date().toISOString()
}

export async function updateMediaMeta(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!canEditContent(user.role)) throw new Error('Forbidden')

  const parsed = updateSchema.parse({
    altRu: formData.get('altRu'),
    altUk: formData.get('altUk'),
    titleRu: formData.get('titleRu'),
    titleUk: formData.get('titleUk'),
    captionRu: formData.get('captionRu'),
    captionUk: formData.get('captionUk'),
  })

  const db = getDB()
  await db.update(mediaAssets).set(parsed).where(eq(mediaAssets.id, id))

  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: user.id,
    action: 'UPDATE',
    entityType: 'media',
    entityId: id,
    afterJson: JSON.stringify(parsed),
    createdAt: now(),
  })

  revalidatePath('/admin/media')
  revalidatePath(`/admin/media/${id}`)
}

export async function deleteMedia(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!canDelete(user.role)) throw new Error('Forbidden')

  const db = getDB()

  // Get the asset to find storage key
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  if (!asset) throw new Error('Not found')

  // Delete from R2
  const r2 = process.env.MEDIA_R2_BUCKET as unknown as { delete(key: string): Promise<void> } | undefined
  if (r2 && asset.storageKey) {
    await r2.delete(asset.storageKey)
  }

  // Delete from DB
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id))

  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: user.id,
    action: 'DELETE',
    entityType: 'media',
    entityId: id,
    createdAt: now(),
  })

  revalidatePath('/admin/media')
}
