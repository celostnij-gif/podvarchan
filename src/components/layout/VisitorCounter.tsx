'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

const SESSION_KEY = 'vc_counted'

export default function VisitorCounter() {
  const t = useTranslations('common')
  const [today, setToday] = useState<number | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    const counted = sessionStorage.getItem(SESSION_KEY)
    const method = counted ? 'GET' : 'POST'

    fetch('/api/visitor-stats', { method })
      .then((r) => r.json())
      .then((d: { today: number; total: number }) => {
        setToday(d.today)
        setTotal(d.total)
        if (!counted) sessionStorage.setItem(SESSION_KEY, '1')
      })
      .catch(() => {
        /* hide counter on error */
      })
  }, [])

  if (today === null || total === null) return null

  return (
    <span className="text-xs text-text-muted tabular-nums">
      {t('visitorToday')}{' '}
      <span className="text-text-secondary font-medium">{today.toLocaleString()}</span>
      {' · '}
      {t('visitorTotal')}{' '}
      <span className="text-text-secondary font-medium">{total.toLocaleString()}</span>
    </span>
  )
}
