'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, AnimatedSection, childVariants, Button } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import BlogCard from '@/components/blog/BlogCard'
import { Link } from '@/i18n/routing'
import type { BlogPost } from '@/types'

/* ── Local type for blog category data from messages ── */
interface BlogCategoryMsg {
  slug: string
  name: string
  description: string
  serviceSlug?: string
}

interface Props {
  category: BlogCategoryMsg
  posts: BlogPost[]
  locale: string
}

/* ── Animation Variants ── */

const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const heroFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const } },
}

export function ClientBlogCategory({ category, posts, locale }: Props) {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.blog'), href: '/blog/' },
    { label: category.name },
  ])

  return (
    <>
      {/* ────── Category Hero ────── */}
      <section className="relative pt-16 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        <div className="relative z-10 w-full max-w-3xl px-gutter text-left">
          {/* Breadcrumbs */}
          <HeroBreadcrumbs />
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Heading */}
            <motion.h1 variants={heroFadeUp} className="text-4xl md:text-5xl font-display text-gold-premium leading-tight tracking-tight">
              {category.name}
            </motion.h1>

            {/* Description */}
            <motion.p variants={heroFadeUp} className="mt-4 text-lg text-text-secondary max-w-2xl leading-relaxed">
              {category.description}
            </motion.p>

            {/* Post count */}
            <motion.div variants={heroFadeUp} className="mt-6 flex items-center gap-2 text-sm text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t('totalArticles', { count: posts.length })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ────── Posts ────── */}
      {posts.length > 0 ? (
        <SectionContainer>
          <div>
            <AnimatedSection
              variant="fadeUp"
              staggerDelay={0.07}
              delay={0.15}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <motion.div key={post.slug} variants={childVariants}>
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
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </SectionContainer>
      ) : (
        <AnimatedSection as="div" variant="fadeUp">
          <SectionContainer>
            <div className="mt-6 text-center py-16 px-6 rounded-2xl bg-bg-surface border border-border-base">
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
