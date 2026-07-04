'use client'

import { signOut } from 'next-auth/react'
import type { AdminUser } from '@/lib/auth/session'

interface Props {
  user: AdminUser
}

export function AdminHeader({ user }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div className="text-sm text-gray-500">
        {/* Breadcrumb placeholder */}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Вийти
        </button>
      </div>
    </header>
  )
}
