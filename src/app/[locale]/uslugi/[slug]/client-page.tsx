'use client'

import { useTranslations, useMessages } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useSetBreadcrumbs, useRegisterSchemas } from '@/providers/BreadcrumbsProvider'
import SuitableForSection from '@/components/sections/SuitableForSection'
import MedicalDisclaimer from '@/components/MedicalDisclaimer'
import { motion } from 'framer-motion'
import { SERVICE_ICONS } from '@/constants'
import { ServiceIcon } from '@/components/ui/Icons'
import { AnimatedSection, AnimatedText, SectionContainer, TiltCard, FaqAccordion } from '@/components/ui'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'

interface ServiceData {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
  /** D1-only fields — may be undefined in fallback mode */
  heroTitle?: string | null
  heroSubtitle?: string | null
  symptomsJson?: string | null
  processJson?: string | null
  benefitsJson?: string | null
  faqJson?: string | null
  icon?: string | null
}

interface Props {
  service: ServiceData
  locale: string
  schemas?: Record<string, unknown>[]
  allServices?: ServiceData[]
}
/* ── Symptoms from D1 JSON or messages (localized) ── */

function getSymptomsFromD1(svc: ServiceData): Array<{ icon: string; title: string; desc: string }> | null {
  if (!svc.symptomsJson) return null
  try {
    const parsed = JSON.parse(svc.symptomsJson)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Array<{ icon: string; title: string; desc: string }>
    }
  } catch { /* invalid json */ }
  return null
}

/* ── Symptoms from messages (localized fallback) ── */

function getSymptoms(messages: Record<string, unknown>, slug: string): Array<{ icon: string; title: string; desc: string }> {
  const allSymptoms = (messages as unknown as Record<string, Record<string, Array<{ icon: string; title: string; desc: string }>>>)?.['serviceSymptoms'] as Record<string, Array<{ icon: string; title: string; desc: string }>> | undefined
  return allSymptoms?.[slug] ?? allSymptoms?.['gipnoterapiya-onlayn'] ?? []
}

/* ── Related services mapping ── */

const RELATED_SERVICES: Record<string, string[]> = {
  'gipnoterapiya-onlayn': ['trevoga-i-panicheskiye-ataki', 'rabota-s-podsoznaniem', 'samosabotazh-i-bloki'],

/* ── Related services mapping ── */
  'neyverennost-i-strakh-provala': ['samosabotazh-i-bloki', 'gipnoterapiya-onlayn', 'rabota-s-podsoznaniem'],
  'psikhosomatika': ['gipnoterapiya-onlayn', 'trevoga-i-panicheskiye-ataki', 'lichnostnyy-krizis'],
  'lichnostnyy-krizis': ['gipnoterapiya-onlayn', 'rabota-s-podsoznaniem', 'emotsionalnoye-vygoraniye'],
  'tsifrovoy-detoks-i-gadzhet-zavisimost': ['gipnoterapiya-onlayn', 'samosabotazh-i-bloki', 'lichnostnyy-krizis'],
  'kak-izbavitsya-ot-trevogi': ['trevoga-i-panicheskiye-ataki', 'gipnoterapiya-onlayn', 'postoyannaya-trevoga-bez-prichiny'],
  'postoyannaya-trevoga-bez-prichiny': ['trevoga-i-panicheskiye-ataki', 'kak-izbavitsya-ot-trevogi', 'vnutrenneye-napryazheniye'],
  'utrennyaya-trevoga': ['trevoga-i-panicheskiye-ataki', 'trevoga-pered-snom', 'gipnoterapiya-onlayn'],
  'trevoga-pered-snom': ['trevoga-i-panicheskiye-ataki', 'utrennyaya-trevoga', 'navyazchivye-mysli'],
  'trevoga-posle-stressa': ['trevoga-i-panicheskiye-ataki', 'vnutrenneye-napryazheniye', 'gipnoterapiya-onlayn'],
  'vnutrenneye-napryazheniye': ['trevoga-i-panicheskiye-ataki', 'postoyannaya-trevoga-bez-prichiny', 'psikhosomatika'],
  'navyazchivye-mysli': ['trevoga-i-panicheskiye-ataki', 'strakh-budushchego', 'trevoga-pered-snom'],
  'strakh-budushchego': ['trevoga-i-panicheskiye-ataki', 'navyazchivye-mysli', 'kak-izbavitsya-ot-trevogi'],
}

