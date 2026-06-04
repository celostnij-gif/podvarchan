'use server'

/**
 * Server Actions для модуля «Настройки».
 */

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withCanManageSettings } from './guard'
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
