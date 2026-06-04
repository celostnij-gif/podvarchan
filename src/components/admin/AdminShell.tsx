'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import type { SessionWithRole } from '@/types/auth'

/* ── Props ── */

export interface AdminShellProps {
  children: ReactNode
  session: SessionWithRole | null
}

/* ── Paths that should render without shell ── */

const PUBLIC_ADMIN_PATHS = ['/admin/login']

/* ── Component ── */

export default function AdminShell({ children, session }: AdminShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Сторінки без shell (логін, помилки) — тільки контент на темному фоні
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return (
      <div className="min-h-screen bg-zinc-950">
        {children}
      </div>
    )
  }

  function handleToggleSidebar() {
    setSidebarOpen((prev) => !prev)
  }

  function handleCloseSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <AdminTopbar session={session} onToggleSidebar={handleToggleSidebar} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-6 xl:px-8 py-4 border-t border-zinc-800/50">
          <p className="text-xs text-zinc-600 text-center">
            &copy; {new Date().getFullYear()} Podvarchan.com &mdash; Админ-панель
          </p>
        </footer>
      </div>
    </div>
  )
}
