'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'

/* ── Context type ── */

interface BreadcrumbsContextValue {
  items: BreadcrumbItem[]
  setItems: (items: BreadcrumbItem[]) => void
  schemas: Record<string, unknown>[]
  setSchemas: (schemas: Record<string, unknown>[]) => void
}

/* ── Context ── */

const BreadcrumbsContext = createContext<BreadcrumbsContextValue>({
  items: [],
  setItems: () => {},
  schemas: [],
  setSchemas: () => {},
})

/* ── Provider ── */

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const [schemas, setSchemas] = useState<Record<string, unknown>[]>([])

  return (
    <BreadcrumbsContext.Provider value={{ items, setItems, schemas, setSchemas }}>
      {children}
    </BreadcrumbsContext.Provider>
  )
}

/* ── Hook for reading current breadcrumbs ── */

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { items } = useContext(BreadcrumbsContext)
  return items
}

/* ── Hook for reading registered schemas ── */

export function useRegisteredSchemas(): Record<string, unknown>[] {
  const { schemas } = useContext(BreadcrumbsContext)
  return schemas
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

/* ── Hook for registering page-specific JSON-LD schemas ── */

export function useRegisterSchemas(newSchemas: Record<string, unknown>[]): void {
  const { schemas: currentSchemas, setSchemas } = useContext(BreadcrumbsContext)

  const currentStr = JSON.stringify(currentSchemas)
  const nextStr = JSON.stringify(newSchemas)

  if (nextStr !== currentStr) {
    setSchemas(newSchemas)
  }
}
