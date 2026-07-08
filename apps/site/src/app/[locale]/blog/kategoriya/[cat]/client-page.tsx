'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, AnimatedSection, Button } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import BlogCard from '@/components/blog/BlogCard'
import { Link } from '@/i18n/routing'
import type { BlogPost } from '@/types'

const PAGE_SIZE = 9

interface BlogCategoryMsg {
  slug: string
  name: string
  description: string
  serviceSlug?: string
}

interface Props {
  category: BlogCategoryMsg
  posts: Omit<BlogPost, 'body'>[]
  locale: string
}

export function ClientBlogCategory({ category, posts, locale }: Props) {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.blog'), href: '/blog/' },
    { label: category.name },
  ])

  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = posts.length > visiblePosts.length

  return (
    <>
      {/* ────── Category Hero ────── */}
      <section className="relative pt-16 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        <div className="relative z-10 w-full max-w-3xl px-gutter text-left">
          <HeroBreadcrumbs />

          <h1 className="mt-5 text-4xl md:text-5xl font-display text-gold-premium leading-tight tracking-tight animate-fade-in-down">
            {category.name}
          </h1>

          <p className="mt-4 text-lg text-text-secondary max-w-2xl leading-relaxed animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
            {category.description}
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm text-text-muted animate-fade-in-down" style={{ animationDelay: '0.15s' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            {t('totalArticles', { count: posts.length })}
          </div>
        </div>
      </section>

      {/* ────── Posts ────── */}
      {posts.length > 0 ? (
        <SectionContainer>
          <div>
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visiblePosts.map((post) => (
                  <div key={post.slug}>
                    <BlogCard
                      slug={post.slug}
                      title={post.title}
                      description={post.description}
                      categoryName={post.categoryName}
                      categorySlug={post.categorySlug}
                      datePublished={post.datePublished}
                      readingTime={post.readingTime}
                      image={post.image}
                      imageAlt={post.imageAlt}
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
                      {t('showMore', { count: Math.min(PAGE_SIZE, posts.length - visiblePosts.length) })}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </SectionContainer>
      ) : (
        <AnimatedSection as="div" variant="fadeUp">
          <SectionContainer>
            <div className="mt-6 text-center py-16 px-6 rounded-2xl border border-border-base bg-bg-surface/85">
              <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-text-muted text-lg font-display">
                {t('noArticles')}
              </p>
              <p className="mt-2 text-text-muted text-sm">
                {t('noArticlesDesc')}
              </p>
              <Link href="/blog/">
                <Button variant="secondary" size="md" className="mt-6">
                  {t('allArticles')}
                </Button>
              </Link>
            </div>
          </SectionContainer>
        </AnimatedSection>
      )}

      {/* ────── Link to service ────── */}
      {category.serviceSlug && posts.length > 0 && (
        <SectionContainer className="pt-0">
          <div className="text-center">
            <AnimatedText direction="up">
              <Link
                href={`/uslugi/${category.serviceSlug}/`}
                className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-all group"
              >
                <span>{t('readMoreLink') || 'Записаться на консультацию по этому направлению'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      )}
    </>
  )
}
