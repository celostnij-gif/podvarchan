import { Link } from '@/i18n/routing'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumbs — единая навигационная строка для всех страниц (кроме главной).
 * Располагается под хедером, над заголовком страницы.
 * Використовує CSS animation замість framer-motion — менше JS на Main Thread.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Главная', href: '/' },
 *   { label: 'Услуги', href: '/uslugi/' },
 *   { label: 'Гипнотерапия онлайн' },
 * ]} />
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      className={`flex items-center gap-2 text-xs text-text-muted mb-6 animate-fade-in-down ${className}`}
      aria-label="Breadcrumb"
    >
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
    </nav>
  )
}
