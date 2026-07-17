import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { CredentialsSignin } from 'next-auth'
import bcrypt from 'bcryptjs'
import { getDB } from '@/db'
import { users } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import { checkLoginRateLimit, resetLoginRateLimit, getClientIp } from '@/lib/rateLimit'

class TooManyAttempts extends CredentialsSignin {
  code = 'TOO_MANY_ATTEMPTS'
}

export default {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        // Rate limit check — 5 attempts per 15 min per IP
        const ip = request ? getClientIp(request as unknown as Request) : '127.0.0.1'
        const allowed = await checkLoginRateLimit(ip)
        if (!allowed) {
          throw new TooManyAttempts()
        }

        const db = getDB()
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .get()

        if (!user || !user.isActive) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        // Successful login — reset counter
        await resetLoginRateLimit(ip)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
} satisfies NextAuthConfig
