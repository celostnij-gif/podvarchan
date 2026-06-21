'use client'

import { Link } from '@/i18n/routing'

interface ServiceCTAProps {
  /** Назва послуги (наприклад, "Гіпнотерапія онлайн") */
  serviceName: string
  /** Slug послуги (наприклад, "gipnoterapiya-onlayn") */
  serviceSlug: string
  /** Заголовок CTA-блоку */
  headline: string
  /** Короткий опис (1-2 речення) */
  description: string
}

/**
 * Компактний CTA-блок для вбудовування в статті блогу.
 * Відображається як акцентна картка з посиланням на сторінку послуги.
 */
export default function ServiceCTA({
  serviceName,
  serviceSlug,
  headline,
  description,
}: ServiceCTAProps) {
  return (
    <div className="relative mt-12 p-6 md:p-8 rounded-2xl border-l-4 border-gold
                    bg-gradient-to-br from-gold/[0.06] to-gold/[0.02]
                    border border-gold/15 border-l-[3px]">
      <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full
                      bg-gold text-bg-deep text-[10px] font-semibold
                      tracking-[0.15em] uppercase">
        Рекомендуємо
      </div>

      <div className="mt-3">
        <h3 className="text-lg font-display text-text-primary">
          {headline}
        </h3>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5">
        <Link
          href={`/uslugi/${serviceSlug}/`}
          className="group inline-flex items-center gap-2 text-sm font-medium text-green-light
                     hover:text-green transition-colors duration-200"
        >
          <span>Докладніше про {serviceName.toLowerCase()}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
