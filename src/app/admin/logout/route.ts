/**
 * Logout route handler.
 * POST /admin/logout — завершує сесію, пише audit log, перенаправляє на login.
 */

import { NextResponse } from 'next/server'
import { auth, signOut } from '@/auth'
import { writeAuditLog } from '@/lib/audit/log'

export async function POST(): Promise<NextResponse> {
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

  // Інвалідуємо сесію через NextAuth signOut
  await signOut({ redirect: false })

  return NextResponse.redirect(new URL('/admin/login', process.env.NEXTAUTH_URL ?? 'https://podvarchan.com'))
}
