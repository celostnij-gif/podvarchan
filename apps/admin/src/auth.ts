import NextAuth from 'next-auth'
import authConfig from './auth.config'
import type { UserRole } from './lib/auth/permissions'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        // token.sub is auto-populated with user.id by NextAuth v5 from authorize()
        session.user.id = token.sub as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
})
