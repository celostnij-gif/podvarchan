'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { getConsent, setConsent } from '@/lib/consent'

/**
 * GDPR-compliant cookie consent banner.
 *
 * - Fixed bottom bar, does NOT block interaction with the page
 * - Stores consent in localStorage
 * - Dispatches a custom event when consent is given so GoogleAnalytics can react
 * - Smooth slide-up entrance animation
 * - Matches the project's dark theme
 */
export default function CookieBanner() {
  const t = useTranslations('cookie')
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Show banner only if consent hasn't been given yet
    const status = getConsent()
    if (status === null) {
      // Small delay to avoid layout shift during hydration
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    setConsent('accepted')
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'))
    dismiss()
  }

  function handleDecline() {
    setConsent('declined')
    dismiss()
  }

  function dismiss() {
    setLeaving(true)
    setTimeout(() => setVisible(false), 400)
  }

  if (!visible) return null

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50',
        'transition-all duration-400 ease-out',
        leaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100',
      ].join(' ')}
      role="alert"
      aria-label={t('title')}
    >
      <div className="max-w-container mx-auto px-gutter pb-4 md:pb-6">
        <div
          className={[
            'relative overflow-hidden',
            'bg-bg-deep/95 backdrop-blur-md',
            'border border-border-base/60',
            'rounded-xl shadow-2xl',
            'px-5 py-4 md:px-8 md:py-5',
          ].join(' ')}
        >
          {/* Top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('text')}{' '}
                <Link
                  href="/politika-konfidentsialnosti/"
                  className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors whitespace-nowrap"
                >
                  {t('privacyLink')}
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDecline}
                className={[
                  'px-4 py-2 text-xs font-medium rounded-lg',
                  'text-text-muted hover:text-text-primary',
                  'bg-bg-surface/85 hover:bg-bg-elevated',
                  'border border-border-base hover:border-border-light',
                  'transition-all duration-200',
                ].join(' ')}
              >
                {t('decline')}
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className={[
                  'px-5 py-2 text-xs font-semibold rounded-lg',
                  'text-bg-deep bg-gold hover:bg-gold-light',
                  'shadow-lg shadow-gold/20',
                  'transition-all duration-200',
                  'active:scale-95',
                ].join(' ')}
              >
                {t('accept')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
