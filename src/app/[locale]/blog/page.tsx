'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslations, useMessages, useLocale } from 'next-intl'
import { AnimatedText, SectionContainer, AnimatedSection, childVariants, Button } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import { Link } from '@/i18n/routing'
import BlogCard from '@/components/blog/BlogCard'
import { getAllBlogPostMetas } from '@/lib/content'
/* ── BlogCategory from messages has all localized fields ── */
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

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.blog') },
  ])

  const allPosts = getAllBlogPostMetas(locale)

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return allPosts
    return allPosts.filter((post) => post.categorySlug === activeCategory)
  }, [activeCategory, allPosts])

  // Featured = first post when no filter is active
  const featuredPost = !activeCategory && allPosts.length > 0 ? allPosts[0] : null
  const gridPosts = !activeCategory ? allPosts.slice(1) : filteredPosts

  const isEmptyFiltered = activeCategory && filteredPosts.length === 0

  return (
    <>
      {/* ────── Hero ────── */}
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-20 md:pb-14">
        <div className="relative z-10 w-full max-w-container mx-auto px-gutter text-left">
          <div className="max-w-3xl">
            {/* Breadcrumbs */}
            <HeroBreadcrumbs />
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
              className="inline-flex items-center gap-3"
            >
              <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
                {commonT('nav.blog')}
              </span>
            </motion.div>

            {/* Heading with gold gradient accent */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.25, 0.1, 0, 1] }}
              className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight"
            >
              {t('pageTitle')}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
              className="mt-4 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed"
            >
              {t('pageDescription')}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
              className="mt-6 flex items-center gap-4 text-sm text-text-muted"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {allPosts.length > 0 && t('totalArticles', { count: allPosts.length })}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                {t('totalCategories', { count: blogCategories.length })}
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────── Category Filter ────── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${!activeCategory
                  ? 'bg-gold text-bg-base shadow-glow-gold'
                  : 'bg-bg-surface text-text-muted hover:text-text-primary border border-border-base hover:border-gold-muted/40'
                }`}
            >
              {t('allArticles')}
            </button>
            {blogCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                  ${activeCategory === cat.slug
                    ? 'bg-gold text-bg-base shadow-glow-gold'
                    : 'bg-bg-surface text-text-muted hover:text-text-primary border border-border-base hover:border-gold-muted/40'
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
          <AnimatedSection
            variant="fadeUp"
            staggerDelay={0.06}
            delay={0.1}
            className="space-y-8"
          >
            {/* Featured post */}
            {featuredPost && !activeCategory && (
              <motion.div variants={childVariants} className="w-full">
                <BlogCard
                  {...featuredPost}
                  featured
                  minutesLabel={t('minutes')}
                  locale={locale}
                  readMoreLabel={t('readMore')}
                />
              </motion.div>
            )}

            {/* Grid posts */}
            {gridPosts.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <motion.div key={post.slug} variants={childVariants}>
                    <BlogCard
                      {...post}
                      minutesLabel={t('minutes')}
                      locale={locale}
                      readMoreLabel={t('readMore')}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatedSection>

          {/* Total count */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-sm text-text-muted text-center"
          >
            {t('totalArticles', { count: allPosts.length })}
          </motion.p>
        </SectionContainer>
      )}

      {/* ────── Empty state (no posts at all / filter with no results) ────── */}
      {(allPosts.length === 0 || isEmptyFiltered) && (
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
            className="mt-8 text-center py-20 px-6 rounded-2xl border border-border-base"
          >
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
          </motion.div>
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
