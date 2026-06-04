'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Decorative floating orbs ── */

function FloatingOrbs() {
  const { shouldReduceAnimations } = useDeviceCapabilities()

  if (shouldReduceAnimations) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Orb 1 */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full
                   bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent blur-3xl
                   animate-hero-orb"
        style={{ animationDelay: '0s' }}
      />
      {/* Orb 2 */}
      <div
        className="absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full
                   bg-gradient-to-tr from-green/[0.03] via-transparent to-transparent blur-3xl
                   animate-hero-orb"
        style={{ animationDelay: '3s' }}
      />
      {/* Orb 3 */}
      <div
        className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full
                   bg-gradient-to-t from-gold/[0.02] via-transparent to-transparent blur-3xl
                   animate-hero-orb"
        style={{ animationDelay: '5s' }}
      />
    </div>
  )
}

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

/* ── Hero Background Image with Parallax ── */

function HeroBackgroundImage() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  // Parallax: фон рухається повільніше за контент при скролі
  const imgY = useTransform(scrollY, [0, 800], [0, 150])

  return (
    <motion.div
      style={{ y: shouldReduceAnimations ? 0 : imgY }}
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
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
      {/* Dark gradient overlays for readability — static, not parallax */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/80 via-bg-deep/50 to-bg-deep/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/60 via-transparent to-bg-deep/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
    </motion.div>
  )
}

/* ── Background Decorations ── */

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
          {/* Decorative rings — SVG lightweight */}
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
          <svg
            className="absolute bottom-1/3 left-1/6 w-32 h-32 opacity-[0.03] animate-rotate-slow"
            viewBox="0 0 100 100"
          >
            <rect x="10" y="10" width="80" height="80" rx="4"
                  stroke="url(#ringGrad)" strokeWidth="0.5" fill="none" transform="rotate(45 50 50)" />
          </svg>
        </>
      )}

      {/* Scattered dots — lightweight, keep */}
      {DECORATION_POINTS.map((point, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-gold/40"
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

/* ── Scroll Indicator ── */

function ScrollIndicator() {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-5 h-8 rounded-full
                 border border-white/10 flex items-start justify-center pt-2
                 animate-scroll-indicator"
      aria-hidden="true"
    >
      <span className="w-1 h-1.5 rounded-full bg-gold/50 block" />
    </div>
  )
}

/* ── Welcome Badge ── */

function WelcomeBadge({ t, commonT }: { t: (key: string) => string; commonT: (key: string) => string }) {
  return (
    <div
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full
                 bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm
                 animate-fade-in-up"
      style={{ animationDelay: '200ms' }}
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-green" />
      </span>
      <span className="text-xs md:text-sm text-text-muted tracking-wide">
        {commonT('authorName')} · {t('badge')}
      </span>
    </div>
  )
}

/* ── Hero Component ── */

export default function Hero() {
  const t = useTranslations('hero')
  const commonT = useTranslations('common')

  return (
    <section
      className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center overflow-hidden
                 bg-gradient-to-b from-bg-deep via-bg-base to-bg-base pt-[72px] pb-16 md:pt-[92px] md:pb-20"
      aria-label={t('ariaLabel')}
    >
      {/* Background layers */}
      <HeroBackgroundImage />
      <FloatingOrbs />
      <BackgroundDecorations />

      {/* Content */}
      <div className="relative z-10 w-full max-w-container mx-auto px-gutter md:mt-[120px]">
        <div className="max-w-3xl mx-auto text-center">
          {/* Welcome badge */}
          <WelcomeBadge t={t} commonT={commonT} />

          {/* Heading */}
          <h1
            className="mt-6 md:mt-8 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display
                       text-text-primary leading-[1.1] md:leading-[1.08] tracking-tight
                       animate-fade-in-up"
            style={{ animationDelay: '320ms' }}
          >
            {t.rich('heroTitle', {
              gold: (chunks: React.ReactNode) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">{chunks}</span>,
              br: () => <br />,
            })}
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 text-base md:text-lg lg:text-xl text-[#D0CDDC] leading-relaxed
                       max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '440ms', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {t('subtitle')}
          </p>

          {/* Benefits */}
          <ul
            className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: '560ms' }}
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
          </ul>

          {/* CTA Buttons */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '680ms' }}
          >
            <Link
              href="/kontakty/"
              data-analytics-booking="hero-primary"
              className="group relative inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4
                         rounded-full text-sm md:text-base font-semibold tracking-wide overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2.5 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
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
                         rounded-full text-sm md:text-base font-medium tracking-wide
                         bg-white/[0.04] border border-white/[0.08] text-text-secondary
                         hover:text-text-primary hover:bg-white/[0.08] hover:border-white/[0.12]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-300"
            >
              <span className="drop-shadow-[0_1px_2px_rgba(5,5,8,0.3)]">
                {t('ctaSecondary')}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   strokeLinejoin="round" className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Social proof */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-muted animate-fade-in-up"
            style={{ animationDelay: '800ms' }}
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
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  )
}
