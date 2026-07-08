'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function MobileStickyCTA() {
  const t = useTranslations('common')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setVisible(scrollPct > 0.5)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-fade-in-up">
      <div className="bg-bg-base/95 backdrop-blur-md border-t border-border-base px-4 py-3 flex items-center gap-3">
        <Link
          href="/kontakty/"
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full
                     text-sm font-semibold tracking-wide
                     bg-gradient-to-r from-gold to-gold-light text-bg-deep hover:text-gold-dark
                     shadow-[0_0_20px_rgba(201,169,110,0.15)]
                     active:scale-[0.98] transition-all duration-200"
        >
          {t('bookingCta')}
        </Link>

        <a
          href="https://t.me/SLAVKA_VIP"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full
                     bg-bg-surface/85 border border-border-base text-text-muted
                     hover:text-gold hover:border-gold-muted
                     transition-all duration-200 active:scale-90"
          aria-label="Telegram"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.507.087.507l-1.397 6.573c-.152.705-.585.772-.968.49l-2.898-2.091-1.265 1.214c-.206.203-.34.314-.518.314-.279 0-.267-.195-.186-.658l.99-4.325.003.001s2.908-2.66 2.989-2.76c.08-.1.041-.166-.08-.124-.192.066-3.742 2.322-3.974 2.465-.16.098-.28.135-.517.014l-2.532-.857c-.325-.12-.503-.19-.453-.4.035-.172.26-.344.723-.52L16.05 7.29c.257-.092.488-.094.584-.076z" />
          </svg>
        </a>

        <a
          href="https://wa.me/380663122069"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full
                     bg-bg-surface/85 border border-border-base text-text-muted
                     hover:text-gold hover:border-gold-muted
                     transition-all duration-200 active:scale-90"
          aria-label="WhatsApp"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9…" />
          </svg>
        </a>
      </div>
    </div>
  )
}
