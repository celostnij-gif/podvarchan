/**
 * Типи для системи авторизації адмін-панелі.
 */

export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'

export type SessionWithRole = {
  user: {
    id: string
    email: string
    name: string | null
    role: UserRole
  }
  expires: string
}

export type GuardCheck = (role: UserRole) => boolean
