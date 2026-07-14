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
 * Генерирует JSON-LD объект Service schema.org для страниц услуг.
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
    inLanguage: locale === 'uk' ? 'uk' : 'ru',
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
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
        description: locale === 'uk'
          ? 'Ціни на консультації — на сторінці цін'
          : 'Цены на консультации — на странице цен',
      },
    },

  }
}

/**
 * Генерирует JSON-LD объект ProfessionalService schema.org (глобальный, для всего сайта).
 * ProfessionalService — более корректный тип для онлайн-практики без мед.лицензии,
 * чем MedicalBusiness. Снижает жёсткость YMYL-фильтров Google для ниши психотерапии.
 *
 * Содержит:
 *  - Organization-обёртку с логотипом
 *  - areaServed (Украина + Россия + онлайн для диаспоры)
 *  - priceRange (актуальные цены из /tseny/)
 *  - offers — отдельный Offer на каждый ключевой направление
 *
 * Используется на главной и всех страницах как базовый E-E-A-T сигнал.
 */
export function practiceSchema(locale: string = 'ru'): Record<string, unknown> {
  const isUk = locale === 'uk'
  const priceRange = isUk ? 'Безкоштовно – 400$' : 'Бесплатно – 400$'

  const offers = [
    {
      '@type': 'Offer',
      name: isUk ? 'Гіпнотерапія онлайн' : 'Гипнотерапия онлайн',
      url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
      price: '50',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/OnlineOnly',
      description: isUk
        ? 'Індивідуальна сесія гіпнотерапії — 50$. Курс із 5 сесій — 210$ (замість 250$).'
        : 'Индивидуальная сессия гипнотерапии — 50$. Курс из 5 сессий — 210$ (вместо 250$).',
      itemOffered: {
        '@type': 'Service',
        name: isUk ? 'Гіпнотерапія онлайн' : 'Гипнотерапия онлайн',
        url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
      },
    },
    {
      '@type': 'Offer',
      name: isUk ? 'Консультація психолога онлайн' : 'Консультация психолога онлайн',
      url: `${SITE.url}/uslugi/onlajn-konsultaciya-psyhologa/`,
      price: '50',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/OnlineOnly',
      description: isUk
        ? 'Індивідуальна консультація психолога — 50$.'
        : 'Индивидуальная консультация психолога — 50$.',
      itemOffered: {
        '@type': 'Service',
        name: isUk ? 'Консультація психолога онлайн' : 'Консультация психолога онлайн',
        url: `${SITE.url}/uslugi/onlajn-konsultaciya-psyhologa/`,
      },
    },
    {
      '@type': 'Offer',
      name: isUk ? 'Робота з підсвідомістю' : 'Работа с подсознанием',
      url: `${SITE.url}/uslugi/rabota-s-podsoznaniem/`,
      price: '50',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/OnlineOnly',
      description: isUk
        ? 'Сесія роботи з підсвідомістю — 50$.'
        : 'Сессия работы с подсознанием — 50$.',
      itemOffered: {
        '@type': 'Service',
        name: isUk ? 'Робота з підсвідомістю' : 'Работа с подсознанием',
        url: `${SITE.url}/uslugi/rabota-s-podsoznaniem/`,
      },
    },
    {
      '@type': 'Offer',
      name: isUk ? 'Елітний курс (10 сесій)' : 'Элитный курс (10 сессий)',
      url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
      price: '400',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/OnlineOnly',
      description: isUk
        ? 'Повний курс із 10 сесій — 400$ (замість 500$). Індивідуальний план.'
        : 'Полный курс из 10 сессий — 400$ (вместо 500$). Индивидуальный план.',
      itemOffered: {
        '@type': 'Service',
        name: isUk ? 'Гіпнотерапія онлайн (10 сесій)' : 'Гипнотерапия онлайн (10 сессий)',
        url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
      },
    },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}#practice`,
    name: SITE.fullName,
    inLanguage: isUk ? 'uk' : 'ru',
    description: isUk
      ? 'Онлайн-гіпнотерапія: робота з тривогою, панічними атаками, самосаботажем та підсвідомістю.'
      : 'Онлайн-гипнотерапия: работа с тревогой, паническими атаками, самосаботажем и подсознанием.',
    url: SITE.url,
    logo: `${SITE.url}/logo.webp`,
    image: `${SITE.url}${SITE.defaultOgImage}`,
    telephone: '+380663122069',
    email: 'podvarchan@gmail.com',
    founder: {
      '@type': 'Person',
      '@id': `${SITE.url}/ob-avtore/#person`,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UA',
    },
    areaServed: [
      { '@type': 'Country', name: 'UA' },
      { '@type': 'Country', name: 'RU' },
      {
        '@type': 'AdministrativeArea',
        name: isUk ? 'Онлайн (для української діаспори у всьому світі)' : 'Онлайн (для русскоязычной диаспоры по всему миру)',
      },
    ],
    priceRange,
    offers,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+380663122069',
      email: 'podvarchan@gmail.com',
      url: `${SITE.url}/kontakty/`,
    },
  }
}
