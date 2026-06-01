'use client'

import { useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'


/* ── Variants ── */

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0, 1] as const } },
}

const fadeUpSmall = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0, 1] as const } },
}

const floatingOrb = (delay: number) => ({
  initial: { y: 0 },
  animate: {
    y: [0, -12, 0],
    transition: { duration: 6, ease: 'easeInOut' as const, repeat: Infinity, delay },
  },
})

const scrollIndicatorVariants = {
  animate: {
    opacity: [0.3, 1, 0.3],
    y: [0, 6, 12],
    transition: { duration: 2.5, ease: 'easeInOut' as const, repeat: Infinity },
  },
}

/* ── Hero Background Image ── */

function HeroBackgroundImage() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()

  // Parallax: image moves down (positive Y) as scroll increases —
  // this makes it scroll *slower* than the rest of the page content,
  // creating the "delayed / lingering" effect.
  // Disabled on mobile for performance.
  const y = useTransform(scrollY, [0, 800], [0, 200])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div className="relative w-full h-full" style={{ y: shouldReduceAnimations ? 0 : y }}>
        {/*
          Desktop offset via pure CSS — server-rendered, no hydration jump.
          Parallax (motion.div) applies on top of this offset.
        */}
        <div className="relative w-full h-full">
          <Image
            src="/images/hero-bg.webp"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
      </motion.div>
      {/* Dark gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/80 via-bg-deep/50 to-bg-deep/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/60 via-transparent to-bg-deep/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
    </div>
  )
}

/* ── Floating Orbs ── */

function FloatingOrbs() {
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const orb0 = useMemo(() => floatingOrb(0), [])
  const orb1 = useMemo(() => floatingOrb(3), [])
  const orb2 = useMemo(() => floatingOrb(5), [])

  // Hide decorative orbs on mobile for performance (large blur-3xl elements are GPU-intensive)
  if (shouldReduceAnimations) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Orb 1 */}
      <motion.div
        variants={orb0} initial="initial" animate="animate"
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full
                   bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent blur-3xl"
      />
      {/* Orb 2 */}
      <motion.div
        variants={orb1} initial="initial" animate="animate"
        className="absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full
                   bg-gradient-to-tr from-green/[0.03] via-transparent to-transparent blur-3xl"
      />
      {/* Orb 3 */}
      <motion.div
        variants={orb2} initial="initial" animate="animate"
        className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full
                   bg-gradient-to-t from-gold/[0.02] via-transparent to-transparent blur-3xl"
      />
    </div>
  )
}

/* ── Background Decorations ── */

/* ── Deterministic decoration points ── */
const DECORATION_POINTS = [
  { x: 15, y: 20, opacity: 0.4 },
  { x: 72, y: 8,  opacity: 0.3 },
  { x: 88, y: 45, opacity: 0.25 },
  { x: 5,  y: 70, opacity: 0.35 },
  { x: 60, y: 85, opacity: 0.2 },
  { x: 35, y: 55, opacity: 0.3 },
  { x: 92, y: 72, opacity: 0.25 },
  { x: 48, y: 15, opacity: 0.4 },
  { x: 22, y: 40, opacity: 0.15 },
  { x: 78, y: 60, opacity: 0.2 },
  { x: 55, y: 30, opacity: 0.3 },
  { x: 10, y: 50, opacity: 0.25 },
] as const

