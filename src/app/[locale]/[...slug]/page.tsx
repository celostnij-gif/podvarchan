import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string[]; locale: string }>
}

/**
 * Catch-all route для несуществующих страниц.
 * Вызывает notFound(), что триггерит [locale]/not-found.tsx — кастомную 404.
 */
export default async function CatchAllPage({ params: _params }: Props) {
  notFound()
}
