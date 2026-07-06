import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-gutter">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-[10rem] md:text-[14rem] font-display leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold/15 via-gold/5 to-transparent select-none" aria-hidden="true">
          404
        </h1>
        <h2 className="mt-[-2rem] text-3xl md:text-4xl font-display text-gold-premium leading-tight">
          Page Not Found
        </h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-7 py-3.5 rounded-full
                       bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60
                       text-gold hover:text-gold-light text-sm font-semibold tracking-wider uppercase
                       transition-all duration-400"
          >
            <span className="relative z-10">Go Home</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
