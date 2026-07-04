'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function NotFoundClient() {
  const t = useTranslations('notFound')
  const commonT = useTranslations('common')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-gutter">
      <div className="max-w-lg mx-auto text-center">
        {/* 404 decorative */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
          className="relative"
        >
          <span
            className="text-[10rem] md:text-[14rem] font-display leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold/15 via-gold/5 to-transparent select-none"
            aria-hidden="true"
          >
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-px bg-gold/30" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0, 1] }}
          className="mt-[-2rem] text-3xl md:text-4xl font-display text-gold-premium leading-tight"
        >
          {t('title')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
          className="mt-4 text-base text-text-secondary leading-relaxed"
        >
          {t('description')}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
          className="mt-10"
        >
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-7 py-3.5 rounded-full
                       bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60
                       text-gold hover:text-gold-light text-sm font-semibold tracking-wider uppercase
                       transition-all duration-400"
          >
            <span className="relative z-10">{t('cta')}</span>
          </Link>
        </motion.div>

        {/* Home link subtle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 text-xs text-text-muted/50"
        >
          {commonT('siteName')}
        </motion.p>
      </div>
    </main>
  )
}
