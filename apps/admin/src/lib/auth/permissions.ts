export type UserRole = 'USER' | 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'

export function canPublish(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role)
}

export function canDelete(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role)
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER'
}

/** Only OWNER can delete (and thereby remove access of) other user accounts. */
export function canDeleteUsers(role: UserRole): boolean {
  return role === 'OWNER'
}

export function canEditContent(role: UserRole): boolean {
  return ['OWNER', 'ADMIN', 'EDITOR'].includes(role)
}

export function canManageSettings(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role)
}

export function canViewAudit(role: UserRole): boolean {
  return ['OWNER', 'ADMIN', 'EDITOR'].includes(role)
}

// Extend next-auth types
declare module 'next-auth' {
  interface User {
    role: UserRole
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }
}
