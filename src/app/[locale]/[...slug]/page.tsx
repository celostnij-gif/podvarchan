import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
    // Явно перекриваємо canonical з layout — Next.js deep-merge не дозволяє пустим {}
    alternates: { canonical: undefined },
  }
}

export default async function CatchAllPage() {
  notFound()
}
