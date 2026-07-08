'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, asc } from 'drizzle-orm'
import { redirectRules } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'

async function requireSettings(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canManageSettings(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const redirectSchema = z.object({
  fromPath: z.string().min(1).max(500),
  toPath: z.string().min(1).max(500),
  statusCode: z.coerce.number().int().optional().default(301),
  isEnabled: z.coerce.boolean().optional().default(true),
})

export async function getRedirectRules() {
  await requireSettings()
  const db = await getActionDb()
  return db.select().from(redirectRules).orderBy(asc(redirectRules.createdAt))
}

export async function saveRedirectRule(data: FormData) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const id = data.get('id') as string | null
  const parsed = redirectSchema.safeParse({
    fromPath: data.get('fromPath'), toPath: data.get('toPath'),
    statusCode: data.get('statusCode'), isEnabled: data.get('isEnabled') === 'on' || data.get('isEnabled') === 'true',
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const rule = parsed.data
  if (id) {
    const existing = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
    if (!existing) throw new Error('Redirect rule not found')
    await db.update(redirectRules).set({
      fromPath: rule.fromPath, toPath: rule.toPath,
      statusCode: rule.statusCode, isEnabled: rule.isEnabled,
    }).where(eq(redirectRules.id, id))
    await writeAuditLog({ userId, action: 'UPDATE', entityType: 'REDIRECT', entityId: id, before: existing, after: rule })
  } else {
    const newId = crypto.randomUUID()
    await db.insert(redirectRules).values({
      id: newId, fromPath: rule.fromPath, toPath: rule.toPath,
      statusCode: rule.statusCode, isEnabled: rule.isEnabled, createdAt: await now(),
    })
    await writeAuditLog({ userId, action: 'CREATE', entityType: 'REDIRECT', entityId: newId, after: rule })
  }
  revalidatePath('/admin/settings')
  redirect('/admin/settings')
}

export async function deleteRedirectRule(id: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
  if (!existing) throw new Error('Redirect rule not found')
  await db.delete(redirectRules).where(eq(redirectRules.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'REDIRECT', entityId: id, before: existing })
  revalidatePath('/admin/settings')
  redirect('/admin/settings')
}

export async function toggleRedirectRule(id: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
  if (!existing) throw new Error('Redirect rule not found')
  await db.update(redirectRules).set({ isEnabled: !existing.isEnabled }).where(eq(redirectRules.id, id))
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'REDIRECT', entityId: id, before: existing, after: { isEnabled: !existing.isEnabled } })
  revalidatePath('/admin/settings')
}

export async function updateRedirectHitCount(id: string) {
  const db = await getActionDb()
  const existing = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
  if (!existing) throw new Error('Redirect rule not found')
  await db.update(redirectRules).set({ hitCount: (existing.hitCount ?? 0) + 1 }).where(eq(redirectRules.id, id))
}
