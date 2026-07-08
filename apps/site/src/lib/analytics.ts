/* ── Typed GA4 Analytics Utility ── */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

type GtagEvent = {
  action: string
  category: string
  label: string
  value?: number
}

type GtagConfig = {
  page_path?: string
  page_title?: string
  page_location?: string
  send_page_view?: boolean
}

/**
 * Отправка события в GA4.
 * Использовать в клиентских компонентах: onClick, useEffect и т.д.
 */
export function trackEvent({ action, category, label, value }: GtagEvent) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Хелпер для трекинга конверсионных действий.
 */
export const analytics = {
  bookingClick(source: string) {
    trackEvent({
      action: 'booking_click',
      category: 'conversion',
      label: source,
    })
  },

  contactsView() {
    trackEvent({
      action: 'contacts_view',
      category: 'engagement',
      label: 'contacts_page',
    })
  },

  serviceEngaged(slug: string) {
    trackEvent({
      action: 'service_engaged',
      category: 'engagement',
      label: slug,
    })
  },

  pageView(path: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID as string, {
      page_path: path,
      page_title: title || document.title,
    } satisfies GtagConfig)
  },

  scrollDepth(slug: string, depth: number) {
    trackEvent({
      action: 'scroll_depth',
      category: 'engagement',
      label: slug,
      value: depth,
    })
  },
}
