'use server'

/**
 * Server Actions для модуля «Пользователи».
 */

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withCanManageUsers } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

const ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'] as const

const CreateUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  name: z.string().min(1, 'Имя обязательно'),
  role: z.enum(ROLES).default('VIEWER'),
})

const UpdateUserSchema = z.object({
  email: z.string().email('Некорректный email').optional(),
  password: z.string().min(8, 'Минимум 8 символов').optional(),
  name: z.string().min(1, 'Имя обязательно').optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
})

export async function getUsers() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.users).orderBy(asc(s.users.createdAt))
    const sanitized = items.map(({ passwordHash: _, ...u }) => u)
    return ok(sanitized)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити користувачів')
  }
}

export const createUser = withCanManageUsers(async (session, ...args) => {
  try {
    const db = getActionDb()
    const data = args[0] ?? {}
    const input = CreateUserSchema.parse(data)

    const [existing] = await db.select().from(s.users).where(eq(s.users.email, input.email)).limit(1)
    if (existing) return fail('Користувач з таким email вже існує')

    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(input.password, 12)

    await db.insert(s.users).values({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await writeAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'USER',
      entityId: input.email,
    })
    revalidatePath('/admin/users')
    return okVoid('Користувача створено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося створити користувача')
  }
})

export const updateUser = withCanManageUsers(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}
    const input = UpdateUserSchema.parse(data)

    const updateData: Record<string, unknown> = {}
    if (input.email !== undefined) updateData.email = input.email
    if (input.name !== undefined) updateData.name = input.name
    if (input.role !== undefined) updateData.role = input.role
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.password) {
      const bcrypt = await import('bcryptjs')
      updateData.passwordHash = await bcrypt.hash(input.password, 12)
    }
    updateData.updatedAt = new Date()

    await db.update(s.users).set(updateData).where(eq(s.users.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'USER', entityId: id })
    revalidatePath('/admin/users')
    return okVoid('Користувача оновлено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити користувача')
  }
})

export const deleteUser = withCanManageUsers(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string

    // Нельзя удалить самого себя
    if (id === session.user.id) return fail('Не можна видалити себе')

    await db.delete(s.users).where(eq(s.users.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'USER', entityId: id })
    revalidatePath('/admin/users')
    return okVoid('Користувача видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити користувача')
  }
})
