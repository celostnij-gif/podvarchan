'use client'

import { motion } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import { Link } from '@/i18n/routing'
import { FaqAccordion, AnimatedSection, SectionContainer } from '@/components/ui'
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
  const messages = useMessages()
  const faqItems = (messages?.faqData as FAQItem[]) ?? []

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-labelledby="faq-heading">
      <SectionContainer size="md" background="transparent">
        {/* Heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <h2 id="faq-heading" className="text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium">
            {faqT('heading')}
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="mt-10 max-w-2xl mx-auto space-y-3" role="list">
          {faqItems.slice(0, 6).map((item, index) => (
            <motion.div
              key={index}
              variants={faqItemVariants}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-20px' }}
            >
              <FaqAccordion question={item.question} answer={item.answer} />
            </motion.div>
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

      </SectionContainer>
    </AnimatedSection>
  )
}
