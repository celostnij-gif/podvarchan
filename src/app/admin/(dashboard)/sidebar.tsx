'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Дашборд', icon: '📊' },
  { href: '/admin/services', label: 'Послуги', icon: '🔧' },
  { href: '/admin/blog', label: 'Блог', icon: '📝' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/testimonials', label: 'Відгуки', icon: '⭐' },
  { href: '/admin/leads', label: 'Заявки', icon: '📨' },
  { href: '/admin/pages', label: 'Сторінки', icon: '📄' },
  { href: '/admin/media', label: 'Медіа', icon: '🖼️' },
  { href: '/admin/seo', label: 'SEO', icon: '🔍' },
  { href: '/admin/navigation', label: 'Навігація', icon: '🧭' },
  { href: '/admin/redirects', label: 'Редиректи', icon: '↗️' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col bg-gray-900 text-white">
      <div className="flex h-14 items-center px-4 font-bold text-sm border-b border-gray-700">
        Podvarchan Admin
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
