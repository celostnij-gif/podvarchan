'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Puzzle,
  FileText,
  HelpCircle,
  MessageSquare,
  Image,
  Users,
  Settings,
  Navigation,
  ArrowLeftRight,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { LogoImage } from '@/components/ui/LogoImage'
import { SITE } from '@/constants'

/* ── Types ── */

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

/* ── Navigation config ── */

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Главная',
    items: [
      { label: 'Дашборд', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Контент',
    items: [
      { label: 'Услуги', href: '/admin/services', icon: Puzzle },
      { label: 'Блог', href: '/admin/blog', icon: FileText },
      { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
      { label: 'Отзывы', href: '/admin/testimonials', icon: MessageSquare },
      { label: 'Страницы', href: '/admin/pages', icon: FileText },
      { label: 'Медиа', href: '/admin/media', icon: Image },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Заявки', href: '/admin/leads', icon: Users },
    ],
  },
  {
    label: 'Система',
    items: [
      { label: 'Навигация', href: '/admin/navigation', icon: Navigation },
      { label: 'Пользователи', href: '/admin/users', icon: Users },
      { label: 'Настройки', href: '/admin/settings', icon: Settings },
      { label: 'Редиректы', href: '/admin/redirects', icon: ArrowLeftRight },
      { label: 'Журнал', href: '/admin/audit', icon: ClipboardList },
    ],
  },
]

/* ── Sidebar overlay (mobile) ── */

function Overlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}

/* ── Nav item ── */

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-gold/10 text-gold'
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl border border-gold/20 shadow-glow-gold/20"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <item.icon className="relative z-10 w-4.5 h-4.5 shrink-0" aria-hidden="true" />
      <span className="relative z-10">{item.label}</span>
      {item.badge && (
        <span className="relative z-10 ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold/20 text-gold">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

/* ── Nav group ── */

function NavGroupComponent({ group, pathname }: { group: NavGroup; pathname: string }) {
  return (
    <div className="mb-4">
      <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemComponent key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  )
}

/* ── Sidebar ── */

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <nav className="flex flex-col h-full" aria-label="Админ-панель навигация">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-zinc-800/50">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label={`${SITE.name} — на главную`}>
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center ring-1 ring-gold/20 group-hover:ring-gold/40 transition-all duration-300">
            <LogoImage />
          </div>
          <span className="text-sm font-semibold text-zinc-200 group-hover:text-gold transition-colors duration-300">
            {SITE.name}
          </span>
        </Link>
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <NavGroupComponent key={group.label} group={group} pathname={pathname} />
        ))}
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile overlay */}
      <Overlay isOpen={isOpen} onClose={onClose} />

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800/50 shadow-2xl shadow-black/40 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-zinc-950 border-r border-zinc-800/50">
        {sidebarContent}
      </aside>
    </>
  )
}
