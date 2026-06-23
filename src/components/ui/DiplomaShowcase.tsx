'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { AnimatedSection, SectionContainer } from '@/components/ui'

/* ── Diploma data ── */

export interface Diploma {
  id: number
  title: string
  organization: string
  year: string
  description: string
  image: string
}

export const DIPLOMAS: Diploma[] = [
  {
    id: 1,
    title: 'INLPTA Certified Practitioner (НЛП Практик)',
    organization: 'Международная ассоциация тренеров НЛП (INLPTA)',
    year: '2010',
    description: 'Успешное освоение курса «Практик НЛП» в области искусства и науки нейролингвистического программирования. Сертификат даёт право использовать титул «Сертифицированный практик НЛП» (Certified Practitioner of Neuro Linguistic Programming). Выдан 30 ноября 2010 года (15 дней занятий, 130 часов обучения). Официальный международный сертификат INLPTA на английском языке, оформленный в классическую синюю узорчатую рамку с круглой золотисто-зелёной эмблемой-печатью ассоциации.',
    image: '/images/diploms/diplom1.jpg',
  },
  {
    id: 2,
    title: 'ABH Certified Hypnotherapist',
    organization: 'American Board of Hypnotherapy (ABH)',
    year: '2025',
    description: 'Статус сертифицированного гипнотерапевта (Certified Hypnotherapist) с хорошей профессиональной репутацией (in good standing), подтвердившего свои знания и мастерство перед Экзаменационным комитетом Американской коллегии гипнотерапии. Сертификат действителен до 1 июня 2030 года (номер H28727). Документ ABH оформлен строгим готическим шрифтом на светлом текстурированном фоне, заверен подписями Директора и Президента коллегии и круглой тёмной рельефной печатью.',
    image: '/images/diploms/diplom2.jpg',
  },
  {
    id: 3,
    title: 'Терапия, фокусированная на переносе (TFP)',
    organization: 'Институт психоаналитической психотерапии / TFP Institute (Otto Kernberg, Frank Yeomans)',
    year: '2019',
    description: 'Участие и успешное завершение курса последипломного образования (72 часа) по теме: «Терапия, фокусированная на переносе, при пограничных и нарциссических расстройствах личности». Сертификат на английском языке с тёмно-синей узорчатой рамкой. Имеет особую ценность — заверен личными подписями авторов метода: доктора Фрэнка Йоманса (Frank E. Yeomans, M.D., Ph.D.) и профессора Отто Кернберга (Otto F. Kernberg, M.D.), а также сухой рельефной печатью.',
    image: '/images/diploms/diplom3.jpg',
  },
  {
    id: 4,
    title: 'Магистр музыкального образования — Музыкальная терапия',
    organization: 'The University of Kansas, School of Music',
    year: '2013',
    description: 'Присуждение академической степени Магистра музыкального образования по специальности «Музыкальная терапия» (Master of Music Education, Music Therapy) со всеми правами, привилегиями и обязанностями. Степень присуждена 31 декабря 2013 года. Официальный университетский диплом на плотной бумаге, название вуза и имя выпускника выделены готическим шрифтом, заверен сине-золотой круглой печатью университета (Universitatis Kansiensis). Подписан Канцлером университета и Председателем Совета регентов штата Канзас.',
    image: '/images/diploms/diplom4.jpg',
  },
  {
    id: 5,
    title: 'Кхенпо (Доктор буддийской философии)',
    organization: 'Shechen Institute of Higher Buddhist Studies (Lekshay Nyidai Ling)',
    year: '2026',
    description: 'Успешное окончание Института высших буддийских исследований Шечен в Катманду (Непал) и присуждение высшего учёного звания и титула Кхенпо (Khenpo), что соответствует степени Доктора буддийской философии (Doctorate in Buddhist Philosophy). Титул присуждён 11 марта 2026 года после девятилетнего курса высшего образования и нескольких лет научно-исследовательской работы. Сертификат международного образца на английском, тибетском и непальском языках с декоративной рамкой в восточном стиле, с золотой эмблемой-печатью Института Шечен. Подписан главой монастырей Шечен — Шеченом Рабджамом VII.',
    image: '/images/diploms/diplom5.jpg',
  },
  {
    id: 6,
    title: 'Диплом специалиста с отличием — Практический психолог',
    organization: 'Черкасский национальный университет им. Б. Хмельницкого',
    year: '2010',
    description: 'Получение высшего образования по специальности «Психология» (образовательная программа «Практическая психология»). Присвоена профессиональная квалификация «Практический психолог». Диплом государственного образца с отличием, выдан 14 августа 2010 года (серия С18 № 036519). Двуязычный официальный документ (украинско-английский разворот) со светло-голубой защитной рамкой и Государственным Гербом Украины. Заверен гербовой синей печатью университета и подписью ректора.',
    image: '/images/diploms/diplom6.jpg',
  },
]

