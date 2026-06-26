'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'
import { hasConsent } from '@/lib/consent'

/**
 * Google Analytics 4 component.
 *
 * Подключает GA4 через <Script strategy="afterInteractive">
 * и автоматически отслеживает:
 *  - page_view при смене роута (SPA-навигация)
 *  - scroll_depth >80% на страницах /uslugi/*
 *
 * Конверсионные события (booking_click, contacts_view) проставляются
 * через data-атрибуты в HTML или через прямой вызов analytics.*.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname()
  const firstRender = useRef(true)
  const prevPath = useRef(pathname)
  const scrollFired = useRef<Set<string>>(new Set())
  const [consented, setConsented] = useState(false)

  const gaId = process.env.NEXT_PUBLIC_GA_ID

  // Wait for cookie consent before loading GA
  useEffect(() => {
    if (hasConsent()) {
      queueMicrotask(() => setConsented(true))
      return
    }

    // Listen for consent given via CookieBanner
    function onConsent() {
      setConsented(true)
    }

    window.addEventListener('cookie-consent-accepted', onConsent)
    return () => window.removeEventListener('cookie-consent-accepted', onConsent)
  }, [])

  // Re-fire page view when consent is given mid-session (only on consent transition, not navigation)
  useEffect(() => {
    if (consented) {
      analytics.pageView(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented])

  useEffect(() => {
    if (!gaId) return

    const current = pathname
    const cleanups: (() => void)[] = []

    /* Send page view on first ever render */
    if (firstRender.current) {
      firstRender.current = false
      prevPath.current = current
      analytics.pageView(current)
    } else if (prevPath.current !== current) {
      analytics.pageView(current)
      prevPath.current = current
    }

    /* Track contacts page view */
    if (current.startsWith('/kontakty')) {
      analytics.contactsView()
    }

    /* Scroll tracking for /uslugi/* pages */
    if (current.startsWith('/uslugi/') && current !== '/uslugi/') {
      const slug = current.replace(/^\/uslugi\//, '').replace(/\/$/, '')

      if (!scrollFired.current.has(slug)) {
        const handleScroll = () => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
          const scrolled = window.scrollY
          const percent = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0

          if (percent >= 80 && !scrollFired.current.has(slug)) {
            scrollFired.current.add(slug)
            analytics.serviceEngaged(slug)
            window.removeEventListener('scroll', handleScroll)
          }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        cleanups.push(() => window.removeEventListener('scroll', handleScroll))
      }
    }

    /* Click tracking for booking buttons via data attribute */
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-analytics-booking]')
      if (target) {
        const source = (target as HTMLElement).getAttribute('data-analytics-booking') || 'unknown'
        analytics.bookingClick(source)
      }
    }

    document.addEventListener('click', handleClick)
    cleanups.push(() => document.removeEventListener('click', handleClick))

    return () => { cleanups.forEach((fn) => fn()) }
  }, [pathname, gaId])

  if (!gaId || !consented) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
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
