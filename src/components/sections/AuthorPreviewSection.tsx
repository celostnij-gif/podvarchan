'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { AnimatedSection, SectionContainer } from '@/components/ui'

export default function AuthorPreviewSection() {
  const t = useTranslations('authorPreview')

  const credentials = [
    { icon: '🎓', text: t('cert1') },
    { icon: '🏆', text: t('cert2') },
    { icon: '💼', text: t('cert3') },
  ]

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('ariaLabel')}>
      <SectionContainer size="md" background="surface" className="bg-bg-surface">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1] as const }}
            className="flex justify-center"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden
                            bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/10
                            shadow-[0_0_30px_rgba(201,169,110,0.08)]">
              <Image
                src="/images/about.webp"
                alt={t('photoAlt')}
                fill
                sizes="(max-width: 768px) 256px, 320px"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0, 1] as const }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary">
              {t('headingPrefix')}<span className="text-gold">{t('headingHighlight')}</span>{t('headingSuffix')}
            </h2>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">{t('description')}</p>

            {/* Credentials */}
            <div className="mt-6 space-y-3">
              {credentials.map((cred, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-lg" role="img" aria-hidden="true">{cred.icon}</span>
                  <span className="text-sm text-text-secondary">{cred.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/ob-avtore/"
                className="group inline-flex items-center gap-2 text-sm font-medium text-gold
                           hover:text-gold-light transition-colors duration-200"
              >
                {t('readMore')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}
