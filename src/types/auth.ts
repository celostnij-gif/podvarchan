/**
 * Типи для системи авторизації адмін-панелі.
 *
 * Розширює стандартні типи NextAuth/Auth.js для роботи з ролями.
 */

import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

/* ── Ролі користувачів ── */

export type UserRole = 'USER' | 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'

/* ── Розширення типів NextAuth ── */

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
  }
}

/* ── Додаткові типи ── */

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
