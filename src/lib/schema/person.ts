import { SITE, AUTHOR } from '@/constants'

export interface PersonCredential {
  name: string
  category: 'certification' | 'license' | 'degree'
  organization: string
  year: string
}

interface PersonSchemaParams {
  credentials?: PersonCredential[]
  sameAs?: string[]
  description?: string
  image?: string
  jobTitle?: string
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
  } = params

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}${AUTHOR.url}#person`,
    name: AUTHOR.name,
    givenName: AUTHOR.givenName,
    familyName: AUTHOR.familyName,
    jobTitle,
    description,
    url: `${SITE.url}${AUTHOR.url}`,
    image: `${SITE.url}${image}`,
    knowsAbout: [
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
    ],
    worksFor: {
      '@type': 'Organization',
      name: SITE.fullName,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Запись на консультацию',
      url: `${SITE.url}/kontakty/`,
      availableLanguage: ['Russian'],
    },
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

  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }

  return schema
}
