'use server'

/**
 * Server Actions для CRM — заявки (read-only + статуси + нотатки).
 */

import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

export async function getLeads() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.contactLeads).orderBy(desc(s.contactLeads.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити заявки')
  }
}

export async function getLead(id: string) {
  try {
    const db = getActionDb()
    const [lead] = await db.select().from(s.contactLeads).where(eq(s.contactLeads.id, id)).limit(1)
    if (!lead) return fail('Заявку не знайдено')
    const events = await db.select().from(s.leadEvents).where(eq(s.leadEvents.leadId, id)).orderBy(desc(s.leadEvents.createdAt))
    return ok({ ...lead, events })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити заявку')
  }
}

export const updateLeadStatus = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const status = (args[1] ?? 'NEW') as 'NEW' | 'IN_PROGRESS' | 'CONTACTED' | 'BOOKED' | 'CLOSED' | 'SPAM'
    const [existing] = await db.select().from(s.contactLeads).where(eq(s.contactLeads.id, id)).limit(1)
    if (!existing) return fail('Заявку не знайдено')

    await db.update(s.contactLeads).set({ status }).where(eq(s.contactLeads.id, id))
    await db.insert(s.leadEvents).values({
      id: crypto.randomUUID(),
      leadId: id,
      userId: session.user.id,
      type: 'STATUS_CHANGE',
      note: `Статус змінено: ${existing.status} → ${status}`,
    })

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'LEAD', entityId: id, before: { status: existing.status }, after: { status } })
    revalidatePath('/admin/leads')
    return okVoid('Статус заявки оновлено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити статус')
  }
})

export const addLeadNote = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const note = (args[1] ?? '') as string
    const [existing] = await db.select().from(s.contactLeads).where(eq(s.contactLeads.id, id)).limit(1)
    if (!existing) return fail('Заявку не знайдено')

    await db.insert(s.leadEvents).values({
      id: crypto.randomUUID(),
      leadId: id,
      userId: session.user.id,
      type: 'NOTE',
      note,
    })
    revalidatePath('/admin/leads')
    return okVoid('Нотатку додано')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося додати нотатку')
  }
})

export const deleteLead = withRole('ADMIN', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.contactLeads).where(eq(s.contactLeads.id, id)).limit(1)
    if (!existing) return fail('Заявку не знайдено')

    await db.delete(s.contactLeads).where(eq(s.contactLeads.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'LEAD', entityId: id })
    revalidatePath('/admin/leads')
    return okVoid('Заявку видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити заявку')
  }
})
