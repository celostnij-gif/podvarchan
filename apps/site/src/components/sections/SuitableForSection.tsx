'use client'

import { useTranslations } from 'next-intl'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionContainer from '@/components/ui/SectionContainer'
import AnimatedText from '@/components/ui/AnimatedText'

export default function SuitableForSection() {
  const t = useTranslations('serviceSection')

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('suitableForTitle')}>
      <SectionContainer size="md" background="default">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Suitable for */}
          <div className="p-6 rounded-xl bg-green/5 border border-green/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center text-green shrink-0" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <AnimatedText
                as="h3"
                direction="up"
                className="text-lg font-display text-green"
              >
                {t('suitableForTitle')}
              </AnimatedText>
            </div>
            <AnimatedText
              direction="up"
              delay={80}
              as="p"
              className="text-sm text-text-secondary leading-relaxed"
            >
              {t('suitableForText')}
            </AnimatedText>
          </div>

          {/* Not suitable for */}
          <div className="p-6 rounded-xl bg-red/5 border border-red/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-red/10 flex items-center justify-center text-red shrink-0" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                </svg>
              </span>
              <AnimatedText
                as="h3"
                direction="up"
                className="text-lg font-display text-red"
              >
                {t('notSuitableForTitle')}
              </AnimatedText>
            </div>
            <AnimatedText
              direction="up"
              delay={80}
              as="p"
              className="text-sm text-text-secondary leading-relaxed"
            >
              {t('notSuitableForText')}
            </AnimatedText>
          </div>
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}
