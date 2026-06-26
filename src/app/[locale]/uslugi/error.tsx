'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'

export default function ServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Service page error:', error)
  }, [error])

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center bg-bg-base px-gutter">
      <div className="max-w-lg mx-auto text-center">
        <span
          className="text-[6rem] font-display leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold/10 via-gold/5 to-transparent select-none"
          aria-hidden="true"
        >
          503
        </span>

        <h1 className="mt-[-1rem] text-2xl md:text-3xl font-display text-gold-premium">
          Сторінка тимчасово недоступна
        </h1>

        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          Сталася помилка при завантаженні сторінки. Спробуйте оновити сторінку або поверніться на головну.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/30
                       text-gold text-sm font-semibold tracking-wider uppercase transition-all duration-400"
          >
            Спробувати знову
          </button>

          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-bg-elevated hover:bg-bg-elevated/80 border border-border-base
                       text-text-secondary text-sm font-semibold tracking-wider uppercase transition-all duration-400"
          >
            На головну
          </Link>
        </div>
      </div>
    </main>
  )
}
