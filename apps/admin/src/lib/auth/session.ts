import { auth } from '@/auth'
import type { SessionWithRole } from '@/types/auth'
import { users } from '@podvarchan/shared'
import { eq } from 'drizzle-orm'
import { getActionDb } from '@/lib/actions/db'
import type { UserRole } from './permissions'

// Re-validates the session against D1 on every call: the JWT role is not
// trusted after login, so deactivated/downgraded users lose privileges
// immediately, not when the token expires.
let _persistedUserCache: { id: string; role: UserRole; isActive: boolean } | null = null

async function resolvePersistedUser(
  id: string,
): Promise<{ role: UserRole; isActive: boolean } | null> {
  if (_persistedUserCache && _persistedUserCache.id === id) return _persistedUserCache
  const db = await getActionDb()
  const row = await db
    .select({ role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id))
    .get()
  if (!row) return null
  _persistedUserCache = { id, role: row.role, isActive: row.isActive }
  return _persistedUserCache
}

export async function getAdminSession(): Promise<SessionWithRole | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const persisted = await resolvePersistedUser(session.user.id)
  if (!persisted || !persisted.isActive) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? null,
      role: persisted.role,
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
  if (!session?.user?.id) return null
  const persisted = await resolvePersistedUser(session.user.id)
  if (!persisted || !persisted.isActive) return null
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? '',
    role: persisted.role,
  }
}
