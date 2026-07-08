'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import CommandPalette from './CommandPalette'
import type { SessionWithRole } from '@/types/auth'
import { getNewLeadCount } from '@/lib/actions/search'

export interface AdminShellProps {
  children: ReactNode
  session: SessionWithRole | null
}

const PUBLIC_ADMIN_PATHS = ['/admin/login']

export default function AdminShell({ children, session }: AdminShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newLeadsCount, setNewLeadsCount] = useState<number | undefined>(undefined)

  useEffect(() => {
    getNewLeadCount().then((result) => {
      if (result.success) {
        setNewLeadsCount(result.data)
      }
    }).catch(() => {})
  }, [])

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
      <CommandPalette newLeadsCount={newLeadsCount} />
      <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} newLeadsCount={newLeadsCount} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminTopbar session={session} onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          {children}
        </main>
        <footer className="px-4 lg:px-6 xl:px-8 py-4 border-t border-zinc-800/50">
          <p className="text-xs text-zinc-600 text-center">
            &copy; {new Date().getFullYear()} Podvarchan.com &mdash; Админ-панель
          </p>
        </footer>
      </div>
    </div>
  )
}
