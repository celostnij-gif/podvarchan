'use client'

import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Hero from '@/components/sections/Hero'
const ProblemsSection = dynamic(() => import('@/components/sections/ProblemsSection'), {
  loading: () => <div className="h-48 md:h-64" aria-hidden="true" />,
})
const MethodSection = dynamic(() => import('@/components/sections/MethodSection'), {
  loading: () => <div className="h-48 md:h-64" aria-hidden="true" />,
})

const ServicesSection = dynamic(() => import('@/components/sections/ServicesSection'), {
  loading: () => <div className="h-48 md:h-64" aria-hidden="true" />,
})
const AuthorPreviewSection = dynamic(() => import('@/components/sections/AuthorPreviewSection'), {
  loading: () => null,
})
const TestimonialsSection = dynamic(() => import('@/components/sections/TestimonialsSection'), {
  loading: () => null,
})
const FAQSection = dynamic(() => import('@/components/sections/FAQSection'), {
  loading: () => null,
})
import { AnimatedText, AnimatedSection, SectionContainer } from '@/components/ui'
import { Link } from '@/i18n/routing'
import { useRegisterSchemas } from '@/providers/BreadcrumbsProvider'

export default function HomeClient({ locale: _locale, schemas }: { locale: string; schemas?: Record<string, unknown>[] }) {
  const t = useTranslations('home')
  useRegisterSchemas(schemas ?? [])

  return (
    <>
      {/* ── Hero ── */}
      <Hero />

      {/* ── Проблемы ── */}
      <ProblemsSection />

      {/* ── Метод ── */}
      <MethodSection />

      {/* ── Услуги ── */}
      <ServicesSection maxCards={9} />

      {/* ── Об авторе ── */}
      <AuthorPreviewSection />

      {/* ── Отзывы ── */}
      <TestimonialsSection />

      {/* ── FAQ ── */}
      <FAQSection />

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
              <Link
                href="/kontakty/"
                data-analytics-booking="home-cta"
                className="group relative inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold shadow-glow-gold
                           hover:shadow-[0_0_40px_rgba(201,169,110,0.25)] hover:-translate-y-0.5
                           active:brightness-95 active:translate-y-0
                           transition-all duration-400 text-sm md:text-base gap-2.5 overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2.5">
                  {t('ctaButton')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       strokeLinejoin="round"
                       className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      </AnimatedSection>
    </>
  )
}
