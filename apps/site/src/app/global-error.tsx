'use client'

import Link from 'next/link'

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body className="bg-[#0A0A12] text-white">
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="max-w-lg mx-auto text-center">
            <span
              className="text-[6rem] font-display leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold/10 via-gold/5 to-transparent select-none"
              aria-hidden="true"
            >
              500
            </span>

            <h1 className="mt-[-1rem] text-2xl md:text-3xl font-display text-gold-premium">
              Временная ошибка
            </h1>

            <p className="mt-4 text-base text-text-secondary leading-relaxed">
              Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте обновить страницу или вернуться на главную.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="px-6 py-3 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-sm font-semibold tracking-wider uppercase transition-all duration-400"
              >
                Попробовать снова
              </button>

              <Link
                href="/"
                className="px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-secondary text-sm font-semibold tracking-wider uppercase transition-all duration-400"
              >
                На главную
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
