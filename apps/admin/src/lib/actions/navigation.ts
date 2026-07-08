'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, asc } from 'drizzle-orm'
import { navigationItems } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidateSiteLayout } from '@/lib/revalidate'

async function requireSettings(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canManageSettings(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const navSchema = z.object({
  location: z.enum(['HEADER', 'FOOTER', 'MOBILE']).optional().default('HEADER'),
  parentId: z.string().optional().default(''),
  href: z.string().max(500).optional().default(''),
  labelRu: z.string().min(1).max(200).optional().default(''),
  labelUk: z.string().min(1).max(200).optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isEnabled: z.coerce.boolean().optional().default(true),
})

export async function getNavigationItems() {
  await requireSettings()
  const db = await getActionDb()
  return db.select().from(navigationItems).orderBy(asc(navigationItems.sortOrder))
}

export async function saveNavigationItem(data: FormData) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const id = data.get('id') as string | null
  const parsed = navSchema.safeParse({
    location: data.get('location'), parentId: data.get('parentId'),
    href: data.get('href'), labelRu: data.get('labelRu'), labelUk: data.get('labelUk'),
    sortOrder: data.get('sortOrder'), isEnabled: data.get('isEnabled') === 'on' || data.get('isEnabled') === 'true',
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const item = parsed.data
  if (id) {
    const existing = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).get()
    if (!existing) throw new Error('Nav item not found')
    await db.update(navigationItems).set({
      location: item.location, href: item.href || null,
      parentId: item.parentId || null, labelRu: item.labelRu || null, labelUk: item.labelUk || null,
      sortOrder: item.sortOrder, isEnabled: item.isEnabled,
    }).where(eq(navigationItems.id, id))
    await writeAuditLog({ userId, action: 'UPDATE', entityType: 'NAVIGATION', entityId: id, before: existing, after: item })
  } else {
    const newId = crypto.randomUUID()
    await db.insert(navigationItems).values({
      id: newId, location: item.location, href: item.href || null,
      parentId: item.parentId || null, labelRu: item.labelRu || null, labelUk: item.labelUk || null,
      sortOrder: item.sortOrder, isEnabled: item.isEnabled,
    })
    await writeAuditLog({ userId, action: 'CREATE', entityType: 'NAVIGATION', entityId: newId, after: item })
  }
  revalidatePath('/admin/settings')
  revalidateSiteLayout('/')
  redirect('/admin/settings')
}

export async function deleteNavigationItem(id: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).get()
  if (!existing) throw new Error('Nav item not found')
  await db.delete(navigationItems).where(eq(navigationItems.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'NAVIGATION', entityId: id, before: existing })
  revalidatePath('/admin/settings')
  revalidateSiteLayout('/')
  redirect('/admin/settings')
}

export async function toggleNavigationItem(id: string) {
  const userId = await requireSettings()
  const db = await getActionDb()
  const existing = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).get()
  if (!existing) throw new Error('Nav item not found')
  await db.update(navigationItems).set({ isEnabled: !existing.isEnabled }).where(eq(navigationItems.id, id))
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'NAVIGATION', entityId: id, before: existing, after: { isEnabled: !existing.isEnabled } })
  revalidatePath('/admin/settings')
  revalidateSiteLayout('/')
}

export async function reorderNavigationItems(items: { id: string; parentId: string | null; sortOrder: number }[]) {
  const userId = await requireSettings()
  const db = await getActionDb()
  for (const item of items) {
    await db.update(navigationItems).set({ parentId: item.parentId, sortOrder: item.sortOrder }).where(eq(navigationItems.id, item.id))
  }
  await writeAuditLog({ userId, action: 'REORDER', entityType: 'NAVIGATION', entityId: 'batch', after: { items } })
  revalidatePath('/admin/settings')
  revalidateSiteLayout('/')
}
