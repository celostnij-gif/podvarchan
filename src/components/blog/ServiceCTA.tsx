'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

interface ServiceCTAProps {
  /** Название услуги (например, "Гипнотерапия онлайн") */
  serviceName: string
  /** Slug услуги (например, "gipnoterapiya-onlayn") */
  serviceSlug: string
  /** Заголовок CTA-блока */
  headline: string
  /** Краткое описание (1-2 предложения) */
  description: string
}

/**
 * Компактный CTA-блок для вставки в статьи блога.
 * Отображается как акцентная карточка со ссылкой на страницу услуги.
 */
export default function ServiceCTA({
  serviceName,
  serviceSlug,
  headline,
  description,
}: ServiceCTAProps) {
  const t = useTranslations('pages.blog')

  return (
    <div className="relative mt-12 p-6 md:p-8 rounded-2xl border-l-4 border-gold
                    bg-gradient-to-br from-gold/[0.06] to-gold/[0.02]
                    border border-gold/15 border-l-[3px]">
      <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full
                      bg-gold text-bg-deep text-[10px] font-semibold
                      tracking-[0.15em] uppercase">
        {t('recommendedLabel')}
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
          <span>{t('readMoreService', { service: serviceName.toLowerCase() })}</span>
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
