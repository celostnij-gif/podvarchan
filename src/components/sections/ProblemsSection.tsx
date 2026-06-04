'use client'

import { useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import TiltCard from '@/components/ui/TiltCard'
import { AnimatedSection, SectionContainer } from '@/components/ui'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Variants ── */

const headingVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const } },
}

const cardVariants = {
  initial: { opacity: 0, y: 30 },
  animate: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  }),
}

const floatingOrb = (delay: number) => ({
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: { duration: 5, ease: 'easeInOut' as const, repeat: Infinity, delay },
  },
})

/* ── Background Decorations ── */

function BackgroundDecorations() {
  const { shouldReduceAnimations } = useDeviceCapabilities()

  // ── Hooks must be called before early return (Rules of Hooks) ──
  const { scrollY } = useScroll()
  const orbY = useTransform(scrollY, [0, 800], [0, -50])
  const orb2Y = useTransform(scrollY, [0, 800], [0, 35])
  const ringY = useTransform(scrollY, [0, 800], [0, -20])
  const orb0 = useMemo(() => floatingOrb(0), [])
  const orb1 = useMemo(() => floatingOrb(2.5), [])

  // Shared static elements — used in both mobile and desktop
  const staticElements = (
    <>
      {/* Ambient glow — fixed center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gold/[0.02] via-transparent to-transparent blur-[100px]" />
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
           style={{ backgroundImage: 'radial-gradient(circle, rgba(201,169,110,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Scattered dots */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-gold/20"
             style={{ top: `${10 + i * 11}%`, left: `${5 + i * 12}%`, opacity: 0.05 + (i % 4) * 0.06 }} />
      ))}
    </>
  )

  // Static background for mobile — no framer-motion, no parallax
  if (shouldReduceAnimations) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {staticElements}
        <div className="absolute -top-20 right-0 w-72 h-72 bg-gradient-to-bl from-gold/[0.03] via-transparent to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green/[0.02] via-transparent to-transparent rounded-full blur-2xl" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {staticElements}

      {/* Floating orbs with parallax scroll */}
      <motion.div style={{ y: orbY }}>
        <motion.div variants={orb0} initial="initial" animate="animate" className="absolute -top-20 right-0 w-72 h-72 bg-gradient-to-bl from-gold/[0.03] via-transparent to-transparent rounded-full blur-2xl" />
      </motion.div>
      <motion.div style={{ y: orb2Y }}>
        <motion.div variants={orb1} initial="initial" animate="animate" className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green/[0.02] via-transparent to-transparent rounded-full blur-2xl" />
      </motion.div>

      {/* Decorative rings with parallax */}
      <motion.div style={{ y: ringY }}>
        <svg className="absolute top-1/6 right-1/5 w-40 h-40 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="70" stroke="#C9A96E" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="50" stroke="#C9A96E" strokeWidth="0.3" />
        </svg>
      </motion.div>
    </div>
  )
}

/* ── Problem Card ── */

function ProblemCard({
  item,
  index,
}: {
  item: { icon: string; title: string; description: string }
  index: number
}) {
  const colors = [
    { bg: 'bg-gold/[0.08]', text: 'text-gold', border: 'group-hover:border-gold/30' },
    { bg: 'bg-green/[0.08]', text: 'text-green-light', border: 'group-hover:border-green/30' },
  ]
  const color = colors[index % 2]

  return (
    <TiltCard tiltDegree={4} scale={1.015} className="overflow-hidden rounded-2xl h-full">
      <motion.div
        variants={cardVariants}
        custom={index}
        className={`group relative p-6 md:p-7 bg-white/[0.02] border border-white/[0.05]
                    hover:bg-white/[0.04] ${color.border}
                    hover:shadow-[0_0_30px_rgba(201,169,110,0.04)]
                    transition-all duration-500 h-full flex flex-col`}
      >
        {/* Number badge */}
        <div className="absolute top-4 right-4 text-[10px] font-semibold text-white/[0.08] tracking-widest select-none"
             aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Hover top accent */}
        <div className={`absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold/0 to-transparent
                         group-hover:via-gold/30 transition-all duration-500`} aria-hidden="true" />

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-lg
                         group-hover:scale-110 transition-all duration-400`}>
          <span className="leading-none" role="img" aria-hidden="true">{item.icon}</span>
        </div>

        {/* Title */}
        <h3 className={`mt-4 text-base font-display text-text-primary group-hover:${color.text} transition-colors duration-300`}>
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-text-muted leading-relaxed group-hover:text-text-secondary/90 transition-colors duration-300 flex-1">
          {item.description}
        </p>

        {/* Bottom accent line */}
        <div className={`mt-4 w-8 h-px bg-white/[0.06] group-hover:bg-gold/30 transition-all duration-400`} aria-hidden="true" />
      </motion.div>
    </TiltCard>
  )
}

/* ── Problems Section ── */

export default function ProblemsSection() {
  const t = useTranslations('problems')
  const commonT = useTranslations('common')

  const problems = [
    { icon: '😰', title: t('problem1Title'), description: t('problem1Desc') },
    { icon: '🫢', title: t('problem2Title'), description: t('problem2Desc') },
    { icon: '😣', title: t('problem3Title'), description: t('problem3Desc') },
    { icon: '😩', title: t('problem4Title'), description: t('problem4Desc') },
    { icon: '😤', title: t('problem5Title'), description: t('problem5Desc') },
    { icon: '😔', title: t('problem6Title'), description: t('problem6Desc') },
  ]

  return (
    <AnimatedSection as="section" variant="fadeUp" className="relative overflow-hidden" aria-label={t('ariaLabel')}>
      <BackgroundDecorations />

      <SectionContainer size="md" background="surface" className="bg-bg-surface">
        {/* Header */}
        <motion.div variants={headingVariants} className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">{t('decorativeLabel')}</span>
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium leading-tight">
            {t.rich('problemsTitle', {
              gold: (chunks: React.ReactNode) => <>{chunks}</>,
            })}
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="mt-10 md:mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => (
            <ProblemCard key={index} item={problem} index={index} />
          ))}
        </div>

        {/* CTA Callout */}
        <motion.div
          variants={cardVariants}
          custom={6}
          className="mt-12 p-8 md:p-10 rounded-2xl text-center
                     bg-gradient-to-br from-gold/[0.06] to-gold/[0.02]
                     border border-gold/[0.12]"
        >
          <p className="text-xl font-display text-text-primary">{t('calloutTitle')}</p>
          <p className="mt-2 text-sm text-text-muted">{t('calloutText')}</p>
          <div className="mt-6">
            <Link
              href="/kontakty/"
              data-analytics-booking="problems-cta"
              className="group relative inline-flex items-center justify-center px-7 py-3 rounded-full
                         text-sm font-semibold tracking-wide overflow-hidden
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
      </SectionContainer>
    </AnimatedSection>
  )
}
