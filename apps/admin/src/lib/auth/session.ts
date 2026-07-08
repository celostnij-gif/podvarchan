import { auth } from '@/auth'
import type { SessionWithRole } from '@/types/auth'
import type { UserRole } from './permissions'

export async function getAdminSession(): Promise<SessionWithRole | null> {
  const session = await auth()
  if (!session?.user) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? null,
      role: session.user.role as SessionWithRole['user']['role'],
    },
    expires: session.expires!,
  }
}

export async function requireAdminSession(): Promise<SessionWithRole> {
  const session = await getAdminSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireRole(minRole: string): Promise<SessionWithRole> {
  const session = await requireAdminSession()
  const roleWeight: Record<string, number> = {
    VIEWER: 10,
    EDITOR: 20,
    ADMIN: 30,
    OWNER: 40,
  }
  if ((roleWeight[session.user.role] ?? 0) < (roleWeight[minRole] ?? 0)) {
    throw new Error('Forbidden')
  }
  return session
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? '',
    role: session.user.role as UserRole,
  }
}
