import { SITE } from '@/constants'
import { cleanUrl } from './utils'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaParams {
  items: BreadcrumbItem[]
  locale?: string
}

/**
 * Генерирует JSON-LD объект BreadcrumbList schema.org.
 * Используется на всех страницах, где отображаются хлебные крошки.
 *
 * @example
 * ```ts
 * breadcrumbSchema([
 *   { name: 'Главная', url: '/' },
 *   { name: 'Услуги', url: '/uslugi/' },
 *   { name: 'Гипнотерапия онлайн', url: '/uslugi/gipnoterapiya-onlayn/' },
 * ])
 * ```
 */
export function breadcrumbSchema(params: BreadcrumbSchemaParams): Record<string, unknown> {
  const { items, locale } = params
  const localePrefix = locale === 'ru' ? 'ru' : locale ?? ''
  const lastUrl = items[items.length - 1].url

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${cleanUrl(SITE.url, localePrefix, lastUrl)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: cleanUrl(SITE.url, localePrefix, item.url),
    })),
  }
}
