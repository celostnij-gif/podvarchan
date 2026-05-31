/* ── Service (услуга) ── */

export interface Service {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  category: string
  priority: number
  icon?: string
  cta: string
  ctaLink: string
  body?: string
}

/* ── Blog Post ── */

export interface BlogPost {
  slug: string
  title: string
  description: string
  metaDescription: string
  keywords: string[]
  categorySlug: string
  categoryName: string
  datePublished: string
  dateModified: string
  author: string
  readingTime: number
  image?: string
  imageAlt?: string
  body?: string
}

/* ── Blog Category ── */

export interface BlogCategory {
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug?: string
}

/* ── FAQ Item ── */

export interface FAQItem {
  question: string
  answer: string
}

/* ── Breadcrumb ── */

export interface BreadcrumbItem {
  name: string
  url: string
}

/* ── Page Metadata ── */

export type PageType = 'page' | 'article' | 'service'

export interface PageMeta {
  title: string
  description: string
  keywords?: string[]
  type?: PageType
  canonical?: string
  ogImage?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
}

/* ── Navigation ── */

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

/* ── Testimonial ── */

export interface Testimonial {
  id: string
  name: string
  city?: string
  text: string
  result: string
  rating?: number
}
