'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import { AnimatedText, SectionContainer, AnimatedSection, childVariants, Button } from '@/components/ui'
import BlogCard from '@/components/blog/BlogCard'
import { getAllBlogPostMetas } from '@/lib/content'
import { Link } from '@/i18n/routing'
import type { BlogCategory } from '@/types'

/* ── Decorative dots (deterministic) ── */

const DECO_DOTS = [
  { x: 85, y: 12, size: 1, opacity: 0.3 },
  { x: 10, y: 18, size: 2, opacity: 0.2 },
  { x: 92, y: 55, size: 1, opacity: 0.25 },
  { x: 15, y: 75, size: 1.5, opacity: 0.2 },
  { x: 78, y: 88, size: 1, opacity: 0.3 },
]

export default function BlogPage() {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')
  const messages = useMessages()
  const blogCategories = (messages?.blogCategories as BlogCategory[]) ?? []
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const allPosts = getAllBlogPostMetas()

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
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-hero opacity-20 blur-[120px]" />
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gold/[0.03] blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[350px] h-[350px] rounded-full bg-green/[0.02] blur-3xl" />
          {DECO_DOTS.map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gold/30"
              style={{
                top: `${dot.y}%`,
                left: `${dot.x}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                opacity: dot.opacity,
              }}
            />
          ))}
        </div>

        <SectionContainer>
          <div className="max-w-3xl">
            <AnimatedText as="h1" direction="up" className="text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight">
              {t('pageTitle')}
            </AnimatedText>
            <AnimatedText as="p" direction="up" delay={200} className="mt-4 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
              {t('pageDescription')}
            </AnimatedText>
          </div>
        </SectionContainer>
      </section>

      {/* ────── Category Filter ────── */}
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
            className="mt-8 text-center py-20 px-6 rounded-2xl bg-bg-surface border border-border-base"
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
      <SectionContainer className="mt-8 mb-16">
        <AnimatedText direction="up" className="text-center">
          <div className="p-10 md:p-14 rounded-2xl bg-gradient-to-br from-gold/[0.07] to-gold/[0.02] border border-gold/15 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-40 -right-40 w-[300px] h-[300px] rounded-full bg-gold/[0.06] blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-40 -left-40 w-[250px] h-[250px] rounded-full bg-green/[0.04] blur-3xl" aria-hidden="true" />

            <div className="relative z-10">
              <p className="text-2xl md:text-3xl font-display text-text-primary">
                {t('ctaTitle')}
              </p>
              <p className="mt-3 text-text-muted max-w-lg mx-auto">
                {t('ctaDescription')}
              </p>
              <Link href="/kontakty/">
                <Button variant="primary" size="lg" className="mt-8">
                  {commonT('cta.booking')}
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedText>
      </SectionContainer>
    </>
  )
}
