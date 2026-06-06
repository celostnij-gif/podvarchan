/**
 * Client-компонент публичной страницы входа.
 *
 * ⏸ Google OAuth временно отключён.
 * Пока показывает информационное сообщение.
 */

'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function LoginClient() {
  const t = useTranslations('login')

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          {t('pageTitle')}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {t('pageDescription')}
        </p>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 px-6 py-8">
          <p className="text-sm text-zinc-400">
            Вход через Google временно недоступен.
            Пожалуйста, вернитесь позже.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            ← {t('goHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
