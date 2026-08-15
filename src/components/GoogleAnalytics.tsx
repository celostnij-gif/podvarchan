'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'
import { hasConsent } from '@/lib/consent'

/**
 * Tracks booking clicks even before cookie consent.
 * Stores in sessionStorage, flushed to GA after consent + gtag.js load.
 */
function BookingClickTracker() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-analytics-booking]')
      if (target) {
        const source = (target as HTMLElement).getAttribute('data-analytics-booking') || 'unknown'
        try {
          const pending = JSON.parse(sessionStorage.getItem('_pending_bookings') || '[]')
          pending.push({ source, timestamp: Date.now() })
          sessionStorage.setItem('_pending_bookings', JSON.stringify(pending))
        } catch { /* ignore */ }
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  return null
}

/**
 * Google Analytics 4 component.
 *
 * Принимает gaId как пропс от Server Component.
 * GA загружается через <Script afterInteractive> — гарантирует, что gtag
 * доступен до того, как сработают useEffect с событиями.
 */
export default function GoogleAnalytics({ gaId }: { gaId?: string }) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const scrollFired = useRef<Set<string>>(new Set())
  const [consented, setConsented] = useState(false)
  const [gaLoaded, setGaLoaded] = useState(false)

  // ── Wait for cookie consent ──
  useEffect(() => {
    if (hasConsent()) {
      queueMicrotask(() => setConsented(true))
      return
    }

    function onConsent() {
      setConsented(true)
    }

    window.addEventListener('cookie-consent-accepted', onConsent)
    return () => window.removeEventListener('cookie-consent-accepted', onConsent)
  }, [])

  // ── When both consent AND gtag.js are ready: flush + initial page view ──
  useEffect(() => {
    if (!gaId || !consented || !gaLoaded) return

    // Flush pending booking clicks that happened before consent
    try {
      const pending = JSON.parse(sessionStorage.getItem('_pending_bookings') || '[]')
      for (const item of pending) {
        analytics.bookingClick(item.source)
      }
      sessionStorage.removeItem('_pending_bookings')
    } catch { /* ignore */ }

    // Send initial page view (with send_page_view: false in init script)
    analytics.pageView(pathname, undefined, gaId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented, gaLoaded])

  // ── Track page views and contacts/tseny views on navigation ──
  useEffect(() => {
    if (!gaId || !consented || !gaLoaded) return

    const current = pathname

    if (prevPath.current !== current) {
      analytics.pageView(current, undefined, gaId)
      prevPath.current = current
    }

    if (current.startsWith('/kontakty')) {
      analytics.contactsView()
    }

    if (current.startsWith('/tseny')) {
      analytics.tsenyView()
    }
  }, [pathname, consented, gaLoaded, gaId])

  // ── Scroll + click event listeners (separate to avoid listener re-creation on nav) ──
  useEffect(() => {
    if (!gaId || !consented || !gaLoaded) return

    const cleanups: (() => void)[] = []

    /* Scroll: /uslugi/* pages at 80% */
    if (pathname.startsWith('/uslugi/') && pathname !== '/uslugi/') {
      const serviceSlug = pathname.replace(/^\/?(ru|uk)?\/?uslugi\//, '').replace(/\/$/, '')
      const key = `uslugi-scroll:${serviceSlug}`
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const percent = scrollHeight > 0 ? Math.round((window.scrollY / scrollHeight) * 100) : 0
        if (percent >= 80 && !scrollFired.current.has(key)) {
          scrollFired.current.add(key)
          analytics.serviceEngaged(serviceSlug)
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', handleScroll))
    }

    /* Scroll: /blog/* posts at 50% and 90% */
    if (pathname.startsWith('/blog/') && pathname !== '/blog/' && !pathname.startsWith('/blog/kategoriya/')) {
      const blogSlug = pathname.replace(/^\/?(ru|uk)?\/?blog\//, '').replace(/\/$/, '')
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const percent = scrollHeight > 0 ? Math.round((window.scrollY / scrollHeight) * 100) : 0
        for (const depth of [50, 90]) {
          const key = `blog-scroll:${blogSlug}:${depth}`
          if (percent >= depth && !scrollFired.current.has(key)) {
            scrollFired.current.add(key)
            analytics.blogScroll(blogSlug, depth)
          }
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', handleScroll))
    }

    /* WhatsApp click */
    const handleWhatsApp = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href*="wa.me"]')
      if (link) {
        const source = (link as HTMLAnchorElement).getAttribute('data-analytics-whatsapp') || 'unknown'
        analytics.whatsappClick(source)
      }
    }
    document.addEventListener('click', handleWhatsApp)
    cleanups.push(() => document.removeEventListener('click', handleWhatsApp))

    /* Telegram click */
    const handleTelegram = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href*="t.me"]')
      if (link) {
        const source = (link as HTMLAnchorElement).getAttribute('data-analytics-telegram') || 'unknown'
        analytics.telegramClick(source)
      }
    }
    document.addEventListener('click', handleTelegram)
    cleanups.push(() => document.removeEventListener('click', handleTelegram))

    return () => { cleanups.forEach((fn) => fn()) }
  }, [pathname, consented, gaLoaded, gaId])

  const handleGtagLoad = useCallback(() => {
    setGaLoaded(true)
  }, [])

  if (!gaId) return null

  if (!consented) {
    return <BookingClickTracker />
  }

  return (
    <>
      <BookingClickTracker />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={handleGtagLoad}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            send_page_view: false,
          });
        `}
      </Script>
    </>
  )
}
