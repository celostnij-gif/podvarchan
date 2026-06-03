'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, TiltCard, PageHero } from '@/components/ui'
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
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index)
  }

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
      <SectionContainer size="sm">
        <div className="mt-10 space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index
          const id = `faq-${index}`

          return (
            <AnimatedText key={index} direction="up" delay={index * 50}>
              <TiltCard tiltDegree={2} scale={1.01} glowOpacity={0.04} className="rounded-xl">
              <div className="rounded-xl border border-border-base bg-bg-surface overflow-hidden">
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-start justify-between p-5 text-left
                             hover:bg-bg-elevated transition-colors duration-200"
                  aria-expanded={isOpen}
                  aria-controls={id}
                >
                  <span className="text-base font-body text-text-primary pr-4">{item.question}</span>
                  <span
                    className={`shrink-0 mt-1 text-gold transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </button>
                <div
                  id={id}
                  role="region"
                  className={`transition-all duration-300 ease-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-5 pb-5 text-sm text-text-muted leading-relaxed">{item.answer}</p>
                </div>
              </div>
              </TiltCard>
            </AnimatedText>
          )
        })}
      </div>
    </SectionContainer>
    </>
  )
}
