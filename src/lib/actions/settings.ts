'use server'

/**
 * Server Actions для модуля «Настройки».
 */

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withCanManageSettings, withRole } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

export async function getSiteSettings() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.siteSettings)
    const settings: Record<string, unknown> = {}
    for (const item of items) {
      try { settings[item.key] = JSON.parse(item.valueJson) } catch { settings[item.key] = item.valueJson }
    }
    return ok(settings)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити налаштування')
  }
}

export const updateSiteSetting = withCanManageSettings(async (session, ...args) => {
  try {
    const db = getActionDb()
    const key = args[0] as string
    const value = args[1] as unknown
    const valueJson = JSON.stringify(value)

    const [existing] = await db.select().from(s.siteSettings).where(eq(s.siteSettings.key, key)).limit(1)

    if (existing) {
      await db.update(s.siteSettings).set({ valueJson, updatedById: session.user.id }).where(eq(s.siteSettings.key, key))
    } else {
      await db.insert(s.siteSettings).values({ key, valueJson, updatedById: session.user.id })
    }

    await writeAuditLog({ userId: session.user.id, action: 'SETTINGS_CHANGE', entityType: 'SETTINGS', entityId: key })
    revalidatePath('/admin/settings')
    return okVoid('Налаштування збережено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося зберегти налаштування')
  }
})

/* ═══════════════════════════════════════
   Contact Channels
   ═══════════════════════════════════════ */

export async function getContactChannels() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.contactChannels).orderBy(asc(s.contactChannels.sortOrder))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити канали')
  }
}

export const createContactChannel = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const data = args[0] as {
      type: string; label: string; value: string; url?: string
      isPrimary?: boolean; isEnabled?: boolean; sortOrder?: number
    }
    await db.insert(s.contactChannels).values({
      id: crypto.randomUUID(),
      type: data.type as 'TELEGRAM' | 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'CUSTOM',
      label: data.label, value: data.value, url: data.url ?? null,
      isPrimary: data.isPrimary ?? false,
      isEnabled: data.isEnabled ?? true,
      sortOrder: data.sortOrder ?? 0,
    })
    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'CONTACT_CHANNEL', entityId: '' })
    revalidatePath('/admin/settings')
    return okVoid('Контактний канал додано')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося створити канал')
  }
})

export const updateContactChannel = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] as {
      type?: string; label?: string; value?: string; url?: string | null
      isPrimary?: boolean; isEnabled?: boolean; sortOrder?: number
    }
    const updateData: Record<string, unknown> = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.label !== undefined) updateData.label = data.label
    if (data.value !== undefined) updateData.value = data.value
    if (data.url !== undefined) updateData.url = data.url ?? null
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    await db.update(s.contactChannels).set(updateData as Parameters<typeof db.update<typeof s.contactChannels> extends (infer U)[] ? U : never>[1]).where(eq(s.contactChannels.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'CONTACT_CHANNEL', entityId: id })
    revalidatePath('/admin/settings')
    return okVoid('Канал оновлено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити канал')
  }
})

export const deleteContactChannel = withRole('ADMIN', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    await db.delete(s.contactChannels).where(eq(s.contactChannels.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'CONTACT_CHANNEL', entityId: id })
    revalidatePath('/admin/settings')
    return okVoid('Канал видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити канал')
  }
})
