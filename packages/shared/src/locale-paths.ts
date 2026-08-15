export type PublicLocale = 'ru' | 'uk'

const SERVICE_SEGMENT: Record<PublicLocale, string> = { ru: 'uslugi', uk: 'poslugy' }

export function serviceIndexPath(locale: PublicLocale): string {
  return '/' + locale + '/' + SERVICE_SEGMENT[locale] + '/'
}

export function servicePath(locale: PublicLocale, slug: string): string {
  const cleanSlug = slug.replace(/^\/+/, '').replace(/\/+$/, '')
  return serviceIndexPath(locale) + cleanSlug + '/'
}