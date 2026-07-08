'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FaqAccordionProps {
  question: string
  answer: string
  /** Smaller variant for pricing page etc. (default: false) */
  compact?: boolean
}

const easePremium = [0.25, 0.1, 0, 1] as const

/**
 * Animated FAQ accordion with smooth open/close transitions.
 * Uses framer-motion for height + opacity animation on both enter and exit.
 * The question is wrapped in <h3> for proper heading outline structure.
 */
export default function FaqAccordion({ question, answer, compact = false }: FaqAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`rounded-xl border bg-bg-surface/85 overflow-hidden transition-colors duration-300 ${
        isOpen
          ? 'border-gold-muted/30 shadow-[0_0_24px_rgba(201,169,110,0.04)]'
          : 'border-border-base'
      }`}
    >
      <h3 className="m-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={`flex items-center justify-between w-full text-left cursor-pointer
                     text-text-primary font-medium
                     hover:bg-bg-elevated transition-colors duration-200 ${
                       compact ? 'px-5 py-4' : 'px-5 py-5'
                     } ${
                       isOpen ? 'border-b border-border-light/50' : ''
                     }`}
        >
          <span className={compact ? 'text-sm pr-4' : 'text-base font-body pr-4'}>{question}</span>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.35, ease: easePremium }}
            className="w-4 h-4 text-gold shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>
      </h3>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: easePremium }}
        className="overflow-hidden"
      >
        <div className={compact ? 'px-5 pb-4' : 'px-5 pb-5'}>
          <p className={`leading-relaxed ${compact ? 'text-sm text-text-secondary' : 'text-sm text-text-muted'}`}>
            {answer}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
