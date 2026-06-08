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
import StatusBadge from './StatusBadge'

/* ── Breadcrumb mapping ── */

const BREADCRUMB_LABELS: Record<string, string> = {
  'admin': 'Админ-панель',
  'services': 'Услуги',
  'blog': 'Блог',
  'faq': 'FAQ',
  'testimonials': 'Отзывы',
  'pages': 'Страницы',
  'media': 'Медиа',
  'leads': 'Заявки',
  'navigation': 'Навигация',
  'users': 'Пользователи',
  'settings': 'Настройки',
  'redirects': 'Редиректы',
  'audit': 'Журнал',
  'login': 'Вход',
}

/* ── Props ── */

export interface AdminTopbarProps {
  session: SessionWithRole | null
  onToggleSidebar: () => void
}

/* ── Component ── */

export default function AdminTopbar({ session, onToggleSidebar }: AdminTopbarProps) {
  const pathname = usePathname()

  // Формируем хлебные крошки
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const label = BREADCRUMB_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
    return { label, path }
  })

  const roleLabel: Record<string, string> = {
    OWNER: 'Владелец',
    ADMIN: 'Админ',
    EDITOR: 'Редактор',
    VIEWER: 'Зритель',
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-6 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-200"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" aria-hidden="true" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-zinc-200 font-medium truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200 truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3 shrink-0">
        {session && (
          <>
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gold" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px]">
                  {session.user.email}
                </span>
                <StatusBadge
                  status={
                    session.user.role === 'OWNER' || session.user.role === 'ADMIN'
                      ? 'active'
                      : 'inactive'
                  }
                  label={roleLabel[session.user.role] ?? session.user.role}
                  dotOnly
                />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
              aria-label="Выйти"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
