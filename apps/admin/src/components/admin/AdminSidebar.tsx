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
  newLeadsCount?: number
}

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
      { label: 'Главная', href: '/admin/home', icon: FileText },
      { label: 'Страницы', href: '/admin/pages', icon: FileText },
      { label: 'Медиа', href: '/admin/media', icon: Image },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Заявки', href: '/admin/leads', icon: Users, badge: '' },
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

function Overlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
    </AnimatePresence>
  )
}

function NavItemComponent({ item, pathname, newLeadsCount: _newLeadsCount }: { item: NavItem; pathname: string; newLeadsCount?: number }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-zinc-800/70 text-zinc-100 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
    </Link>
  )
}

function NavGroupComponent({ group, pathname, newLeadsCount }: { group: NavGroup; pathname: string; newLeadsCount?: number }) {
  return (
    <div className="mb-4">
      <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        {group.label}
      </div>
      {group.items.map((item) => (
        <NavItemComponent key={item.href} item={item} pathname={pathname} newLeadsCount={newLeadsCount} />
      ))}
    </div>
  )
}

export default function AdminSidebar({ isOpen, onClose, newLeadsCount }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <Overlay isOpen={isOpen} onClose={onClose} />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-zinc-800/50">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            <LogoImage className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 truncate">{SITE.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">Панель управления</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{ height: 'calc(100vh - 4rem)' }}>
          {NAV_GROUPS.map((group) => (
            <NavGroupComponent key={group.label} group={group} pathname={pathname} newLeadsCount={newLeadsCount} />
          ))}
        </nav>
      </aside>
    </>
  )
}
