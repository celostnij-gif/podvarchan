/**
 * Logout route handler.
 * POST /admin/logout — завершує сесію, пише audit log, перенаправляє на login.
 *
 * Використовує auth() для отримання сесії.
 * signOut виконується через GET-запит до /api/auth/signout (NextAuth v4 не має 
 * серверного signOut в цій версії API).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeAuditLog } from '@/lib/audit/log'

 
export async function POST(_request: Request): Promise<NextResponse> {
  try {
    const session = await auth()

    if (session?.user?.id) {
      await writeAuditLog({
        userId: session.user.id,
        action: 'LOGOUT',
        entityType: 'SESSION',
        entityId: session.user.id,
      })
    }
  } catch {
    // Audit log не повинен блокувати вихід
  }

  // Інвалідуємо сесію — NextAuth v4 використовує JWT, просто редіректимо на login
  // з query-параметром для очищення cookie
  const url = new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://podvarchan.com')
  url.searchParams.set('signout', 'true')

  const response = NextResponse.redirect(url)

  // Очищаємо cookie сесії
  response.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' })
  response.cookies.set('next-auth.callback-url', '', { maxAge: 0, path: '/' })
  response.cookies.set('next-auth.csrf-token', '', { maxAge: 0, path: '/' })
  response.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' })

  return response
}
