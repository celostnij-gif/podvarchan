export interface ServiceTranslation {
  id: string
  serviceId: string
  locale: 'ru' | 'uk'
  slug: string
  title: string | null
  shortTitle: string | null
  description: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  symptomsJson: string | null
  processJson: string | null
  benefitsJson: string | null
  faqJson: string | null
  ctaText: string | null
}

export interface ServiceWithTranslations {
  id: string
  slugBase: string
  icon: string | null
  category: string | null
  priority: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  translations: ServiceTranslation[]
}
