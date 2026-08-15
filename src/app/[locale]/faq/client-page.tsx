'use client'

import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, PageHero, FaqAccordion } from '@/components/ui'
import type { FAQItem } from '@/types'
import { useRegisterSchemas } from '@/providers/BreadcrumbsProvider'
import { Link } from '@/i18n/routing'

interface Props {
  items: FAQItem[]
  schemas?: Record<string, unknown>[]
}

export function ClientFaqPage({ items, schemas }: Props) {
  useRegisterSchemas(schemas ?? [])
  const t = useTranslations('faq')
  const commonT = useTranslations('common')

  return (
    <>
      <PageHero
        label="FAQ"
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbItems={[
          { label: commonT('nav.home'), href: '/' },
          { label: 'FAQ' },
        ]}
        clean
      />

      {/* ────── FAQ Content ────── */}
      <SectionContainer size="sm" background="transparent">
        <div className="mt-10 space-y-3">
          {items.map((item, index) => (
            <AnimatedText key={index} direction="up" delay={index * 50}>
              <FaqAccordion question={item.question} answer={item.answer} />
            </AnimatedText>
          ))}
        </div>

        {/* ── CTA after FAQ ── */}
        <AnimatedText direction="up" className="mt-8 p-6 md:p-8 rounded-xl bg-gold/[0.04] border border-gold/10 text-center">
          <h2 className="text-lg font-display text-gold mb-2">{t('ctaHeading')}</h2>
          <p className="text-sm text-text-muted mb-4">{t('ctaText')}</p>
          <Link
            href="/kontakty/"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-light hover:text-green transition-colors duration-200"
          >
            {t('ctaButton')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </AnimatedText>
      </SectionContainer>
    </>
  )
}
