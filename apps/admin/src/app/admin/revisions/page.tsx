import Link from 'next/link'

export default function RevisionsIndexPage() {
  const ENTITIES = [
    { type: 'service', label: 'Послуги', href: '/admin/services' },
    { type: 'blog_post', label: 'Пости блогу', href: '/admin/blog/posts' },
    { type: 'page', label: 'Сторінки', href: '/admin/pages' },
    { type: 'faq_item', label: 'FAQ', href: '/admin/faq' },
    { type: 'testimonial', label: 'Відгуки', href: '/admin/testimonials' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Ревізії</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Перегляд журналу змін для конкретної сутності. Відкрийте потрібний запис і натисніть&nbsp;«Ревізії».
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ENTITIES.map((e) => (
          <Link
            key={e.type}
            href={e.href}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 transition-colors hover:border-zinc-600/60 hover:bg-zinc-800/40"
          >
            <span className="flex-1 text-sm font-medium text-zinc-200">{e.label}</span>
            <span className="text-xs text-zinc-600">→</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-zinc-700">
        Ревізії зберігаються автоматично при кожному збереженні публікованого контенту.
      </p>
    </div>
  )
}
