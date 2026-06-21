'use client'

import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRef, useState, useCallback } from 'react'
import { Link } from '@/i18n/routing'
import { AnimatedSection, SectionContainer } from '@/components/ui'

export default function AuthorPreviewSection() {
  const t = useTranslations('authorPreview')
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, margin: '-100px' })
  const [isPlaying, setIsPlaying] = useState(true)

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const credentials = [
    { icon: '🎓', text: t('cert1') },
    { icon: '🏆', text: t('cert2') },
    { icon: '💼', text: t('cert3') },
  ]

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label={t('ariaLabel')}>
      <SectionContainer size="md" background="transparent">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          {/* Video */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1] as const }}
            className="flex justify-center relative group"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden
                            bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/10
                            shadow-[0_0_30px_rgba(201,169,110,0.08)]">
              <video
                ref={videoRef}
                src="/videos/author-preview.mp4"
                poster="/images/about.webp"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                aria-label={t('videoAlt')}
                onClick={togglePlay}
              />
              {/* Play/pause overlay on hover */}
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center
                           bg-black/0 hover:bg-black/20 transition-all duration-300
                           opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label={isPlaying ? t('pauseVideo') : t('playVideo')}
              >
                <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center
                                shadow-lg backdrop-blur-sm transition-transform duration-300
                                group-hover:scale-110">
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-bg-deep">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-bg-deep ml-0.5">
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  )}
                </div>
              </button>
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
                className="group inline-flex items-center gap-2 text-sm font-medium text-green-light
                           hover:text-green transition-colors duration-200"
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
