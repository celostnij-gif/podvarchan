'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NavigationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Помилка</h2>
      <p className="text-zinc-400 mb-6 text-center max-w-md">
        {error.message || 'Сталася неочікувана помилка'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
      >
        Повторити
      </button>
    </motion.div>
  )
}
