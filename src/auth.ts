/**
 * NextAuth (v4) конфігурація для адмін-панелі.
 *
 * Використовує credentials provider (email + password).
 * Користувачі зберігаються в D1 через Drizzle ORM.
 *
 * Експортує:
 * - `auth` — для Server Components / Server Actions
 * - `handlers` — для API Route (GET/POST /api/auth/*)
 * - `signIn`, `signOut` — для клієнтських компонентів
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'
import * as dbSchema from '@/db/schema'

/* ── Функція отримання D1 binding ── */

function getDbBinding(): D1Database | null {
  try {
    const ctx = getCloudflareContext()
    return (ctx.env as unknown as Record<string, unknown>).DB as unknown as D1Database ?? null
  } catch {
    return null
  }
}

/* ── Лічильник спроб для rate limiting (in-memory) ── */

const loginAttempts = new Map<string, { count: number; lockUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(email)

  if (!entry || now > entry.lockUntil) {
    loginAttempts.set(email, { count: 0, lockUntil: 0 })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false
  return true
}

function recordAttempt(email: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(email)
    return
  }

  const now = Date.now()
  const entry = loginAttempts.get(email) ?? { count: 0, lockUntil: 0 }
  entry.count += 1

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockUntil = now + LOCK_DURATION_MS
  }

  loginAttempts.set(email, entry)
}

/* ── NextAuth конфіг ── */

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        // Rate limiting
        if (!checkRateLimit(email)) return null

        // Отримуємо D1 binding
        const binding = getDbBinding()
        if (!binding) return null

        const db = drizzle(binding, { schema: dbSchema })

        try {
          // Шукаємо користувача
          const [user] = await db
            .select()
            .from(dbSchema.users)
            .where(eq(dbSchema.users.email, email))
            .limit(1)

          if (!user || !user.isActive) {
            recordAttempt(email, false)
            return null
          }

          // Перевіряємо пароль
          const isValid = await bcrypt.compare(password, user.passwordHash)
          if (!isValid) {
            recordAttempt(email, false)
            return null
          }

          // Оновлюємо lastLoginAt
          await db
            .update(dbSchema.users)
            .set({ lastLoginAt: new Date() })
            .where(eq(dbSchema.users.id, user.id))

          recordAttempt(email, true)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.role = (user as { role: string }).role as dbSchema.User['role']
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ''
        session.user.role = (token.role ?? 'VIEWER') as dbSchema.User['role']
      }
      return session
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // trustHost опція доступна в NextAuth v5 (@auth/core), не в v4
})
