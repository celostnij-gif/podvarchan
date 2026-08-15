'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'

/* ── Context type ── */

interface BreadcrumbsContextValue {
  items: BreadcrumbItem[]
  setItems: (items: BreadcrumbItem[]) => void
}

/* ── Context ── */

const BreadcrumbsContext = createContext<BreadcrumbsContextValue>({
  items: [],
  setItems: () => {},
})

/* ── Provider ── */

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])

  return (
    <BreadcrumbsContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbsContext.Provider>
  )
}

/* ── Hook for reading current breadcrumbs ── */

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { items } = useContext(BreadcrumbsContext)
  return items
}

/* ── Hook for setting breadcrumbs from a page component ── */

export function useSetBreadcrumbs(items: BreadcrumbItem[]): void {
  const { items: currentItems, setItems } = useContext(BreadcrumbsContext)

  useEffect(() => {
    const currentStr = JSON.stringify(currentItems)
    const nextStr = JSON.stringify(items)

    if (nextStr !== currentStr) {
      setItems(items)
    }
  })
}
