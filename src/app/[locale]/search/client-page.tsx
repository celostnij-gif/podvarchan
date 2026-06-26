'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { AnimatedText, SectionContainer } from '@/components/ui'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import type { BlogPost } from '@/types'

interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  keywords: string[]
}

interface SearchTranslations {
  heading: string
  placeholder: string
  noResults: string
  blogHeading: string
  servicesHeading: string
  readingTime: string
  minutes: string
}

interface Props {
  locale: string
  blogPosts: Omit<BlogPost, 'body'>[]
  services: ServiceItem[]
  translations: SearchTranslations
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-gold/20 text-gold-light rounded-sm px-0.5">{part}</mark>
      : part
  )
}

export function ClientSearchPage({ locale, blogPosts, services, translations }: Props) {
  const t = useTranslations('search')
  const commonT = useTranslations('common')
  const [query, setQuery] = useState('')

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: t('breadcrumb'), href: '/search/' },
  ])

  const normalizedQuery = query.toLowerCase().trim()

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) return []
    return blogPosts.filter((post) => {
      const searchText = [post.title, post.description, post.metaDescription, ...post.keywords].join(' ').toLowerCase()
      return searchText.includes(normalizedQuery)
    })
  }, [blogPosts, normalizedQuery])

  const filteredServices = useMemo(() => {
    if (!normalizedQuery) return []
    return services.filter((svc) => {
      const searchText = [svc.title, svc.shortTitle, svc.description, ...svc.keywords].join(' ').toLowerCase()
      return searchText.includes(normalizedQuery)
    })
  }, [services, normalizedQuery])

  const hasResults = filteredPosts.length > 0 || filteredServices.length > 0

  return (
    <>
      <section className="relative pt-16 pb-8 md:pt-20 md:pb-10 overflow-hidden">
        <div className="relative z-10 w-full max-w-container mx-auto px-gutter text-left">
          <div className="max-w-3xl">
            <HeroBreadcrumbs />

            <div className="mt-6">
              <AnimatedText direction="up">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight">
                  {translations.heading}
                </h1>
              </AnimatedText>
            </div>

            <div className="mt-8">
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={translations.placeholder}
                className="w-full px-6 py-4 rounded-xl bg-bg-elevated border border-border-base
                           text-text-primary text-lg placeholder:text-text-muted/50
                           focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/10
                           transition-all duration-300"
                aria-label={translations.placeholder}
              />
            </div>
          </div>
        </div>
      </section>

      <SectionContainer background="surface" className="min-h-[40vh]">
        <div className="max-w-3xl mx-auto">
          {!normalizedQuery && (
            <p className="text-text-muted text-center py-16">
              {translations.placeholder}
            </p>
          )}

          {normalizedQuery && !hasResults && (
            <p className="text-text-muted text-center py-16">
              {translations.noResults}
            </p>
          )}

          {normalizedQuery && hasResults && (
            <div className="space-y-12">
              {/* Blog results */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="text-xl font-display text-text-primary mb-4">
                    {translations.blogHeading} ({filteredPosts.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredPosts.slice(0, 20).map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}/`}
                        className="block p-4 rounded-xl bg-bg-base border border-border-base
                                   hover:border-gold/30 hover:bg-gold/[0.02] transition-all duration-300 group"
                      >
                        <h3 className="text-base font-display text-text-primary group-hover:text-gold transition-colors">
                          {highlightMatch(post.title, query)}
                        </h3>
                        <p className="mt-1 text-sm text-text-muted line-clamp-2">
                          {highlightMatch(post.description, query)}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-text-muted/60">
                          <span>{post.categoryName}</span>
                          <span className="w-px h-3 bg-border-base" />
                          <span>{translations.readingTime} {post.readingTime} {translations.minutes}</span>
                        </div>
                      </Link>
                    ))}
                    {filteredPosts.length > 20 && (
                      <p className="text-sm text-text-muted text-center pt-2">
                        + {filteredPosts.length - 20} {t('moreResults')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Services results */}
              {filteredServices.length > 0 && (
                <div>
                  <h2 className="text-xl font-display text-text-primary mb-4">
                    {translations.servicesHeading} ({filteredServices.length})
                  </h2>
                  <div className="space-y-3">
                    {filteredServices.slice(0, 10).map((svc) => (
                      <Link
                        key={svc.slug}
                        href={`/uslugi/${svc.slug}/`}
                        className="block p-4 rounded-xl bg-bg-base border border-border-base
                                   hover:border-gold/30 hover:bg-gold/[0.02] transition-all duration-300 group"
                      >
                        <h3 className="text-base font-display text-text-primary group-hover:text-gold transition-colors">
                          {highlightMatch(svc.title, query)}
                        </h3>
                        <p className="mt-1 text-sm text-text-muted line-clamp-2">
                          {highlightMatch(svc.shortTitle, query)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionContainer>
    </>
  )
}
