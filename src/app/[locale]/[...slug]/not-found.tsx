import type { Metadata } from 'next'
import NotFoundClient from '../not-found-client'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function CatchAllNotFound() {
  return <NotFoundClient />
}
