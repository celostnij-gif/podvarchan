// ── Blog Post Client Page ──
'use client'

import Image from 'next/image'

import { useTranslations } from 'next-intl'
import { useMessages } from 'next-intl'
import { motion } from 'framer-motion'
import { AnimatedText, AnimatedSection, SectionContainer, Button, ScrollProgress } from '@/components/ui'
import { useSetBreadcrumbs, useRegisterSchemas } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import { Link } from '@/i18n/routing'
import ServiceCTA from '@/components/blog/ServiceCTA'
import { getServiceSlugByCategory } from '@/lib/serviceMapping'
/* ── BlogCategory from messages has all localized fields ── */
interface MessagesBlogCategory {
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug: string
}

interface RelatedPost {
  slug: string
  title: string
}

interface Props {
  title: string
  body: string
  date: string
  category: string
  categorySlug: string
  author: string
  readingTime: number
  slug: string
  image?: string
  imageAlt?: string
  locale: string
  relatedPosts: RelatedPost[]
  schemas?: Record<string, unknown>[]
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

export function ClientBlogPost({ title, body, date, category, categorySlug, author, readingTime, slug: _slug, image, imageAlt, locale: _locale, relatedPosts, schemas }: Props) {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')
  const messages = useMessages()

  useRegisterSchemas(schemas ?? [])

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.blog'), href: '/blog/' },
    { label: category, href: `/blog/kategoriya/${categorySlug}/` },
  ])

  /* ── Service CTA data from category mapping ── */
  const servicesData = (messages?.servicesData as Array<{ slug: string; title: string; description: string }>) ?? []
  const blogCategories = (messages?.blogCategories as MessagesBlogCategory[]) ?? []
  const serviceSlug = getServiceSlugByCategory(categorySlug)
  const serviceData = serviceSlug ? servicesData.find(s => s.slug === serviceSlug) : null
  const categoryData = blogCategories.find(c => c.slug === categorySlug)

  return (
    <>
      {/* ── Reading progress bar ── */}
      <ScrollProgress />

      {/* ────── Article Hero ────── */}
      <section className="relative pt-16 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        <div className="relative z-10 w-full max-w-container mx-auto px-gutter text-left">
          <div className="max-w-3xl">
          {/* Breadcrumbs */}
          <HeroBreadcrumbs />
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Section label */}
            <motion.div variants={heroFadeUp} className="inline-flex items-center gap-3">
              <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
                {category}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 variants={heroFadeUp} className="mt-5 text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium leading-tight tracking-tight">
              {title}
            </motion.h1>

            {/* Meta info */}
            <motion.div variants={heroFadeUp} className="mt-5 flex flex-wrap items-center gap-5 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {author}
              </span>
              <span className="w-px h-3.5 bg-border-base" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {date}
              </span>
              <span className="w-px h-3.5 bg-border-base" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingTime} {t('minutes')}
              </span>
            </motion.div>

          </motion.div>
          </div>
        </div>
      </section>

      {/* ────── Article Content ────── */}
      <SectionContainer background="surface" className="relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-gold/[0.01] via-transparent to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Featured image */}
          {image && (
            <div className="mb-8 rounded-xl overflow-hidden border border-border-base shadow-lg shadow-black/20">
              <Image
                src={image}
                alt={imageAlt ?? title}
                width={1200}
                height={675}
                className="w-full h-auto object-cover aspect-video"
                priority
              />
            </div>
          )}
          {/* Article body */}
          <article
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {/* ── Separator ── */}
          <div className="mt-16 flex items-center justify-center gap-4" aria-hidden="true">
            <span className="w-8 h-px bg-gold/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold/30" />
            <span className="w-8 h-px bg-gold/20" />
          </div>

          {/* ── Service CTA ── */}
          {serviceData && (
            <AnimatedText direction="up" className="mt-12">
              <ServiceCTA
                serviceName={serviceData.title}
                serviceSlug={serviceSlug!}
                headline={t('ctaService', { service: categoryData?.name || serviceData.title })}
                description={t('ctaServiceDescription', { serviceName: (categoryData?.name || serviceData.title).toLowerCase() })}
              />
            </AnimatedText>
          )}

          {/* ── Related posts ── */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <AnimatedText direction="up">
                <h3 className="text-xl font-display text-text-primary mb-6">{t('moreOnTopic')}</h3>
              </AnimatedText>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map((post, i) => (
                  <AnimatedText key={post.slug} direction="up" delay={i * 100}>
                    <Link
                      href={`/blog/${post.slug}/`}
                      className="group block p-5 rounded-xl bg-bg-surface/85 border border-border-base
                                 hover:border-gold/30 hover:-translate-y-0.5
                                 transition-all duration-300"
                    >
                      <h4 className="text-base font-display text-text-primary group-hover:text-gold transition-colors duration-200">
                        {post.title}
                      </h4>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm text-gold">
                        {commonT('readMore')}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round">
                          <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </AnimatedText>
                ))}
              </div>
            </div>
          )}

          {/* ── Separator ── */}
          <div className="mt-16 flex items-center justify-center gap-4" aria-hidden="true">
            <span className="w-8 h-px bg-gold/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold/30" />
            <span className="w-8 h-px bg-gold/20" />
          </div>

          {/* ── Author bio ── */}
          <div className="mt-12 p-6 rounded-xl bg-bg-surface/85 border border-border-base">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-xl font-display text-bg-base shrink-0">
                ВП
              </div>
              <div>
                <p className="font-display text-text-primary">{commonT('authorName')}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {commonT('authorBio')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Back to blog ── */}
          <div className="mt-10 text-center">
            <Link
              href="/blog/"
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
              {t('allArticles') || 'Все статьи'}
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="mt-12 text-xs text-text-muted text-center border-t border-border-base pt-6">
            {commonT('disclaimer')}
          </p>
        </div>
      </SectionContainer>

      {/* ── CTA ── */}
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
