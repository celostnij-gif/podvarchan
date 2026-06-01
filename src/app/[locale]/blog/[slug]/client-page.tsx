'use client'

import { useTranslations } from 'next-intl'
import { useMessages } from 'next-intl'
import { AnimatedText, SectionContainer, Button } from '@/components/ui'
import { Link } from '@/i18n/routing'
import ServiceCTA from '@/components/blog/ServiceCTA'
import { getServiceSlugByCategory } from '@/lib/serviceMapping'
import type { BlogCategory } from '@/types'

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
}

export function ClientBlogPost({ title, body, date, category, categorySlug, author, readingTime, slug, image, imageAlt, locale, relatedPosts }: Props) {
  const t = useTranslations('blog')
  const commonT = useTranslations('common')
  const messages = useMessages()

  /* ── Service CTA data from category mapping ── */
  const servicesData = (messages?.servicesData as Array<{ slug: string; title: string; description: string }>) ?? []
  const blogCategories = (messages?.blogCategories as BlogCategory[]) ?? []
  const serviceSlug = getServiceSlugByCategory(categorySlug)
  const serviceData = serviceSlug ? servicesData.find(s => s.slug === serviceSlug) : null
  const categoryData = blogCategories.find(c => c.slug === categorySlug)

  return (
    <SectionContainer size="xs">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-gold transition-colors">{commonT('nav.home')}</Link>
        <span>/</span>
        <Link href="/blog/" className="hover:text-gold transition-colors">{commonT('nav.blog')}</Link>
        <span>/</span>
        <Link
          href={`/blog/kategoriya/${categorySlug}/`}
          className="text-gold hover:text-gold-light transition-colors"
        >
          {category}
        </Link>
      </nav>

      {/* Category badge */}
      <AnimatedText direction="up">
        <Link
          href={`/blog/kategoriya/${categorySlug}/`}
          className="inline-block text-xs font-medium uppercase tracking-widest text-gold hover:text-gold-light transition-colors"
        >
          {category}
        </Link>
      </AnimatedText>

      {/* Title */}
      <AnimatedText as="h1" direction="up" delay={100} className="mt-3 text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium leading-tight">
        {title}
      </AnimatedText>

      {/* Meta info */}
      <AnimatedText direction="up" delay={200} className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {date}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {readingTime} {t('minutes')}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {author}
        </span>
      </AnimatedText>

      {/* Featured image */}
      {image && (
        <div className="mt-8 -mx-4 sm:mx-0 rounded-xl overflow-hidden border border-border-base">
          <img
            src={image}
            alt={imageAlt ?? title}
            className="w-full h-auto object-cover aspect-video"
            loading="eager"
          />
        </div>
      )}

      {/* Article body */}
      <article
        className="mt-10 prose prose-invert prose-headings:font-display prose-headings:text-text-primary 
                   prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-gold
                   prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                   prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-4
                   prose-a:text-gold prose-a:hover:text-gold-light prose-a:underline-offset-2 prose-a:transition-colors
                   prose-ul:my-4 prose-li:text-text-secondary prose-li:mb-2
                   prose-strong:text-text-primary
                   prose-blockquote:border-l-gold prose-blockquote:bg-bg-surface/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
                   prose-blockquote:text-text-secondary prose-blockquote:italic prose-blockquote:not-italic
                   prose-ol:my-4 prose-li:pl-2
                   max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />

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
                  className="group block p-5 rounded-xl bg-bg-surface border border-border-base
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

      {/* Author bio */}
      <div className="mt-16 p-6 rounded-xl bg-bg-surface border border-border-base">
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

      {/* CTA */}
      <AnimatedText direction="up" className="mt-12 text-center">
        <div className="p-8 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
          <p className="text-xl font-display text-text-primary">
            {t('ctaTitle')}
          </p>
          <p className="mt-2 text-text-muted text-sm">
            {t('ctaDescription')}
          </p>
          <Link href="/kontakty/">
            <Button variant="primary" size="lg" className="mt-6">
              {commonT('cta.booking')}
            </Button>
          </Link>
        </div>
      </AnimatedText>

      {/* Disclaimer */}
      <p className="mt-12 text-xs text-text-muted text-center border-t border-border-base pt-6">
        {commonT('disclaimer')}
      </p>
    </SectionContainer>
  )
}
