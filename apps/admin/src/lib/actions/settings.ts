'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, asc } from 'drizzle-orm'
import { siteSettings, contactChannels } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, getHomeRevalidatePaths } from '@/lib/revalidate'

async function requireSettings(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canManageSettings(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

/* ── Site Settings ── */

export async function getSiteSettings() {
  await requireSettings()
  const db = await getActionDb()
  return db.select().from(siteSettings).orderBy(asc(siteSettings.key))
}

export async function updateSiteSetting(key: string, valueJson: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
  const ts = await now()
  if (existing) {
    await db.update(siteSettings).set({ valueJson, updatedAt: ts }).where(eq(siteSettings.key, key))
  } else {
    await db.insert(siteSettings).values({ key, valueJson, updatedAt: ts })
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'SETTING', entityId: key, before: existing, after: { valueJson } })
  revalidatePath('/admin/settings')
  void revalidatePublic({ paths: getHomeRevalidatePaths(), type: 'layout' })
}

export async function deleteSiteSetting(key: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
  if (!existing) throw new Error('Setting not found')
  await db.delete(siteSettings).where(eq(siteSettings.key, key))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'SETTING', entityId: key, before: existing })
  revalidatePath('/admin/settings')
  void revalidatePublic({ paths: getHomeRevalidatePaths(), type: 'layout' })
}

/* ── Contact Channels ── */

const channelSchema = z.object({
  type: z.enum(['TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM']),
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(500),
  url: z.string().max(500).optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isEnabled: z.coerce.boolean().optional().default(true),
  isPrimary: z.coerce.boolean().optional().default(false),
})

export async function getContactChannels() {
  await requireSettings()
  const db = await getActionDb()
  return db.select().from(contactChannels).orderBy(asc(contactChannels.sortOrder))
}

export async function saveContactChannel(data: FormData) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const id = data.get('id') as string | null
  const parsed = channelSchema.safeParse({
    type: data.get('type'), label: data.get('label'), value: data.get('value'),
    url: data.get('url'), sortOrder: data.get('sortOrder'), isEnabled: data.get('isEnabled') === 'on' || data.get('isEnabled') === 'true', isPrimary: data.get('isPrimary') === 'on' || data.get('isPrimary') === 'true',
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const ch = parsed.data
  if (id) {
    const existing = await db.select().from(contactChannels).where(eq(contactChannels.id, id)).get()
    if (!existing) throw new Error('Channel not found')
    await db.update(contactChannels).set({
      type: ch.type as 'TELEGRAM' | 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'CUSTOM', label: ch.label, value: ch.value, url: ch.url || null,
      sortOrder: ch.sortOrder, isEnabled: ch.isEnabled, isPrimary: ch.isPrimary,
    }).where(eq(contactChannels.id, id))
    await writeAuditLog({ userId, action: 'UPDATE', entityType: 'CONTACT_CHANNEL', entityId: id, before: existing, after: ch })
  } else {
    const newId = crypto.randomUUID()
    const ts = await now()
    await db.insert(contactChannels).values({
      id: newId, type: ch.type as 'TELEGRAM' | 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'CUSTOM',
      label: ch.label, value: ch.value, url: ch.url || null,
      sortOrder: ch.sortOrder, isEnabled: ch.isEnabled, isPrimary: ch.isPrimary,
    })
    await writeAuditLog({ userId, action: 'CREATE', entityType: 'CONTACT_CHANNEL', entityId: newId, after: ch })
  }
  revalidatePath('/admin/settings')
  void revalidatePublic({ paths: getHomeRevalidatePaths(), type: 'layout' })
  redirect('/admin/settings')
}

export async function deleteContactChannel(id: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(contactChannels).where(eq(contactChannels.id, id)).get()
  if (!existing) throw new Error('Channel not found')
  await db.delete(contactChannels).where(eq(contactChannels.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'CONTACT_CHANNEL', entityId: id, before: existing })
  revalidatePath('/admin/settings')
  void revalidatePublic({ paths: getHomeRevalidatePaths(), type: 'layout' })
  redirect('/admin/settings')
}

export async function reorderContactChannels(ids: string[]) {
  const userId = await requireSettings()
  const db = await getActionDb()
  for (let i = 0; i < ids.length; i++) {
    await db.update(contactChannels).set({ sortOrder: i }).where(eq(contactChannels.id, ids[i]))
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'CONTACT_CHANNEL', entityId: 'batch', after: { order: ids } })
  revalidatePath('/admin/settings')
  void revalidatePublic({ paths: getHomeRevalidatePaths(), type: 'layout' })
}
