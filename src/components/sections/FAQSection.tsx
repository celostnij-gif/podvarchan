'use client'

import { motion } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import { Link } from '@/i18n/routing'
import type { FAQItem } from '@/types'

const easePremium = [0.25, 0.1, 0, 1] as const

const headingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easePremium },
  },
}

const faqItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: easePremium },
  }),
}

export default function FAQSection() {
  const faqT = useTranslations('faqSection')
  const t = useTranslations('home')
  const commonT = useTranslations('common')
  const messages = useMessages()
  const faqItems = (messages?.faqData as FAQItem[]) ?? []

  return (      <section
      className="relative py-20 md:py-28 bg-bg-surface/85 overflow-hidden"
      aria-labelledby="faq-heading"
    >
      <div className="relative z-10 max-w-container mx-auto px-gutter">
        {/* Heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <h2 id="faq-heading" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary">
            {faqT('heading')}
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="mt-10 max-w-2xl mx-auto space-y-3" role="list">
          {faqItems.slice(0, 6).map((item, index) => (
            <motion.article
              key={index}
              variants={faqItemVariants}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-20px' }}
              role="listitem"
              className="rounded-xl border border-border-base bg-bg-surface overflow-hidden"
            >
              <details className="group">
                <summary
                  className="flex items-center justify-between w-full px-5 py-5 text-left cursor-pointer
                             text-text-primary font-medium
                             hover:bg-bg-elevated transition-colors duration-200
                             [&::-webkit-details-marker]:hidden list-none"
                >
                  <span className="text-base font-body pr-4">{item.question}</span>
                  <span
                    className="shrink-0 mt-0.5 text-gold transition-transform duration-300
                               group-open:rotate-180"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </summary>
                <div className="px-5 pb-5 faq-answer">
                  <p className="text-sm text-text-muted leading-relaxed">{item.answer}</p>
                </div>
              </details>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/faq/"
            className="text-sm text-gold hover:text-gold-light underline-offset-4 hover:underline transition-all"
          >
            {faqT('allLink')} →
          </Link>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 p-8 rounded-2xl text-center bg-gradient-to-br from-gold/[0.06] to-gold/[0.02]
                     border border-gold/[0.12]"
        >
          <p className="text-xl font-display text-text-primary">{t('ctaTitle')}</p>
          <p className="mt-2 text-sm text-text-muted">{t('ctaDescription')}</p>
          <div className="mt-6">
            <Link
              href="/kontakty/"
              data-analytics-booking="faq-cta"
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
                {commonT('bookingCta')}
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
  )
}
