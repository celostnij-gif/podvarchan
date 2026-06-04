'use server'

/**
 * Server Actions для модуля «Редиректы».
 */

import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

const RedirectSchema = z.object({
  fromPath: z.string().min(1, 'Вихідний шлях обов\'язковий').startsWith('/', 'Шлях має починатися з /'),
  toPath: z.string().min(1, 'Цільовий шлях обов\'язковий').startsWith('/', 'Шлях має починатися з /'),
  statusCode: z.number().int().refine(v => [301, 302, 307, 308].includes(v), 'Код має бути 301, 302, 307 або 308').default(301),
  isEnabled: z.boolean().default(true),
})

export async function getRedirects() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.redirectRules).orderBy(desc(s.redirectRules.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити редиректи')
  }
}

export const createRedirect = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const data = args[0] ?? {}
    const input = RedirectSchema.parse(data)
    await db.insert(s.redirectRules).values({ id: crypto.randomUUID(), ...input, hitCount: 0 })
    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'REDIRECT', entityId: input.fromPath })
    revalidatePath('/admin/redirects')
    return okVoid('Редирект створено')
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
    if (e instanceof Error && e.message?.includes('UNIQUE')) return fail('Такий fromPath вже існує')
    return fail(e instanceof Error ? e.message : 'Не вдалося створити редирект')
  }
})

export const updateRedirect = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}
    const input = RedirectSchema.partial().parse(data)
    await db.update(s.redirectRules).set(input).where(eq(s.redirectRules.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'REDIRECT', entityId: id })
    revalidatePath('/admin/redirects')
    return okVoid('Редирект оновлено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити редирект')
  }
})

export const deleteRedirect = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    await db.delete(s.redirectRules).where(eq(s.redirectRules.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'REDIRECT', entityId: id })
    revalidatePath('/admin/redirects')
    return okVoid('Редирект видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити редирект')
  }
})
