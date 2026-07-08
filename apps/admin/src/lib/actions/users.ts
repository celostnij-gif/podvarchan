'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { users } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canManageUsers } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'

async function requireManageUsers(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canManageUsers(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'USER']).optional(),
  isActive: z.coerce.boolean().optional(),
})

export async function getUsers() {
  await requireManageUsers()
  const db = await getActionDb()
  return db.select().from(users).orderBy(users.createdAt)
}

export async function updateUser(id: string, formData: FormData) {
  const userId = await requireManageUsers()
  const db = await getActionDb()
  const existing = await db.select().from(users).where(eq(users.id, id)).get()
  if (!existing) throw new Error('User not found')
  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'), role: formData.get('role'), isActive: formData.get('isActive'),
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  const updateData: Record<string, unknown> = { updatedAt: await now() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.role !== undefined) updateData.role = data.role
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  await db.update(users).set(updateData).where(eq(users.id, id))
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'USER', entityId: id, before: existing, after: data })
  revalidatePath('/admin/users')
}

export async function deleteUser(id: string) {
  const userId = await requireManageUsers()
  const db = await getActionDb()
  const existing = await db.select().from(users).where(eq(users.id, id)).get()
  if (!existing) throw new Error('User not found')
  await db.delete(users).where(eq(users.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'USER', entityId: id, before: existing })
  revalidatePath('/admin/users')
}
