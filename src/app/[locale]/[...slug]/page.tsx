import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
    alternates: { canonical: undefined },
  }
}

export default async function CatchAllPage() {
  notFound()
}
