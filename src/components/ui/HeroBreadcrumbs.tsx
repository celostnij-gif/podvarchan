'use client'

import { useBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import { Link } from '@/i18n/routing'

/**
 * HeroBreadcrumbs — хлебные крошки внутри hero секции.
 * Рендерит навигацию + JSON-LD BreadcrumbList для SEO.
 * Используется во всех страницах (кроме главной) внутри hero-секции.
 */
export default function HeroBreadcrumbs() {
  const items = useBreadcrumbs()
  if (items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href
        ? { item: item.href.startsWith('http') ? item.href : `https://podvarchan.com${item.href}` }
        : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
    </>
  )
}
