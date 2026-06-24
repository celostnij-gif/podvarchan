'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useMessages, useLocale } from 'next-intl'
import { AnimatedText, SectionContainer, AnimatedSection, Button } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import { Link } from '@/i18n/routing'
import BlogCard from '@/components/blog/BlogCard'
import { getAllBlogPostMetas } from '@/lib/content-metas'

const PAGE_SIZE = 9

interface MessagesBlogCategory {
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug: string
}

export default function BlogPage() {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')
  const locale = useLocale()
  const messages = useMessages()
  const blogCategories = (messages?.blogCategories as MessagesBlogCategory[]) ?? []
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.blog') },
  ])

  const allPosts = getAllBlogPostMetas(locale)

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return allPosts
    return allPosts.filter((post) => post.categorySlug === activeCategory)
  }, [activeCategory, allPosts])

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug)
    setVisibleCount(PAGE_SIZE)
  }

  // Featured = first post when no filter is active
  const featuredPost = !activeCategory && allPosts.length > 0 ? allPosts[0] : null
  const gridPosts = !activeCategory ? allPosts.slice(1) : filteredPosts
  const visiblePosts = featuredPost
    ? gridPosts.slice(0, visibleCount - 1)
    : gridPosts.slice(0, visibleCount)

  const isEmptyFiltered = activeCategory && filteredPosts.length === 0
  const hasMore = gridPosts.length > visiblePosts.length
  const totalToShow = visiblePosts.length + (featuredPost ? 1 : 0)

  return (
    <>
      {/* ────── Hero ────── */}
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-20 md:pb-14">
        <div className="relative z-10 w-full max-w-container mx-auto px-gutter text-left">
          <div className="max-w-3xl">
            <HeroBreadcrumbs />
            <div className="inline-flex items-center gap-3 mt-4 animate-fade-in-down">
              <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
                {commonT('nav.blog')}
              </span>
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight animate-fade-in-down" style={{ animationDelay: '0.05s' }}>
              {t('pageTitle')}
            </h1>

            <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
              {t('pageDescription')}
            </p>

            <div className="mt-6 flex items-center gap-4 text-sm text-text-muted animate-fade-in-down" style={{ animationDelay: '0.15s' }}>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {allPosts.length > 0 && t('totalArticles', { count: allPosts.length })}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                {t('totalCategories', { count: blogCategories.length })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ────── Category Filter ────── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${!activeCategory
                  ? 'bg-gold text-bg-base shadow-glow-gold'
                  : 'bg-bg-surface/85 text-text-muted hover:text-text-primary border border-border-base hover:border-gold-muted/40'
                }`}
            >
              {t('allArticles')}
            </button>
            {blogCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                  ${activeCategory === cat.slug
                    ? 'bg-gold text-bg-base shadow-glow-gold'
                    : 'bg-bg-surface/85 text-text-muted hover:text-text-primary border border-border-base hover:border-gold-muted/40'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ────── Posts Grid ────── */}
      {allPosts.length > 0 && !isEmptyFiltered && (
        <SectionContainer className="mt-6">
          <div className="space-y-8">
            {/* Featured post */}
            {featuredPost && !activeCategory && (
              <div className="w-full">
                <BlogCard
                  {...featuredPost}
                  featured
                  minutesLabel={t('minutes')}
                  locale={locale}
                  readMoreLabel={t('readMore')}
                />
              </div>
            )}

            {/* Grid posts */}
            {visiblePosts.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visiblePosts.map((post) => (
                    <div key={post.slug}>
                      <BlogCard
                        {...post}
                        minutesLabel={t('minutes')}
                        locale={locale}
                        readMoreLabel={t('readMore')}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination: Show more */}
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="group relative inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold tracking-wide overflow-hidden
                        bg-bg-surface/85 text-text-secondary hover:text-text-primary border border-border-base hover:border-gold-muted/40
                        transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {t('showMore', { count: Math.min(PAGE_SIZE, gridPosts.length - visiblePosts.length) })}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </SectionContainer>
      )}

      {/* ────── Empty state ────── */}
      {(allPosts.length === 0 || isEmptyFiltered) && (
        <SectionContainer>
          <div className="mt-8 text-center py-20 px-6 rounded-2xl border border-border-base bg-bg-surface/85">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-text-muted text-lg font-display">
              {t('noArticles')}
            </p>
            <p className="mt-2 text-text-muted text-sm max-w-md mx-auto">
              {t('noArticlesDesc')}
            </p>
          </div>
        </SectionContainer>
      )}

      {/* ────── CTA Section ────── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <AnimatedText as="h2" direction="up" className="relative text-3xl md:text-4xl font-display text-text-primary">
              {t('ctaTitle')}
            </AnimatedText>

            <AnimatedText as="p" direction="up" delay={150} className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
              {t('ctaDescription')}
            </AnimatedText>

            <AnimatedText direction="up" delay={250} className="relative mt-8">
              <Link href="/kontakty/">
                <Button variant="primary" size="lg">
                  {commonT('cta.booking')}
                </Button>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      </AnimatedSection>
    </>
  )
}
