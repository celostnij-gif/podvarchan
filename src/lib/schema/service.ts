import { getTranslations } from 'next-intl/server'
import { SITE, AUTHOR } from '@/constants'
import { getPricingPlans } from '@/lib/db/public'
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
    providerName,
    areaServed = ['Worldwide'],
    locale,
  } = params
  const effectiveProviderName = providerName ?? (locale === 'uk' ? AUTHOR.nameUk : AUTHOR.name)

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
      name: effectiveProviderName,
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
export async function practiceSchema(locale: string = 'ru'): Promise<Record<string, unknown>> {
  const isUk = locale === 'uk'
  const pricesPath = isUk ? '/uk/tsiny/' : '/ru/tseny/'
  const pricesUrl = `${SITE.url}${pricesPath}`

  // Цены — из D1 (pricing_plans). При недоступности D1 — прежний fallback-прайс.
  const plans = await getPricingPlans(locale).catch(() => null)

  let priceRange = isUk ? 'Безкоштовно – 400$' : 'Бесплатно – 400$'
  let offers: Record<string, unknown>[]

  if (plans && plans.length > 0) {
    const t = await getTranslations({ locale, namespace: 'tseny' })
    const freeLabel = t('freeConsultationPrice') // «Бесплатно» / «Безкоштовно»
    const prices = plans.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    priceRange = min === 0 ? `${freeLabel} – ${max}$` : `${min}$ – ${max}$`
    offers = plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.title,
      url: pricesUrl,
      price: String(plan.price),
      priceCurrency: plan.currency,
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      description: plan.description ?? plan.subtitle ?? undefined,
      itemOffered: {
        '@type': 'Service',
        name: plan.title,
        url: pricesUrl,
      },
    }))
  } else {
    // Fallback: D1 недоступен — константный прайс (историческое поведение).
    const serviceNames: Array<{ name: string; url: string; desc: string }> = [
      {
        name: isUk ? 'Гіпнотерапія онлайн' : 'Гипнотерапия онлайн',
        url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
        desc: isUk
          ? 'Індивідуальна сесія гіпнотерапії — 50$. Курс із 5 сесій — 210$ (замість 250$).'
          : 'Индивидуальная сессия гипнотерапии — 50$. Курс из 5 сессий — 210$ (вместо 250$).',
      },
      {
        name: isUk ? 'Консультація психолога онлайн' : 'Консультация психолога онлайн',
        url: `${SITE.url}/uslugi/onlajn-konsultaciya-psyhologa/`,
        desc: isUk
          ? 'Індивідуальна консультація психолога — 50$.'
          : 'Индивидуальная консультация психолога — 50$.',
      },
      {
        name: isUk ? 'Робота з підсвідомістю' : 'Работа с подсознанием',
        url: `${SITE.url}/uslugi/rabota-s-podsoznaniem/`,
        desc: isUk ? 'Сесія роботи з підсвідомістю — 50$.' : 'Сессия работы с подсознанием — 50$.',
      },
      {
        name: isUk ? 'Елітний курс (10 сесій)' : 'Элитный курс (10 сессий)',
        url: `${SITE.url}/uslugi/gipnoterapiya-onlayn/`,
        desc: isUk
          ? 'Повний курс із 10 сесій — 400$ (замість 500$). Індивідуальний план.'
          : 'Полный курс из 10 сессий — 400$ (вместо 500$). Индивидуальный план.',
      },
    ]
    offers = serviceNames.map((s) => ({
      '@type': 'Offer',
      name: s.name,
      url: s.url,
      price: s.name.includes('Елітний') || s.name.includes('Элитный') ? '400' : '50',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/OnlineOnly',
      description: s.desc,
      itemOffered: {
        '@type': 'Service',
        name: s.name,
        url: s.url,
      },
    }))
  }

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
