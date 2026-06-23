'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { AnimatedSection, AnimatedText, SectionContainer, FaqAccordion, PageHero } from '@/components/ui'
import { useRegisterSchemas } from '@/providers/BreadcrumbsProvider'

/* ── Animation variants ── */

interface TsenyClientProps {
  schemas?: Record<string, unknown>[]
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  }),
}

/* ── Pricing Card ── */

function PricingCard({
  title,
  subtitle,
  price,
  originalPrice,
  oldPrice,
  description,
  features,
  badge,
  highlighted,
  index,
}: {
  title: string
  subtitle: string
  price: string
  originalPrice?: string
  oldPrice?: string
  description: string
  features: string[]
  badge?: string
  highlighted?: boolean
  index: number
}) {
  const t = useTranslations('tseny')
  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={`relative rounded-2xl p-6 md:p-8 flex flex-col ${
        highlighted
          ? 'bg-gradient-to-b from-gold/[0.08] to-gold/[0.02] border-2 border-gold/30 shadow-[0_0_40px_rgba(201,169,110,0.1)]'
          : 'bg-bg-surface/85 border border-border-base hover:border-gold-muted/30'
      } transition-all duration-500`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-bg-deep text-xs font-semibold whitespace-nowrap shadow-glow-gold">
          {badge}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-display text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 flex-wrap">
          {(originalPrice || oldPrice) && (
            <span className="text-lg text-text-muted line-through">{originalPrice || oldPrice}</span>
          )}
          {(originalPrice || oldPrice) && (
            <span className="text-text-muted/40 text-sm" aria-hidden="true">/</span>
          )}
          <span className={`text-3xl md:text-4xl font-display font-bold ${
            highlighted ? 'text-gold' : 'text-text-primary'
          }`}>
            {price}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">{description}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <svg className="w-4 h-4 mt-0.5 text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/kontakty/"
        data-analytics-booking="tseny-card"
        className={`mt-8 inline-flex items-center justify-center w-full px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-400 ${
          highlighted
            ? 'bg-gradient-to-r from-gold to-gold-light text-bg-deep shadow-glow-gold hover:shadow-[0_0_30px_rgba(201,169,110,0.25)] hover:-translate-y-0.5'
            : 'bg-bg-elevated border border-border-light text-text-primary hover:bg-gold/10 hover:border-gold/30 hover:text-gold'
        } active:translate-y-0`}
      >
        <span className={highlighted ? 'drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]' : ''}>
          {t(index === 0 ? 'cardCtaFree' : 'cardCtaOther')}
        </span>
      </Link>
    </motion.div>
  )
}

/* ── Main Component ── */

export function TsenyClient({ schemas }: TsenyClientProps) {
  const t = useTranslations('tseny')
  const commonT = useTranslations('common')
  useRegisterSchemas(schemas ?? [])

  const pricingPlans = [
    {
      title: t('freeConsultationTitle'),
      subtitle: t('freeConsultationSub'),
      price: t('freeConsultationPrice'),
      description: t('freeConsultationDesc'),
      features: [t('freeFeature1'), t('freeFeature2'), t('freeFeature3')],
      highlighted: false,
    },
    {
      title: t('singleSessionTitle'),
      subtitle: t('singleSessionSub'),
      price: t('singleSessionPrice'),
      description: t('singleSessionDesc'),
      features: [t('singleFeature1'), t('singleFeature2'), t('singleFeature3'), t('singleFeature4')],
      highlighted: false,
    },
    {
      title: t('premiumCourseTitle'),
      subtitle: t('premiumCourseSub'),
      price: t('premiumCoursePrice'),
      originalPrice: t('premiumCourseOldPrice'),
      description: t('premiumCourseDesc'),
      features: [t('premiumFeature1'), t('premiumFeature2'), t('premiumFeature3'), t('premiumFeature4'), t('premiumFeature5')],
      badge: t('popularBadge'),
      highlighted: true,
    },
    {
      title: t('eliteCourseTitle'),
      subtitle: t('eliteCourseSub'),
      price: t('eliteCoursePrice'),
      oldPrice: t('eliteCourseOldPrice'),
      description: t('eliteCourseDesc'),
      features: [t('eliteFeature1'), t('eliteFeature2'), t('eliteFeature3'), t('eliteFeature4'), t('eliteFeature5'), t('eliteFeature6')],
      highlighted: false,
    },
  ]

  const faqItems = [
    { question: t('faqPaymentTitle'), answer: t('faqPaymentAnswer') },
    { question: t('faqRefundTitle'), answer: t('faqRefundAnswer') },
    { question: t('faqFormatTitle'), answer: t('faqFormatAnswer') },
  ]

  return (
    <>
      <PageHero
        label={t('badgeLabel')}
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbItems={[
          { label: commonT('nav.home'), href: '/' },
          { label: t('badgeLabel') },
        ]}
        clean
      />

      {/* ── Pricing Cards ── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
            {pricingPlans.map((plan, i) => (
              <PricingCard key={i} {...plan} index={i} />
            ))}
          </div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-[11px] text-text-muted/50 text-center max-w-lg mx-auto"
          >
            {t('disclaimer')}
          </motion.p>
        </SectionContainer>
      </AnimatedSection>

      {/* ── FAQ ── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md" background="transparent">
          <div className="max-w-2xl mx-auto">
            <AnimatedText as="h2" direction="up" className="text-2xl md:text-3xl font-display text-text-primary text-center mb-8">
              {t('faqTitle')}
            </AnimatedText>

            <AnimatedText direction="up" delay={150} as="div">
              <div className="space-y-3">
                {faqItems.map((item, i) => (
                  <FaqAccordion key={i} question={item.question} answer={item.answer} compact />
                ))}
              </div>
            </AnimatedText>
          </div>
        </SectionContainer>
      </AnimatedSection>

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
                data-analytics-booking="tseny-cta"
                className="group relative inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold tracking-wide shadow-glow-gold
                           hover:shadow-[0_0_40px_rgba(201,169,110,0.25)] hover:-translate-y-0.5
                           active:brightness-95 active:translate-y-0
                           transition-all duration-400 text-sm md:text-base gap-2.5 overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 flex items-center gap-2.5 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                  {t('ctaButton')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       strokeLinejoin="round"
                       className="transition-transform duration-300 group-hover:translate-x-0.5">
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
