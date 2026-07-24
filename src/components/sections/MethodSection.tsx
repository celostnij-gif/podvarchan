'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import TiltCard from '@/components/ui/TiltCard'
import { AnimatedSection, SectionContainer } from '@/components/ui'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Premium easing ── */
const easePremium = [0.25, 0.1, 0, 1] as const

/* ── Section animation variants ── */

const headingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easePremium },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.6, ease: easePremium },
  }),
}

const badgeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.45, duration: 0.5, ease: easePremium },
  },
}

/* ── Background Decorations ── */

function BackgroundDecorations() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const orbY = useTransform(scrollY, [0, 800], [0, -60])
  const orb2Y = useTransform(scrollY, [0, 800], [0, 40])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {!shouldReduceAnimations && (
        <>
          {/* Ambient glow — moves with parallax, disabled on mobile */}
          <motion.div
            style={{ y: orbY }}
            className="absolute top-1/3 -right-20 w-80 h-80 bg-gradient-to-bl from-gold/[0.03] via-transparent to-transparent rounded-full blur-[80px]"
          />
          <motion.div
            style={{ y: orb2Y }}
            className="absolute bottom-0 -left-20 w-72 h-72 bg-gradient-to-tr from-green/[0.02] via-transparent to-transparent rounded-full blur-[80px]"
          />

          {/* Decorative ring */}
          <svg className="absolute top-1/4 left-1/4 w-48 h-48 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="70" stroke="#C9A96E" strokeWidth="0.4" />
            <circle cx="100" cy="100" r="50" stroke="#C9A96E" strokeWidth="0.3" />
          </svg>
        </>
      )}
    </div>
  )
}

/* ── D1 content type ── */
interface MethodD1 {
  heading?: string
  subtitle?: string
  items?: { title: string; description?: string; duration?: string }[]
}

/* ── Component ── */

export default function MethodSection({ d1Content }: { d1Content?: MethodD1 }) {
  const t = useTranslations('method')

  const steps = d1Content?.items && d1Content.items.length > 0
    ? d1Content.items.slice(0, 3).map((item, i) => ({
        num: String(i + 1).padStart(2, '0'),
        title: item.title,
        desc: item.description ?? '',
      }))
    : [
        { num: '01', title: t('step1Title'), desc: t('step1Desc') },
        { num: '02', title: t('step2Title'), desc: t('step2Desc') },
        { num: '03', title: t('step3Title'), desc: t('step3Desc') },
      ]

  return (
    <AnimatedSection as="section" variant="fadeUp" className="relative overflow-hidden" aria-label={t('ariaLabel')}>
      <BackgroundDecorations />

      <SectionContainer size="md" background="transparent">
        {/* Heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium">
            {d1Content?.heading || t('heading')}
          </h2>
          <p className="mt-4 text-base text-text-secondary max-w-2xl mx-auto">
            {d1Content?.subtitle || t('subtitle')}
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-xl h-full">
              <motion.div
                variants={cardVariants}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="relative p-6 bg-bg-surface/85 border border-border-base
                           hover:border-gold/20 transition-all duration-400 group rounded-xl
                           h-full flex flex-col"
              >
                <span className="text-4xl font-display text-gold/30 group-hover:text-gold/50 transition-colors duration-300"
                      aria-hidden="true">
                  {step.num}
                </span>
                <h3 className="mt-3 text-lg font-display text-text-primary group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed flex-1">{step.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>

        {/* Online badge */}
        <motion.div
          variants={badgeVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-10 p-6 rounded-xl bg-bg-elevated/85 border border-border-base text-center"
        >
          <p className="text-sm text-text-muted">{t('onlineBadge')}</p>
        </motion.div>
      </SectionContainer>
    </AnimatedSection>
  )
}
