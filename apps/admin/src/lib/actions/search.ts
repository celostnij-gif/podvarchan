'use server'

/* СТАБ: до міграції Server Actions */

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SearchResultItem {
  id: string
  type: 'service' | 'blog' | 'lead' | 'page' | 'faq'
  label: string
  sublabel: string
  href: string
  icon?: string
}

export async function searchAdmin(_query?: string): Promise<ActionResult<SearchResultItem[]>> {
  return { success: true, data: [] }
}

export async function getNewLeadCount(): Promise<ActionResult<number>> {
  return { success: true, data: 0 }
}
