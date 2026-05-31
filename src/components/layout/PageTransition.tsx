'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Оборачивает children в AnimatePresence для плавных переходов между страницами.
 * Комбинирует opacity + y + scale для более премиального ощущения.
 */
export default function PageTransition({ children }: Props) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