/* ── Animation Variants ── */

const cardUp = (i: number) => ({
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  },
})

const faqItem = (i: number) => ({
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0, 1] as const },
  },
})

/* ── Hero Section ── */

function HeroSection({ service }: { service: ServiceData }) {
  const commonT = useTranslations('common')
  const t = useTranslations('serviceSection')
  useSetBreadcrumbs([
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.services'), href: '/uslugi/' },
    { label: service.shortTitle },
  ])

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 w-full max-w-container mx-auto px-gutter pt-16 pb-10 md:pt-20 md:pb-14 text-left">
        <div className="max-w-3xl">
          {/* Breadcrumbs */}
          <HeroBreadcrumbs />
          {/* Section label */}
          <div className="inline-flex items-center gap-3 animate-fade-in-down">
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
              {service.shortTitle}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight animate-fade-in-down" style={{ animationDelay: '0.05s' }}>
            {service.title}
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg text-text-secondary leading-relaxed max-w-2xl animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
            {service.description}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4 animate-fade-in-down" style={{ animationDelay: '0.15s' }}>
            <Link
              href="/kontakty/"
              data-analytics-booking={`service-${service.slug}-hero`}
              className="group relative inline-flex items-center justify-center px-7 py-3.5 rounded-full
                         text-sm font-semibold tracking-wide overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep hover:text-gold-dark
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2">
                {service.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
            <span className="badge-free">
              {t('heroFreeLabel')}
            </span>
          </div>

          {/* Medical Disclaimer */}
            <MedicalDisclaimer type="crisis" className="mt-6" />
        </div>
      </div>
    </section>
  )
}

/* ── Symptoms Section ── */


/* ── Method Section ── */

function MethodSection({ service }: { service: ServiceData }) {
  const t = useTranslations('serviceSection')
  const label = service.shortTitle?.toLowerCase() || service.slug

  const steps = [
    {
      num: '01',
      title: t('methodStep1Title'),
      desc: t('methodStep1Desc'),
    },
    {
      num: '02',
      title: t('methodStep2Title'),
      desc: t('methodStep2Desc'),
    },
    {
      num: '03',
      title: t('methodStep3Title'),
      desc: t('methodStep3Desc'),
    },
    {
      num: '04',
      title: t('methodStep4Title'),
      desc: t('methodStep4Desc'),
    },
  ]

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('methodAriaLabel')}>
      <SectionContainer size="md" background="surface">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary leading-tight text-center">
          {t('methodTitle')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
            {t('methodTitleAccent', { service: label })}
          </span>
        </AnimatedText>
        <AnimatedText direction="up" delay={150} as="p" className="mt-4 text-base text-text-secondary max-w-2xl mx-auto text-center">
          {t('methodSubtitle')}
        </AnimatedText>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-xl h-full">
              <motion.div
                variants={cardUp(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative p-6 bg-bg-surface/85 border border-border-base
                           hover:border-gold/20 transition-all duration-400 rounded-xl h-full flex flex-col"
              >
                <span className="text-4xl font-display text-gold/20 group-hover:text-gold/40 transition-colors duration-300"
                      aria-hidden="true">
                  {step.num}
                </span>
                <h3 className="mt-3 text-lg font-display text-green group-hover:text-green-light transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed flex-1">
                  {step.desc}
                </p>
              </motion.div>
            </TiltCard>
          ))}
        </div>

        {/* Online badge */}
        <AnimatedText direction="up" delay={250} as="div" className="mt-10 p-5 rounded-xl bg-bg-elevated/85 border border-border-base text-center">
          <p className="text-sm text-text-muted">
            {t('methodBadge')}
          </p>
        </AnimatedText>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Symptoms Section ── */

