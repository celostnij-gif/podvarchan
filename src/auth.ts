/**
 * NextAuth конфігурація для адмін-панелі.
 *
 * Використовує credentials provider (email + password) + Google OAuth (опціонально).
 * Користувачі зберігаються в D1 через Drizzle ORM.
 *
 * ВАЖЛИВО: NextAuth v4 API — NextAuth(config) повертає функцію-обробник запитів,
 * а НЕ об'єкт з методами auth/signIn/signOut.
 * Для отримання сесії на сервері використовується getServerSession().
 * Для клієнтського signIn/signOut — next-auth/react.
 *
 * Експортує:
 * - authConfig() — об'єкт конфігурації для NextAuth (для getServerSession)
 * - getAuthHandler() — функція-обробник для API Route (/api/auth/[...nextauth])
 *
 * Лінива ініціалізація (lazy) — щоб уникнути падіння під час `next build`
 * (Cloudflare Worker контекст недоступний на етапі збірки).
 */

import NextAuth, { getServerSession } from 'next-auth'
import type { AuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
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

/** Плейсхолдер пароля для Google-користувачів (не можуть увійти через форму) */
const GOOGLE_PASSWORD_PLACEHOLDER = '__GOOGLE_AUTH__NO_PASSWORD__'

/* ── Лінива ініціалізація конфігурації ── */

type Cached = { config: AuthOptions; handler: (req: Request, res: unknown) => Promise<Response> }

let _cached: Cached | null = null
let _initError: Error | null = null

function buildConfig(): AuthOptions {
  const googleId = process.env.AUTH_GOOGLE_ID ?? ''
  const googleSecret = process.env.AUTH_GOOGLE_SECRET ?? ''
  const hasGoogleConfig = !!(googleId && googleSecret)

  return {
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

          if (!checkRateLimit(email)) return null

          const binding = getDbBinding()
          if (!binding) return null

          const db = drizzle(binding, { schema: dbSchema })

          try {
            const [user] = await db
              .select()
              .from(dbSchema.users)
              .where(eq(dbSchema.users.email, email))
              .limit(1)

            if (!user || !user.isActive) {
              recordAttempt(email, false)
              return null
            }

            const isValid = await bcrypt.compare(password, user.passwordHash)
            if (!isValid) {
              recordAttempt(email, false)
              return null
            }

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
      // ⏸ Google OAuth — будет включено позже
      ...(hasGoogleConfig ? [Google({ clientId: googleId, clientSecret: googleSecret })] : []),
    ],

    callbacks: {
      async signIn({ user, account }) {
        if (account?.provider !== 'google') return true

        const binding = getDbBinding()
        if (!binding) return false

        const db = drizzle(binding, { schema: dbSchema })

        try {
          const email = user.email ?? ''
          if (!email) return false

          const [existing] = await db
            .select()
            .from(dbSchema.users)
            .where(eq(dbSchema.users.email, email))
            .limit(1)

          if (existing) {
            // Оновлюємо googleId, якщо його ще немає
            if (!existing.googleId && account.providerAccountId) {
              await db
                .update(dbSchema.users)
                .set({ googleId: account.providerAccountId })
                .where(eq(dbSchema.users.id, existing.id))
            }
            return true
          }

          // Створюємо нового користувача з Google
          await db.insert(dbSchema.users).values({
            id: crypto.randomUUID(),
            email,
            name: user.name ?? email.split('@')[0],
            googleId: account.providerAccountId,
            passwordHash: GOOGLE_PASSWORD_PLACEHOLDER,
            role: 'VIEWER',
            isActive: true,
          })

          return true
        } catch {
          return false
        }
      },

      async jwt({ token, account, user }) {
        if (account) {
          // OAuth (Google) — отримуємо id та role з БД
          const binding = getDbBinding()
          if (binding) {
            const db = drizzle(binding, { schema: dbSchema })
            try {
              const [dbUser] = await db
                .select()
                .from(dbSchema.users)
                .where(eq(dbSchema.users.email, user?.email ?? ''))
                .limit(1)
              if (dbUser) {
                token.id = dbUser.id
                token.role = dbUser.role
              }
            } catch {
              // fall through
            }
          }
        } else if (user) {
          // Credentials
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
      maxAge: 24 * 60 * 60,
    },
  }
}

function getOrInit(): Cached {
  if (_cached) return _cached
  if (_initError) throw _initError

  try {
    const config = buildConfig()
    const handler = NextAuth(config) as unknown as Cached['handler']
    _cached = { config, handler }
    return _cached
  } catch (err) {
    _initError = err instanceof Error ? err : new Error('NextAuth initialization failed')
    console.error('[Auth] Помилка ініціалізації NextAuth:', _initError)
    throw _initError
  }
}

/* ── Експорт лінивих обгорток ── */

/** authConfig() — об'єкт конфігурації NextAuth (для getServerSession / API Route Handler) */
export function authConfig(): AuthOptions {
  return getOrInit().config
}

/** getAuthHandler() — функція-обробник для API Route (/api/auth/[...nextauth]) */
export function getAuthHandler(): Cached['handler'] {
  return getOrInit().handler
}

/**
 * auth() — перевірка сесії (Server Components / Server Actions).
 * Використовує getServerSession з NextAuth v4.
 */
export async function auth(): Promise<import('next-auth').Session | null> {
  // getServerSession в next-auth v4 приймає (config) для RSC або (req, res, config)
  return await getServerSession(authConfig())
}
