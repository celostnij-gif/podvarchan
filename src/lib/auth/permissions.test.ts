import { describe, it, expect } from 'vitest'
import {
  canPublish,
  canDelete,
  canManageUsers,
  canManageSettings,
  canEditContent,
  canViewLeads,
  canUploadMedia,
  canViewAuditLog,
} from './permissions'
import type { UserRole } from '@/types/auth'

const ALL_ROLES: UserRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']
const MIN_EDITOR_ROLES: UserRole[] = ['EDITOR', 'ADMIN', 'OWNER']
const MIN_ADMIN_ROLES: UserRole[] = ['ADMIN', 'OWNER']
const OWNER_ONLY: UserRole[] = ['OWNER']

function testRoleFunction(
  fn: (role: UserRole) => boolean,
  allowed: UserRole[],
  name: string,
) {
  describe(`${name}()`, () => {
    for (const role of ALL_ROLES) {
      const expected = allowed.includes(role)
      it(`${expected ? 'allows' : 'denies'} ${role}`, () => {
        expect(fn(role)).toBe(expected)
      })
    }
  })
}

testRoleFunction(canPublish, MIN_EDITOR_ROLES, 'canPublish')
testRoleFunction(canDelete, MIN_ADMIN_ROLES, 'canDelete')
testRoleFunction(canManageUsers, OWNER_ONLY, 'canManageUsers')
testRoleFunction(canManageSettings, OWNER_ONLY, 'canManageSettings')
testRoleFunction(canEditContent, MIN_EDITOR_ROLES, 'canEditContent')
testRoleFunction(canViewLeads, ALL_ROLES, 'canViewLeads')
testRoleFunction(canUploadMedia, MIN_EDITOR_ROLES, 'canUploadMedia')
testRoleFunction(canViewAuditLog, MIN_ADMIN_ROLES, 'canViewAuditLog')
