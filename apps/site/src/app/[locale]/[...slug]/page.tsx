import type { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
    // Явно перекриваємо canonical з layout — Next.js deep-merge не дозволяє пустим {}
    alternates: { canonical: undefined },
  }
}

export default async function CatchAllPage() {
  return (
    <div style={{ padding: '48px 16px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: '0 0 16px', color: '#111' }}>404</h1>
      <p style={{ fontSize: '1.125rem', color: '#666', margin: '0 0 32px' }}>Страница не найдена</p>
      <Link href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>На главную</Link>
    </div>
  )
}
