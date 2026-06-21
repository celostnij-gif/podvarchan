'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import Image from 'next/image'
import { AnimatedText, AnimatedSection, SectionContainer, TiltCard, childVariants, DiplomaShowcase } from '@/components/ui'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'
import { Link } from '@/i18n/routing'
import { AUTHOR } from '@/constants'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Animation presets ── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const },
}

const cardSlide = (i: number) => ({
  initial: { opacity: 0, x: i % 2 === 0 ? -20 : 20, scale: 0.97 },
  whileInView: { opacity: 1, x: 0, scale: 1 },
  viewport: { once: true },
  transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
})

/* ── Hero Background Parallax ── */

function HeroBackgroundParallax() {
  const { scrollY } = useScroll()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const shadeY = useTransform(scrollY, [0, 400], [0, -80])

  return (
    <motion.div style={{ y: shouldReduceAnimations ? 0 : shadeY }} className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-bg-deep pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/[0.03] to-transparent pointer-events-none" />
    </motion.div>
  )
}

/* ── Component ── */

export function ClientAboutPage() {
  const t = useTranslations('pages.about')
  const commonT = useTranslations('common')

  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.about') },
  ])

  const credNames = t.raw('credNames') as string[]
  const credOrgs = t.raw('credOrgs') as string[]
  const educationCreds = AUTHOR.credentials.filter((c) => c.category === 'degree').map((cred, i) => ({
    ...cred,
    name: credNames[i] ?? cred.name,
    organization: credOrgs[i] ?? cred.organization,
  }))
  const certCreds = AUTHOR.credentials.filter((c) => c.category === 'certification').map((cred, i) => ({
    ...cred,
    name: credNames[i + 3] ?? cred.name,
    organization: credOrgs[i + 3] ?? cred.organization,
  }))
  const specializationItems = t.raw('specializationItems') as string[]
  const messages = useMessages()
  const diplomaItems = (messages as any)?.diplomaData?.items as Array<{
    id: number
    title: string
    organization: string
    year: string
    description: string
    image: string
  }> | undefined

  return (
    <>
      {/* ════════════════════════════════════════
           HERO — Фото + Имя + Регалии
           ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        aria-label={t('heading')}
      >
        <HeroBackgroundParallax />

        <div className="max-w-container mx-auto px-gutter pt-16 pb-10 md:pt-20 md:pb-14">
          <div className="relative z-10">
            {/* Breadcrumbs */}
            <HeroBreadcrumbs />
            <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
              {/* Photo */}
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 }}
                className="md:col-span-2 flex justify-center md:justify-start"
              >
                <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden border-2 border-gold/20 shadow-glow-gold">
                  <Image
                    src="/images/about.webp"
                    alt={commonT('authorName')}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 224px, 288px"
                  />
                </div>
              </motion.div>

              {/* Text */}
              <div className="md:col-span-3 text-center md:text-left">
                <AnimatedText
                  as="h1"
                  direction="up"
                  className="text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight"
                >
                  {commonT('authorName')}
                </AnimatedText>
                <AnimatedText
                  as="p"
                  direction="up"
                  delay={100}
                  className="mt-2 text-xl text-gold font-body"
                >
                  {commonT('authorTitle')}
                </AnimatedText>
                <AnimatedText
                  direction="up"
                  delay={200}
                  className="mt-4 text-base text-text-secondary leading-relaxed max-w-xl"
                >
                  {t('description')}
                </AnimatedText>

                {/* CTA */}
                <AnimatedText direction="up" delay={300} className="mt-6">
                  <Link
                    href="/kontakty/"
                    className="inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                               bg-gold text-bg-deep font-semibold tracking-wide shadow-glow-gold
                               hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5
                               transition-all duration-400 text-sm md:text-base"
                  >
                    <span className="drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">{commonT('bookingCta')}</span>
                  </Link>
                </AnimatedText>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
           STATS — Цифры доверия
           ════════════════════════════════════════ */}
      <SectionContainer size="sm">
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
          {[
            { value: '2000+', label: t('statsClients') },
            { value: '15+', label: t('statsYears') },
            { value: '6+', label: t('statsCertificates') },
          ].map((stat, i) => (
            <AnimatedText key={i} direction="up" delay={i * 80}>
              <div className="text-3xl md:text-5xl font-display text-gold leading-none">
                {stat.value}
              </div>
              <div className="mt-2 text-xs text-text-muted uppercase tracking-widest">
                {stat.label}
              </div>
            </AnimatedText>
          ))}
        </div>
      </SectionContainer>

      {/* ════════════════════════════════════════
           PERSONAL STORY — Путь и философия
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <div className="max-w-3xl mx-auto">
            <div className="relative p-8 md:p-12 bg-bg-surface/85 border border-border-base rounded-2xl">
              {/* Decorative quote mark */}
              <span
                className="absolute -top-3 left-6 text-7xl text-gold/10 font-display leading-none pointer-events-none select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <div className="relative">
                <AnimatedText
                  as="h2"
                  direction="up"
                  className="text-2xl md:text-3xl font-display text-gold"
                >
                  {t('personalStoryTitle')}
                </AnimatedText>

                {/* Narrative */}
                <AnimatedText
                  direction="up"
                  delay={80}
                  className="mt-6 text-base text-text-secondary leading-relaxed"
                >
                  {t('personalStory')}
                </AnimatedText>

                {/* Divider */}
                <div className="my-8 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" aria-hidden="true" />

                {/* Related directions */}
                <AnimatedText
                  direction="up"
                  delay={120}
                  className="text-base font-display text-gold-light"
                >
                  {t('personalStoryDirections')}
                </AnimatedText>

                <AnimatedText direction="up" delay={160}>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { slug: 'gipnoterapiya-onlayn', icon: '✨' },
                      { slug: 'rabota-s-podsoznaniem', icon: '🌌' },
                      { slug: 'samosabotazh-i-bloki', icon: '🔓' },
                      { slug: 'trevoga-i-panicheskiye-ataki', icon: '🫂' },
                    ].map((svc) => {
                      const svcData = (messages?.servicesData as Array<{ slug: string; title: string }>)?.find((s) => s.slug === svc.slug)
                      if (!svcData) return null
                      return (
                        <Link
                          key={svc.slug}
                          href={`/uslugi/${svc.slug}/`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated/50 border border-border-base
                                     hover:border-gold/30 hover:bg-bg-elevated transition-all duration-300 group"
                        >
                          <span className="text-lg" aria-hidden="true">{svc.icon}</span>
                          <span className="text-sm text-text-secondary group-hover:text-gold transition-colors duration-300">
                            {svcData.title}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </AnimatedText>
              </div>
            </div>
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           FAMILY — Фото с женой (доверие)
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0, 1] }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-gold/20 shadow-glow-gold">
                <Image
                  src="/images/author-family.webp"
                  alt={t('familyPhotoAlt')}
                  width={800}
                  height={533}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority={false}
                />
              </div>
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-gold/30 rounded-tl" aria-hidden="true" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-gold/30 rounded-br" aria-hidden="true" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0, 1] }}
            >
              <AnimatedText
                as="h2"
                direction="up"
                className="text-2xl md:text-3xl font-display text-gold"
              >
                {t('familyTitle')}
              </AnimatedText>
              <AnimatedText
                direction="up"
                delay={100}
                className="mt-4 text-base text-text-secondary leading-relaxed"
              >
                {t('familyDescription')}
              </AnimatedText>
            </motion.div>
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           EDUCATION — Дипломы и образование
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md" background="surface">
          <AnimatedText
            as="h2"
            direction="up"
            className="text-3xl md:text-4xl font-display text-text-primary text-center"
          >
            {t('education')}
          </AnimatedText>

          <div className="mt-10 space-y-5 max-w-3xl mx-auto">
            {educationCreds.map((cred, i) => (
              <TiltCard key={i} tiltDegree={3} scale={1.015} className="rounded-xl">
                <motion.div
                  variants={cardSlide(i)}
                  initial="initial"
                  whileInView="whileInView"
                  className="flex items-start gap-5 p-6 border border-border-base
                             hover:border-gold/20 transition-all duration-400 group rounded-xl"
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center shrink-0 text-xl group-hover:bg-gold/20 transition-colors duration-300">
                    🎓
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-display text-gold group-hover:text-gold-light transition-colors duration-300">
                        {cred.name}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gold/10 text-gold rounded-full">
                        {cred.year}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                      {cred.organization}
                    </p>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           CERTIFICATIONS — Сертификаты
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <AnimatedText
            as="h2"
            direction="up"
            className="text-3xl md:text-4xl font-display text-text-primary text-center"
          >
            {t('certificationsTitle')}
          </AnimatedText>

          <AnimatedText
            direction="up"
            delay={80}
            className="mt-3 text-center text-sm text-text-muted max-w-xl mx-auto"
          >
            {t('certificationsSubtitle')}
          </AnimatedText>

          <div className="mt-10 space-y-5 max-w-3xl mx-auto">
            {certCreds.map((cred, i) => (
              <TiltCard key={i} tiltDegree={3} scale={1.015} className="rounded-xl">
                <motion.div
                  variants={cardSlide(i)}
                  initial="initial"
                  whileInView="whileInView"
                  className="flex items-start gap-5 p-6 border border-border-base
                             hover:border-gold/20 transition-all duration-400 group rounded-xl"
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center shrink-0 text-xl group-hover:bg-gold/20 transition-colors duration-300">
                    🏅
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-display text-gold group-hover:text-gold-light transition-colors duration-300">
                        {cred.name}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gold/10 text-gold rounded-full">
                        {cred.year}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                      {cred.organization}
                    </p>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           DIPLOMAS — Визуальная демонстрация дипломов
           ════════════════════════════════════════ */}
      <DiplomaShowcase diplomas={diplomaItems} />

      {/* ════════════════════════════════════════
           METHOD — Описание метода
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md" background="surface">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedText
              as="h2"
              direction="up"
              className="text-3xl md:text-4xl font-display text-text-primary"
            >
              {t('methodTitle')}
            </AnimatedText>

            <AnimatedText
              direction="up"
              delay={100}
              className="mt-6 text-base text-text-secondary leading-relaxed text-left"
            >
              {t('methodDescription')}
            </AnimatedText>

            <AnimatedText direction="up" delay={200} className="mt-8">
              <Link
                href="/metod/"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light underline-offset-4 hover:underline transition-all text-sm"
              >
                {t('methodLink')} <span aria-hidden="true">→</span>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           SPECIALIZATION — Области работы
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md" background="default">
          <AnimatedText
            as="h2"
            direction="up"
            className="text-3xl md:text-4xl font-display text-text-primary text-center"
          >
            {t('specialization')}
          </AnimatedText>

          <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            {specializationItems.map((item, i) => (
              <TiltCard key={i} tiltDegree={2} scale={1.01} glowOpacity={0.04} className="rounded-lg h-full">
                <motion.div
                  variants={childVariants}
                  className="flex items-start gap-3 p-4 bg-bg-surface/85 border border-border-base
                             hover:border-gold/15 transition-all duration-300 group rounded-lg h-full"
                >
                  <span className="text-gold mt-0.5 shrink-0 text-lg group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                    ✦
                  </span>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-300">
                    {item}
                  </span>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </SectionContainer>
      </AnimatedSection>

      {/* ════════════════════════════════════════
           CTA — Призыв к действию
           ════════════════════════════════════════ */}
      <AnimatedSection as="div" variant="fadeUp">
        <SectionContainer size="md">
          <div className="relative max-w-3xl mx-auto text-center">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <AnimatedText
              as="h2"
              direction="up"
              className="relative text-3xl md:text-4xl font-display text-text-primary"
            >
              {t('ctaTitle')}
            </AnimatedText>

            <AnimatedText
              direction="up"
              delay={150}
              className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto"
            >
              {t('ctaDescription')}
            </AnimatedText>

            <AnimatedText direction="up" delay={250} className="relative mt-8">
              <Link
                href="/kontakty/"
                className="inline-flex items-center justify-center px-9 py-3.5 rounded-full
                           bg-gold text-bg-deep font-semibold tracking-wide shadow-glow-gold
                           hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5
                           transition-all duration-400 text-base"
              >
                <span className="drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">{t('cta')}</span>
              </Link>
            </AnimatedText>
          </div>
        </SectionContainer>
      </AnimatedSection>
    </>
  )
}
