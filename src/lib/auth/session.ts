import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from './permissions'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
}

/**
 * Отримує поточного адмін-користувача з сесії.
 * Використовувати в Server Components та Server Actions.
 */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
    role: session.user.role,
  }
}

/**
 * Перевіряє роль користувача. Якщо роль нижча за необхідну — redirect.
 * Мінімальна ієрархія: OWNER > ADMIN > EDITOR > VIEWER
 */
export async function requireRole(minRole: UserRole): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  const hierarchy: Record<UserRole, number> = {
    VIEWER: 0,
    EDITOR: 1,
    ADMIN: 2,
    OWNER: 3,
  }

  if ((hierarchy[user.role] ?? -1) < hierarchy[minRole]) {
    redirect('/admin')
  }

  return user
}

/**
 * Використовувати в admin layout для перевірки авторизації
 */
export async function requireAuth(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}
