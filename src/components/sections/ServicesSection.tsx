 'use client'
 
 import { motion } from 'framer-motion'
 import { useTranslations, useMessages } from 'next-intl'
 import { Link } from '@/i18n/routing'
 import TiltCard from '@/components/ui/TiltCard'
 import { AnimatedSection, SectionContainer } from '@/components/ui'
 import { ServiceIcon } from '@/components/ui/Icons'
 import { SERVICE_ICONS } from '@/constants'
 
 /* ── Тип для servicesData из переводов ── */

interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

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
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.55, ease: easePremium },
  }),
}

/* ── Компонент ── */

export default function ServicesSection({ maxCards }: { maxCards?: number } = {}) {
  const t = useTranslations('servicesSection')
  const messages = useMessages()
  const services = (messages?.servicesData as ServiceItem[]) ?? []

  if (services.length === 0) return null

  const displayedServices = maxCards ? services.slice(0, maxCards) : services

  return (
    <AnimatedSection as="section" variant="fadeUp" className="relative overflow-hidden" aria-label={t('ariaLabel')}>
      <SectionContainer size="md" background="transparent">
        {/* Heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium">{t('heading')}</h2>
          <p className="mt-4 text-base text-text-secondary max-w-2xl mx-auto">{t('subtitle')}</p>
        </motion.div>

        {/* Cards grid */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service, i) => (
            <motion.div
              key={service.slug}
              variants={cardVariants}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              className="h-full"
            >
              <TiltCard tiltDegree={4} scale={1.015} className="rounded-xl h-full">
              <Link
                href={`/uslugi/${service.slug}/`}
                aria-label={`${service.title} — ${service.shortTitle}`}
                className="group block p-6 border border-border-base bg-bg-surface/85
                           hover:border-gold-muted hover:shadow-lg hover:shadow-gold/5
                           transition-all duration-400 h-full rounded-xl focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
              >
                  <ServiceIcon name={SERVICE_ICONS[service.slug] || 'sparkles'} size={24} className="text-gold-muted group-hover:scale-110 transition-transform duration-400" />
                  <h3 className="mt-3 text-lg font-display text-text-primary group-hover:text-green-light transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed" aria-hidden="true">
                    {service.shortTitle}
                  </p>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5, ease: easePremium }}
          className="mt-10 text-center"
        >
          <Link
            href="/uslugi/"
            className="text-sm text-green-light hover:text-green underline-offset-4 hover:underline transition-all"
          >
            {t('allLink')}
          </Link>
        </motion.div>
      </SectionContainer>
    </AnimatedSection>
  )
}
