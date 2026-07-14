import { SITE, AUTHOR } from '@/constants'

export interface PersonCredential {
  name: string
  category: 'certification' | 'license' | 'degree'
  organization: string
  year: string
  url?: string
}

interface PersonSchemaParams {
  credentials?: PersonCredential[]
  sameAs?: string[]
  description?: string
  image?: string
  jobTitle?: string
  locale?: string
}

/**
 * Генерирует JSON-LD объект Person schema.org для автора.
 * Встраивается в /ob-avtore/ и используется как @id reference на других страницах.
 *
 * @example
 * ```tsx
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema()) }}
 * />
 * ```
 */
export function personSchema(params: PersonSchemaParams = {}): Record<string, unknown> {
  const {
    credentials = AUTHOR.credentials,
    sameAs = AUTHOR.sameAs,
    description = AUTHOR.description,
    image = AUTHOR.image,
    jobTitle = AUTHOR.jobTitle,
    locale = 'ru',
  } = params

  const knowsAbout: string[] = locale === 'uk'
    ? [
        'Еріксонівський гіпноз',
        'Регресивна гіпнотерапія',
        'Тривожні розлади',
        'Панічні атаки',
        'Самосаботаж та прокрастинація',
        'Робота з підсвідомістю',
        'Психосоматика',
        'Обмежувальні переконання',
        'Емоційне вигорання',
        'Особистісна криза',
        'Пробудологія',
      ]
    : [
        'Эриксоновский гипноз',
        'Регрессивная гипнотерапия',
        'Тревожные расстройства',
        'Панические атаки',
        'Самосаботаж и прокрастинация',
        'Работа с подсознанием',
        'Психосоматика',
        'Ограничивающие убеждения',
        'Эмоциональное выгорание',
        'Личностный кризис',
        'Пробудология',
      ]

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}${AUTHOR.url}#person`,
    name: AUTHOR.name,
    givenName: AUTHOR.givenName,
    familyName: AUTHOR.familyName,
    inLanguage: locale === 'uk' ? 'uk' : 'ru',
    jobTitle,
    description,
    url: `${SITE.url}${AUTHOR.url}`,
    image: `${SITE.url}${image}`,
    knowsAbout,
    worksFor: {
      '@type': 'Organization',
      name: SITE.fullName,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: locale === 'uk' ? 'Запис на консультацію' : 'Запись на консультацию',
      url: `${SITE.url}/kontakty/`,
      availableLanguage: locale === 'uk' ? ['Ukrainian'] : ['Russian'],
    },
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }

  if (credentials.length > 0) {
    schema.hasCredential = credentials.map((cred) => ({
      '@type': 'EducationalOccupationalCredential',
      name: cred.name,
      credentialCategory: cred.category,
      recognizedBy: {
        '@type': 'Organization',
        name: cred.organization,
      },
      dateCreated: cred.year,
    }))
  }

  /* ── alumniOf: вузы по degree credentials ── */
  const degreeCredentials: PersonCredential[] = credentials.filter((c) => c.category === 'degree')
  if (degreeCredentials.length > 0) {
    schema.alumniOf = degreeCredentials.map((cred) => ({
      '@type': 'CollegeOrUniversity',
      name: cred.organization,
      ...(cred.url ? { url: cred.url } : {}),
    }))
  }

  /* ── award: диплом с отличием и т.п. ── */
  const awards = credentials
    .filter((c) => /отличием|honors/i.test(c.name))
    .map((c) => c.name)
  if (awards.length > 0) {
    schema.award = awards.length === 1 ? awards[0] : awards
  }

  return schema
}
