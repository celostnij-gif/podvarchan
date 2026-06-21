'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useMessages } from 'next-intl'
import { TiltCard, AnimatedSection, SectionContainer } from '@/components/ui'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import type { Testimonial } from '@/types'

const AUTO_PLAY_INTERVAL = 6000 // ms — slower for lower CPU load

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0, 1] as const },
  }),
}

export default function TestimonialsSection() {
  const t = useTranslations('testimonials')
  const messages = useMessages()
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const items = (messages?.testimonials?.items as Testimonial[]) ?? []
  const [[page, direction], setPage] = useState([0, 0])
  const itemIndex = Math.abs(page) % (items.length || 1)

  const paginate = useCallback(
    (newDirection: number) => setPage(([prev]) => [prev + newDirection, newDirection]),
    []
  )

  /* ── Auto-play (disabled on mobile for performance) ── */
  useEffect(() => {
    if (items.length < 2 || shouldReduceAnimations) return
    const timer = setInterval(() => paginate(1), AUTO_PLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [items.length, shouldReduceAnimations, paginate])

  const item = items[itemIndex] || { name: '', text: '', result: '' }

  return (
    <AnimatedSection as="section" variant="fadeUp" className="relative overflow-hidden" aria-label={t('ariaLabel')}>
      <SectionContainer size="md" background="transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] as const }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-gold-premium">
            {t.rich('heading', {
              gold: (chunks: React.ReactNode) => <>{chunks}</>,
            })}
          </h2>
        </motion.div>

        {/* Section-level disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-text-muted/50 leading-relaxed max-w-lg mx-auto">
              {t('disclaimer')}
            </p>
          </div>

        <div className="mt-6 max-w-2xl mx-auto relative">
          <AnimatePresence mode="wait" custom={direction}>
            <TiltCard key={page} tiltDegree={3} scale={1.01} glowOpacity={0.05} disabled={shouldReduceAnimations} className="rounded-2xl">
            <motion.div
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-8 md:p-10 rounded-2xl bg-bg-surface/85 border border-border-base text-center"
            >
              {/* Avatar */}
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-gold to-gold-dark
                              flex items-center justify-center text-lg font-display text-bg-base">
                {item.name.charAt(0)}
              </div>

              {/* Stars */}
              <div className="mt-4 flex justify-center gap-1" aria-label="5 звёзд">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Text */}
              <p className="mt-6 text-base text-text-secondary leading-relaxed italic">&ldquo;{item.text}&rdquo;</p>

              {/* Result */}
              <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-green/[0.08] border border-green/[0.12]">
                <span className="text-xs text-green-light font-medium">✓ {item.result}</span>
              </div>

              {/* Name */}
              <p className="mt-4 text-sm font-medium text-text-primary">{item.name}</p>
            </motion.div>
            </TiltCard>
          </AnimatePresence>

          {/* Dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage([i, i > itemIndex ? 1 : -1])}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === itemIndex ? 'bg-gold w-5' : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={t('reviewLabel', { number: i + 1 })}
              />
            ))}
          </div>
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}