function BackgroundDecorations() {
  const { shouldReduceAnimations } = useDeviceCapabilities()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Dot pattern overlay — lightweight, keep on all devices */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(circle, rgba(201,169,110,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Ambient glow top — keep, it's just CSS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-hero opacity-30 blur-[120px]" />

      {!shouldReduceAnimations && (
        <>
          {/* Decorative rings — SVG is lightweight, but motion is not needed on mobile */}
          <svg className="absolute top-1/4 right-1/6 w-64 h-64 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="url(#ringGrad)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" stroke="url(#ringGrad)" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="95" stroke="url(#ringGrad)" strokeWidth="0.2" />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C9A96E" stopOpacity="0" />
                <stop offset="50%" stopColor="#C9A96E" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Decorative rhombus with rotation animation */}
          <motion.svg
            initial={{ rotate: 0, scale: 0.8 }} animate={{ rotate: 360, scale: 1 }}
            transition={{ duration: 120, ease: 'linear', repeat: Infinity }}
            className="absolute bottom-1/3 left-1/6 w-32 h-32 opacity-[0.03]"
            viewBox="0 0 100 100"
          >
            <rect x="10" y="10" width="80" height="80" rx="4"
                  stroke="url(#ringGrad)" strokeWidth="0.5" fill="none" transform="rotate(45 50 50)" />
          </motion.svg>
        </>
      )}

      {/* Scattered dots — lightweight, keep */}
      {DECORATION_POINTS.map((point, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold/20"
          style={{
            top: `${point.y}%`,
            left: `${point.x}%`,
            opacity: point.opacity,
          }}
        />
      ))}
    </div>
  )
}

/* ── Welcome Badge ── */

function WelcomeBadge({ t, commonT }: { t: (key: string) => string; commonT: (key: string) => string }) {
  return (
    <motion.div variants={fadeUpSmall} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full
                   bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-green" />
      </span>
      <span className="text-xs md:text-sm text-text-muted tracking-wide">
        {commonT('authorName')} · {t('badge')}
      </span>
    </motion.div>
  )
}

/* ── Scroll Indicator ── */

function ScrollIndicator() {
  return (
    <motion.div
      variants={scrollIndicatorVariants}
      animate="animate"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-5 h-8 rounded-full
                 border border-white/10 flex items-start justify-center pt-2"
      aria-hidden="true"
    >
      <motion.circle className="w-1 h-1.5 rounded-full bg-gold/50" />
    </motion.div>
  )
}

/* ── Hero Component ── */

export default function Hero() {
  const t = useTranslations('hero')
  const commonT = useTranslations('common')

  return (
    <section
      className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden
                 bg-gradient-to-b from-bg-deep via-bg-base to-bg-base pt-8 pb-16"
      aria-label={t('ariaLabel')}
    >
      {/* Background layers */}
      <HeroBackgroundImage />
      <FloatingOrbs />
      <BackgroundDecorations />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-container mx-auto px-gutter"
      >
        <div className="max-w-3xl mx-auto text-center">
          {/* Welcome badge */}
          <WelcomeBadge t={t} commonT={commonT} />

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="mt-6 md:mt-8 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display
                       text-text-primary leading-[1.1] md:leading-[1.08] tracking-tight"
          >
            {t.rich('heroTitle', {
              gold: (chunks: any) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">{chunks}</span>,
              br: () => <br />,
            })}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-base md:text-lg lg:text-xl text-[#D0CDDC] leading-relaxed
                       max-w-2xl mx-auto"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {t('subtitle')}
          </motion.p>

          {/* Benefits */}
          <motion.ul
            variants={fadeUp}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {['benefit1', 'benefit2', 'benefit3'].map((key, i) => (
              <li key={i}
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                           bg-white/[0.03] border border-white/[0.05]
                           hover:bg-white/[0.06] hover:border-gold/20
                           hover:shadow-[0_0_15px_rgba(201,169,110,0.06)]
                           transition-all duration-300"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                  i % 2 === 0 ? 'bg-gold' : 'bg-green'
                }`} />
                <span className="text-sm text-text-secondary/90 leading-tight">{t(key)}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/kontakty/"
              data-analytics-booking="hero-primary"
              className="group relative inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4
                         rounded-full text-sm md:text-base font-semibold overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2.5">
                {commonT('cta.booking')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              href="/metod/"
              className="group inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4
                         rounded-full text-sm md:text-base font-medium
                         bg-white/[0.04] border border-white/[0.08] text-text-secondary
                         hover:text-text-primary hover:bg-white/[0.08] hover:border-white/[0.12]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-300"
            >
              {t('ctaSecondary')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   strokeLinejoin="round" className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={fadeUpSmall}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-muted"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              {t('socialProof1')}
            </span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" aria-hidden="true" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t('socialProof2')}
            </span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" aria-hidden="true" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" />
              </svg>
              {t('socialProof3')}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  )
}
