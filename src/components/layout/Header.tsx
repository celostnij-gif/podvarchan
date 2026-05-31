'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoImage } from '@/components/ui/LogoImage'
import { MAIN_NAV } from '@/constants'
import { Link } from '@/i18n/routing'
import type { NavItem } from '@/types'

/* ── Nav label key mapping ── */

const NAV_LABEL_KEYS: Record<string, string> = {
  '/': 'nav.home',
  '/uslugi/': 'nav.services',
  '/blog/': 'nav.blog',
  '/ob-avtore/': 'nav.about',
  '/metod/': 'nav.method',
  '/faq/': 'nav.faq',
  '/kontakty/': 'nav.contacts',
  '/uslugi/gipnoterapiya-onlayn/': 'nav.gipnoterapiya',
  '/uslugi/trevoga-i-panicheskiye-ataki/': 'nav.trevoga',
  '/uslugi/rabota-s-podsoznaniem/': 'nav.podsoznanie',
  '/uslugi/samosabotazh-i-bloki/': 'nav.samosabotazh',
  '/uslugi/emotsionalnoye-vygoraniye/': 'nav.vygoraniye',
  '/uslugi/neyverennost-i-strakh-provala/': 'nav.neyverennost',
  '/uslugi/psikhosomatika/': 'nav.psikhosomatika',
  '/uslugi/lichnostnyy-krizis/': 'nav.krizis',
}

function getNavLabelKey(href: string): string {
  return NAV_LABEL_KEYS[href] ?? 'nav.home'
}

/* ── Animation Variants ── */

const fadeInDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as const } },
}

const mobileOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
}

const mobilePanel = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0, 1] as const } },
  exit: { x: '100%', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
}

const dropdown = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.25, 0.1, 0, 1] as const } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' as const } },
}

const mobileItem = {
  initial: { opacity: 0, x: 20 },
  animate: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.35, ease: [0.25, 0.1, 0, 1] as const } }),
}

/* ── Helpers ── */

function isActive(pathname: string, href: string): boolean {
  // Remove locale prefix before checking
  const stripped = pathname.replace(/^\/(ru|uk)\/?/, '/')
  if (href === '/') return stripped === '/' || stripped === ''
  return stripped.startsWith(href)
}

/* ── Language Switcher ── */

