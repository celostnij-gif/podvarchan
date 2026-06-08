/**
 * Root layout для адмін-панелі (/admin/*).
 * Обгортає контент в AdminShell (Sidebar + Topbar + Footer).
 * Сторінка /admin/login — виключення: рендериться без Shell.
 */

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getAdminSession } from '@/lib/auth/session'
import { AdminShell } from '@/components/admin'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    template: '%s | Podvarchan.com',
    default: 'Админ-панель | Podvarchan.com',
  },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession()

  return <AdminShell session={session}>{children}</AdminShell>
}
