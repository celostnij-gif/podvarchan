'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Menu,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react'
import type { SessionWithRole } from '@/types/auth'
import StatusBadge, { type StatusVariant } from './StatusBadge'

const BREADCRUMB_LABELS: Record<string, string> = {
  'admin': 'Адмін-панель',
  'services': 'Послуги',
  'blog': 'Блог',
  'faq': 'FAQ',
  'testimonials': 'Відгуки',
  'pages': 'Сторінки',
  'media': 'Медіа',
  'leads': 'Заявки',
  'navigation': 'Навігація',
  'users': 'Користувачі',
  'settings': 'Налаштування',
  'redirects': 'Редиректи',
  'audit': 'Журнал',
  'login': 'Вхід',
}

export interface AdminTopbarProps {
  session: SessionWithRole | null
  onToggleSidebar: () => void
}

export default function AdminTopbar({ session, onToggleSidebar }: AdminTopbarProps) {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    return { label: BREADCRUMB_LABELS[segment] ?? segment, href }
  })


  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-6 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          aria-label="Відкрити меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-zinc-100 font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-zinc-300 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {session && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-200 leading-tight">{session.user.name ?? session.user.email}</p>
              <StatusBadge status={session.user.role.toLowerCase() as StatusVariant} />
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          title="Вийти"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
