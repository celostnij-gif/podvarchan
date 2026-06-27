'use client'

import { useTranslations } from 'next-intl'

interface MedicalDisclaimerProps {
  type?: 'crisis' | 'medical' | 'general'
  className?: string
}

export default function MedicalDisclaimer({ type = 'general', className = '' }: MedicalDisclaimerProps) {
  const t = useTranslations('disclaimer')

  const config = {
    crisis: {
      icon: '🚨',
      title: t('crisisTitle'),
      text: t('crisisText'),
    },
    medical: {
      icon: '⚕️',
      title: t('medicalTitle'),
      text: t('medicalText'),
    },
    general: {
      icon: 'ℹ️',
      title: t('important'),
      text: t('text'),
    },
  }[type]

  return (
    <div role="alert" className={`p-4 md:p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5 shrink-0" role="img" aria-hidden="true">
          {config.icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-400">{config.title}</p>
          <p className="mt-1 text-xs md:text-sm text-text-muted leading-relaxed">{config.text}</p>
        </div>
      </div>
    </div>
  )
}
