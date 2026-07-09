import { getDB } from '@/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function DebugPage() {
  const results: { label: string; ok: boolean; error?: string }[] = []

  // Test 1: Basic D1 query
  try {
    const db = getDB()
    const row = await db.run('SELECT 1 as test')
    results.push({ label: 'D1 basic query', ok: true })
  } catch (e) {
    results.push({ label: 'D1 basic query', ok: false, error: String(e) })
  }

  // Test 2: FAQ query (known working)
  try {
    const db = getDB()
    const rows = await db.run('SELECT COUNT(*) as count FROM faq_items')
    results.push({ label: 'FAQ table query', ok: true })
  } catch (e) {
    results.push({ label: 'FAQ table query', ok: false, error: String(e) })
  }

  // Test 3: Blog posts query (known failing)
  try {
    const db = getDB()
    const rows = await db.run('SELECT COUNT(*) as count FROM blog_posts')
    results.push({ label: 'Blog posts table query', ok: true })
  } catch (e) {
    results.push({ label: 'Blog posts table query', ok: false, error: String(e) })
  }

  // Test 4: Env vars
  try {
    const hasDb = typeof process.env !== 'undefined'
    results.push({ label: 'process.env available', ok: hasDb })
  } catch (e) {
    results.push({ label: 'process.env available', ok: false, error: String(e) })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
      <table className="min-w-full border-collapse border border-zinc-700">
        <thead>
          <tr className="bg-zinc-800">
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Test</th>
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Status</th>
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Error</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-900/20'}>
              <td className="border border-zinc-700 px-4 py-2 text-sm">{r.label}</td>
              <td className="border border-zinc-700 px-4 py-2 text-sm">
                <span className={r.ok ? 'text-green-400' : 'text-red-400'}>
                  {r.ok ? '✅ OK' : '❌ FAIL'}
                </span>
              </td>
              <td className="border border-zinc-700 px-4 py-2 text-sm font-mono text-red-400 max-w-xl break-all">
                {r.error || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