function SymptomsSection({ service }: { service: ServiceData }) {
  const t = useTranslations('serviceSection')
  const messages = useMessages()

  // Try D1 symptomsJson first, fallback to messages
  let symptoms = getSymptomsFromD1(service)
  if (!symptoms) {
    symptoms = getSymptoms(messages, service.slug)
  }
  if (symptoms.length === 0) return null
  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('symptomsTitle')}>
      <SectionContainer size="md">
        <AnimatedText direction="up" as="div" className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">{t('symptomsLabel')}</span>
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
          </div>
        </AnimatedText>
        <AnimatedText direction="up" delay={150} as="h2" className="mt-4 text-3xl md:text-4xl lg:text-5xl font-display text-text-primary leading-tight text-center">
          {t('symptomsTitle')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
            {t('symptomsTitleAccent')}
          </span>
        </AnimatedText>
        <AnimatedText direction="up" delay={250} as="p" className="mt-4 text-base text-text-secondary max-w-xl mx-auto text-center">
          {t('symptomsSubtitle')}
        </AnimatedText>

        <div className="mt-10 md:mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {symptoms.map((symptom, i) => (
            <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-2xl h-full">
              <motion.div
                variants={cardUp(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative p-5 md:p-6 bg-white/[0.02] border border-white/[0.05]
                           hover:bg-white/[0.04] hover:border-gold/20
                           hover:shadow-[0_0_30px_rgba(201,169,110,0.04)]
                           transition-all duration-500 rounded-2xl h-full flex flex-col"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                                 ${i % 2 === 0 ? 'bg-gold/[0.08]' : 'bg-green/[0.08]'}
                                 group-hover:scale-110 transition-transform duration-400`}>
                  <span className="leading-none" role="img" aria-hidden="true">{symptom.icon}</span>
                </div>
                <h3 className="mt-3 text-base font-display text-green">
                  {symptom.title}
                </h3>
                <p className="mt-1.5 text-sm text-text-muted leading-relaxed flex-1">{symptom.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}
function FAQSection({ service }: { service: ServiceData }) {
  const t = useTranslations('serviceSection')
  const messages = useMessages()

  // Try D1 faqJson first
  let faqs: Array<{ question: string; answer: string }> = []
  if (service.faqJson) {
    try {
      const parsed = JSON.parse(service.faqJson)
      if (Array.isArray(parsed)) faqs = parsed
    } catch { /* invalid json */ }
  }

  // Fallback to messages if no D1 faqs
  if (faqs.length === 0) {
    const serviceFaqs = (messages?.serviceFaqs as Record<string, Array<{ question: string; answer: string }>>) ?? {}
    const defaultFaqs = (messages?.serviceFaqs?._default as Array<{ question: string; answer: string }>) ?? []
    faqs = serviceFaqs[service.slug] || defaultFaqs
  }

  if (faqs.length === 0) return null
  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('faqTitle')}>
      <SectionContainer size="md" background="transparent">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary text-center">
          {t('faqTitle')}
        </AnimatedText>

        <div className="mt-10 max-w-2xl mx-auto space-y-3">
          {faqs.slice(0, 5).map((item, index) => (
            <motion.div
              key={index}
              variants={faqItem(index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <FaqAccordion question={item.question} answer={item.answer} />
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── CTA Section ── */

function CTASection({ service }: { service: ServiceData }) {
  const t = useTranslations('serviceSection')
  return (
    <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <AnimatedText as="h2" direction="up" className="relative text-3xl md:text-4xl font-display text-text-primary leading-tight">
            {t('ctaTitle')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green to-green-light">
              {t('ctaAccent')}
            </span>
          </AnimatedText>

          <AnimatedText as="p" direction="up" delay={150} className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
            {t('ctaDescription')}
          </AnimatedText>

          <AnimatedText direction="up" delay={250} className="relative mt-8">
            <Link
              href="/kontakty/"
              data-analytics-booking={`service-${service.slug}-cta`}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 rounded-full
                         text-sm md:text-base font-semibold tracking-wide overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep hover:text-gold-dark
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2">
                {service.cta}
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
  )
}

/* ── Related Services Section ── */
function RelatedServicesSection({ service, allServices }: { service: ServiceData; allServices: ServiceData[] }) {
  const t = useTranslations('serviceSection')
  const relatedSlugs = RELATED_SERVICES[service.slug] || []
  const related = allServices.filter(s => relatedSlugs.includes(s.slug)).slice(0, 3)

  if (related.length === 0) return null

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('relatedTitle')}>
      <SectionContainer size="md">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary text-center">
          {t('relatedTitle')}
        </AnimatedText>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item, i) => (
            <motion.div
              key={item.slug}
              variants={faqItem(i)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <TiltCard tiltDegree={4} scale={1.015} className="rounded-xl h-full">
                <Link
                  href={`/uslugi/${item.slug}/`}
                  className="group block p-6 border border-border-base h-full
                             hover:bg-bg-elevated hover:border-gold/30 hover:-translate-y-0.5
                             hover:shadow-glow-gold transition-all duration-400 rounded-xl"
                >
                  <ServiceIcon name={SERVICE_ICONS[item.slug] || 'sparkles'} size={24} className="text-gold" />
                  <h3 className="mt-2 text-lg font-display text-green group-hover:text-green-light transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">{item.shortTitle}</p>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Trevoga Hub Banner (keyword cannibalization fix) ── */

const TREVOGA_HUB_SLUGS = new Set([
  'kak-izbavitsya-ot-trevogi',
  'postoyannaya-trevoga-bez-prichiny',
  'utrennyaya-trevoga',
  'trevoga-pered-snom',
  'trevoga-posle-stressa',
  'vnutrenneye-napryazheniye',
  'navyazchivye-mysli',
  'strakh-budushchego',
])

function TrevogaHubBanner({ service, locale }: { service: ServiceData; locale: string }) {
  if (!TREVOGA_HUB_SLUGS.has(service.slug)) return null

  const hubPath = locale === 'uk' ? '/uk/blog/trivoga-povniy-putivnik/' : '/ru/blog/trevoga-polnyy-putevoditel/'
  const text = locale === 'uk'
    ? 'Ця сторінка — частина серії матеріалів про тривогу. Ознайомтеся з повним путівником.'
    : 'Эта страница — часть серии материалов о тревоге. Ознакомьтесь с полным путеводителем.'
  const linkText = locale === 'uk' ? 'Повний путівник по тривозі →' : 'Полный путеводитель по тревоге →'

  return (
    <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md">
        <div className="p-4 rounded-xl bg-gold/[0.04] border border-gold/10 text-center">
          <p className="text-sm text-text-muted">
            {text}{' '}
            <Link href={hubPath} className="text-gold hover:text-gold-light transition-colors underline underline-offset-2">
              {linkText}
            </Link>
          </p>
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Also Read: cross-linking service pages → relevant blog articles ── */

interface BlogLink {
  slugRu: string
  slugUk: string
  titleRu: string
  titleUk: string
}

const TREVOGA_BLOG_LINKS: Record<string, BlogLink[]> = {
  'kak-izbavitsya-ot-trevogi': [
    { slugRu: 'kak-spravitsya-s-trevogoy', slugUk: 'yak-vporatisya-z-trivogoyu', titleRu: 'Как справиться с тревогой — 5 методов, которые реально работают', titleUk: 'Як впоратися з тривогою — 5 методів, які реально працюють' },
    { slugRu: 'pochemu-trevoga-ne-prokhodit-godami', slugUk: 'chomu-trivoga-ne-minaye-rokarami', titleRu: 'Почему тревога не проходит годами — истинные причины', titleUk: 'Чому тривога не минає роками — істинні причини' },
  ],
  'postoyannaya-trevoga-bez-prichiny': [
    { slugRu: 'pochemu-trevoga-ne-prokhodit-godami', slugUk: 'chomu-trivoga-ne-minaye-rokarami', titleRu: 'Почему тревога не проходит годами — истинные причины', titleUk: 'Чому тривога не минає роками — істинні причини' },
    { slugRu: 'trevoga-prichiny-i-simptomy', slugUk: 'trivoga-prichini-i-simptomi', titleRu: 'Тревога: причины, симптомы и когда стоит обратиться', titleUk: 'Тривога: причини, симптоми і коли варто звернутися' },
  ],
  'utrennyaya-trevoga': [
    { slugRu: 'pochemu-voznikaet-panika-nochyu', slugUk: 'chomu-vinikaye-panika-vnochi', titleRu: 'Почему возникает паника ночью — ночные панические атаки', titleUk: 'Чому виникає паніка вночі — нічні панічні атаки' },
    { slugRu: 'kak-spravitsya-s-trevogoy', slugUk: 'yak-vporatisya-z-trivogoyu', titleRu: 'Как справиться с тревогой — 5 методов', titleUk: 'Як впоратися з тривогою — 5 методів' },
  ],
  'trevoga-pered-snom': [
    { slugRu: 'pochemu-voznikaet-panika-nochyu', slugUk: 'chomu-vinikaye-panika-vnochi', titleRu: 'Почему возникает паника ночью — ночные панические атаки', titleUk: 'Чому виникає паніка вночі — нічні панічні атаки' },
    { slugRu: 'kom-v-gorle-pri-trevoge', slugUk: 'grudka-v-gorli-pri-trivozi', titleRu: 'Ком в горле при тревоге — почему возникает и как избавиться', titleUk: 'Грудка в горлі при тривозі — чому виникає і як позбутися' },
  ],
  'trevoga-posle-stressa': [
    { slugRu: 'postoyannoe-vnutrennee-napryazhenie', slugUk: 'postiyne-vnutrishnye-napruzhennya', titleRu: 'Постоянное внутреннее напряжение — причины и как снять', titleUk: 'Постійне внутрішнє напруження — причини і як зняти' },
    { slugRu: 'kak-spravitsya-s-trevogoy', slugUk: 'yak-vporatisya-z-trivogoyu', titleRu: 'Как справиться с тревогой — 5 методов', titleUk: 'Як впоратися з тривогою — 5 методів' },
  ],
  'vnutrenneye-napryazheniye': [
    { slugRu: 'postoyannoe-vnutrennee-napryazhenie', slugUk: 'postiyne-vnutrishnye-napruzhennya', titleRu: 'Постоянное внутреннее напряжение — причины и как снять', titleUk: 'Постійне внутрішнє напруження — причини і як зняти' },
    { slugRu: 'pochemu-trevoga-ne-prokhodit-godami', slugUk: 'chomu-trivoga-ne-minaye-rokarami', titleRu: 'Почему тревога не проходит годами', titleUk: 'Чому тривога не минає роками' },
  ],
  'navyazchivye-mysli': [
    { slugRu: 'kom-v-gorle-pri-trevoge', slugUk: 'grudka-v-gorli-pri-trivozi', titleRu: 'Ком в горле при тревоге', titleUk: 'Грудка в горлі при тривозі' },
    { slugRu: 'strakh-smerti-bez-prichiny', slugUk: 'strakh-smerti-bez-prichini', titleRu: 'Страх смерти без причины', titleUk: 'Страх смерті без причини' },
  ],
  'strakh-budushchego': [
    { slugRu: 'kak-perestat-boyatsya-budushchego', slugUk: 'yak-perestati-boyatisya-maybutnogo', titleRu: 'Как перестать бояться будущего — тревога о завтрашнем дне', titleUk: 'Як перестати боятися майбутнього — тривога про завтрашній день' },
    { slugRu: 'strakh-smerti-bez-prichiny', slugUk: 'strakh-smerti-bez-prichini', titleRu: 'Страх смерти без причины', titleUk: 'Страх смерті без причини' },
  ],
}

function TrevogaAlsoReadSection({ service, locale }: { service: ServiceData; locale: string }) {
  const links = TREVOGA_BLOG_LINKS[service.slug]
  if (!links || links.length === 0) return null

  const isUk = locale === 'uk'
  const title = isUk ? 'Читайте також у блозі' : 'Читайте также в блоге'

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={title}>
      <SectionContainer size="md" background="transparent">
        <AnimatedText direction="up" as="h2" className="text-2xl md:text-3xl font-display text-text-primary text-center">
          {title}
        </AnimatedText>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {links.map((link, i) => {
            const slug = isUk ? link.slugUk : link.slugRu
            const itemTitle = isUk ? link.titleUk : link.titleRu
            return (
              <motion.div
                key={slug}
                variants={faqItem(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Link
                  href={`/blog/${slug}/`}
                  className="group block p-5 rounded-xl bg-bg-surface/85 border border-border-base
                             hover:border-gold/30 hover:-translate-y-0.5
                             transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <div>
                      <h3 className="text-base font-display text-text-primary group-hover:text-gold transition-colors duration-200">
                        {itemTitle}
                      </h3>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-gold">
                        {isUk ? 'Читати статтю →' : 'Читать статью →'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Main Component ── */

export function ClientServicePage({ service, schemas, locale, allServices: allServicesProp }: Props) {
  const messages = useMessages()

  // Use D1 allServices if provided, fallback to messages
  const allServices = allServicesProp ?? ((messages?.servicesData as ServiceData[]) ?? [])
  useRegisterSchemas(schemas ?? [])

  return (
    <>
      <HeroSection service={service} />
      <SymptomsSection service={service} />
      <MethodSection service={service} />
      <TrevogaHubBanner service={service} locale={locale} />
      <TrevogaAlsoReadSection service={service} locale={locale} />
      <FAQSection service={service} />
      <SuitableForSection />

      <CTASection service={service} />
      <RelatedServicesSection service={service} allServices={allServices} />
    </>
  )
}
