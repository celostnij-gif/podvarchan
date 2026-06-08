/**
 * Допоміжні функції для роботи з сесією в адмін-панелі.
 *
 * Використовуються в Server Components, Server Actions та Route Handlers.
 */

import { auth } from '@/auth'
import type { UserRole, SessionWithRole } from '@/types/auth'

/**
 * Отримує поточну сесію адміністратора (може бути null).
 * Використовувати в Server Components.
 */
export async function getAdminSession(): Promise<SessionWithRole | null> {
  const session = await auth()
  if (!session?.user?.email) return null

  return {
    user: {
      id: session.user.id ?? '',
      email: session.user.email,
      name: session.user.name ?? null,
      role: (session.user.role as UserRole) ?? 'VIEWER',
    },
    expires: session.expires ?? '',
  }
}

/**
 * Перевіряє наявність сесії. Використовувати в Server Actions / Route Handlers.
 * @throws Error якщо сесії немає
 */
export async function requireAdminSession(): Promise<SessionWithRole> {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Необхідна авторизація. Увійдіть в адмін-панель.')
  }
  return session
}

/**
 * Перевіряє наявність сесії та мінімальну роль.
 * @param minRole — мінімальна необхідна роль
 * @throws Error якщо сесії немає або роль недостатня
 */
const HIERARCHY: UserRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

export async function requireRole(minRole: UserRole): Promise<SessionWithRole> {
  const session = await requireAdminSession()

  const userLevel = HIERARCHY.indexOf(session.user.role)
  const requiredLevel = HIERARCHY.indexOf(minRole)

  if (userLevel < requiredLevel) {
    throw new Error(`Недостатньо прав. Потрібна роль: ${minRole}, ваша: ${session.user.role}`)
  }

  return session
}
