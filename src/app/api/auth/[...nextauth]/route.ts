/**
 * NextAuth API Route Handler.
 * Обробляє всі запити до /api/auth/* (signIn, signOut, session, csrf).
 */

import { handlers } from '@/auth'

export const { GET, POST } = handlers