/* ── Animation variants (modal only) ── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  },
}

const textStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const textFadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0, 1] as const },
  },
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
  const t = useTranslations('diplomaShowcase')

  return (
    <button
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate || undefined}
      type="button"
      onClick={() => onSelect(diploma)}
      className="group relative w-full text-left overflow-hidden rounded-xl
                 bg-bg-surface/85 border border-border-base flex flex-col h-full
                 hover:border-gold/30 hover:-translate-y-0.5
                 hover:shadow-[0_0_30px_rgba(201,169,110,0.06)]
                 transition-all duration-500"
    >
      {/* Image container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-bg-elevated">
        <div className="absolute inset-2 sm:inset-3">
          <Image
            src={diploma.image}
            alt={diploma.title}
            fill
            className="object-contain transition-transform duration-500
                       group-hover:scale-105"
            sizes="280px"
          />
        </div>

        {/* Hover overlay with view hint */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-bg-deep/50 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        />
        <div
          className="absolute inset-0 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        >
          <span
            className="flex items-center gap-2 px-4 py-2 rounded-full
                       bg-gold/90 text-bg-deep text-xs font-semibold tracking-wide
                       shadow-glow-gold backdrop-blur-sm"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t('viewDetails')}
          </span>
        </div>
      </div>

      {/* Text info */}
      <div className="p-3.5 md:p-4 flex-1 flex flex-col min-w-0 gap-1.5">
        <h3
          className="text-sm font-display text-text-primary leading-tight
                     group-hover:text-gold transition-colors duration-300 line-clamp-2"
        >
          {diploma.title}
        </h3>
        <p className="text-[11px] text-text-muted line-clamp-2">
          {diploma.organization}
        </p>
        <span
          className="inline-block mt-auto self-start px-2 py-0.5 text-[10px] font-semibold
                     uppercase tracking-wider bg-gold/10 text-gold rounded-full"
        >
          {diploma.year}
        </span>
      </div>

      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent
                    via-transparent to-transparent
                    group-hover:via-gold/40 transition-all duration-500"
        aria-hidden="true"
      />
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
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12
                  flex items-center justify-center rounded-full
                  bg-bg-deep/70 backdrop-blur-md border border-border-base
                  text-text-muted hover:text-gold hover:border-gold/30
                  disabled:opacity-20 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-lg
                  hover:scale-105 active:scale-95
                  ${isPrev ? 'left-2 md:left-3' : 'right-2 md:right-3'}`}
      aria-label={isPrev ? 'Предыдущий диплом' : 'Следующий диплом'}
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isPrev ? (
          <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>
        ) : (
          <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>
        )}
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
  const t = useTranslations('diplomaShowcase')
  const diploma = allDiplomas[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allDiplomas.length - 1

  /* ── Zoom state ── */
  const [isZoomed, setIsZoomed] = useState(false)

  /* ── Touch swipe + pinch (ref-based, no re-renders during drag) ── */
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const swipeOffsetRef = useRef(0)
  const swipeContentRef = useRef<HTMLDivElement | null>(null)
  const pinchDistRef = useRef(0)
  const isPinchingRef = useRef(false)

  /* ── Close on Escape (closes modal), reset zoom on navigation ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isZoomed) { setIsZoomed(false); return }
        onClose()
      }
      if (e.key === 'ArrowLeft' && hasPrev) { setIsZoomed(false); onNavigate('prev') }
      if (e.key === 'ArrowRight' && hasNext) { setIsZoomed(false); onNavigate('next') }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onNavigate, hasPrev, hasNext, isZoomed])

  /* ── Touch handlers (swipe + pinch) ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDistRef.current = Math.sqrt(dx * dx + dy * dy)
      return
    }
    isPinchingRef.current = false
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    swipeOffsetRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / pinchDistRef.current
      if (ratio > 1.3 && !isZoomed) setIsZoomed(true)
      else if (ratio < 0.77 && isZoomed) setIsZoomed(false)
      return
    }
    if (!isZoomed && e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (dy < Math.abs(dx) * 1.5) {
        swipeOffsetRef.current = dx
        if (swipeContentRef.current) {
          swipeContentRef.current.style.transform = `translateX(${dx}px)`
        }
      }
    }
  }, [isZoomed])

  const handleTouchEnd = useCallback(() => {
    if (isPinchingRef.current) {
      isPinchingRef.current = false
      return
    }
    const dx = swipeOffsetRef.current
    swipeOffsetRef.current = 0
    if (swipeContentRef.current) {
      swipeContentRef.current.style.transform = ''
    }
    if (!isZoomed && Math.abs(dx) > 60) {
      if (dx > 0 && hasPrev) onNavigate('prev')
      else if (dx < 0 && hasNext) onNavigate('next')
    }
  }, [hasPrev, hasNext, onNavigate, isZoomed])

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={diploma.title}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto
                   rounded-2xl bg-bg-base border border-border-light
                   shadow-2xl shadow-black/50
                   touch-pan-y"
      >
        {/* Navigation arrows */}
        <NavArrow direction="prev" onClick={() => onNavigate('prev')} disabled={!hasPrev} />
        <NavArrow direction="next" onClick={() => onNavigate('next')} disabled={!hasNext} />

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 w-11 h-11 flex items-center justify-center
                     rounded-full bg-bg-deep/80 backdrop-blur-md border border-border-base
                     text-text-muted hover:text-text-primary hover:border-gold/40
                     transition-all duration-200 shadow-lg
                     ${isZoomed ? 'z-[60]' : 'z-20'}`}
          aria-label={t('close')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
               strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>

        {/* Gold top accent */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent
                        via-gold/40 to-transparent" aria-hidden="true" />

        {/* Counter badge */}
        <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full
                        bg-bg-deep/60 backdrop-blur-sm border border-border-base
                        text-[10px] font-mono tabular-nums text-text-muted">
          {String(currentIndex + 1).padStart(2, '0')} / {String(allDiplomas.length).padStart(2, '0')}
        </div>

        {/* Swipeable inner wrapper */}
        <div ref={swipeContentRef} className="min-h-full transition-[transform] duration-0">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Diploma image */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsZoomed((z) => !z)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsZoomed((z) => !z) } }}
            className={`relative w-full rounded-xl overflow-hidden
                        border border-border-base shadow-lg bg-bg-elevated
                        cursor-zoom-in transition-all duration-300
                        ${isZoomed
                          ? 'aspect-auto fixed inset-0 z-50 m-0 border-0 rounded-none shadow-none bg-black/95 cursor-zoom-out'
                          : 'aspect-[4/3]'
                        }`}
          >
            <div className={`relative w-full h-full transition-[transform] duration-300
                            ${isZoomed ? 'min-h-screen flex items-center justify-center p-4 sm:p-8' : 'absolute inset-1 sm:inset-2'}`}>
              <Image
                src={diploma.image}
                alt={diploma.title}
                fill
                className={`object-contain transition-transform duration-300
                            ${isZoomed ? 'scale-150 sm:scale-100' : ''}`}
                sizes={isZoomed ? '95vw' : '(max-width: 768px) 100vw, 900px'}
                priority
              />
            </div>

            {/* Zoom hint icon */}
            {!isZoomed && (
              <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full
                              bg-bg-deep/60 backdrop-blur-sm flex items-center justify-center
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                   aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round" className="text-text-muted">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              </div>
            )}

            {/* Zoom out hint */}
            {isZoomed && (
              <div className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full
                              bg-white/10 backdrop-blur-md border border-white/20
                              text-white/70 text-xs flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
                {t('zoomOut')}
              </div>
            )}
          </div>

          {/* Diploma info */}
          <motion.div
            variants={textStagger}
            initial="hidden"
            animate="visible"
            className="mt-5 md:mt-6 space-y-3"
          >
            <motion.span
              variants={textFadeUp}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                           bg-gold/10 border border-gold/20 text-[10px] font-semibold
                           tracking-[0.2em] uppercase text-gold w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {diploma.year}
            </motion.span>

            <motion.h2
              variants={textFadeUp}
              className="text-lg sm:text-xl md:text-2xl font-display text-gold-premium leading-tight"
            >
              {diploma.title}
            </motion.h2>

            <motion.p
              variants={textFadeUp}
              className="text-sm text-text-secondary leading-relaxed"
            >
              {diploma.organization}
            </motion.p>

            <motion.p
              variants={textFadeUp}
              className="text-sm text-text-muted leading-relaxed whitespace-pre-line"
            >
              {diploma.description}
            </motion.p>

            <motion.div
              variants={textFadeUp}
              className="flex items-center gap-3 py-2"
            >
              <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" aria-hidden="true" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold/40" />
              <span className="flex-1 h-px bg-gradient-to-l from-gold/20 to-transparent" aria-hidden="true" />
            </motion.div>

            <motion.a
              variants={textFadeUp}
              href={diploma.image}
              download
              aria-label={`${t('downloadImage')}: ${diploma.title}`}
              className="inline-flex items-center gap-2 text-xs text-gold/70 hover:text-gold
                         transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('downloadImage')}
            </motion.a>
          </motion.div>
        </div>
        </div>
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

      {/* Marquee keyframes */}
      <style>{`@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}`}</style>

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
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex gap-4 md:gap-5"
            style={{
              width: 'fit-content',
              animation: `marquee-scroll ${MARQUEE_DURATION}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
              willChange: 'transform',
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
            {/* Second copy — seamless loop visual only, hidden from screen readers */}
            {items.map((diploma) => (
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
