'use client'

import { useBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import { Link } from '@/i18n/routing'

/**
 * HeroBreadcrumbs — хлебные крошки внутри hero секции.
 * Рендерит только видимую навигацию. JSON-LD BreadcrumbList рендерится
 * на сервере через PageJsonLd (AGENTS.md §5: все JSON-LD в SSR).
 * Используется во всех страницах (кроме главной) внутри hero-секции.
 */
export default function HeroBreadcrumbs() {
  const items = useBreadcrumbs()
  if (items.length === 0) return null

  return (
    <nav className="pt-5 mb-5" aria-label="Breadcrumb">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-border-light select-none" aria-hidden="true">/</span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-gold transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-text-secondary' : ''}>
                  {item.label}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
