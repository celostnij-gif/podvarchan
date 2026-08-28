import { getCurrentUser, type AdminUser } from './session'
import { canDelete, canDeleteUsers } from './permissions'

export async function requireDelete(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Заборонено')
  return user
}

/** Content delete vs user-account delete are different capabilities (ADMIN deletes content, not other users). */
export async function requireDeleteUser(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user || !canDeleteUsers(user.role)) throw new Error('Заборонено')
  return user
}
