import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getDB } from '@/db'
import { users } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'

export default {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const db = getDB()
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .get()

        if (!user || !user.isActive) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

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
