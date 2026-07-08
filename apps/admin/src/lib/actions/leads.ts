'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { contactLeads, leadEvents } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'

const leadStatuses = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM'] as const

async function requireView() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

async function requireEdit() {
  const user = await requireView()
  if (!canEditContent(user.role)) throw new Error('Forbidden')
  return user
}

async function now(): Promise<string> { return new Date().toISOString() }

export async function getLeads() {
  await requireView()
  const db = await getActionDb()
  return db.select().from(contactLeads).orderBy(contactLeads.createdAt)
}

export async function markLeadRead(id: string) {
  const user = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(contactLeads).where(eq(contactLeads.id, id)).get()
  if (!existing) throw new Error('Lead not found')
  await db.update(contactLeads).set({ status: 'CONTACTED' }).where(eq(contactLeads.id, id))
  await writeAuditLog({ userId: user.id, action: 'UPDATE', entityType: 'LEAD', entityId: id, before: existing, after: { status: 'CONTACTED' } })
  revalidatePath('/admin/leads')
}

export async function deleteLead(id: string) {
  const user = await requireView()
  if (!canDelete(user.role)) throw new Error('Forbidden')
  const db = await getActionDb()
  await db.delete(leadEvents).where(eq(leadEvents.leadId, id))
  await db.delete(contactLeads).where(eq(contactLeads.id, id))
  await writeAuditLog({ userId: user.id, action: 'DELETE', entityType: 'LEAD', entityId: id })
  revalidatePath('/admin/leads')
}

export async function exportLeads() {
  await requireView()
  const db = await getActionDb()
  return db.select().from(contactLeads).orderBy(contactLeads.createdAt)
}

/* ── Status update ── */

const statusSchema = z.object({
  status: z.enum(leadStatuses),
})

const eventSchema = z.object({
  type: z.string().min(1).max(100),
  note: z.string().max(2000).optional().default(''),
})

const noteSchema = z.object({
  note: z.string().max(5000),
})

export async function updateLeadStatus(id: string, formData: FormData) {
  const user = await requireEdit()
  const db = await getActionDb()

  const parsed = statusSchema.safeParse({ status: formData.get('status') })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const lead = await db.select().from(contactLeads).where(eq(contactLeads.id, id)).get()
  if (!lead) throw new Error('Lead not found')

  const prevStatus = lead.status
  await db.update(contactLeads).set({ status: parsed.data.status, updatedAt: await now() }).where(eq(contactLeads.id, id))

  await writeAuditLog({ userId: user.id, action: 'UPDATE', entityType: 'LEAD', entityId: id, before: { status: prevStatus }, after: { status: parsed.data.status } })

  // Auto-add event
  await db.insert(leadEvents).values({
    id: crypto.randomUUID(), leadId: id, userId: user.id,
    type: 'STATUS_CHANGE', note: `Статус змінено: ${prevStatus} → ${parsed.data.status}`,
    createdAt: await now(),
  })

  revalidatePath(`/admin/leads/${id}`)
  revalidatePath('/admin/leads')
}

export async function addLeadEvent(leadId: string, formData: FormData) {
  const user = await requireEdit()
  const db = await getActionDb()

  const parsed = eventSchema.safeParse({ type: formData.get('type'), note: formData.get('note') ?? '' })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  await db.insert(leadEvents).values({
    id: crypto.randomUUID(), leadId, userId: user.id,
    type: parsed.data.type, note: parsed.data.note || null, createdAt: await now(),
  })
  await db.update(contactLeads).set({ updatedAt: await now() }).where(eq(contactLeads.id, leadId))

  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath('/admin/leads')
}

export async function updateInternalNote(leadId: string, formData: FormData) {
  const user = await requireEdit()
  const db = await getActionDb()

  const parsed = noteSchema.safeParse({ note: formData.get('note') ?? '' })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  await db.update(contactLeads).set({ internalNote: parsed.data.note, updatedAt: await now() }).where(eq(contactLeads.id, leadId))
  await writeAuditLog({ userId: user.id, action: 'UPDATE', entityType: 'LEAD', entityId: leadId })

  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath('/admin/leads')
}
