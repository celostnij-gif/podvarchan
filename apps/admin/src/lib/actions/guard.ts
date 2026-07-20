'use server'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

import type { SessionWithRole } from '@/types/auth'
import type { UserRole } from '@/types/auth'
import { canPublish, canDelete, canManageUsers, canManageSettings } from '@/lib/auth/permissions'
import { requireAdminSession } from '@/lib/auth/session'
import { fail } from './result'
import type { ActionResult } from './result'

type AsyncAction<T, A extends unknown[]> = (session: SessionWithRole, ...args: A) => Promise<ActionResult<T>>

function makeRoleCheck(check: (role: UserRole) => boolean) {
  return <T, A extends unknown[]>(action: AsyncAction<T, A>): (...args: A) => Promise<ActionResult<T>> => {
    return async (...args: A) => {
      try {
        const session = await requireAdminSession()
        if (!check(session.user.role)) {
          return fail('Недостатньо прав')
        }
        return action(session, ...args)
      } catch (e) {
        if (isRedirectError(e)) throw e
        return fail(e instanceof Error ? e.message : 'Unauthorized')
      }
    }
  }
}

export const withAuth = makeRoleCheck(() => true)
export const withRole = <T, A extends unknown[]>(minRole: UserRole, action: AsyncAction<T, A>) =>
  makeRoleCheck((role) => {
    const weight: Record<UserRole, number> = { USER: 0, VIEWER: 10, EDITOR: 20, ADMIN: 30, OWNER: 40 }
    return weight[role] >= weight[minRole]
  })(action)
export const withCanPublish = makeRoleCheck(canPublish)
export const withCanDelete = makeRoleCheck(canDelete)
export const withCanManageUsers = makeRoleCheck(canManageUsers)
export const withCanManageSettings = makeRoleCheck(canManageSettings)

