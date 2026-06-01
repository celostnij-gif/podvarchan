'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { FaqAccordion } from '@/components/ui'

/* ── Animation variants ── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const } },
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
          : 'bg-bg-surface border border-border-base hover:border-gold-muted/30'
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
        <div className="flex items-baseline gap-2">
          {originalPrice && (
            <span className="text-lg text-text-muted line-through">{originalPrice}</span>
          )}
          <span className={`text-3xl md:text-4xl font-display font-bold ${
            highlighted ? 'text-gold' : 'text-text-primary'
          }`}>
            {price}
          </span>
          {oldPrice && (
            <span className="text-sm text-text-muted line-through">{oldPrice}</span>
          )}
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
        className={`mt-8 inline-flex items-center justify-center w-full px-6 py-3 rounded-full text-sm font-semibold transition-all duration-400 ${
          highlighted
            ? 'bg-gradient-to-r from-gold to-gold-light text-bg-deep shadow-glow-gold hover:shadow-[0_0_30px_rgba(201,169,110,0.25)] hover:-translate-y-0.5'
            : 'bg-bg-elevated border border-border-light text-text-primary hover:bg-gold/10 hover:border-gold/30 hover:text-gold'
        } active:translate-y-0`}
      >
        {index === 0 ? 'Записаться' : 'Выбрать курс'}
      </Link>
    </motion.div>
  )
}

/* ── Main Component ── */

export function TsenyClient() {
  const t = useTranslations('tseny')

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
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-hero opacity-20 blur-[100px]" />
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gold/[0.03] blur-3xl" />
        </div>

        <div className="relative z-10 max-w-container mx-auto px-gutter text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
              {t('badgeLabel')}
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight">
              {t('pageTitle')}
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              {t('pageDescription')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-container mx-auto px-gutter">
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
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-container mx-auto px-gutter">
          <div className="max-w-2xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-display text-text-primary text-center mb-8"
            >
              {t('faqTitle')}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              {faqItems.map((item, i) => (
                <FaqAccordion key={i} question={item.question} answer={item.answer} compact />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-container mx-auto px-gutter">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-2xl text-center bg-gradient-to-br from-gold/[0.06] to-gold/[0.02] border border-gold/15 relative overflow-hidden"
          >
            <div className="absolute -top-40 -right-40 w-[300px] h-[300px] rounded-full bg-gold/[0.06] blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-xl md:text-2xl font-display text-text-primary">
                {t('ctaTitle')}
              </p>
              <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">
                {t('ctaDescription')}
              </p>
              <Link
                href="/kontakty/"
                data-analytics-booking="tseny-cta"
                className="group relative inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold shadow-glow-gold
                           hover:shadow-[0_0_40px_rgba(201,169,110,0.25)] hover:-translate-y-0.5
                           active:brightness-95 active:translate-y-0
                           transition-all duration-400 text-sm md:text-base gap-2.5 overflow-hidden mt-6"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 flex items-center gap-2.5">
                  {t('ctaButton')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       strokeLinejoin="round"
                       className="transition-transform duration-300 group-hover:translate-x-0.5">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
