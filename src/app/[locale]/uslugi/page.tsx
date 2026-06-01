'use client'

import { useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import { Link } from '@/i18n/routing'
import { SERVICE_ICONS } from '@/constants'
import TiltCard from '@/components/ui/TiltCard'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
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

const floatingOrb = (delay: number) => ({
  hidden: { y: 0 },
  visible: {
    y: [0, -10, 0],
    transition: { duration: 5, ease: 'easeInOut' as const, repeat: Infinity, delay },
  },
})

/* ── Background Decorations ── */

function BackgroundDecorations() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const orbY = useTransform(scrollY, [0, 600], [0, -40])
  const orb2Y = useTransform(scrollY, [0, 600], [0, 30])

  const orb0 = useMemo(() => floatingOrb(0), [])
  const orb1 = useMemo(() => floatingOrb(2.5), [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Ambient glow — static CSS, lightweight, keep */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-gradient-radial from-gold/[0.03] via-transparent to-transparent blur-[120px]" />

      {!shouldReduceAnimations && (
        <>
          <motion.div style={{ y: orbY }}>
            <motion.div
              variants={orb0}
              initial="hidden"
              animate="visible"
              className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-bl from-green/[0.03] via-transparent to-transparent rounded-full blur-3xl"
            />
          </motion.div>

          <motion.div style={{ y: orb2Y }}>
            <motion.div
              variants={orb1}
              initial="hidden"
              animate="visible"
              className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-gold/[0.02] via-transparent to-transparent rounded-full blur-3xl"
            />
          </motion.div>

          {/* Decorative rings */}
          <svg className="absolute top-1/4 right-1/6 w-48 h-48 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="70" stroke="url(#ringGrad)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="50" stroke="url(#ringGrad)" strokeWidth="0.3" />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C9A96E" stopOpacity="0" />
                <stop offset="50%" stopColor="#C9A96E" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </>
      )}

      {/* Dot pattern — lightweight, keep */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(201,169,110,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
    </div>
  )
}

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

/* ── Services Page ── */

export default function UslugiPage() {
  const t = useTranslations('services')
  const commonT = useTranslations('common')
  const messages = useMessages()
  const servicesData = (messages?.servicesData as ServiceItem[]) ?? []

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-8 md:pt-32 md:pb-12 bg-bg-base overflow-hidden">
        <BackgroundDecorations />

        <motion.div
          variants={sectionContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-container mx-auto px-gutter"
        >
          <div className="max-w-3xl">
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
      <section className="relative py-12 md:py-16 bg-gradient-to-b from-bg-base to-bg-surface overflow-hidden">
        <div className="max-w-container mx-auto px-gutter">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
            {servicesData.map((service, index) => (
              <ServiceCard key={service.slug} service={service} index={index} />
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-14 p-8 md:p-10 rounded-2xl text-center
                       bg-gradient-to-br from-gold/[0.06] to-gold/[0.02]
                       border border-gold/[0.12]"
          >
            <p className="text-xl font-display text-text-primary">
              {t('notSure') || 'Не уверены, что подходит?'}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {t('freeConsultation') || 'Запишитесь на бесплатную консультацию — я помогу разобраться'}
            </p>
            <div className="mt-6">
              <Link
                href="/kontakty/"
                data-analytics-booking="services-listing-cta"
                className="group relative inline-flex items-center justify-center px-7 py-3 rounded-full
                           text-sm font-semibold overflow-hidden
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep
                           shadow-[0_0_20px_rgba(201,169,110,0.15)]
                           hover:shadow-[0_0_30px_rgba(201,169,110,0.25)]
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-400"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2">
                  {commonT('cta.booking')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       strokeLinejoin="round"
                       className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
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
