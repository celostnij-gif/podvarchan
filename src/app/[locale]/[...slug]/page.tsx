import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {}
}

export default async function CatchAllPage() {
  notFound()
}
