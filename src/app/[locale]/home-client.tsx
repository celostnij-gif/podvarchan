'use client'

import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Hero from '@/components/sections/Hero'
import ProblemsSection from '@/components/sections/ProblemsSection'
import MethodSection from '@/components/sections/MethodSection'

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
import { motion } from 'framer-motion'
import { AnimatedText, SectionContainer } from '@/components/ui'
import { Link } from '@/i18n/routing'

/* ── CTA animation variants ── */

const ctaContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const ctaChildVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const },
  },
}

export default function HomeClient({ locale }: { locale: string }) {
  const t = useTranslations('home')

  return (
    <>
      {/* ── Hero ── */}
      <Hero />

      {/* ── Проблемы ── */}
      <ProblemsSection />

      {/* ── Метод ── */}
      <MethodSection />

      {/* ── Услуги ── */}
      <ServicesSection />

      {/* ── Об авторе ── */}
      <AuthorPreviewSection />

      {/* ── Отзывы ── */}
      <TestimonialsSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA ── */}
      <SectionContainer background="deep" className="text-center relative overflow-hidden">
        {/* Background glow with parallax */}
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                     bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent
                     rounded-full blur-[100px]"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0, 1] }}
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10"
          variants={ctaContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          <motion.div variants={ctaChildVariants}>
            <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary">
              {t('ctaTitle')}
            </AnimatedText>
          </motion.div>

          <motion.div variants={ctaChildVariants}>
            <AnimatedText as="p" direction="up" delay={200} className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              {t('ctaDescription')}
            </AnimatedText>
          </motion.div>

          <motion.div variants={ctaChildVariants}>
            <AnimatedText direction="up" delay={400} className="mt-8">
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
          </motion.div>
        </motion.div>
      </SectionContainer>
    </>
  )
}
