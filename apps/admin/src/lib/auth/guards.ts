import { getCurrentUser, type AdminUser } from './session'
import { canDelete } from './permissions'

export async function requireDelete(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Заборонено')
  return user
}
