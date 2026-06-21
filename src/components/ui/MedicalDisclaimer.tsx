import { useTranslations } from 'next-intl'

interface MedicalDisclaimerProps {
  className?: string
}

export function MedicalDisclaimer({ className = '' }: MedicalDisclaimerProps) {
  const t = useTranslations('disclaimer')

  return (
    <div
      className={`mt-8 p-4 rounded-xl border border-border-base bg-bg-surface/85 flex gap-3 items-start ${className}`}
    >
      <span className="text-text-muted text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
        ℹ️
      </span>
      <p className="text-xs text-text-muted leading-relaxed">
        <strong className="text-text-secondary font-medium">
          {t('important')}:&nbsp;
        </strong>
        {t('text')}
      </p>
    </div>
  )
}
