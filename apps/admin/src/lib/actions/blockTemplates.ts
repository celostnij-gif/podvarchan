'use server'

import { eq, asc, like } from 'drizzle-orm'
import { siteSettings } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { revalidatePath } from 'next/cache'

const TEMPLATE_PREFIX = 'block_template:'

export interface BlockTemplate {
  id: string
  name: string
  sectionType: string
  contentRu: Record<string, unknown>
  contentUk: Record<string, unknown>
  created: string
  updated: string
}

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user.id
}

function now(): string {
  return new Date().toISOString()
}

/**
 * Save current block content as a reusable template.
 * If `id` is provided, updates existing template.
 */
export async function saveBlockTemplate(data: {
  id?: string
  name: string
  sectionType: string
  contentRu: string
  contentUk: string
}) {
  await requireEdit()
  const db = await getActionDb()
  const id = data.id ?? crypto.randomUUID()
  const key = `${TEMPLATE_PREFIX}${id}`

  const value: Omit<BlockTemplate, 'id'> = {
    name: data.name,
    sectionType: data.sectionType,
    contentRu: JSON.parse(data.contentRu),
    contentUk: JSON.parse(data.contentUk),
    created: now(),
    updated: now(),
  }

  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
  if (existing) {
    // Preserve original created date
    const existingValue = tryParse(existing.valueJson) as Record<string, unknown> | null
    if (existingValue?.created) value.created = String(existingValue.created)
    await db.update(siteSettings).set({ valueJson: JSON.stringify(value), updatedAt: now() }).where(eq(siteSettings.key, key))
  } else {
    await db.insert(siteSettings).values({ key, valueJson: JSON.stringify(value), updatedAt: now() })
  }

  revalidatePath('/admin/pages')
  return id
}

/**
 * List all saved block templates.
 */
export async function listBlockTemplates(): Promise<BlockTemplate[]> {
  await requireEdit()
  const db = await getActionDb()
  const rows = await db
    .select()
    .from(siteSettings)
    .where(like(siteSettings.key, `${TEMPLATE_PREFIX}%`))
    .orderBy(asc(siteSettings.updatedAt))

  const templates: BlockTemplate[] = []
  for (const row of rows) {
    const parsed = tryParse(row.valueJson)
    if (!parsed) continue
    const id = row.key.replace(TEMPLATE_PREFIX, '')
    const p = parsed as Record<string, unknown>
    templates.push({
      id,
      name: (p.name as string) ?? 'Unnamed',
      sectionType: (p.sectionType as string) ?? '',
      contentRu: (p.contentRu as Record<string, unknown>) ?? {},
      contentUk: (p.contentUk as Record<string, unknown>) ?? {},
      created: (p.created as string) ?? row.updatedAt ?? '',
      updated: row.updatedAt ?? '',
    })
  }

  return templates.reverse() // newest first
}

/**
 * Get a single block template by id.
 */
export async function getBlockTemplate(id: string): Promise<BlockTemplate | null> {
  await requireEdit()
  const db = await getActionDb()
  const row = await db.select().from(siteSettings).where(eq(siteSettings.key, `${TEMPLATE_PREFIX}${id}`)).get()
  if (!row) return null

  const parsed = tryParse(row.valueJson)
  if (!parsed) return null
  const p = parsed as Record<string, unknown>

  return {
    id,
    name: (p.name as string) ?? 'Unnamed',
    sectionType: (p.sectionType as string) ?? '',
    contentRu: (p.contentRu as Record<string, unknown>) ?? {},
    contentUk: (p.contentUk as Record<string, unknown>) ?? {},
    created: (p.created as string) ?? row.updatedAt ?? '',
    updated: row.updatedAt ?? '',
  }
}

/**
 * Delete a block template by id.
 */
export async function deleteBlockTemplate(id: string) {
  await requireEdit()
  const db = await getActionDb()
  await db.delete(siteSettings).where(eq(siteSettings.key, `${TEMPLATE_PREFIX}${id}`))
  revalidatePath('/admin/pages')
}

function tryParse(json: string | null): Record<string, unknown> | null {
  if (!json) return null
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
