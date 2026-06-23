'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AnimatedSection, SectionContainer } from '@/components/ui'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'

/* ── Diploma data ── */

export interface Diploma {
  id: string | number
  image: string
  title: string
  organization: string
  year: string
}
export const DIPLOMAS: Diploma[] = [
  {
    id: 'diplom-psychologist',
    image: '/images/diploms/psychologist-online.webp',
    title: 'Диплом практического психолога',
    organization: 'Черкасский национальный университет им. Б. Хмельницкого',
    year: '2010',
  },
  {
    id: 'cert-hypnotherapist',
    image: '/images/diploms/hypnotherapist.webp',
    title: 'Сертификат гипнотерапевта',
    organization: 'American Board of Hypnotherapy (ABH)',
    year: '2020',
  },
  {
    id: 'cert-nlp',
    image: '/images/diploms/nlp-practitioner.webp',
    title: 'NLP Practitioner',
    organization: 'International NLP Trainers Association (INLPTA)',
    year: '2020',
  },
  {
    id: 'cert-regression',
    image: '/images/diploms/regression-hypnotherapist.webp',
    title: 'Сертификат регрессивного гипнотерапевта',
    organization: 'International Association of Regression Therapy (IART)',
    year: '2021',
  },
  {
    id: 'cert-erickson',
    image: '/images/diploms/erickson-hypnosis.webp',
    title: 'Сертификат эриксоновского гипноза',
    organization: 'Kansas Hypnosis Center',
    year: '2022',
  },
  {
    id: 'cert-clinical',
    image: '/images/diploms/clinical-hypnosis.webp',
    title: 'Сертификат клинического гипноза',
    organization: 'American Board of Hypnotherapy (ABH)',
    year: '2023',
  },
]

/* ── Animation variants (modal only) ── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0, 1] as const } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0, 1] as const } },
}

const textStagger = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
}

const textFadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0, 1] as const } },
}

/* ── Marquee Card ── */

