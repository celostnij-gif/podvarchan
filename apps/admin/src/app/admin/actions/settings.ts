'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getDB } from '@/db'
import { siteSettings, contactChannels, navigationItems, redirectRules } from '@/db/schema/settings'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { UserRole } from '@/lib/auth/permissions'

/* ── Auth helpers ── */

async function requireEdit(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!canEditContent(user.role)) throw new Error('Forbidden')
  return { id: user.id, role: user.role }
}

function uid(): string {
  return randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

/* ════════════════════════════════════════
   Site Settings (key-value)
   ════════════════════════════════════════ */

export async function getSiteSettings(): Promise<{ key: string; valueJson: string | null }[]> {
  await requireEdit()
  const db = getDB()
  return db.select({ key: siteSettings.key, valueJson: siteSettings.valueJson }).from(siteSettings).all()
}

export async function updateSiteSetting(key: string, valueJson: string) {
  const user = await requireEdit()
  const db = getDB()
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
  if (existing) {
    await db.update(siteSettings)
      .set({ valueJson, updatedById: user.id, updatedAt: now() })
      .where(eq(siteSettings.key, key))
  } else {
    await db.insert(siteSettings).values({ key, valueJson, updatedById: user.id, updatedAt: now() })
  }
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'site_settings', entityId: key,
    action: existing ? 'UPDATE' : 'CREATE', userId: user.id, afterJson: valueJson, createdAt: now(),
  })
  revalidatePath('/admin/settings')
}

export async function deleteSiteSetting(key: string) {
  const user = await requireEdit()
  const db = getDB()
  await db.delete(siteSettings).where(eq(siteSettings.key, key))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'site_settings', entityId: key,
    action: 'DELETE', userId: user.id, createdAt: now(),
  })
  revalidatePath('/admin/settings')
}

/* ════════════════════════════════════════
   Contact Channels
   ════════════════════════════════════════ */

export async function getContactChannels() {
  await requireEdit()
  const db = getDB()
  return db.select().from(contactChannels).orderBy(contactChannels.sortOrder).all()
}

const channelSchema = z.object({
  type: z.enum(['TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM']),
  label: z.string().max(200).optional().default(''),
  value: z.string().max(500).optional().default(''),
  url: z.string().max(500).optional().default(''),
  isPrimary: z.coerce.boolean().optional().default(false),
  isEnabled: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce.number().optional().default(0),
})

export async function saveContactChannel(data: FormData) {
  const user = await requireEdit()
  const parsed = channelSchema.parse(Object.fromEntries(data))
  const db = getDB()
  const id = data.get('id') as string || uid()
  const existing = id ? await db.select().from(contactChannels).where(eq(contactChannels.id, id)).get() : null
  const values = { id, ...parsed }
  if (existing) {
    await db.update(contactChannels).set(values).where(eq(contactChannels.id, id))
  } else {
    await db.insert(contactChannels).values(values)
  }
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'contact_channel', entityId: id,
    action: existing ? 'UPDATE' : 'CREATE', userId: user.id, afterJson: JSON.stringify(parsed), createdAt: now(),
  })
  revalidatePath('/admin/settings')
}

export async function deleteContactChannel(id: string) {
  const user = await requireEdit()
  const db = getDB()
  await db.delete(contactChannels).where(eq(contactChannels.id, id))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'contact_channel', entityId: id,
    action: 'DELETE', userId: user.id, createdAt: now(),
  })
  revalidatePath('/admin/settings')
}

export async function reorderContactChannels(ids: string[]) {
  await requireEdit()
  const db = getDB()
  for (let i = 0; i < ids.length; i++) {
    await db.update(contactChannels).set({ sortOrder: i }).where(eq(contactChannels.id, ids[i]))
  }
  revalidatePath('/admin/settings')
}

/* ════════════════════════════════════════
   Navigation Items (tree)
   ════════════════════════════════════════ */

export async function getNavigationItems() {
  await requireEdit()
  const db = getDB()
  return db.select().from(navigationItems).orderBy(navigationItems.location, navigationItems.sortOrder).all()
}

const navSchema = z.object({
  location: z.enum(['HEADER', 'FOOTER', 'MOBILE']),
  parentId: z.string().optional().default(''),
  href: z.string().max(500).optional().default(''),
  labelRu: z.string().max(200).optional().default(''),
  labelUk: z.string().max(200).optional().default(''),
  isEnabled: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce.number().optional().default(0),
})

