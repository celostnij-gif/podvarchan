export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

export function canPublish(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role)
}

export function canDelete(role: UserRole): boolean {
  return role === 'OWNER'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER'
}

export function canEditContent(role: UserRole): boolean {
  return ['OWNER', 'ADMIN', 'EDITOR'].includes(role)
}

export function canManageSettings(role: UserRole): boolean {
  return ['OWNER', 'ADMIN'].includes(role)
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

declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole
  }
}