function MarqueeCard({
  diploma,
  onSelect,
  isDuplicate = false,
}: {
  diploma: Diploma
  onSelect: (diploma: Diploma) => void
  isDuplicate?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const t = useTranslations('diplomaShowcase')

  return (
    <button
      type="button"
      onClick={() => onSelect(diploma)}
      className={`
        group relative w-full rounded-xl overflow-hidden
        border border-gold-muted/15 bg-bg-surface/80
        transition-all duration-400 cursor-pointer text-left
        focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2
        ${isDuplicate ? 'opacity-85' : ''}
        ${isHovered ? 'border-gold-muted/40 shadow-lg shadow-gold/5 -translate-y-0.5' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={isDuplicate ? -1 : 0}
      aria-label={diploma.title}
    >
      {/* Image container with locked aspect ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-deep/50">
        <Image
          src={diploma.image}
          alt={diploma.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 260px, 300px"
        />
        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-bg-deep/10 to-transparent
            transition-opacity duration-300 flex items-end p-3
            ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <span className="text-[11px] font-medium text-gold-light tracking-wider uppercase">
            {t('viewDetails')}
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="p-3">
        <h3 className="text-sm font-display text-text-primary leading-snug line-clamp-2">
          {diploma.title}
        </h3>
        <p className="mt-1 text-[11px] text-text-muted leading-tight line-clamp-1">
          {diploma.organization}
        </p>
        <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gold/10 text-gold rounded-full">
          {diploma.year}
        </span>
      </div>

      {/* Lock icon for duplicates */}
      {isDuplicate && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-bg-deep/60 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-muted">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      )}
    </button>
  )
}

/* ── Navigation Arrow Button ── */

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        w-10 h-10 rounded-full
        bg-bg-elevated/80 backdrop-blur-sm border border-border-light
        flex items-center justify-center
        transition-all duration-300
        ${isPrev ? 'left-3' : 'right-3'}
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:bg-gold/20 hover:border-gold/40 hover:text-gold cursor-pointer focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
        }
      `}
      aria-label={isPrev ? 'Previous' : 'Next'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isPrev ? '' : 'rotate-180'}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

/* ── Lightbox Modal ── */

function DiplomaModal({
  allDiplomas,
  currentIndex,
  onNavigate,
  onClose,
}: {
  allDiplomas: Diploma[]
  currentIndex: number
  onNavigate: (direction: 'prev' | 'next') => void
  onClose: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const isZoomed = zoomLevel > 1
  const t = useTranslations('diplomaShowcase')
  const diploma = allDiplomas[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allDiplomas.length - 1

  /* ── Keyboard navigation ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowLeft' && hasPrev) { onNavigate('prev'); setZoomLevel(1); setImageLoaded(false) }
      if (e.key === 'ArrowRight' && hasNext) { onNavigate('next'); setZoomLevel(1); setImageLoaded(false) }
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onNavigate, hasPrev, hasNext])

  if (!diploma) return null

  const wrapperClass = isZoomed
    ? 'min-h-screen flex items-center justify-center'
    : 'max-w-4xl mx-auto my-auto'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${diploma.title} — ${diploma.organization}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-deep/85 backdrop-blur-md" />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-bg-elevated/80 border border-border-light
                   flex items-center justify-center hover:bg-gold/20 hover:border-gold/40
                   transition-all duration-200 focus-visible:outline-2 focus-visible:outline-gold"
        aria-label={t('close')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18" /><path d="M6 6l12 12" />
        </svg>
      </button>

      {/* Prev / Next arrows */}
      {hasPrev && <NavArrow direction="prev" onClick={() => { onNavigate('prev'); setZoomLevel(1); setImageLoaded(false) }} disabled={!hasPrev} />}
      {hasNext && <NavArrow direction="next" onClick={() => { onNavigate('next'); setZoomLevel(1); setImageLoaded(false) }} disabled={!hasNext} />}

      {/* Content */}
      <motion.div
        className={`relative z-10 w-full ${wrapperClass}`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        key={currentIndex}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div
          className={`relative overflow-hidden rounded-2xl border border-border-light shadow-2xl
            ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
          role="img"
          aria-label={diploma.title}
        >
          <div
            className={isZoomed ? 'overflow-auto max-h-[80vh]' : ''}
            style={{
              transform: isZoomed ? `scale(${zoomLevel})` : 'scale(1)',
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
            }}
          >
            <Image
              src={diploma.image}
              alt={diploma.title}
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              onLoad={() => setImageLoaded(true)}
              priority
            />
          </div>
        </div>

        {/* Caption */}
        <motion.div
          className="mt-4 px-2 text-center"
          variants={textStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h3 variants={textFadeUp} className="text-base font-display text-gold-light">
            {diploma.title}
          </motion.h3>
          <motion.p variants={textFadeUp} className="mt-1 text-sm text-text-muted">
            {diploma.organization} — {diploma.year}
          </motion.p>
          <motion.p variants={textFadeUp} className="mt-4 text-[11px] text-text-muted/50">
            {t('zoomHint')}
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/* ════════════════════════════════════════
   MAIN COMPONENT — Marquee
   ════════════════════════════════════════ */

interface DiplomaShowcaseProps {
  title?: string
  subtitle?: string
  diplomas?: Diploma[]
}

const MARQUEE_DURATION = 35 // seconds for a full cycle

export default function DiplomaShowcase({
  title,
  subtitle,
  diplomas,
}: DiplomaShowcaseProps) {
  const t = useTranslations('diplomaShowcase')
  const { shouldReduceAnimations } = useDeviceCapabilities()
  const resolvedTitle = title ?? t('defaultTitle')
  const resolvedSubtitle = subtitle ?? t('defaultSubtitle')
  const items = diplomas ?? DIPLOMAS

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const handleSelect = useCallback((diploma: Diploma) => {
    setSelectedIndex(items.indexOf(diploma))
  }, [items])

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setSelectedIndex((prev) => {
      if (prev === null) return prev
      if (direction === 'prev') return Math.max(0, prev - 1)
      return Math.min(items.length - 1, prev + 1)
    })
  }, [items])

  const handleClose = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  const isAnimating = !shouldReduceAnimations && items.length > 2

  return (
    <>
      <AnimatedSection
      as="section"
      variant="fadeUp"
      className="relative overflow-hidden"
      aria-label={resolvedTitle}
    >
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/[0.02] rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Marquee keyframes — only injected when animations enabled */}
      {isAnimating && <style>{`@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}`}</style>}

      <SectionContainer size="md" background="surface">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
              {t('sectionLabel')}
            </span>
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary leading-tight">
            {resolvedTitle}
          </h2>
          <p className="mt-3 text-sm text-text-muted max-w-xl mx-auto">
            {resolvedSubtitle}
          </p>
        </motion.div>

        {/* ── Marquee Track ── */}
        <div
          className="mt-10 md:mt-14 overflow-hidden select-none"
          onMouseEnter={() => isAnimating && setIsPaused(true)}
          onMouseLeave={() => isAnimating && setIsPaused(false)}
        >
          <div
            className="flex gap-4 md:gap-5"
            style={{
              width: 'fit-content',
              ...(isAnimating
                ? {
                    animation: `marquee-scroll ${MARQUEE_DURATION}s linear infinite`,
                    animationPlayState: isPaused ? 'paused' : 'running',
                    willChange: 'transform',
                  }
                : {}),
            }}
          >
            {/* First copy — visible to all */}
            {items.map((diploma) => (
              <div
                key={diploma.id}
                className="w-[260px] md:w-[300px] shrink-0"
              >
                <MarqueeCard
                  diploma={diploma}
                  onSelect={handleSelect}
                />
              </div>
            ))}
            {/* Second copy — seamless loop, only when animations enabled */}
            {isAnimating && items.map((diploma) => (
              <div
                key={`dup-${diploma.id}`}
                className="w-[260px] md:w-[300px] shrink-0"
                aria-hidden="true"
              >
                <MarqueeCard
                  diploma={diploma}
                  onSelect={handleSelect}
                  isDuplicate
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-center text-[11px] text-text-muted/40"
        >
          {t('hintText')}
        </motion.p>
      </SectionContainer>
    </AnimatedSection>

      {/* Lightbox Modal */}
      <AnimatePresence mode="wait">
        {selectedIndex !== null && (
          <DiplomaModal
            key={selectedIndex}
            allDiplomas={items}
            currentIndex={selectedIndex}
            onNavigate={handleNavigate}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
