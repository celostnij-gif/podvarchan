import { SITE } from '@/constants'
import { cleanUrl } from './utils'

interface ServiceSchemaParams {
  name: string
  description: string
  url: string
  image?: string
  providerName?: string
  areaServed?: string[]
  locale?: string
}

/**
 * Генерирует JSON-LD объект MedicalBusiness schema.org для страниц услуг.
 * Используется на /uslugi/[slug]/ страницах.
 */
export function serviceSchema(params: ServiceSchemaParams): Record<string, unknown> {
  const {
    name,
    description,
    url,
    image,
    providerName = SITE.authorName,
    areaServed = ['RU', 'UA'],
    locale,
  } = params

  const localePrefix = locale === 'ru' ? 'ru' : locale ?? ''

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: cleanUrl(SITE.url, localePrefix, url),
    image: image ? cleanUrl(SITE.url, image) : undefined,
    provider: {
      '@type': 'Person',
      '@id': `${SITE.url}/ob-avtore/#person`,
      name: providerName,
    },
    areaServed: areaServed.map((country) => ({
      '@type': 'Country',
      name: country,
    })),
    audience: {
      '@type': 'Audience',
      audienceType: locale === 'uk'
        ? 'Дорослі, які шукають психологічну допомогу онлайн'
        : 'Взрослые, ищущие психологическую помощь онлайн',
    },
    offers: {
      '@type': 'Offer',
      name: locale === 'uk' ? `Консультація: ${name}` : `Консультация: ${name}`,
      availability: 'https://schema.org/OnlineOnly',
      url: cleanUrl(SITE.url, localePrefix, url),
    },

  }
}

/**
 * Генерирует JSON-LD объект MedicalBusiness schema.org (глобальный, для всего сайта).
 * Используется на главной и всех страницах как базовый E-E-A-T сигнал.
 */
export function medicalBusinessSchema(locale: string = 'ru'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${SITE.url}#medicalbusiness`,
    name: SITE.fullName,
    description: locale === 'uk'
      ? 'Онлайн-гіпнотерапія: робота з тривогою, панічними атаками, самосаботажем та підсвідомістю.'
      : 'Онлайн-гипнотерапия: работа с тревогой, паническими атаками, самосаботажем и подсознанием.',
    url: SITE.url,
    medicalSpecialty: 'Psychotherapy',
    founder: {
      '@type': 'Person',
      '@id': `${SITE.url}/ob-avtore/#person`,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UA',
    },
    areaServed: [
      { '@type': 'Country', name: 'RU' },
      { '@type': 'Country', name: 'UA' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${SITE.url}/kontakty/`,
    },
  }
}
