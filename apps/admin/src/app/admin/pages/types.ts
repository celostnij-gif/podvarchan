export interface PageTranslationRecord {
  id: string
  pageId: string
  locale: 'ru' | 'uk'
  slug: string
  title: string | null
  excerpt: string | null
  contentJson: string | null
  seoMetaId: string | null
}

export interface PageRecord {
  id: string
  type: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PageWithTranslations extends PageRecord {
  translations: PageTranslationRecord[]
  sections: PageSectionWithTranslations[]
}

export interface PageSectionRecord {
  id: string
  pageId: string
  key: string
  type: string
  enabled: boolean
  sortOrder: number
  settingsJson: string | null
}

export interface PageSectionTranslationRecord {
  id: string
  sectionId: string
  locale: 'ru' | 'uk'
  contentJson: string | null
}

export interface PageSectionWithTranslations {
  section: PageSectionRecord
  translations: PageSectionTranslationRecord[]
}
