'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { AnimatedText, AnimatedSection, SectionContainer, Button, MedicalDisclaimer, TiltCard, childVariants } from '@/components/ui'
import { Link } from '@/i18n/routing'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Animation presets ── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const },
}

/* ── Hero Background Image ── */

function HeroBackgroundImage() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  // Параллакс: изображение смещается вниз при скролле (как на главной) —
  // фон движется медленнее контента, создавая эффект глубины
  // Disabled on mobile for performance.
  const imgY = useTransform(scrollY, [0, 800], [0, 200])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Image — positioned on the right side */}
      <motion.div style={{ y: shouldReduceAnimations ? 0 : imgY }} className="absolute inset-y-0 right-0 w-full lg:w-[60%]">
        <Image
          src="/images/metod-hero.webp"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: 'right top' }}
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          aria-hidden="true"
        />

        {/* Layer 2: Тёплое золотисто-янтарное свечение от области портрета */}
        <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/[0.07] via-gold/[0.10] to-transparent pointer-events-none" />

        {/* Layer 2b: Мягкий ореол тепла поверх портрета */}
        <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-gradient-to-bl from-orange-400/[0.04] via-gold/[0.05] to-transparent pointer-events-none" />

        {/* Layer 3a: Диагональная виньетка — глубина по нижнему и левому краям */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/30 via-[30%] to-transparent pointer-events-none" />

        {/* Layer 3b: Левая виньетка — дополнительное затемнение левого края */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />

        {/* Layer 4: Общее затемнение для читаемости текста */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Layer 5: bg-deep ПОВЕРХ — растворяется с левого края изображения, синхронизирован с параллаксом */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-deep via-bg-deep/30 via-[15%] to-transparent pointer-events-none" />
      </motion.div>
    </div>
  )
}

/* ── Page ── */

export default function MetodClient() {
  const t = useTranslations('pages.metod')
  const methodT = useTranslations('method')
  const commonT = useTranslations('common')

  const components = t.raw('items') as Array<{
    title: string
    desc: string
    fullDesc: string
    icon: string
    benefits: string[]
  }>

  const sessionFlow = t.raw('sessionFlow') as Array<{
    title: string
    desc: string
  }>

  const safetyItems = t.raw('safetyItems') as Array<{
    title: string
    desc: string
  }>

  const audienceItems = t.raw('audienceItems') as string[]

  return (
    <>
      {/* ════════════════════════════════════════
           HERO
           ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-bg-deep"
        aria-label={t('heading')}
      >
        <HeroBackgroundImage />

        <SectionContainer size="sm" background="transparent">
          <div className="relative z-10 max-w-3xl">
            {/* Breadcrumb */}
            <AnimatedText direction="up" delay={50} className="flex items-center gap-2 text-xs text-text-muted mb-6">
              <Link href="/" className="hover:text-gold transition-colors">
                {commonT('nav.home')}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-gold">{t('breadcrumb')}</span>
            </AnimatedText>

            {/* Heading */}
            <AnimatedText as="h1" direction="up" delay={100} className="relative">
              <span className="block text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight">
                {t('heading')} {t('headingAccent')}
              </span>
            </AnimatedText>

            <AnimatedText as="p" direction="up" delay={200} className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl">
              <span className="bg-bg-deep/60 backdrop-blur-sm px-4 py-3 rounded-xl block">
                {t('heroSubtitle')}
              </span>
            </AnimatedText>

            {/* CTA buttons */}
            <AnimatedText direction="up" delay={300} className="mt-8 flex flex-wrap gap-4">
              <Link href="/kontakty/">
                <Button variant="primary" size="lg">
                  {commonT('bookingCta')}
                </Button>
              </Link>
              <Link href="/ob-avtore/">
                <Button variant="secondary" size="lg">
                  {commonT('nav.about')}
                </Button>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      </section>

      {/* ════════════════════════════════════════
           PHILOSOPHY — premium redesign
           ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-bg-deep">
        {/* Subtle ambient glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <SectionContainer size="md" background="transparent">
          <div className="relative max-w-4xl mx-auto">
            {/* Opening decorative asterism */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1] }}
              className="text-center mb-6"
            >
              <span
                className="text-5xl md:text-6xl font-display text-gold/[0.12] leading-none select-none tracking-[0.3em]"
                aria-hidden="true"
              >
                ✦ ✦ ✦
              </span>
            </motion.div>

            <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary text-center">
              {t('philosophyTitle')}
            </AnimatedText>

            {/* Decorative gold divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0, 1], delay: 0.3 }}
              className="mt-6 flex items-center justify-center gap-3"
            >
              <span className="w-12 h-px bg-gradient-to-r from-transparent via-gold/40 to-gold/40" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold/60" />
              <span className="w-12 h-px bg-gradient-to-r from-gold/40 via-gold/40 to-transparent" />
            </motion.div>

            {/* Paragraphs with vertical gold accent bars */}
            <div className="mt-10 space-y-10">
              {t('philosophyText').split('\n\n').map((text: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1], delay: 0.2 + i * 0.15 }}
                  className="relative pl-8 md:pl-12"
                >
                  {/* Full-height gold accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold/50 via-gold/20 to-transparent rounded-full" />

                  {/* Small gold dot marker */}
                  <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-gold/40" />

                  <p className="text-base md:text-lg text-text-secondary leading-relaxed md:leading-[1.85]">
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Closing decorative asterism */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1], delay: 0.6 }}
              className="mt-10 text-center"
            >
              <span
                className="text-4xl md:text-5xl font-display text-gold/[0.10] leading-none select-none tracking-[0.3em]"
                aria-hidden="true"
              >
                ✦ ✦ ✦
              </span>
            </motion.div>
          </div>
        </SectionContainer>
      </section>

      {/* ════════════════════════════════════════
           THREE COMPONENTS
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="default">
        <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary text-center">
          {t('componentsTitle')}
        </AnimatedText>

        <div className="mt-12 space-y-16">
          {components.map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="grid md:grid-cols-5 gap-8 md:gap-12 items-start"
            >
              {/* Icon + Title */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl" aria-hidden="true">{item.icon}</span>
                  <h3 className="text-2xl font-display text-gold">{item.title}</h3>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>

              {/* Full description + benefits */}
              <div className="md:col-span-3">
                <p className="text-text-secondary leading-relaxed">{item.fullDesc}</p>

                <ul className="mt-4 space-y-1.5">
                  {item.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Separator (except last) */}
              {i < components.length - 1 && (
                <div className="md:col-span-5 border-t border-border-base/50" />
              )}
            </motion.div>
          ))}
        </div>
      </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           HOW IT WORKS (Session Flow)
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="surface">
        <div className="max-w-4xl mx-auto">
          <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary text-center">
            {t('howItWorksTitle')}
          </AnimatedText>

          <AnimatedText direction="up" delay={100} className="mt-4 text-center text-text-secondary max-w-2xl mx-auto">
            {t('howItWorksText')}
          </AnimatedText>

          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {sessionFlow.map((step, i) => (
              <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-xl h-full">
              <motion.div
                variants={childVariants}
                className="relative p-6 bg-bg-base border border-border-base hover:border-gold/20 transition-all duration-400 group rounded-xl h-full flex flex-col"
              >
                <span className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-display text-gold">
                  {i + 1}
                </span>
                <h3 className="mt-1 text-lg font-display text-text-primary group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed flex-1">
                  {step.desc}
                </p>
              </motion.div>
              </TiltCard>
            ))}
          </div>

          {/* Reuse existing method steps for more detail */}
          <AnimatedText direction="up" delay={300} className="mt-16">
            <p className="text-center text-text-muted text-sm">
              {methodT('onlineBadge')}
            </p>
          </AnimatedText>
        </div>
      </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           SAFETY
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="default">
        <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary text-center">
          {t('safetyTitle')}
        </AnimatedText>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {safetyItems.map((item, i) => (
            <TiltCard key={i} tiltDegree={3} scale={1.015} className="rounded-xl h-full">
            <motion.div
              variants={childVariants}
              className="p-6 bg-bg-surface border border-border-base text-center
                         hover:border-gold/20 transition-all duration-400 group rounded-xl h-full flex flex-col"
            >
              <h3 className="text-base font-display text-gold group-hover:text-gold-light transition-colors duration-300">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-text-muted leading-relaxed flex-1">
                {item.desc}
              </p>
            </motion.div>
            </TiltCard>
          ))}
        </div>
      </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           AUDIENCE
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="surface">
        <div className="max-w-3xl mx-auto">
          <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary text-center">
            {t('audienceTitle')}
          </AnimatedText>

          <ul className="mt-10 space-y-3">              {audienceItems.map((item, i) => (
              <TiltCard key={i} tiltDegree={2} scale={1.01} glowOpacity={0.04} className="rounded-lg">
              <motion.li
                variants={childVariants}
                className="flex items-start gap-3 p-4 bg-bg-base border border-border-base
                           hover:border-gold/15 transition-all duration-300 group rounded-lg"
              >
                <span
                  className="mt-1 w-2 h-2 rounded-full bg-gold/60 shrink-0 group-hover:bg-gold transition-colors duration-300"
                  aria-hidden="true"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-300">
                  {item}
                </span>
              </motion.li>
              </TiltCard>
            ))}
          </ul>
        </div>
      </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           MEDICAL DISCLAIMER
           ════════════════════════════════════════ */}
      <MedicalDisclaimer />

      {/* ════════════════════════════════════════
           CTA
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="deep">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Decorative gradient */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <AnimatedText as="h2" direction="up" className="relative text-3xl md:text-4xl font-display text-text-primary">
            {t('ctaTitle')}
          </AnimatedText>

          <AnimatedText direction="up" delay={150} className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
            {t('ctaText')}
          </AnimatedText>

          <AnimatedText direction="up" delay={250} className="relative mt-8">
            <Link href="/kontakty/">
              <Button variant="primary" size="lg">
                {t('ctaButton')}
              </Button>
            </Link>
          </AnimatedText>

          <AnimatedText direction="up" delay={350} className="relative mt-6">
            <Link
              href="/ob-avtore/"
              className="text-sm text-gold/70 hover:text-gold underline-offset-4 hover:underline transition-all"
            >
              {t('readMore')}
            </Link>
          </AnimatedText>
        </div>
      </SectionContainer>
      </AnimatedSection>
    </>
  )
}
