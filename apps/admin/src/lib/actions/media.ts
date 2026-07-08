'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { mediaAssets } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
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
  if (!existing) throw new Error('Media not found')
  const parsed = mediaSchema.safeParse({
    altRu: formData.get('altRu'), altUk: formData.get('altUk'),
    captionRu: formData.get('captionRu'), captionUk: formData.get('captionUk'),
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(mediaAssets).set({
    altRu: data.altRu || null, altUk: data.altUk || null,
    captionRu: data.captionRu || null, captionUk: data.captionUk || null,
  }).where(eq(mediaAssets.id, id))
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'MEDIA', entityId: id, before: existing, after: data })
  revalidatePath('/admin/media')
  redirect('/admin/media')
}

export async function deleteMedia(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()
  if (!existing) throw new Error('Media not found')
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'MEDIA', entityId: id, before: existing })
  revalidatePath('/admin/media')
  redirect('/admin/media')
}