function LangSwitcher({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/uk') ? 'uk' : 'ru'
  const pathWithoutLocale = pathname.replace(/^\/(ru|uk)/, '') || '/'

  return (
    <div className={`flex items-center gap-1 ${className}`} role="navigation" aria-label="Выбор языка">
      <Link
        href={pathWithoutLocale}
        locale="ru"
        hrefLang="ru"
        aria-label="Русский язык"
        aria-current={currentLocale === 'ru' ? 'true' : undefined}
        className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
          currentLocale === 'ru'
            ? 'text-gold bg-gold/10'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        RU
      </Link>
      <span className="text-border-light text-xs" aria-hidden="true">|</span>
      <Link
        href={pathWithoutLocale}
        locale="uk"
        hrefLang="uk"
        aria-label="Українська мова"
        aria-current={currentLocale === 'uk' ? 'true' : undefined}
        className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
          currentLocale === 'uk'
            ? 'text-gold bg-gold/10'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        UK
      </Link>
    </div>
  )
}

/* ── Mobile Nav Item ── */

function MobileNavItem({
  item,
  pathname,
  onClose,
  index,
  t,
}: {
  item: NavItem
  pathname: string
  onClose: () => void
  index: number
  t: (key: string) => string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const label = t(getNavLabelKey(item.href))

  if (!hasChildren) {
    const active = isActive(pathname, item.href)
    return (
      <motion.div variants={mobileItem} custom={index}>
        <Link
          href={item.href}
          onClick={onClose}
          className={`group flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base transition-all duration-300
            ${active
              ? 'text-gold bg-gold/[0.08] border border-gold/[0.15] shadow-glow-gold/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            active ? 'bg-gold shadow-glow-gold' : 'bg-text-muted/30 group-hover:bg-gold-muted'
          }`} />
          <span>{label}</span>
        </Link>
      </motion.div>
    )
  }

  const active = isActive(pathname, item.href)

  return (
    <motion.div variants={mobileItem} custom={index}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-base transition-all duration-300
          ${active || isOpen
            ? 'text-gold bg-gold/[0.06] border border-gold/[0.12]'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
          }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            active ? 'bg-gold shadow-glow-gold' : 'bg-text-muted/30'
          }`} />
          <span>{label}</span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-gold-muted" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-8 mt-1 space-y-1 pb-1 pl-4 border-l border-gold/[0.12]">
              {item.children!.map((child) => {
                const childActive = isActive(pathname, child.href)
                const childLabel = t(getNavLabelKey(child.href))
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`block px-4 py-2.5 rounded-xl text-sm transition-all duration-200
                      ${childActive
                        ? 'text-gold bg-gold/[0.06]'
                        : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
                      }`}
                  >
                    {childLabel}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Desktop Dropdown ── */

function DesktopDropdown({ item, pathname, t }: { item: NavItem; pathname: string; t: (key: string) => string }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 80)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const hasChildren = item.children && item.children.length > 0
  const active = isActive(pathname, item.href)
  const label = t(getNavLabelKey(item.href))

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          className={`relative group px-1.5 xl:px-2 2xl:px-3 py-2 text-[0.875rem] xl:text-[0.9375rem] font-medium tracking-wide transition-all duration-300
            ${active ? 'text-gold' : 'text-text-secondary hover:text-text-primary'}`}
        >
          {label}
          <span className={`absolute -bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-400
            ${active ? 'w-5 bg-gold shadow-glow-gold' : 'w-0 bg-gold/50 group-hover:w-5'}`} />
        </Link>
      </li>
    )
  }

  return (
    <li ref={ref} onMouseEnter={open} onMouseLeave={close} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group flex items-center gap-1.5 px-1.5 xl:px-2 2xl:px-3 py-2 text-[0.875rem] xl:text-[0.9375rem] font-medium tracking-wide transition-all duration-300
          ${active || isOpen ? 'text-gold' : 'text-text-secondary hover:text-text-primary'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="transition-colors duration-300" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
        <span className={`absolute -bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-400
          ${active || isOpen ? 'w-5 bg-gold shadow-glow-gold' : 'w-0 bg-gold/50 group-hover:w-5'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdown}
            initial="initial" animate="animate" exit="exit"
            className="absolute top-full mt-3 w-72 p-2 rounded-2xl
                       bg-bg-surface backdrop-blur-2xl border border-border-light shadow-2xl
                       shadow-black/40 z-[60]
                       before:absolute before:-top-[6px] before:left-1/2 before:-translate-x-1/2
                       before:w-3 before:h-3 before:rotate-45 before:bg-border-light before:border-l before:border-t
                       before:border-border-light"
            style={{ transformOrigin: 'top center', left: 'calc(50% - 130px)' }}
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" aria-hidden="true" />

            <nav aria-label={t('nav.submenu')} className="relative z-10">
              {item.children!.map((child) => {
                const childActive = isActive(pathname, child.href)
                const childLabel = t(getNavLabelKey(child.href))
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200
                      ${childActive
                        ? 'text-gold bg-gold/[0.08]'
                        : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                      }`}
                  >
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-300 ${
                      childActive
                        ? 'bg-gold shadow-glow-gold'
                        : 'bg-text-muted/20 group-hover:bg-gold-muted/50'
                    }`} />
                    <span>{childLabel}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-2 pt-2 border-t border-gold/[0.08] px-2">
              <Link
                href="/kontakty/"
                data-analytics-booking="header-dropdown"
                className="group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium
                           bg-gradient-to-r from-gold/[0.12] to-gold/[0.06] text-gold
                           hover:from-gold/[0.18] hover:to-gold/[0.1] active:from-gold/[0.08]
                           transition-all duration-300"
              >
                <span>{t('cta.booking')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/* ── Logo with hover animation ── */

function Logo({ authorName, authorTitle }: { authorName: string; authorTitle: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const nameRef = useRef<HTMLSpanElement>(null)
  const subtitleRef = useRef<HTMLSpanElement>(null)
  const textBlockRef = useRef<HTMLDivElement>(null)
  const [offsets, setOffsets] = useState({
    subtitleTranslate: 0,
    goldDashTranslateY: 48,
    goldDashLeft: 0,
  })

  /* ── Measure name/subtitle widths for subtitle centering & gold dash drop ── */
  useEffect(() => {
    function updateOffsets() {
      const nameEl = nameRef.current
      const subtitleEl = subtitleRef.current
      const textBlock = textBlockRef.current
      if (!nameEl || !subtitleEl || !textBlock) return

      const nameWidth = nameEl.offsetWidth
      const subtitleWidth = subtitleEl.offsetWidth

      // Subtitle centering: shift right so it sits centered under the name
      const subtitleTranslate = Math.max(0, (nameWidth - subtitleWidth) / 2)

      // Gold dash: starts above the first letter (top: -5px, left-aligned),
      // drops behind the text and comes to rest centered below the subtitle
      const nameHeight = nameEl.offsetHeight
      const subtitleHeight = subtitleEl.offsetHeight
      const mt = 2     // mt-0.5 = 0.125rem ≈ 2px
      const pad = 4    // small gap below subtitle
      const goldStart = -5
      const goldDashEnd = nameHeight + mt + subtitleHeight + pad
      const goldDashTranslateY = goldDashEnd - goldStart

      // goldDashLeft: left edge of the text block = first letter "В"
      const goldDashLeft = textBlock.offsetLeft

      setOffsets(prev => ({
        ...prev,
        subtitleTranslate,
        goldDashTranslateY: Math.max(48, goldDashTranslateY),
        goldDashLeft,
      }))
    }

    updateOffsets()

    const nameEl = nameRef.current
    const subtitleEl = subtitleRef.current
    const textBlock = textBlockRef.current
    if (!nameEl || !subtitleEl || !textBlock) return

    const ro = new ResizeObserver(updateOffsets)
    ro.observe(nameEl)
    ro.observe(subtitleEl)
    ro.observe(textBlock)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--logo-duration': '400ms', '--gold-dash-duration': '600ms' } as React.CSSProperties}
    >
      <Link
        href="/"
        className="group relative flex items-center gap-2 md:gap-3"
        aria-label={`${authorName} — ${authorTitle}`}
        style={{
          transform: `translateY(${isHovered ? '-10px' : '0'})`,
          transition: 'transform var(--logo-duration, 400ms) ease-in-out',
        }}
      >
        {/* ── Gold dash above the letter "В" ──
            Drops down behind the name → scales up → rests centered below subtitle */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-5px',
            left: isHovered ? '50%' : `${offsets.goldDashLeft}px`,
            zIndex: 0,
            transform: `translateY(${isHovered ? offsets.goldDashTranslateY : 0}px) translateX(${isHovered ? '-50%' : '0'}) scaleX(${isHovered ? 2 : 1})`,
            transformOrigin: 'center center',
            transition:
              'left var(--gold-dash-duration, 600ms) ease-in-out, transform var(--gold-dash-duration, 600ms) ease-in-out',
          }}
          aria-hidden="true"
        >
          <span className="block w-6 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        </div>

        {/* ── Logo image ── */}
        <LogoImage priority />

        {/* ── Text block (name + subtitle) ──
            Sits above the gold dash in the stacking order */}
        <div ref={textBlockRef} className="flex flex-col leading-tight" style={{ position: 'relative', zIndex: 1 }}>
          {/* Name */}
          <span
            ref={nameRef}
            className="text-xl md:text-2xl font-display text-text-primary tracking-tight whitespace-nowrap
                       group-hover:text-gold transition-all duration-500"
          >
            {authorName}
          </span>

          {/* Subtitle row — width matches the name so centering is measured correctly */}
          <div className="flex items-center gap-2 mt-0.5 w-full">
            {/* Subtitle text — slides to centered under the name on hover */}
            <span
              ref={subtitleRef}
              className="text-[10px] md:text-[11px] text-text-muted tracking-[0.2em] uppercase font-medium
                         whitespace-nowrap group-hover:text-gold-muted transition-all duration-500"
              style={{
                transform: `translateX(${isHovered ? offsets.subtitleTranslate : 0}px)`,
                transition: 'transform var(--logo-duration, 400ms) ease-in-out',
              }}
            >
              {authorTitle}
            </span>

            {/* Decorative dash to the right of subtitle — slides under and fades */}
            <span
              className="w-4 h-px bg-gold-muted/30 flex-shrink-0"
              style={{
                opacity: isHovered ? 0 : 1,
                transform: `translateX(${isHovered ? '-100%' : '0'})`,
                transition:
                  'opacity var(--logo-duration, 400ms) ease-in-out, transform var(--logo-duration, 400ms) ease-in-out',
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Header Component ── */

export default function Header() {
  const pathname = usePathname()
  const t = useTranslations('common')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pageTop, setPageTop] = useState(true)

  const isHome = pathname === '/' || pathname === '/ru' || pathname === '/uk'
  const shouldBeSolid = !isHome || scrolled
  const shouldBeTransparent = isHome && !scrolled && pageTop

  /* ── Scroll detection ── */

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY
      setScrolled(y > 40)
      setPageTop(y < 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ── Close mobile menu on route change ── */

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  /* ── Lock body scroll when mobile menu open ── */

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ── Close on Escape key ── */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <motion.header
        variants={fadeInDown}
        initial="initial"
        animate="animate"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
          ${shouldBeTransparent
            ? 'bg-transparent'
            : shouldBeSolid
              ? 'bg-bg-base/85 backdrop-blur-2xl border-b border-border-base/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
              : 'bg-gradient-to-b from-bg-base/40 to-transparent backdrop-blur-sm'
          }`}
      >
        {shouldBeSolid && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" aria-hidden="true" />
        )}

        <div className="max-w-container mx-auto px-gutter">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── Logo ── */}
            <Logo authorName={t('authorName')} authorTitle={t('authorTitle')} />

            {/* ── Desktop Navigation ── */}
            <nav className="hidden lg:flex items-center" aria-label={t('nav.main')}>
              <ul className="flex items-center gap-0.5">
                {MAIN_NAV.map((item) => (
                  <DesktopDropdown key={item.href} item={item} pathname={pathname} t={t} />
                ))}
              </ul>
            </nav>

            {/* ── Desktop Language Switcher + CTA ── */}
            <div className="hidden lg:flex items-center gap-3">
              <LangSwitcher />
              <Link
                href="/kontakty/"
                data-analytics-booking="header-desktop"
                className="group relative inline-flex items-center justify-center px-5 py-2.5 rounded-full
                           text-sm font-semibold tracking-wide overflow-hidden
                           bg-gradient-to-r from-gold to-gold-light text-bg-deep
                           shadow-[0_0_20px_rgba(201,169,110,0.15)]
                           hover:shadow-[0_0_30px_rgba(201,169,110,0.25)]
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-400"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 transition-transform duration-700 bg-gradient-to-r
                                 from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                  {t('cta.booking')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       strokeLinejoin="round"
                       className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* ── Mobile Right Side — LangSwitcher + Burger ── */}
            <div className="flex lg:hidden items-center gap-1.5">
              <LangSwitcher />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="relative w-10 h-10 flex items-center justify-center
                           rounded-xl text-text-secondary hover:text-text-primary
                           hover:bg-white/[0.06] active:bg-white/[0.04]
                           transition-all duration-200"
                aria-label={mobileOpen ? t('aria.closeMenu') : t('aria.openMenu')}
                aria-expanded={mobileOpen}
              >
                <div className="relative w-5 h-4">
                  <motion.span
                    animate={mobileOpen ? { rotate: 45, y: 6, width: 20 } : { rotate: 0, y: 0, width: 20 }}
                    className="absolute left-0 top-0 h-[1.5px] bg-current rounded-full"
                    style={{ transformOrigin: 'center' }}
                  />
                  <motion.span
                    animate={mobileOpen ? { opacity: 0, x: 8 } : { opacity: 1, x: 0 }}
                    className="absolute left-0 top-1/2 -mt-px w-4 h-[1.5px] bg-current rounded-full"
                  />
                  <motion.span
                    animate={mobileOpen ? { rotate: -45, y: -6, width: 20 } : { rotate: 0, y: 0, width: 14 }}
                    className="absolute left-0 bottom-0 h-[1.5px] bg-current rounded-full"
                    style={{ transformOrigin: 'center' }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Menu ── */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileOverlay}
            initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            <motion.div
              variants={mobilePanel}
              initial="initial" animate="animate" exit="exit"
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm
                         bg-bg-base/95 backdrop-blur-2xl border-l border-border-base
                         shadow-2xl shadow-black/40 overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" aria-hidden="true" />

              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <LangSwitcher />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl
                             text-text-muted hover:text-text-primary hover:bg-white/[0.06]
                             transition-all duration-200"
                  aria-label={t('aria.closeMenu')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="px-4 pb-8" aria-label={t('nav.mobile')}>
                <div className="space-y-1">
                  {MAIN_NAV.map((item, idx) => (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onClose={() => setMobileOpen(false)}
                      index={idx}
                      t={t}
                    />
                  ))}
                </div>

                <div className="my-6 mx-5 flex items-center gap-3">
                  <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" aria-hidden="true" />
                  <span className="text-[10px] text-text-muted/50 tracking-[0.2em] uppercase">{t('contacts')}</span>
                  <span className="flex-1 h-px bg-gradient-to-l from-gold/20 to-transparent" aria-hidden="true" />
                </div>

                <div className="px-1">
                  <Link
                    href="/kontakty/"
                    data-analytics-booking="header-mobile"
                    onClick={() => setMobileOpen(false)}
                    className="group relative flex items-center justify-center w-full px-5 py-3.5 rounded-2xl
                               text-sm font-semibold overflow-hidden
                               bg-gradient-to-r from-gold to-gold-light text-bg-deep
                               shadow-[0_0_20px_rgba(201,169,110,0.15)]
                               hover:shadow-[0_0_30px_rgba(201,169,110,0.25)]
                               active:scale-[0.98] transition-all duration-300"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                     transition-transform duration-700 bg-gradient-to-r
                                     from-transparent via-white/20 to-transparent" aria-hidden="true" />
                    <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                      {t('cta.booking')}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                           strokeLinejoin="round"
                           className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </div>

                <div className="mt-6 px-4">
                  <a href="mailto:podvarchan@gmail.com"
                     className="flex items-center gap-2.5 text-sm text-text-muted hover:text-gold transition-colors duration-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                         strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 4l-10 8L2 4" />
                    </svg>
                    podvarchan@gmail.com
                  </a>
                  <Link href="/politika-konfidentsialnosti/"
                        className="inline-block mt-3 text-xs text-text-muted/50 hover:text-gold-muted transition-colors duration-200">
                    {t('privacy')}
                  </Link>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
