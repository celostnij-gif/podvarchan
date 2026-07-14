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

  /** WhatsApp button click */
  whatsappClick(source: string) {
    trackEvent({
      action: 'whatsapp_click',
      category: 'conversion',
      label: source,
    })
  },

  /** Telegram button click */
  telegramClick(source: string) {
    trackEvent({
      action: 'telegram_click',
      category: 'conversion',
      label: source,
    })
  },

  /** /tseny/ page view */
  tsenyView() {
    trackEvent({
      action: 'tseny_view',
      category: 'engagement',
      label: 'tseny_page',
    })
  },

  /** Blog scroll depth */
  blogScroll(slug: string, depth: number) {
    trackEvent({
      action: 'blog_scroll',
      category: 'engagement',
      label: slug,
      value: depth,
    })
  },

  pageView(path: string, title?: string, gaId?: string) {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', gaId ?? '', {
      page_path: path,
      page_title: title || document.title,
    } satisfies GtagConfig)
  },
}
