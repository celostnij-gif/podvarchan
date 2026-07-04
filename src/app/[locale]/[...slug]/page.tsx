import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string[]; locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
  }
}

/**
 * Catch-all route для несуществующих страниц.
 * Вызывает notFound(), что триггерит [locale]/not-found.tsx — кастомную 404.
 */
export default async function CatchAllPage({ params: _params }: Props) {
  notFound()
}
