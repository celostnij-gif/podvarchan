import type { SessionWithRole } from '@/types/auth'
import type { UserRole } from './permissions'

/**
 * СТАБ: Повертає null (тимчасово, до міграції Auth).
 */
export async function getAdminSession(): Promise<SessionWithRole | null> {
  return null
}

/**
 * СТАБ: Кидає помилку (тимчасово, до міграції Auth).
 */
export async function requireAdminSession(): Promise<SessionWithRole> {
  throw new Error('Auth not migrated yet')
}

export async function requireRole(_minRole: string): Promise<SessionWithRole> {
  throw new Error('Auth not migrated yet')
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  return null
}
