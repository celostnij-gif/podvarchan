'use server'

/**
 * Server Actions для модуля «Навигация».
 */

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

const NavItemSchema = z.object({
  location: z.enum(['HEADER', 'FOOTER', 'MOBILE']),
  parentId: z.string().optional(),
  href: z.string().min(1, 'Посилання обов\'язкове'),
  labelRu: z.string().min(1, 'Label (RU) обов\'язковий'),
  labelUk: z.string().min(1, 'Label (UK) обов\'язковий'),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function getNavigationItems() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.navigationItems).orderBy(asc(s.navigationItems.sortOrder))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити навігацію')
  }
}

export const createNavItem = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const data = args[0] ?? {}
    const input = NavItemSchema.parse(data)
    await db.insert(s.navigationItems).values({ id: crypto.randomUUID(), ...input, parentId: input.parentId ?? null })
    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'NAV_ITEM', entityId: '' })
    revalidatePath('/admin/navigation')
    return okVoid('Пункт навігації додано')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося створити пункт')
  }
})

export const updateNavItem = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}
    const input = NavItemSchema.partial().parse(data)
    await db.update(s.navigationItems).set(input).where(eq(s.navigationItems.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'NAV_ITEM', entityId: id })
    revalidatePath('/admin/navigation')
    return okVoid('Пункт оновлено')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити пункт')
  }
})

export const deleteNavItem = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    await db.delete(s.navigationItems).where(eq(s.navigationItems.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'NAV_ITEM', entityId: id })
    revalidatePath('/admin/navigation')
    return okVoid('Пункт видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити пункт')
  }
})
