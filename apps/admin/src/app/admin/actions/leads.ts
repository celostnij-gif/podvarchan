'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getDB } from '@/db'
import { contactLeads, leadEvents } from '@/db/schema/leads'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { UserRole } from '@/lib/auth/permissions'

const leadStatuses = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM'] as const

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

function now(): string {
  return new Date().toISOString()
}

async function requireView(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  // Everyone authenticated can view leads
  return { id: user.id, role: user.role }
}

export async function updateLeadStatus(id: string, formData: FormData) {
  const user = await requireView()
  if (!canEditContent(user.role)) {
    throw new Error('Forbidden')
  }
  const db = getDB()

  const raw = {
    status: formData.get('status'),
  }
  const parsed = statusSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  const { status } = parsed.data
  const lead = await db.select().from(contactLeads).where(eq(contactLeads.id, id)).get()
  if (!lead) {
    throw new Error('Lead not found')
  }

  const prevStatus = lead.status

  await db
    .update(contactLeads)
    .set({ status, updatedAt: now() })
    .where(eq(contactLeads.id, id))

  // Audit log
  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: user.id,
    action: 'UPDATE',
    entityType: 'lead',
    entityId: id,
    beforeJson: JSON.stringify({ status: prevStatus }),
    afterJson: JSON.stringify({ status }),
    createdAt: now(),
  })

  // Auto-add event
  await db.insert(leadEvents).values({
    id: randomUUID(),
    leadId: id,
    userId: user.id,
    type: 'STATUS_CHANGE',
    note: `Статус змінено: ${prevStatus} → ${status}`,
    createdAt: now(),
  })

  revalidatePath(`/admin/leads/${id}`)
  revalidatePath('/admin/leads')
}

export async function addLeadEvent(leadId: string, formData: FormData) {
  const user = await requireView()
  if (!canEditContent(user.role)) {
    throw new Error('Forbidden')
  }
  const db = getDB()

  const raw = {
    type: formData.get('type'),
    note: formData.get('note') ?? '',
  }
  const parsed = eventSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  await db.insert(leadEvents).values({
    id: randomUUID(),
    leadId,
    userId: user.id,
    type: parsed.data.type,
    note: parsed.data.note || null,
    createdAt: now(),
  })

  // Touch updatedAt on lead
  await db
    .update(contactLeads)
    .set({ updatedAt: now() })
    .where(eq(contactLeads.id, leadId))

  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath('/admin/leads')
}

export async function updateInternalNote(leadId: string, formData: FormData) {
  const user = await requireView()
  if (!canEditContent(user.role)) {
    throw new Error('Forbidden')
  }
  const db = getDB()

  const raw = {
    note: formData.get('note') ?? '',
  }
  const parsed = noteSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  await db
    .update(contactLeads)
    .set({
      internalNote: parsed.data.note,
      updatedAt: now(),
    })
    .where(eq(contactLeads.id, leadId))

  // Audit log
  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: user.id,
    action: 'UPDATE',
    entityType: 'lead',
    entityId: leadId,
    createdAt: now(),
  })

  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath('/admin/leads')
}

export async function deleteLead(id: string) {
  const user = await requireView()
  if (!canDelete(user.role)) {
    throw new Error('Forbidden')
  }
  const db = getDB()

  await db.delete(leadEvents).where(eq(leadEvents.leadId, id))
  await db.delete(contactLeads).where(eq(contactLeads.id, id))

  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: user.id,
    action: 'DELETE',
    entityType: 'lead',
    entityId: id,
    createdAt: now(),
  })

  revalidatePath('/admin/leads')
}

export type { UserRole }
