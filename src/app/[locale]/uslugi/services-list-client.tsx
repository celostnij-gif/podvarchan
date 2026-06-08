'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { SERVICE_ICONS } from '@/constants'
import TiltCard from '@/components/ui/TiltCard'
import { AnimatedSection, AnimatedText, SectionContainer } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'

export interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  cta: string
}

/* ── Variants ── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const } },
}

const sectionContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const cardUp = (i: number) => ({
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  },
})

/* ── Service Card ── */

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const accentColors = [
    { border: 'group-hover:border-gold/30', glow: 'group-hover:shadow-glow-gold', badge: 'bg-gold/10 text-gold' },
    { border: 'group-hover:border-green/30', glow: 'group-hover:shadow-glow-green', badge: 'bg-green/10 text-green-light' },
  ]
  const color = accentColors[index % 2]

  return (
    <motion.div
      variants={cardUp(index)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <TiltCard tiltDegree={4} scale={1.02} glowOpacity={0.08} className="h-full rounded-2xl">
      <Link
        href={`/uslugi/${service.slug}/`}
        className={`group relative block p-6 md:p-7 h-full
                    bg-bg-surface border border-border-base
                    hover:bg-bg-elevated ${color.border} ${color.glow}
                    hover:-translate-y-1
                    transition-all duration-500 overflow-hidden rounded-2xl`}
      >
        {/* Hover top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/0 to-transparent
                     group-hover:via-gold/30 transition-all duration-500"
          aria-hidden="true"
        />

        {/* Number */}
        <div className="absolute top-5 right-5 text-[10px] font-semibold text-white/[0.06] tracking-widest select-none"
             aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                         bg-gold/[0.06] border border-gold/10
                         group-hover:scale-110 group-hover:bg-gold/[0.1]
                         transition-all duration-400`}
             role="img" aria-hidden="true">
          {SERVICE_ICONS[service.slug] || '✨'}
        </div>

        {/* Title */}
        <h2 className="mt-4 text-xl font-display text-text-primary
                       group-hover:text-gold transition-colors duration-300">
          {service.title}
        </h2>

        {/* Short title badge */}
        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wider
                          uppercase ${color.badge} transition-colors duration-300`}>
          {service.shortTitle}
        </span>

        {/* Description */}
        <p className="mt-3 text-sm text-text-muted leading-relaxed
                      group-hover:text-text-secondary/90 transition-colors duration-300">
          {service.description}
        </p>

        {/* Bottom accent */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gold/60
                        group-hover:text-gold transition-all duration-300">
          <span>{service.cta}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round"
               className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
      </TiltCard>
    </motion.div>
  )
}

/* ── Services List Client ── */

export default function ServicesListClient({ servicesData }: { servicesData: ServiceItem[] }) {
  const t = useTranslations('services')
  const commonT = useTranslations('common')

  // Set breadcrumbs via layout context
  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.services') },
  ])

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-20 md:pb-14">
        <motion.div
          variants={sectionContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-container mx-auto px-gutter text-left"
        >
          <div className="max-w-3xl">
            {/* Breadcrumbs */}
            <HeroBreadcrumbs />
            {/* Section label */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3">
              <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
                {commonT('nav.services')}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fadeUp} className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight">
              {t('pageTitle')}
            </motion.h1>

            {/* Description */}
            <motion.p variants={fadeUp} className="mt-4 text-lg text-text-secondary leading-relaxed max-w-2xl">
              {t('pageDescription')}
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {servicesData.length} {t('directions') || 'направлений'}
              </span>
              <span className="w-px h-4 bg-border-base" aria-hidden="true" />
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                {t('consultation') || 'Бесплатная консультация'}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Services Grid ── */}
      <AnimatedSection as="div" variant="fadeUp" staggerDelay={0.04}>
        <SectionContainer size="md" background="surface">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
            {servicesData.map((service, index) => (
              <ServiceCard key={service.slug} service={service} index={index} />
            ))}
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md" background="deep">
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <AnimatedText as="h2" direction="up" className="relative text-3xl md:text-4xl font-display text-text-primary">
              {t('notSure') || 'Не уверены, что подходит?'}
            </AnimatedText>

            <AnimatedText as="p" direction="up" delay={150} className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
              {t('freeConsultation') || 'Запишитесь на бесплатную консультацию — я помогу разобраться'}
            </AnimatedText>

            <AnimatedText direction="up" delay={250} className="relative mt-8">
              <Link
                href="/kontakty/"
                data-analytics-booking="services-listing-cta"
                className="group relative inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                           text-sm md:text-base font-semibold tracking-wide overflow-hidden
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep
                           shadow-[0_0_20px_rgba(201,169,110,0.15)]
                           hover:shadow-[0_0_30px_rgba(201,169,110,0.25)]
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-400"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                  {commonT('cta.booking')}
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