export async function saveNavigationItem(data: FormData) {
  const user = await requireEdit()
  const parsed = navSchema.parse(Object.fromEntries(data))
  const db = getDB()
  const id = data.get('id') as string || uid()
  const existing = id && (await db.select().from(navigationItems).where(eq(navigationItems.id, id)).get())
  const values = { id, ...parsed, parentId: parsed.parentId || null }
  if (existing) {
    await db.update(navigationItems).set(values).where(eq(navigationItems.id, id))
  } else {
    await db.insert(navigationItems).values(values)
  }
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'navigation_item', entityId: id,
    action: existing ? 'UPDATE' : 'CREATE', userId: user.id, afterJson: JSON.stringify(values), createdAt: now(),
  })
  revalidatePath('/admin/navigation')
}

export async function deleteNavigationItem(id: string) {
  const user = await requireEdit()
  const db = getDB()
  // Delete children first, then parent
  await db.delete(navigationItems).where(eq(navigationItems.parentId, id))
  await db.delete(navigationItems).where(eq(navigationItems.id, id))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'navigation_item', entityId: id,
    action: 'DELETE', userId: user.id, createdAt: now(),
  })
  revalidatePath('/admin/navigation')
}

export async function toggleNavigationItem(id: string) {
  const user = await requireEdit()
  const db = getDB()
  const item = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).get()
  if (!item) return
  await db.update(navigationItems).set({ isEnabled: !item.isEnabled }).where(eq(navigationItems.id, id))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'navigation_item', entityId: id,
    action: 'UPDATE', userId: user.id, afterJson: JSON.stringify({ isEnabled: !item.isEnabled }), createdAt: now(),
  })
  revalidatePath('/admin/navigation')
}

export async function reorderNavigationItems(items: { id: string; parentId: string | null; sortOrder: number }[]) {
  await requireEdit()
  const db = getDB()
  for (const item of items) {
    await db.update(navigationItems).set({ parentId: item.parentId, sortOrder: item.sortOrder }).where(eq(navigationItems.id, item.id))
  }
  revalidatePath('/admin/navigation')
}

/* ════════════════════════════════════════
   Redirect Rules
   ════════════════════════════════════════ */

export async function getRedirectRules() {
  await requireEdit()
  const db = getDB()
  return db.select().from(redirectRules).orderBy(redirectRules.createdAt).all()
}

const redirectSchema = z.object({
  fromPath: z.string().min(1).max(500),
  toPath: z.string().min(1).max(500),
  statusCode: z.coerce.number().optional().default(301),
  isEnabled: z.coerce.boolean().optional().default(true),
})

export async function saveRedirectRule(data: FormData) {
  const user = await requireEdit()
  const parsed = redirectSchema.parse(Object.fromEntries(data))
  const db = getDB()
  const id = data.get('id') as string || uid()
  const existing = id ? await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get() : null
  const values = { id, ...parsed, createdAt: existing?.createdAt || now() }
  if (existing) {
    await db.update(redirectRules).set(values).where(eq(redirectRules.id, id))
  } else {
    await db.insert(redirectRules).values(values)
  }
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'redirect_rule', entityId: id,
    action: existing ? 'UPDATE' : 'CREATE', userId: user.id, afterJson: JSON.stringify(parsed), createdAt: now(),
  })
  revalidatePath('/admin/redirects')
}

export async function deleteRedirectRule(id: string) {
  const user = await requireEdit()
  const db = getDB()
  await db.delete(redirectRules).where(eq(redirectRules.id, id))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'redirect_rule', entityId: id,
    action: 'DELETE', userId: user.id, createdAt: now(),
  })
  revalidatePath('/admin/redirects')
}

export async function toggleRedirectRule(id: string) {
  const user = await requireEdit()
  const db = getDB()
  const rule = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
  if (!rule) return
  await db.update(redirectRules).set({ isEnabled: !rule.isEnabled }).where(eq(redirectRules.id, id))
  await db.insert(auditLogs).values({
    id: uid(), entityType: 'redirect_rule', entityId: id,
    action: 'UPDATE', userId: user.id, afterJson: JSON.stringify({ isEnabled: !rule.isEnabled }), createdAt: now(),
  })
  revalidatePath('/admin/redirects')
}

export async function updateRedirectHitCount(id: string) {
  const db = getDB()
  const rule = await db.select().from(redirectRules).where(eq(redirectRules.id, id)).get()
  if (rule) {
    await db.update(redirectRules).set({ hitCount: (rule.hitCount || 0) + 1 }).where(eq(redirectRules.id, id))
  }
}
