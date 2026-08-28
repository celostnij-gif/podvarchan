import { describe, it, expect } from 'vitest'
import {
  canPublish,
  canDelete,
  canManageUsers,
  canDeleteUsers,
  canEditContent,
  canManageSettings,
  canViewAudit,
} from '@/lib/auth/permissions'
import type { UserRole } from '@/lib/auth/permissions'

const ALL_ROLES: UserRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']

function allowed(fn: (role: UserRole) => boolean): UserRole[] {
  return ALL_ROLES.filter(fn)
}

function denied(fn: (role: UserRole) => boolean): UserRole[] {
  return ALL_ROLES.filter((r) => !fn(r))
}

describe('permissions', () => {
  describe('canPublish', () => {
    it('allows OWNER and ADMIN', () => {
      expect(allowed(canPublish)).toEqual(['OWNER', 'ADMIN'])
    })

    it('denies EDITOR and VIEWER', () => {
      expect(denied(canPublish)).toEqual(['EDITOR', 'VIEWER'])
    })
  })

  describe('canDelete', () => {
    it('allows OWNER and ADMIN (ADMIN deletes content, not users)', () => {
      expect(allowed(canDelete)).toEqual(['OWNER', 'ADMIN'])
    })

    it('denies EDITOR and VIEWER', () => {
      expect(denied(canDelete)).toEqual(['EDITOR', 'VIEWER'])
    })
  })

  describe('canManageUsers', () => {
    it('allows only OWNER', () => {
      expect(allowed(canManageUsers)).toEqual(['OWNER'])
    })
  })

  describe('canDeleteUsers', () => {
    it('allows only OWNER (ADMIN never deletes other user accounts)', () => {
      expect(allowed(canDeleteUsers)).toEqual(['OWNER'])
    })

    it('denies ADMIN, EDITOR, VIEWER', () => {
      expect(denied(canDeleteUsers)).toEqual(['ADMIN', 'EDITOR', 'VIEWER'])
    })
  })

  describe('canEditContent', () => {
    it('allows OWNER, ADMIN, EDITOR', () => {
      expect(allowed(canEditContent)).toEqual(['OWNER', 'ADMIN', 'EDITOR'])
    })

    it('denies VIEWER', () => {
      expect(denied(canEditContent)).toEqual(['VIEWER'])
    })
  })

  describe('canManageSettings', () => {
    it('allows OWNER and ADMIN', () => {
      expect(allowed(canManageSettings)).toEqual(['OWNER', 'ADMIN'])
    })

    it('denies EDITOR and VIEWER', () => {
      expect(denied(canManageSettings)).toEqual(['EDITOR', 'VIEWER'])
    })
  })

  describe('canViewAudit', () => {
    it('allows OWNER, ADMIN, EDITOR', () => {
      expect(allowed(canViewAudit)).toEqual(['OWNER', 'ADMIN', 'EDITOR'])
    })

    it('denies VIEWER', () => {
      expect(denied(canViewAudit)).toEqual(['VIEWER'])
    })
  })
})
