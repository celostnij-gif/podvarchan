'use client'

import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, PageHero, FaqAccordion } from '@/components/ui'
import type { FAQItem } from '@/types'
import { useRegisterSchemas } from '@/providers/BreadcrumbsProvider'

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
      </SectionContainer>
    </>
  )
}
